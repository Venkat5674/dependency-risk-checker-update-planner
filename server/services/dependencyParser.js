/**
 * @file dependencyParser.js
 * @description Safe dependency manifest parser for npm, Python (PyPI), and Maven ecosystems.
 *
 * SECURITY & PARSING PRINCIPLES:
 * 1. Safe parsing: Never executes package scripts, never evaluates dynamic code, and never invokes package managers.
 * 2. Resource protection: Limits manifest payload size to 1 MB and max dependencies to 2000.
 * 3. XML Safety: Enforces strict rejection of <!DOCTYPE and <!ENTITY to prevent XML External Entity (XXE) attacks.
 * 4. Version Resolution: Explicitly distinguishes between declared version ranges (unresolved)
 *    and exact pinned/installed versions (resolved).
 */

const { ECOSYSTEMS, MANIFEST_TYPES } = require("../utils/constants");

const MAX_MANIFEST_SIZE = 1024 * 1024; // 1 Megabyte
const MAX_DEPENDENCIES = 2000;

/**
 * Validates dependency list constraints.
 * @throws {Error} If empty or exceeds maximum dependency count
 */
const validate = (dependencies, ecosystem, manifestType) => {
    if (!dependencies.length) {
        throw new Error("Manifest contains no supported dependencies.");
    }
    if (dependencies.length > MAX_DEPENDENCIES) {
        throw new Error(`Manifest exceeds maximum limit of ${MAX_DEPENDENCIES} dependencies.`);
    }
    return { ecosystem, manifestType, dependencies };
};

/**
 * Parses Node.js `package.json` manifests.
 * Declared versions typically contain ranges (^, ~, >=), so versions are marked as unresolved.
 * @param {string} text - JSON string of package.json
 */
const parsePackageJson = (text) => {
    let data;
    try {
        data = JSON.parse(text);
    } catch (err) {
        throw new Error(`Malformed package.json: ${err.message}`);
    }

    const dependencies = [];
    const combined = {
        ...(data.dependencies || {}),
        ...(data.devDependencies || {}),
    };

    for (const [name, requestedVersion] of Object.entries(combined)) {
        if (!name || typeof name !== "string") continue;
        dependencies.push({
            name: name.trim(),
            requestedVersion: String(requestedVersion).trim(),
            version: null, // Version range is unresolved until lockfile is provided
            resolved: false,
            direct: true,
        });
    }

    return validate(dependencies, ECOSYSTEMS.NPM, MANIFEST_TYPES.PACKAGE_JSON);
};

/**
 * Parses Node.js `package-lock.json` manifests (supports lockfileVersion 1, 2, and 3).
 * Extracts pinned resolved versions and distinguishes direct from transitive packages.
 * @param {string} text - JSON string of package-lock.json
 */
const parsePackageLock = (text) => {
    let data;
    try {
        data = JSON.parse(text);
    } catch (err) {
        throw new Error(`Malformed package-lock.json: ${err.message}`);
    }

    const dependencies = [];

    // Lockfile v2 & v3: use "packages" map
    if (data.packages && typeof data.packages === "object") {
        for (const [pkgPath, val] of Object.entries(data.packages)) {
            if (!pkgPath || !pkgPath.includes("node_modules/") || !val || !val.version) continue;

            const name = pkgPath.split("node_modules/").pop();
            const isTransitive = (pkgPath.match(/node_modules\//g) || []).length > 1;

            dependencies.push({
                name,
                version: String(val.version).trim(),
                requestedVersion: String(val.version).trim(),
                resolved: true,
                direct: !isTransitive,
            });
        }
    } else if (data.dependencies && typeof data.dependencies === "object") {
        // Lockfile v1 legacy structure
        for (const [name, val] of Object.entries(data.dependencies)) {
            if (!name || !val || !val.version) continue;

            dependencies.push({
                name,
                version: String(val.version).trim(),
                requestedVersion: String(val.version).trim(),
                resolved: true,
                direct: true,
            });
        }
    }

    return validate(dependencies, ECOSYSTEMS.NPM, MANIFEST_TYPES.PACKAGE_LOCK);
};

/**
 * Parses Python `requirements.txt` manifests.
 * Handles pinned versions (==) as resolved, while treating unpinned or range-based packages as unresolved.
 * Ignores comments (#) and file reference directives (-r).
 * @param {string} text - Raw text of requirements.txt
 */
const parseRequirements = (text) => {
    const lines = text.split(/\r?\n/);
    const dependencies = [];

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || line.startsWith("-r") || line.startsWith("-i")) {
            continue;
        }

        // Match package name and optional pinned version: e.g. "requests == 2.32.0"
        const match = line.match(/^([A-Za-z0-9_.-]+)\s*(?:==\s*([A-Za-z0-9.+!-]+))?/);
        if (match) {
            const name = match[1].trim();
            const pinnedVersion = match[2] ? match[2].trim() : null;

            dependencies.push({
                name,
                version: pinnedVersion,
                requestedVersion: pinnedVersion || line,
                resolved: Boolean(pinnedVersion),
                direct: true,
            });
        }
    }

    return validate(dependencies, ECOSYSTEMS.PYPI, MANIFEST_TYPES.REQUIREMENTS_TXT);
};

/**
 * Parses Java Maven `pom.xml` dependency declarations.
 * Mitigates XML External Entity (XXE) vulnerabilities by blocking DOCTYPE and ENTITY tags.
 * @param {string} text - Raw XML string of pom.xml
 */
const parsePom = (text) => {
    // XXE Defense: strictly forbid DOCTYPE and ENTITY declarations
    if (/<\!DOCTYPE|<!ENTITY/i.test(text)) {
        throw new Error("XML entities and external documents are strictly prohibited for security reasons.");
    }

    const dependencies = [];
    const dependencyBlocks = text.match(/<dependency\b[^>]*>[\s\S]*?<\/dependency>/gi) || [];

    for (const block of dependencyBlocks) {
        const groupMatch = block.match(/<groupId>\s*([^<]+)\s*<\/groupId>/i);
        const artifactMatch = block.match(/<artifactId>\s*([^<]+)\s*<\/artifactId>/i);
        const versionMatch = block.match(/<version>\s*([^<]+)\s*<\/version>/i);

        if (groupMatch && artifactMatch) {
            const group = groupMatch[1].trim();
            const artifact = artifactMatch[1].trim();
            const version = versionMatch ? versionMatch[1].trim() : null;

            dependencies.push({
                name: `${group}:${artifact}`,
                version: version && !version.startsWith("${") ? version : null,
                requestedVersion: version || "managed",
                resolved: Boolean(version && !version.startsWith("${")),
                direct: true,
            });
        }
    }

    return validate(dependencies, ECOSYSTEMS.MAVEN, MANIFEST_TYPES.POM_XML);
};

/**
 * Universal dispatcher for parsing dependency manifests by format type.
 * @param {string} manifestType - 'package.json', 'package-lock.json', 'requirements.txt', 'pom.xml'
 * @param {string} text - Raw manifest content
 * @returns {{ecosystem: string, manifestType: string, dependencies: Array<Object>}}
 */
const parseManifest = (manifestType, text) => {
    if (typeof text !== "string" || !text.trim()) {
        throw new Error("Manifest content is empty.");
    }
    if (Buffer.byteLength(text, "utf8") > MAX_MANIFEST_SIZE) {
        throw new Error("Manifest size exceeds the 1 MB security limit.");
    }

    switch (manifestType) {
        case MANIFEST_TYPES.PACKAGE_JSON:
            return parsePackageJson(text);
        case MANIFEST_TYPES.PACKAGE_LOCK:
            return parsePackageLock(text);
        case MANIFEST_TYPES.REQUIREMENTS_TXT:
            return parseRequirements(text);
        case MANIFEST_TYPES.POM_XML:
            return parsePom(text);
        default:
            throw new Error(`Unsupported manifest type: "${manifestType}".`);
    }
};

module.exports = {
    parseManifest,
    parsePackageJson,
    parsePackageLock,
    parseRequirements,
    parsePom,
    MAX_DEPENDENCIES,
    MAX_MANIFEST_SIZE,
};