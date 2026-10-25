/**
 * @file riskScoringService.js
 * @description Deterministic, transparent risk scoring engine for DepSafe.
 * Computes individual vulnerability risk scores (0-100) and aggregates project-wide risk metrics.
 *
 * SCORING METHODOLOGY:
 * 1. Base Score:
 *    - If a valid numerical CVSS v3 score (0.0 - 10.0) is available, Base = cvssScore * 10 (range: 0 - 100).
 *    - Otherwise, falls back to qualitative advisory severity:
 *        * Critical: 95
 *        * High: 80
 *        * Medium: 55
 *        * Low: 25
 *        * Unknown: 0
 *
 * 2. Contextual Adjustments:
 *    - Fix Availability: +5 if an official fix version exists (prioritizes actionable remediation).
 *    - Direct Dependency: +5 if the package is declared directly in project manifests (higher exposure).
 *
 * 3. Bounding:
 *    - Score is clamped strictly between 0 and 100 via Math.max(0, Math.min(100, score)).
 *
 * 4. Project Overall Score:
 *    - Arithmetic mean of individual finding risk scores, or 0 if no findings exist.
 */

const { BASE_SEVERITY_SCORES } = require("../utils/constants");

/**
 * Calculates a bounded risk score (0-100) for an individual finding.
 * @param {Object} finding
 * @param {number} [finding.cvssScore] - Numerical CVSS score if available
 * @param {string} [finding.severity] - 'critical', 'high', 'medium', 'low', 'unknown'
 * @param {Array<string>} [finding.fixedVersions] - List of patched versions
 * @param {boolean} [finding.direct] - Whether the dependency is direct or transitive
 * @returns {number} Score between 0 and 100
 */
const scoreFinding = (finding) => {
    // 1. Determine base severity score
    let base = 0;
    if (Number.isFinite(finding.cvssScore) && finding.cvssScore >= 0 && finding.cvssScore <= 10) {
        base = finding.cvssScore * 10;
    } else {
        const severityKey = String(finding.severity || "unknown").toLowerCase();
        base = BASE_SEVERITY_SCORES[severityKey] ?? 0;
    }

    // 2. Adjustments based on operational context
    const hasFixAdjustment = finding.fixedVersions && finding.fixedVersions.length > 0 ? 5 : 0;
    const directDependencyAdjustment = finding.direct ? 5 : 0;

    const total = Math.round(base + hasFixAdjustment + directDependencyAdjustment);

    // 3. Strict clamping between 0 and 100
    return Math.max(0, Math.min(100, total));
};

/**
 * Calculates the overall project risk score by aggregating finding risk scores.
 * @param {Array<Object>} findings - List of findings with .riskScore
 * @returns {number} Aggregated score between 0 and 100
 */
const projectScore = (findings) => {
    if (!Array.isArray(findings) || findings.length === 0) return 0;
    const sum = findings.reduce((acc, f) => acc + (Number(f.riskScore) || 0), 0);
    return Math.max(0, Math.min(100, Math.round(sum / findings.length)));
};

module.exports = {
    scoreFinding,
    projectScore,
};