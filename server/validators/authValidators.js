/**
 * @file authValidators.js
 * @description Request validation rules for DepSafe authentication and profile endpoints.
 * Uses express-validator to enforce data integrity and prevent malicious payloads.
 */

const { body } = require("express-validator");

/**
 * Validation chain for new user registration:
 * - name: required, trimmed, 2-80 characters
 * - email: valid email format, normalized to lowercase
 * - password: minimum 10 characters (maximum 128) to prevent computational DoS during bcrypt hashing
 */
const registerValidator = [
    body("name")
        .trim()
        .notEmpty().withMessage("Full name is required.")
        .isLength({ min: 2, max: 80 }).withMessage("Name must be between 2 and 80 characters."),
    body("email")
        .trim()
        .notEmpty().withMessage("Email address is required.")
        .isEmail().withMessage("Please provide a valid email address.")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("Password is required.")
        .isLength({ min: 10, max: 128 }).withMessage("Password must be between 10 and 128 characters."),
];

/**
 * Validation chain for user login:
 * - email: required, valid format, normalized
 * - password: required, non-empty
 */
const loginValidator = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email address is required.")
        .isEmail().withMessage("Please provide a valid email address.")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("Password is required.")
        .isString().withMessage("Password must be a valid string."),
];

/**
 * Validation chain for profile updates:
 * - name: optional, 2-80 characters if provided
 */
const updateProfileValidator = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 80 }).withMessage("Name must be between 2 and 80 characters."),
];

module.exports = {
    registerValidator,
    loginValidator,
    updateProfileValidator,
};
