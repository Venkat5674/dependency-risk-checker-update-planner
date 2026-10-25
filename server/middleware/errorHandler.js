const errorHandler = (error, req, res, next) => {
    const statusCode = Number.isInteger(error.statusCode)
        ? error.statusCode
        : error.name === "ValidationError"
          ? 400
          : error.code === 11000
            ? 409
        : error.type === "entity.too.large"
          ? 413
          : 500;
    const isProduction = process.env.NODE_ENV === "production";

    if (statusCode >= 500) {
        console.error(error);
    }

    res.status(statusCode).json({
        success: false,
        message:
            statusCode >= 500 && isProduction
                ? "An unexpected error occurred."
                : error.message || "An unexpected error occurred.",
        errors: error.errors || [],
    });
};

module.exports = errorHandler;