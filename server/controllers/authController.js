const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { register, login, publicUser } = require("../services/authService");

exports.register = asyncHandler(async (req, res) => res.status(201).json({ success: true, message: "Account created.", data: await register(req.body) }));
exports.login = asyncHandler(async (req, res) => res.json({ success: true, message: "Signed in.", data: await login(req.body) }));
exports.logout = asyncHandler(async (req, res) => res.json({ success: true, message: "Signed out.", data: {} }));
exports.me = asyncHandler(async (req, res) => res.json({ success: true, message: "Current user retrieved.", data: { user: publicUser(req.user) } }));
exports.updateMe = asyncHandler(async (req, res) => {
    const allowed = {};
    if (typeof req.body.name === "string") allowed.name = req.body.name.trim();
    const user = await User.findByIdAndUpdate(req.user._id, allowed, { new: true, runValidators: true });
    res.json({ success: true, message: "Profile updated.", data: { user: publicUser(user) } });
});