const queryOsv = async (dependency, timeoutMs = 8000) => {
    if (!dependency.version) return [];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch("https://api.osv.dev/v1/query", {
            method: "POST", headers: { "content-type": "application/json" },
            body: JSON.stringify({ version: dependency.version, package: { name: dependency.name, ecosystem: dependency.ecosystem } }),
            signal: controller.signal,
        });
        if (!response.ok) throw new Error(`OSV returned HTTP ${response.status}`);
        const data = await response.json();
        return Array.isArray(data.vulns) ? data.vulns : [];
    } finally {
        clearTimeout(timeout);
    }
};

const withRetry = async (fn, attempts = 2) => {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        try { return await fn(); } catch (error) { lastError = error; if (attempt < attempts - 1) await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1))); }
    }
    throw lastError;
};

module.exports = { queryOsv, withRetry };