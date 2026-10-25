/**
 * @file constants.js
 * @description Centralized application constants for DepSafe.
 * Defines supported ecosystems, manifest file formats, remediation workflow statuses,
 * scan execution states, role hierarchies, and base vulnerability risk scoring weights.
 */

// Supported programming language and package manager ecosystems
const ECOSYSTEMS = {
    NPM: "npm",
    PYPI: "PyPI",
    MAVEN: "Maven",
};

// Supported dependency manifest file types parsed by DepSafe
const MANIFEST_TYPES = {
    PACKAGE_JSON: "package.json",
    PACKAGE_LOCK: "package-lock.json",
    REQUIREMENTS_TXT: "requirements.txt",
    POM_XML: "pom.xml",
};

// Remediation workflow states for detected vulnerabilities
const REMEDIATION_STATUSES = {
    OPEN: "open",
    IN_PROGRESS: "in_progress",
    RESOLVED: "resolved",
    ACCEPTED_RISK: "accepted_risk",
};

// Execution states of vulnerability scans
const SCAN_STATUSES = {
    QUEUED: "queued",
    RUNNING: "running",
    COMPLETED: "completed",
    FAILED: "failed",
};

// System authorization roles
const USER_ROLES = {
    USER: "user",
    ADMIN: "admin",
};

// Standard severity classifications
const SEVERITY_LEVELS = {
    CRITICAL: "critical",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    UNKNOWN: "unknown",
};

// Base risk scores for fallback calculation when CVSS score is not available
const BASE_SEVERITY_SCORES = {
    critical: 95,
    high: 80,
    medium: 55,
    low: 25,
    unknown: 0,
};

module.exports = {
    ECOSYSTEMS,
    MANIFEST_TYPES,
    REMEDIATION_STATUSES,
    SCAN_STATUSES,
    USER_ROLES,
    SEVERITY_LEVELS,
    BASE_SEVERITY_SCORES,
};
