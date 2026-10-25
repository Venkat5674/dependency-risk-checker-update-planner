/**
 * @file authRoutes.js
 * @description API route definitions for authentication and profile management.
 */

const express = require("express");
const controller = require("../controllers/authController");
const authenticate = require("../middleware/authenticate");
const validate = require("../middleware/validateRequest");
const { authLimiter } = require("../middleware/rateLimiter");
const {
    registerValidator,
    loginValidator,
    updateProfileValidator,
} = require("../validators/authValidators");

const router = express.Router();

// Registration endpoint: rate-limited, validated
router.post("/register", authLimiter, registerValidator, validate, controller.register);

// Login endpoint: rate-limited, validated
router.post("/login", authLimiter, loginValidator, validate, controller.login);

// Logout endpoint: requires valid JWT
router.post("/logout", authenticate, controller.logout);

// Retrieve current authenticated user profile
router.get("/me", authenticate, controller.me);

// Update current user profile
router.patch("/me", authenticate, updateProfileValidator, validate, controller.updateMe);

module.exports = router;