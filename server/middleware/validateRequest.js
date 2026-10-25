const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

module.exports = (req, res, next) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return next(new ApiError(400, "Request validation failed.", result.array().map((item) => ({
            field: item.path, message: item.msg,
        }))));
    }
    next();
};