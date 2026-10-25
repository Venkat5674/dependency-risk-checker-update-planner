const mongoose = require("mongoose");

const dependencySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        version: { type: String, default: null },
        requestedVersion: { type: String, default: null },
        direct: { type: Boolean, default: true },
        resolved: { type: Boolean, default: false },
    },
    { _id: false }
);

const projectSchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 120 },
        description: { type: String, trim: true, maxlength: 1000, default: "" },
        repositoryUrl: { type: String, trim: true, default: "" },
        ecosystem: { type: String, enum: ["npm", "PyPI", "Maven"], required: true },
        manifestType: { type: String, enum: ["package.json", "package-lock.json", "requirements.txt", "pom.xml"], required: true },
        dependencies: { type: [dependencySchema], default: [] },
        latestScan: { type: mongoose.Schema.Types.ObjectId, ref: "Scan", default: null },
    },
    { timestamps: true, versionKey: false }
);

projectSchema.index({ owner: 1, updatedAt: -1 });
module.exports = mongoose.model("Project", projectSchema);