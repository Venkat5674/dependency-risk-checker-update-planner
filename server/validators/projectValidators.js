/**
 * @file projectValidators.js
 * @description Request validation rules for project creation, retrieval, updating, and deletion.
 */

const { body, param } = require("express-validator");
const { MANIFEST_TYPES } = require("../utils/constants");

/**
 * Validates MongoDB ObjectId in URL params (e.g. /projects/:id)
 */
const idParamValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid project ID format."),
];

/**
 * Validation chain for project creation:
 * - name: required, 2-120 characters
 * - description: optional, up to 1000 characters
 * - repositoryUrl: optional, up to 500 characters
 * - manifestType: must be one of the supported manifest formats
 * - manifest: manifest raw string, 1 byte to 1 MB limit
 */
const createProjectValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Project name is required.")
        .isLength({ min: 2, max: 120 }).withMessage("Project name must be between 2 and 120 characters."),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters."),
    body("repositoryUrl")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Repository URL cannot exceed 500 characters."),
    body("manifestType")
        .notEmpty().withMessage("Manifest type is required.")
        .isIn(Object.values(MANIFEST_TYPES)).withMessage(
            `Manifest type must be one of: ${Object.values(MANIFEST_TYPES).join(", ")}`
        ),
    body("manifest")
        .notEmpty().withMessage("Manifest content is required.")
        .isString().withMessage("Manifest content must be a string.")
        .isLength({ min: 1, max: 1024 * 1024 }).withMessage("Manifest content cannot exceed 1 MB."),
];

/**
 * Validation chain for updating project metadata:
 * - name: optional, 2-120 chars
 * - description: optional, up to 1000 chars
 * - repositoryUrl: optional, up to 500 chars
 */
const updateProjectValidator = [
    ...idParamValidator,
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 120 }).withMessage("Project name must be between 2 and 120 characters."),
    body("description")
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage("Description cannot exceed 1000 characters."),
    body("repositoryUrl")
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage("Repository URL cannot exceed 500 characters."),
];

module.exports = {
    idParamValidator,
    createProjectValidator,
    updateProjectValidator,
};
