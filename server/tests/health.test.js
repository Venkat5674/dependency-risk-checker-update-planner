const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../app");

let server;
let baseUrl;

before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    await new Promise((resolve) => server.close(resolve));
});

test("health endpoint reports readiness state", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 503);
    assert.equal(body.success, false);
    assert.equal(body.status, "not_ready");
    assert.equal(body.database, "disconnected");
});

test("unknown routes return the shared error shape", async () => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.success, false);
    assert.ok(body.message.includes("Route not found"));
    assert.deepEqual(body.errors, []);
});
