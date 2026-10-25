/**
 * @file scan.test.js
 * @description Unit tests for OSV severity parsing, advisory normalization, and upgrade recommendations.
 */

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { severityFrom } = require("../services/scanService");
const { generateRecommendation } = require("../services/upgradeService");

test("severityFrom correctly extracts database_specific CVSS scores", () => {
    const vuln = {
        id: "GHSA-1234",
        database_specific: { cvss: 9.8 },
    };
    const result = severityFrom(vuln);
    assert.equal(result.severity, "critical");
    assert.equal(result.cvssScore, 9.8);
});

test("severityFrom parses CVSS v3 score from severity array", () => {
    const vuln = {
        id: "GHSA-5678",
        severity: [{ type: "CVSS_V3", score: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H 7.5" }],
    };
    const result = severityFrom(vuln);
    assert.equal(result.severity, "high");
    assert.equal(result.cvssScore, 7.5);
});

test("severityFrom handles unknown severity safely", () => {
    const vuln = { id: "GHSA-none" };
    const result = severityFrom(vuln);
    assert.equal(result.severity, "unknown");
    assert.equal(result.cvssScore, undefined);
});

test("generateRecommendation generates safe advisory when fix is available", () => {
    const vuln = {
        vulnerabilityId: "CVE-2024-1234",
        packageName: "axios",
        ecosystem: "npm",
        installedVersion: "1.6.0",
        fixedVersions: ["1.7.4"],
        severity: "critical",
        riskScore: 95,
        references: ["https://nvd.nist.gov/vuln/detail/CVE-2024-1234"],
    };

    const rec = generateRecommendation(vuln);
    assert.equal(rec.isFixAvailable, true);
    assert.equal(rec.fixedVersion, "1.7.4");
    assert.ok(rec.action.includes("Upgrade axios"));
    assert.ok(rec.guidance.includes("changelog/release notes"));
    assert.ok(rec.disclaimer.includes("strictly advisory"));
});

test("generateRecommendation handles advisories with no fix without inventing versions", () => {
    const vuln = {
        vulnerabilityId: "CVE-2024-9999",
        packageName: "unpatched-lib",
        ecosystem: "npm",
        installedVersion: "0.1.0",
        fixedVersions: [],
        severity: "high",
        riskScore: 80,
    };

    const rec = generateRecommendation(vuln);
    assert.equal(rec.isFixAvailable, false);
    assert.equal(rec.fixedVersion, null);
    assert.ok(rec.action.includes("No official fixed version reported"));
});
