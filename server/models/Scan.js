const mongoose = require("mongoose");

const findingSchema = new mongoose.Schema(
    {
        packageName: String, ecosystem: String, installedVersion: String,
        vulnerabilityId: String, aliases: [String], summary: String, details: String,
        severity: String, cvssScore: Number, affectedVersions: [String], fixedVersions: [String],
        references: [String], riskScore: Number,
        status: { type: String, enum: ["open", "in_progress", "resolved", "accepted_risk"], default: "open" },
        direct: Boolean,
    },
    { _id: false }
);

const scanSchema = new mongoose.Schema(
    {
        project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true },
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        status: { type: String, enum: ["queued", "running", "completed", "failed"], default: "queued" },
        manifestType: String, dependencyCount: { type: Number, default: 0 },
        scannedDependencyCount: { type: Number, default: 0 }, vulnerabilityCount: { type: Number, default: 0 },
        severitySummary: { critical: Number, high: Number, medium: Number, low: Number, unknown: Number },
        riskScore: { type: Number, default: 0 }, findings: { type: [findingSchema], default: [] },
        startedAt: Date, completedAt: Date, errorMessage: String,
    },
    { timestamps: true, versionKey: false }
);

scanSchema.index({ owner: 1, createdAt: -1 });
module.exports = mongoose.model("Scan", scanSchema);