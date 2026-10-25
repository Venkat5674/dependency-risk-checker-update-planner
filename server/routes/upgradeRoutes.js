/**
 * @file upgradeRoutes.js
 * @description API route definitions for upgrade planner recommendations.
 */

const express = require("express");
const { param, body } = require("express-validator");
const controller = require("../controllers/upgradeController");
const validate = require("../middleware/validateRequest");
const { REMEDIATION_STATUSES } = require("../utils/constants");

const router = express.Router();

const idValidator = [param("id").isMongoId().withMessage("Invalid upgrade ID.")];

// List prioritized upgrade recommendations
router.get("/", controller.list);

// Get single upgrade plan recommendation details
router.get("/:id", idValidator, validate, controller.get);

// Update remediation tracking status
router.patch(
    "/:id/status",
    [
        ...idValidator,
        body("status")
            .isIn(Object.values(REMEDIATION_STATUSES))
            .withMessage(`Status must be one of: ${Object.values(REMEDIATION_STATUSES).join(", ")}`),
    ],
    validate,
    controller.updateStatus
);

module.exports = router;
