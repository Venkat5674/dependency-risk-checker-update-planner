
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { getAllowedOrigins } = require("./config/security");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const authenticate = require("./middleware/authenticate");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const scanRoutes = require("./routes/scanRoutes");
const vulnerabilityRoutes = require("./routes/vulnerabilityRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const upgradeRoutes = require("./routes/upgradeRoutes");
const auditRoutes = require("./routes/auditRoutes");

const app = express();

app.disable("x-powered-by");
app.use(helmet());

app.use(
    cors({
        origin: getAllowedOrigins(process.env.CLIENT_URL || "http://localhost:5173"),
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", authenticate, projectRoutes);
app.use("/api/scans", authenticate, scanRoutes);
app.use("/api/vulnerabilities", authenticate, vulnerabilityRoutes);
app.use("/api/dashboard", authenticate, dashboardRoutes);
app.use("/api/upgrades", authenticate, upgradeRoutes);
app.use("/api/audit-logs", authenticate, auditRoutes);

app.get("/api/health", (req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;
    const status = databaseReady ? "ok" : "not_ready";

    res.status(databaseReady ? 200 : 503).json({
        success: databaseReady,
        status,
        service: "depsafe-api",
        database: databaseReady ? "connected" : "disconnected",
    });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
