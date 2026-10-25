const buckets = new Map();

const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 20 } = {}) => (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now - bucket.start >= windowMs) {
        buckets.set(key, { start: now, count: 1 });
        return next();
    }
    bucket.count += 1;
    if (bucket.count > max) return res.status(429).json({ success: false, message: "Too many requests. Try again later.", errors: [] });
    next();
};

module.exports = { authLimiter: rateLimit({ max: 10 }), scanLimiter: rateLimit({ windowMs: 60 * 60 * 1000, max: 30 }) };