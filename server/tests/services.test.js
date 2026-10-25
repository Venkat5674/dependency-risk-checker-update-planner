const assert = require("node:assert/strict");
const { test } = require("node:test");
const { parseManifest } = require("../services/dependencyParser");
const { scoreFinding, projectScore } = require("../services/riskScoringService");

test("parses package.json with unresolved ranges", () => {
    const result = parseManifest("package.json", JSON.stringify({ dependencies: { express: "^5.0.0" } }));
    assert.equal(result.ecosystem, "npm");
    assert.deepEqual(result.dependencies[0], {
        name: "express", requestedVersion: "^5.0.0", version: null, resolved: false, direct: true,
    });
});

test("parses pinned requirements and rejects unsafe XML", () => {
    const result = parseManifest("requirements.txt", "requests==2.32.0\nflask");
    assert.equal(result.dependencies[0].version, "2.32.0");
    assert.equal(result.dependencies[1].resolved, false);
    assert.throws(() => parseManifest("pom.xml", "<!DOCTYPE x><dependency/>"), /entities/);
});

test("risk scores are deterministic and bounded", () => {
    const critical = scoreFinding({ severity: "critical", fixedVersions: ["2.0.0"], direct: true });
    assert.equal(critical, 100);
    assert.ok(critical >= 0 && critical <= 100);
    assert.equal(projectScore([{ riskScore: 80 }, { riskScore: 20 }]), 50);
});
