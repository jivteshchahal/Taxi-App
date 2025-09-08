// Very lightweight in-memory rate limiter
// Options: { windowMs: number, max: number }
// Tracks counts per IP in memory (not suitable for multi-instance setups)

const buckets = new Map(); // ip -> { count, resetAt }

module.exports = function rateLimit(options = {}) {
  const windowMs = options.windowMs || 60_000; // 1 minute
  const max = options.max || 5;

  return function (req, res, next) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(ip);

    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(ip, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.status(429);
      return res.render('error', {
        message: 'Too many booking attempts. Please wait a minute and try again.',
        error: (process.env.NODE_ENV || 'development') === 'development' ? { status: 429 } : null,
      });
    }

    next();
  };
};

