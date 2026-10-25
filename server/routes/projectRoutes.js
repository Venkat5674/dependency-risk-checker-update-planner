/**
 * @file projectRoutes.js
 * @description API route definitions for project management and project-scoped scans.
 */

const express = require("express");
const controller = require("../controllers/projectController");
const scanController = require("../controllers/scanController");
const validate = require("../middleware/validateRequest");
const {
    idParamValidator,
    createProjectValidator,
    updateProjectValidator,
} = require("../validators/projectValidators");

const router = express.Router();

// List all projects owned by the authenticated user
router.get("/", controller.list);

// Create a new project from a dependency manifest
router.post("/", createProjectValidator, validate, controller.create);

// Get single project details by ID
router.get("/:id", idParamValidator, validate, controller.get);

// Update project metadata
router.patch("/:id", updateProjectValidator, validate, controller.update);

// Delete project and related scans/findings
router.delete("/:id", idParamValidator, validate, controller.remove);

// Project-scoped scan endpoints:
// Trigger a new scan for this project
router.post("/:id/scans", idParamValidator, validate, scanController.create);

// List scan history for this specific project
router.get("/:id/scans", idParamValidator, validate, scanController.listByProject);

module.exports = router;