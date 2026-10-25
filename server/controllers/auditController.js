/**
 * @file auditController.js
 * @description Controller for retrieving user-scoped audit activity logs.
 */

const asyncHandler = require("../utils/asyncHandler");
const { getAuditLogs } = require("../services/auditService");

/**
 * Retrieves audit logs for the authenticated user with pagination.
 */
exports.list = asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const page = req.query.page ? Number(req.query.page) : 1;

    const logs = await getAuditLogs(req.user._id, { limit, page });

    res.json({
        success: true,
        message: "Audit logs retrieved successfully.",
        data: { logs },
    });
});