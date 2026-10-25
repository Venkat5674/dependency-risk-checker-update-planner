/**
 * @file upgradeService.js
 * @description Generates safe, prioritized upgrade recommendations from vulnerability advisories.
 * Computes advisory actions, explains breaking change considerations, provides references,
 * and tracks remediation status updates while auditing changes.
 *
 * CRITICAL SAFETY RULES:
 * 1. Never invent a patched version; if no fixed version is reported in the advisory, explicitly state that.
 * 2. Recommendations are advisory guidance, not automatic upgrades or guarantees of compatibility.
 * 3. Encourage verification of release notes and comprehensive automated testing.
 */

const Vulnerability = require("../models/Vulnerability");
const ApiError = require("../utils/ApiError");
const { logEvent } = require("./auditService");
const { REMEDIATION_STATUSES } = require("../utils/constants");

/**
 * Formulates a transparent, evidence-based upgrade recommendation.
 * @param {Object} vuln - Vulnerability record from MongoDB
 * @returns {Object} Structured recommendation object
 */
const generateRecommendation = (vuln) => {
    const hasFix = Array.isArray(vuln.fixedVersions) && vuln.fixedVersions.length > 0;
    const recommendedVersion = hasFix ? vuln.fixedVersions[0] : null;

    let actionText = "";
    let guidanceNotes = "";
    let riskLevel = "low";

    if (hasFix) {
        actionText = `Upgrade ${vuln.packageName} from version ${vuln.installedVersion || "current"} to ${recommendedVersion} or higher.`;
        guidanceNotes =
            "Review the library changelog/release notes for potential breaking changes or API deprecations before upgrading in production. Run project test suites to verify compatibility.";
        riskLevel = vuln.severity === "critical" || vuln.severity === "high" ? "high" : "medium";
    } else {
        actionText = `No official fixed version reported yet in the security advisory for ${vuln.packageName}.`;
        guidanceNotes =
            "Consider applying defense-in-depth mitigations, restricting untrusted input reaching this dependency, or evaluating alternative packages with active security maintenance.";
        riskLevel = "high";
    }

    return {
        vulnerabilityId: vuln.vulnerabilityId,
        packageName: vuln.packageName,
        ecosystem: vuln.ecosystem,
        installedVersion: vuln.installedVersion || "Unknown",
        fixedVersion: recommendedVersion,
        allFixedVersions: vuln.fixedVersions || [],
        affectedVersions: vuln.affectedVersions || [],
        severity: vuln.severity || "unknown",
        riskScore: vuln.riskScore || 0,
        status: vuln.status || REMEDIATION_STATUSES.OPEN,
        action: actionText,
        guidance: guidanceNotes,
        remediationRisk: riskLevel,
        isFixAvailable: hasFix,
        references: vuln.references || [],
        disclaimer:
            "This recommendation is generated from publicly available security advisories (OSV/CVE). It is strictly advisory and does not guarantee backward compatibility or total vulnerability eradication.",
    };
};

/**
 * Lists all active upgrade recommendations for a specific user.
 * @param {string|mongoose.Types.ObjectId} userId - Current user ID
 * @param {Object} filter - Optional filters (status, severity, project)
 * @returns {Promise<Array>} List of recommendations with populated project
 */
const getUpgradeRecommendations = async (userId, filter = {}) => {
    const query = { owner: userId };

    if (filter.status) {
        query.status = filter.status;
    } else {
        // By default, exclude already resolved items
        query.status = { $ne: REMEDIATION_STATUSES.RESOLVED };
    }

    if (filter.severity) {
        query.severity = filter.severity;
    }

    if (filter.project) {
        query.project = filter.project;
    }

    const vulnerabilities = await Vulnerability.find(query)
        .populate("project", "name ecosystem")
        .sort("-riskScore");

    return vulnerabilities.map((vuln) => {
        const recommendation = generateRecommendation(vuln);
        return {
            ...vuln.toObject(),
            recommendation,
        };
    });
};

/**
 * Retrieves a single upgrade recommendation by its vulnerability ID.
 * @param {string} id - Vulnerability ObjectId
 * @param {string|mongoose.Types.ObjectId} userId - Current user ID
 * @returns {Promise<Object>} Recommendation details
 */
const getUpgradeById = async (id, userId) => {
    const vuln = await Vulnerability.findOne({ _id: id, owner: userId }).populate("project", "name ecosystem repositoryUrl");
    if (!vuln) {
        throw new ApiError(404, "Upgrade recommendation not found.");
    }

    return {
        ...vuln.toObject(),
        recommendation: generateRecommendation(vuln),
    };
};

/**
 * Updates the remediation status of a vulnerability and logs the audit event.
 * @param {string} id - Vulnerability ObjectId
 * @param {string|mongoose.Types.ObjectId} userId - Current user ID
 * @param {string} newStatus - New status ('open', 'in_progress', 'resolved', 'accepted_risk')
 * @param {string} [notes] - Optional user justification notes
 * @returns {Promise<Object>} Updated vulnerability
 */
const updateRemediationStatus = async (id, userId, newStatus, notes = "") => {
    const validStatuses = Object.values(REMEDIATION_STATUSES);
    if (!validStatuses.includes(newStatus)) {
        throw new ApiError(400, `Invalid remediation status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const vuln = await Vulnerability.findOne({ _id: id, owner: userId });
    if (!vuln) {
        throw new ApiError(404, "Vulnerability not found.");
    }

    const previousStatus = vuln.status;
    vuln.status = newStatus;
    await vuln.save();

    // Log the remediation action to AuditLog
    await logEvent({
        actor: userId,
        project: vuln.project,
        action: "vulnerability.remediation_status_updated",
        resourceType: "Vulnerability",
        resourceId: vuln._id.toString(),
        outcome: "success",
        metadata: {
            vulnerabilityId: vuln.vulnerabilityId,
            packageName: vuln.packageName,
            previousStatus,
            newStatus,
            notes: notes ? notes.slice(0, 250) : undefined,
        },
    });

    return vuln;
};

module.exports = {
    generateRecommendation,
    getUpgradeRecommendations,
    getUpgradeById,
    updateRemediationStatus,
};
