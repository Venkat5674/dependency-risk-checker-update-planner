/**
 * @file dashboardController.js
 * @description Controller delivering security metrics, vulnerability trends,
 * and recent scan telemetry for the executive and engineer dashboard.
 */

const Project = require("../models/Project");
const Scan = require("../models/Scan");
const Vulnerability = require("../models/Vulnerability");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Delivers top-level KPI summary cards:
 * - Total projects monitored
 * - Total dependencies tracked
 * - Open/in-progress vulnerabilities
 * - Critical count
 * - High-risk findings (riskScore >= 70)
 * - Most recent scan status and score
 */
exports.summary = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [projectsCount, dependencyAggregation, openVulnCount, criticalCount, highRiskCount, latestScan] =
        await Promise.all([
            Project.countDocuments({ owner: userId }),
            Project.aggregate([
                { $match: { owner: userId } },
                { $project: { count: { $size: "$dependencies" } } },
                { $group: { _id: null, total: { $sum: "$count" } } },
            ]),
            Vulnerability.countDocuments({
                owner: userId,
                status: { $in: ["open", "in_progress"] },
            }),
            Vulnerability.countDocuments({
                owner: userId,
                severity: "critical",
                status: { $ne: "resolved" },
            }),
            Vulnerability.countDocuments({
                owner: userId,
                riskScore: { $gte: 70 },
                status: { $ne: "resolved" },
            }),
            Scan.findOne({ owner: userId })
                .sort("-createdAt")
                .populate("project", "name ecosystem")
                .select("status createdAt riskScore vulnerabilityCount dependencyCount project"),
        ]);

    const totalDependencies = dependencyAggregation[0]?.total || 0;

    res.json({
        success: true,
        message: "Dashboard summary retrieved successfully.",
        data: {
            projects: projectsCount,
            dependencies: totalDependencies,
            vulnerabilities: openVulnCount,
            critical: criticalCount,
            highRisk: highRiskCount,
            latestScan,
        },
    });
});

/**
 * Delivers historical vulnerability trends and severity distributions for dashboard charts.
 */
exports.trends = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [severityBreakdown, recentScansTrend, topPackages] = await Promise.all([
        // Count vulnerabilities by severity
        Vulnerability.aggregate([
            { $match: { owner: userId, status: { $ne: "resolved" } } },
            { $group: { _id: "$severity", count: { $sum: 1 } } },
        ]),
        // Risk score trend over the last 10 completed scans
        Scan.find({ owner: userId, status: "completed" })
            .sort("createdAt")
            .limit(10)
            .select("createdAt riskScore vulnerabilityCount manifestType"),
        // Most frequently affected packages
        Vulnerability.aggregate([
            { $match: { owner: userId, status: { $ne: "resolved" } } },
            { $group: { _id: "$packageName", count: { $sum: 1 }, maxRisk: { $max: "$riskScore" } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]),
    ]);

    // Format severity breakdown into consistent structure
    const severities = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
    severityBreakdown.forEach((item) => {
        if (item._id && severities.hasOwnProperty(item._id.toLowerCase())) {
            severities[item._id.toLowerCase()] = item.count;
        }
    });

    res.json({
        success: true,
        message: "Dashboard trends retrieved successfully.",
        data: {
            severities,
            scansTrend: recentScansTrend,
            topVulnerablePackages: topPackages.map((p) => ({
                packageName: p._id,
                vulnerabilityCount: p.count,
                highestRiskScore: p.maxRisk,
            })),
        },
    });
});

/**
 * Retrieves the most recent scans across all projects for quick audit preview.
 */
exports.recentScans = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const scans = await Scan.find({ owner: userId })
        .sort("-createdAt")
        .limit(5)
        .populate("project", "name ecosystem");

    res.json({
        success: true,
        message: "Recent scans retrieved successfully.",
        data: { scans },
    });
});
