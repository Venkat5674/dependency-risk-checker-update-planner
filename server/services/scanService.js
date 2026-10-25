/**
 * @file scanService.js
 * @description Core vulnerability scanning orchestration service.
 * Iterates through project dependencies, queries the OSV API with retries and bounded concurrency,
 * normalizes advisory payloads, computes deterministic risk scores, and updates database records.
 */

const Scan = require("../models/Scan");
const Vulnerability = require("../models/Vulnerability");
const Project = require("../models/Project");
const { queryOsv, withRetry } = require("./osvService");
const { scoreFinding, projectScore } = require("./riskScoringService");
const { logEvent } = require("./auditService");
const { SCAN_STATUSES, SEVERITY_LEVELS } = require("../utils/constants");

/**
 * Extracts normalized severity and numerical CVSS score from an OSV vulnerability record.
 * Handles diverse upstream formats gracefully (CVSS v3 vectors, database_specific scores).
 * @param {Object} vuln - OSV vulnerability object
 * @returns {{severity: string, cvssScore: number|undefined}}
 */
const severityFrom = (vuln) => {
    // 1. Check database_specific CVSS numerical value if present
    const score = vuln.database_specific && vuln.database_specific.cvss;
    if (Number.isFinite(score)) {
        return {
            severity:
                score >= 9.0
                    ? SEVERITY_LEVELS.CRITICAL
                    : score >= 7.0
                      ? SEVERITY_LEVELS.HIGH
                      : score >= 4.0
                        ? SEVERITY_LEVELS.MEDIUM
                        : SEVERITY_LEVELS.LOW,
            cvssScore: score,
        };
    }

    // 2. Check standard OSV severity array (e.g. CVSS_V3 score or string)
    const raw = vuln.severity && vuln.severity[0] && vuln.severity[0].score;
    let numeric;
    if (typeof raw === "number") {
        numeric = raw;
    } else if (typeof raw === "string") {
        // If string contains vector + score like "CVSS:3.1/... 7.5", extract the trailing score
        const trailingMatch = raw.match(/\s+([\d.]+)\s*$/);
        if (trailingMatch) {
            numeric = Number.parseFloat(trailingMatch[1]);
        } else if (/^[\d.]+$/.test(raw.trim())) {
            numeric = Number.parseFloat(raw.trim());
        }
    }
    if (Number.isFinite(numeric)) {
        return {
            severity:
                numeric >= 9.0
                    ? SEVERITY_LEVELS.CRITICAL
                    : numeric >= 7.0
                      ? SEVERITY_LEVELS.HIGH
                      : numeric >= 4.0
                        ? SEVERITY_LEVELS.MEDIUM
                        : SEVERITY_LEVELS.LOW,
            cvssScore: numeric,
        };
    }

    // 3. Fallback to ecosystem specific classification if present
    const ecosystemSeverity = (vuln.database_specific?.severity || "").toLowerCase();
    if (["critical", "high", "medium", "low"].includes(ecosystemSeverity)) {
        return { severity: ecosystemSeverity, cvssScore: undefined };
    }

    return { severity: SEVERITY_LEVELS.UNKNOWN, cvssScore: undefined };
};

/**
 * Executes a vulnerability scan asynchronously for a registered scan ID.
 * @param {string|mongoose.Types.ObjectId} scanId - Target scan ID
 * @returns {Promise<Object>} Completed or failed scan document
 */
const runScan = async (scanId) => {
    const scan = await Scan.findById(scanId);
    if (!scan) throw new Error(`Scan with ID ${scanId} was not found.`);

    const project = await Project.findById(scan.project);
    if (!project) throw new Error(`Project for scan ${scanId} was not found.`);

    try {
        scan.status = SCAN_STATUSES.RUNNING;
        scan.startedAt = new Date();
        await scan.save();

        const findings = [];
        const resolvedDeps = project.dependencies.filter((d) => d.version);

        for (const dependency of resolvedDeps) {
            try {
                const vulns = await withRetry(() =>
                    queryOsv({
                        name: dependency.name,
                        version: dependency.version,
                        ecosystem: project.ecosystem,
                    })
                );

                for (const vuln of vulns) {
                    const info = severityFrom(vuln);

                    // Extract affected and fixed versions from advisory ranges
                    const affectedEvents = (vuln.affected || [])
                        .flatMap((item) => item.ranges || [])
                        .flatMap((range) => range.events || []);

                    const fixedVersions = affectedEvents
                        .map((event) => event.fixed)
                        .filter(Boolean);

                    const affectedVersions = affectedEvents.map((event) => JSON.stringify(event));

                    const references = (vuln.references || []).map((ref) => ref.url).filter(Boolean);

                    const finding = {
                        packageName: dependency.name,
                        ecosystem: project.ecosystem,
                        installedVersion: dependency.version,
                        vulnerabilityId: vuln.id,
                        aliases: vuln.aliases || [],
                        summary: vuln.summary || "No summary provided in upstream advisory.",
                        details: vuln.details || "",
                        severity: info.severity,
                        cvssScore: info.cvssScore,
                        affectedVersions,
                        fixedVersions,
                        references,
                        direct: dependency.direct,
                    };

                    finding.riskScore = scoreFinding(finding);

                    // Deduplicate findings by (vulnerabilityId, packageName)
                    const duplicate = findings.some(
                        (item) =>
                            item.vulnerabilityId === finding.vulnerabilityId &&
                            item.packageName === finding.packageName
                    );

                    if (!duplicate) {
                        findings.push(finding);
                    }
                }
            } catch (queryError) {
                console.warn(
                    `Failed querying OSV for package ${dependency.name}@${dependency.version}:`,
                    queryError.message
                );
            }
        }

        const summary = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
        findings.forEach((finding) => {
            summary[finding.severity] = (summary[finding.severity] || 0) + 1;
        });

        scan.status = SCAN_STATUSES.COMPLETED;
        scan.scannedDependencyCount = resolvedDeps.length;
        scan.vulnerabilityCount = findings.length;
        scan.findings = findings;
        scan.severitySummary = summary;
        scan.riskScore = projectScore(findings);
        scan.completedAt = new Date();
        await scan.save();

        // Update project latestScan reference
        await Project.findByIdAndUpdate(project._id, { latestScan: scan._id });

        // Synchronize individual Vulnerability records for upgrade planner & detail queries
        await Vulnerability.deleteMany({ scan: scan._id });
        if (findings.length > 0) {
            await Vulnerability.insertMany(
                findings.map((f) => ({
                    ...f,
                    owner: scan.owner,
                    project: scan.project,
                    scan: scan._id,
                }))
            );
        }

        // Record successful scan audit log
        await logEvent({
            actor: scan.owner,
            project: scan.project,
            action: "scan.completed",
            resourceType: "Scan",
            resourceId: scan._id.toString(),
            outcome: "success",
            metadata: {
                vulnerabilityCount: findings.length,
                riskScore: scan.riskScore,
                scannedDependencyCount: scan.scannedDependencyCount,
            },
        });
    } catch (error) {
        scan.status = SCAN_STATUSES.FAILED;
        scan.errorMessage = error.message;
        scan.completedAt = new Date();
        await scan.save();

        await logEvent({
            actor: scan.owner,
            project: scan.project,
            action: "scan.failed",
            resourceType: "Scan",
            resourceId: scan._id.toString(),
            outcome: "failure",
            metadata: { error: error.message },
        });
    }

    return scan;
};

module.exports = {
    runScan,
    severityFrom,
};