const { isIP } = require("node:net");

const DEFAULTS = {
    port: 5000,
    nodeEnv: "development",
    jwtExpiresIn: "15m",
    bcryptSaltRounds: 12,
    clientUrl: "http://localhost:5173",
};

const getRequiredEnvironment = () => {
    const missing = ["MONGODB_URI", "JWT_SECRET"].filter(
        (name) => !process.env[name] || !process.env[name].trim()
    );

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variable(s): ${missing.join(", ")}. ` +
                "Configure them in server/.env before starting the server."
        );
    }
};

const getConfig = () => {
    const saltRounds = Number.parseInt(
        process.env.BCRYPT_SALT_ROUNDS || DEFAULTS.bcryptSaltRounds,
        10
    );

    if (!Number.isInteger(saltRounds) || saltRounds < 10 || saltRounds > 15) {
        throw new Error("BCRYPT_SALT_ROUNDS must be an integer between 10 and 15.");
    }

    const port = Number.parseInt(process.env.PORT || DEFAULTS.port, 10);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535.");
    }

    const clientUrl = process.env.CLIENT_URL || DEFAULTS.clientUrl;
    getAllowedOrigins(clientUrl);

    return {
        port,
        nodeEnv: process.env.NODE_ENV || DEFAULTS.nodeEnv,
        mongodbUri: process.env.MONGODB_URI,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || DEFAULTS.jwtExpiresIn,
        bcryptSaltRounds: saltRounds,
        clientUrl,
        trustProxy: process.env.TRUST_PROXY === "true",
    };
};

const getAllowedOrigins = (clientUrl) => {
    const origins = clientUrl
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    origins.forEach((origin) => {
        const url = new URL(origin);
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            throw new Error(`Invalid CORS origin protocol: ${origin}`);
        }
        if (!url.hostname || (isIP(url.hostname) === 0 && url.hostname.includes(" "))) {
            throw new Error(`Invalid CORS origin hostname: ${origin}`);
        }
    });

    return origins;
};

module.exports = {
    getRequiredEnvironment,
    getConfig,
    getAllowedOrigins,
};