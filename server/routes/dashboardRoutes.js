/**
 * @file dashboardRoutes.js
 * @description API route definitions for dashboard analytics and summaries.
 */

const express = require("express");
const controller = require("../controllers/dashboardController");

const router = express.Router();

// Summary KPI metrics (projects, deps, open vulnerabilities, critical count, latest scan)
router.get("/summary", controller.summary);

// Visual trend metrics (severity breakdown, scan history risk line, top affected packages)
router.get("/trends", controller.trends);

// Recent scan history preview
router.get("/recent-scans", controller.recentScans);

module.exports = router;
