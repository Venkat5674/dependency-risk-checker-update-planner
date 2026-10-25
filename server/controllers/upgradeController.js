/**
 * @file upgradeController.js
 * @description Controller for the Upgrade Planner.
 * Delivers prioritized, safe upgrade recommendations, advisory details, and remediation updates.
 */

const asyncHandler = require("../utils/asyncHandler");
const {
    getUpgradeRecommendations,
    getUpgradeById,
    updateRemediationStatus,
} = require("../services/upgradeService");

/**
 * Lists prioritized upgrade recommendations for the user.
 */
exports.list = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.project) filter.project = req.query.project;

    const upgrades = await getUpgradeRecommendations(req.user._id, filter);

    res.json({
        success: true,
        message: "Upgrade recommendations retrieved successfully.",
        data: { upgrades },
    });
});

/**
 * Retrieves a single upgrade recommendation by ID.
 */
exports.get = asyncHandler(async (req, res) => {
    const upgrade = await getUpgradeById(req.params.id, req.user._id);

    res.json({
        success: true,
        message: "Upgrade recommendation retrieved successfully.",
        data: { upgrade },
    });
});

/**
 * Updates remediation status for an upgrade plan item.
 */
exports.updateStatus = asyncHandler(async (req, res) => {
    const { status, notes } = req.body;
    const upgrade = await updateRemediationStatus(
        req.params.id,
        req.user._id,
        status,
        notes
    );

    res.json({
        success: true,
        message: "Upgrade status updated successfully.",
        data: { upgrade },
    });
});
