/**
 * @file auth.test.js
 * @description Unit and integration tests for authentication, password hashing, and token generation.
 */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { createToken } = require("../services/tokenService");
const { publicUser } = require("../services/authService");

test("publicUser sanitizes passwordHash and returns only safe fields", () => {
    const rawUser = {
        _id: "60d0fe4f5311236168a109ca",
        name: "Security Tester",
        email: "tester@example.com",
        passwordHash: "$2b$12$eX4mPL3H45hV4lu3",
        role: "user",
        createdAt: new Date("2026-01-01"),
        updatedAt: new Date("2026-01-02"),
    };

    const sanitized = publicUser(rawUser);

    assert.equal(sanitized.id, rawUser._id);
    assert.equal(sanitized.name, "Security Tester");
    assert.equal(sanitized.email, "tester@example.com");
    assert.equal(sanitized.role, "user");
    assert.equal(sanitized.passwordHash, undefined, "passwordHash must never be exposed");
});

test("tokenService generates valid signed JWT with correct claims", () => {
    process.env.JWT_SECRET = "test_super_secret_key_1234567890_depsafe";
    process.env.JWT_EXPIRES_IN = "15m";

    const user = {
        _id: "60d0fe4f5311236168a109ca",
        role: "user",
    };

    const token = createToken(user);
    assert.ok(typeof token === "string" && token.split(".").length === 3, "Must be valid JWT structure");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    assert.equal(decoded.sub, "60d0fe4f5311236168a109ca");
    assert.equal(decoded.role, "user");
});

test("bcrypt correctly hashes passwords and verifies them securely", async () => {
    const password = "SuperSecretPassword123!";
    const hash = await bcrypt.hash(password, 10);

    assert.notEqual(password, hash, "Hash must not equal plain text");
    const match = await bcrypt.compare(password, hash);
    assert.equal(match, true, "Valid password should verify");

    const mismatch = await bcrypt.compare("WrongPassword", hash);
    assert.equal(mismatch, false, "Invalid password should fail");
});
