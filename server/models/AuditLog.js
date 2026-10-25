const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
        action: { type: String, required: true }, resourceType: { type: String, required: true },
        resourceId: String, outcome: { type: String, enum: ["success", "failure"], required: true },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: { createdAt: true, updatedAt: false }, versionKey: false }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);