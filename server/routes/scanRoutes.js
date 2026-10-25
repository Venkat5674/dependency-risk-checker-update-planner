/**
 * @file scanRoutes.js
 * @description API route definitions for scans (listing, details, polling status, retry).
 */

const express = require("express");
const controller = require("../controllers/scanController");
const validate = require("../middleware/validateRequest");
const { scanLimiter } = require("../middleware/rateLimiter");
const { scanIdParamValidator, listScansQueryValidator } = require("../validators/scanValidators");

const router = express.Router();

// List scans across all projects owned by the user
router.get("/", listScansQueryValidator, validate, controller.listAll);

// Get complete details of a specific scan
router.get("/:id", scanIdParamValidator, validate, controller.get);

// Get status of a scan (for polling during execution)
router.get("/:id/status", scanIdParamValidator, validate, controller.status);

// Retry a failed scan (rate limited)
router.post("/:id/retry", scanIdParamValidator, scanLimiter, validate, controller.retry);

module.exports = router;