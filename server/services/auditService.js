/**
 * @file auditService.js
 * @description Centralized audit logging service for tracking security-sensitive operations.
 * Records user authentications, project modifications, vulnerability remediations, and scans.
 * Ensures sensitive data such as passwords, tokens, and raw manifests are never persisted to logs.
 */

const AuditLog = require("../models/AuditLog");

/**
 * Strips sensitive keys from metadata objects to prevent accidental credential leakage.
 * @param {Object} metadata - Arbitrary metadata object
 * @returns {Object} Sanitized copy of metadata
 */
const sanitizeMetadata = (metadata = {}) => {
    if (!metadata || typeof metadata !== "object") return {};
    const sanitized = { ...metadata };
    const forbiddenKeys = [
        "password",
        "passwordHash",
        "confirmPassword",
        "token",
        "jwt",
        "secret",
        "manifest",
    ];

    for (const key of Object.keys(sanitized)) {
        if (forbiddenKeys.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
            delete sanitized[key];
        }
    }
    return sanitized;
};

/**
 * Creates an immutable audit log entry.
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.actor - ID of the user performing the action
 * @param {string|mongoose.Types.ObjectId} [params.project] - Optional ID of the affected project
 * @param {string} params.action - Name of the action (e.g., 'user.login', 'project.created')
 * @param {string} params.resourceType - Type of resource ('User', 'Project', 'Scan', 'Vulnerability')
 * @param {string} [params.resourceId] - ID of the target resource
 * @param {'success'|'failure'} params.outcome - Result of the action
 * @param {Object} [params.metadata] - Additional sanitized context
 */
const logEvent = async ({
    actor,
    project = null,
    action,
    resourceType,
    resourceId = "",
    outcome = "success",
    metadata = {},
}) => {
    try {
        if (!actor || !action || !resourceType) {
            console.warn("Audit log skipped: missing required fields (actor, action, resourceType).");
            return null;
        }

        const logEntry = await AuditLog.create({
            actor,
            project,
            action,
            resourceType,
            resourceId: resourceId ? resourceId.toString() : "",
            outcome,
            metadata: sanitizeMetadata(metadata),
        });

        return logEntry;
    } catch (error) {
        // Audit logging should not crash the primary user workflow if database write fails
        console.error(`Audit logging failure for action "${action}":`, error.message);
        return null;
    }
};

/**
 * Retrieves audit logs for an authenticated user with pagination and sorting.
 * @param {string|mongoose.Types.ObjectId} userId - Current user ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of audit logs
 */
const getAuditLogs = async (userId, { limit = 50, page = 1 } = {}) => {
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const parsedPage = Math.max(Number(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    return AuditLog.find({ actor: userId })
        .populate("project", "name")
        .sort("-createdAt")
        .skip(skip)
        .limit(parsedLimit);
};

module.exports = {
    logEvent,
    getAuditLogs,
    sanitizeMetadata,
};
