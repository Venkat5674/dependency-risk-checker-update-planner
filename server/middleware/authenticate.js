const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

module.exports = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        const token = header && header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token || !process.env.JWT_SECRET) throw new ApiError(401, "Authentication required.");
        const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        const user = await User.findById(payload.sub).select("+passwordHash");
        if (!user || !user.isActive) throw new ApiError(401, "Authentication required.");
        req.user = user;
        next();
    } catch (error) {
        next(error instanceof ApiError ? error : new ApiError(401, "Authentication required."));
    }
};