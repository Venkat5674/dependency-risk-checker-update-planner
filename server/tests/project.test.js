/**
 * @file project.test.js
 * @description Unit tests for project manifest validations, ecosystem mapping, and limits.
 */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseManifest, MAX_DEPENDENCIES, MAX_MANIFEST_SIZE } = require("../services/dependencyParser");

test("rejects manifests exceeding maximum size limit", () => {
    const hugeManifest = "a".repeat(MAX_MANIFEST_SIZE + 10);
    assert.throws(() => {
        parseManifest("package.json", hugeManifest);
    }, /exceeds the 1 MB security limit/);
});

test("rejects unsupported manifest types", () => {
    assert.throws(() => {
        parseManifest("build.gradle", "dependencies {}");
    }, /Unsupported manifest type/);
});

test("parses package-lock.json with both direct and transitive dependencies", () => {
    const lockContent = JSON.stringify({
        name: "test-app",
        version: "1.0.0",
        lockfileVersion: 2,
        packages: {
            "node_modules/express": {
                version: "4.19.2",
            },
            "node_modules/express/node_modules/cookie": {
                version: "0.6.0",
            },
        },
    });

    const parsed = parseManifest("package-lock.json", lockContent);
    assert.equal(parsed.ecosystem, "npm");
    assert.equal(parsed.dependencies.length, 2);

    const direct = parsed.dependencies.find((d) => d.name === "express");
    const transitive = parsed.dependencies.find((d) => d.name === "cookie");

    assert.ok(direct, "Direct dependency found");
    assert.equal(direct.direct, true);
    assert.equal(direct.version, "4.19.2");
    assert.equal(direct.resolved, true);

    assert.ok(transitive, "Transitive dependency found");
    assert.equal(transitive.direct, false);
    assert.equal(transitive.version, "0.6.0");
});
