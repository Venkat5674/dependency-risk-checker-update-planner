
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const { getConfig, getRequiredEnvironment } = require("./config/security");

let httpServer;

const startServer = async () => {
    try {
        getRequiredEnvironment();
        const config = getConfig();
        await connectDB();

        httpServer = app.listen(config.port, () => {
            console.log(`Backend server listening on port ${config.port}`);
        });
    } catch (error) {
        console.error(`Server startup failed: ${error.message}`);
        process.exitCode = 1;
    }
};

const shutdown = async (signal) => {
    console.log(`${signal} received; shutting down gracefully.`);

    if (httpServer) {
        await new Promise((resolve) => httpServer.close(resolve));
    }

    await mongoose.connection.close();
    process.exit(0);
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

if (require.main === module) {
    startServer();
}

module.exports = { startServer };
