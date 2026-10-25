/**
 * @file scanValidators.js
 * @description Request validation rules for triggering scans, checking scan status, and retrying failed scans.
 */

const { param, query } = require("express-validator");

/**
 * Validates MongoDB ObjectId in URL params for scans
 */
const scanIdParamValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid scan ID format."),
];

/**
 * Validates query filters when listing scans
 */
const listScansQueryValidator = [
    query("limit")
        .optional()
        .isInt({ min: 1, max: 200 })
        .withMessage("Limit must be an integer between 1 and 200."),
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer."),
];

module.exports = {
    scanIdParamValidator,
    listScansQueryValidator,
};
