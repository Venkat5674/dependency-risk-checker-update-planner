/**
 * @file scanController.js
 * @description Controller managing vulnerability scan jobs, history retrieval,
 * polling status, and retries.
 */

const Scan = require("../models/Scan");
const Project = require("../models/Project");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { runScan } = require("../services/scanService");
const { logEvent } = require("../services/auditService");
const { SCAN_STATUSES } = require("../utils/constants");

/**
 * Queues a vulnerability scan for a given project.
 */
exports.create = asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const scan = await Scan.create({
        project: project._id,
        owner: req.user._id,
        manifestType: project.manifestType,
        dependencyCount: project.dependencies.length,
        status: SCAN_STATUSES.QUEUED,
    });

    await logEvent({
        actor: req.user._id,
        project: project._id,
        action: "scan.queued",
        resourceType: "Scan",
        resourceId: scan._id.toString(),
        outcome: "success",
        metadata: { dependencyCount: project.dependencies.length },
    });

    // Run the scan asynchronously so HTTP response is returned immediately (status 202 Accepted)
    runScan(scan._id).catch((error) => {
        console.error(`Scan execution ${scan._id} failed:`, error.message);
    });

    res.status(202).json({
        success: true,
        message: "Vulnerability scan queued successfully.",
        data: { scan },
    });
});

/**
 * Lists all scans for the current user.
 */
exports.listAll = asyncHandler(async (req, res) => {
    const scans = await Scan.find({ owner: req.user._id })
        .populate("project", "name ecosystem")
        .sort("-createdAt")
        .limit(100);

    res.json({
        success: true,
        message: "Scans retrieved successfully.",
        data: { scans },
    });
});

/**
 * Lists all scans belonging to a specific project.
 */
exports.listByProject = asyncHandler(async (req, res) => {
    const scans = await Scan.find({ project: req.params.id, owner: req.user._id })
        .sort("-createdAt");

    res.json({
        success: true,
        message: "Project scans retrieved successfully.",
        data: { scans },
    });
});

/**
 * Retrieves a single scan by ID.
 */
exports.get = asyncHandler(async (req, res) => {
    const scan = await Scan.findOne({ _id: req.params.id, owner: req.user._id })
        .populate("project", "name ecosystem repositoryUrl");

    if (!scan) {
        throw new ApiError(404, "Scan not found.");
    }

    res.json({
        success: true,
        message: "Scan retrieved successfully.",
        data: { scan },
    });
});

/**
 * Lightweight endpoint for polling the status and progress of an active scan.
 */
exports.status = exports.get;

/**
 * Retries a failed scan.
 */
exports.retry = asyncHandler(async (req, res) => {
    const scan = await Scan.findOne({ _id: req.params.id, owner: req.user._id });
    if (!scan) {
        throw new ApiError(404, "Scan not found.");
    }

    if (scan.status !== SCAN_STATUSES.FAILED) {
        throw new ApiError(409, "Only failed scans can be retried.");
    }

    scan.status = SCAN_STATUSES.QUEUED;
    scan.errorMessage = undefined;
    await scan.save();

    await logEvent({
        actor: req.user._id,
        project: scan.project,
        action: "scan.retried",
        resourceType: "Scan",
        resourceId: scan._id.toString(),
        outcome: "success",
    });

    runScan(scan._id).catch((error) => {
        console.error(`Scan retry ${scan._id} failed:`, error.message);
    });

    res.status(202).json({
        success: true,
        message: "Scan retry queued successfully.",
        data: { scan },
    });
});