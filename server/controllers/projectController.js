/**
 * @file projectController.js
 * @description Controller handling project CRUD operations, manifest parsing,
 * ownership isolation, and audit logging.
 */

const mongoose = require("mongoose");
const Project = require("../models/Project");
const Scan = require("../models/Scan");
const Vulnerability = require("../models/Vulnerability");
const { parseManifest } = require("../services/dependencyParser");
const { logEvent } = require("../services/auditService");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Finds a project strictly owned by the requesting user.
 * Prevents Insecure Direct Object References (IDOR).
 */
const findOwnedProject = (id, ownerId) => Project.findOne({ _id: id, owner: ownerId });

/**
 * Lists all projects belonging to the authenticated user.
 */
exports.list = asyncHandler(async (req, res) => {
    const projects = await Project.find({ owner: req.user._id })
        .populate("latestScan")
        .sort("-updatedAt");

    res.json({
        success: true,
        message: "Projects retrieved successfully.",
        data: { projects },
    });
});

/**
 * Creates a new project from a dependency manifest.
 * Parses and validates the submitted manifest content safely without executing it.
 */
exports.create = asyncHandler(async (req, res) => {
    const { name, description, repositoryUrl, manifestType, manifest } = req.body;

    let parsed;
    try {
        parsed = parseManifest(manifestType, manifest);
    } catch (error) {
        throw new ApiError(400, `Manifest parsing failed: ${error.message}`);
    }

    const project = await Project.create({
        owner: req.user._id,
        name: name.trim(),
        description: description ? description.trim() : "",
        repositoryUrl: repositoryUrl ? repositoryUrl.trim() : "",
        manifestType,
        ecosystem: parsed.ecosystem,
        dependencies: parsed.dependencies,
    });

    // Record audit event for project creation
    await logEvent({
        actor: req.user._id,
        project: project._id,
        action: "project.created",
        resourceType: "Project",
        resourceId: project._id.toString(),
        outcome: "success",
        metadata: {
            name: project.name,
            ecosystem: project.ecosystem,
            manifestType: project.manifestType,
            dependencyCount: parsed.dependencies.length,
        },
    });

    res.status(201).json({
        success: true,
        message: "Project created successfully.",
        data: { project },
    });
});

/**
 * Retrieves a single project by ID with its latest scan details.
 */
exports.get = asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        throw new ApiError(404, "Project not found.");
    }

    const project = await findOwnedProject(req.params.id, req.user._id).populate("latestScan");
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    res.json({
        success: true,
        message: "Project retrieved successfully.",
        data: { project },
    });
});

/**
 * Updates project metadata (name, description, repositoryUrl).
 */
exports.update = asyncHandler(async (req, res) => {
    const project = await findOwnedProject(req.params.id, req.user._id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const previousName = project.name;
    if (typeof req.body.name === "string") project.name = req.body.name.trim();
    if (typeof req.body.description === "string") project.description = req.body.description.trim();
    if (typeof req.body.repositoryUrl === "string") project.repositoryUrl = req.body.repositoryUrl.trim();

    await project.save();

    await logEvent({
        actor: req.user._id,
        project: project._id,
        action: "project.updated",
        resourceType: "Project",
        resourceId: project._id.toString(),
        outcome: "success",
        metadata: { previousName, newName: project.name },
    });

    res.json({
        success: true,
        message: "Project updated successfully.",
        data: { project },
    });
});

/**
 * Deletes a project and cascades cleanup to associated scans and findings.
 */
exports.remove = asyncHandler(async (req, res) => {
    const project = await findOwnedProject(req.params.id, req.user._id);
    if (!project) {
        throw new ApiError(404, "Project not found.");
    }

    const projectId = project._id;
    const projectName = project.name;

    // Delete associated scans and vulnerabilities to avoid orphan records
    await Scan.deleteMany({ project: projectId });
    await Vulnerability.deleteMany({ project: projectId });
    await project.deleteOne();

    await logEvent({
        actor: req.user._id,
        project: projectId,
        action: "project.deleted",
        resourceType: "Project",
        resourceId: projectId.toString(),
        outcome: "success",
        metadata: { name: projectName },
    });

    res.json({
        success: true,
        message: "Project and associated scans deleted successfully.",
        data: {},
    });
});