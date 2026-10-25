/**
 * @file authService.js
 * @description Authentication service handling user registration, credential verification,
 * password hashing, and user profile formatting.
 */

const bcrypt = require("bcrypt");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { createToken } = require("./tokenService");
const { logEvent } = require("./auditService");

/**
 * Strips passwordHash and internal attributes before returning user objects to clients.
 * @param {Object} user - User document
 * @returns {Object} Publicly safe user representation
 */
const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
});

/**
 * Registers a new user account with a hashed password and initializes audit trail.
 * @param {Object} params - User registration details
 * @param {string} params.name - User full name
 * @param {string} params.email - User email address
 * @param {string} params.password - Plain text password to hash
 * @returns {Promise<{user: Object, token: string}>}
 */
const register = async ({ name, email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if account already exists
    const existing = await User.exists({ email: normalizedEmail });
    if (existing) {
        throw new ApiError(409, "An account with that email already exists.");
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
    });

    // Record audit event for account creation
    await logEvent({
        actor: user._id,
        action: "user.registered",
        resourceType: "User",
        resourceId: user._id.toString(),
        outcome: "success",
        metadata: { email: normalizedEmail, name: user.name },
    });

    return {
        user: publicUser(user),
        token: createToken(user),
    };
};

/**
 * Verifies credentials, verifies account active status, and returns an access token.
 * Uses generic error messages to prevent user enumeration attacks.
 * @param {Object} params - Login credentials
 * @param {string} params.email - User email
 * @param {string} params.password - User password
 * @returns {Promise<{user: Object, token: string}>}
 */
const login = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

    const valid = user && user.isActive && (await bcrypt.compare(password, user.passwordHash));

    if (!valid) {
        if (user) {
            await logEvent({
                actor: user._id,
                action: "user.login_failed",
                resourceType: "User",
                resourceId: user._id.toString(),
                outcome: "failure",
                metadata: { email: normalizedEmail, reason: "invalid_credentials" },
            });
        }
        throw new ApiError(401, "Invalid email or password.");
    }

    // Record successful login audit
    await logEvent({
        actor: user._id,
        action: "user.logged_in",
        resourceType: "User",
        resourceId: user._id.toString(),
        outcome: "success",
        metadata: { email: normalizedEmail },
    });

    return {
        user: publicUser(user),
        token: createToken(user),
    };
};

module.exports = {
    register,
    login,
    publicUser,
};