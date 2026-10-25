const jwt = require("jsonwebtoken");

const createToken = (user) => jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m", algorithm: "HS256" }
);

module.exports = { createToken };