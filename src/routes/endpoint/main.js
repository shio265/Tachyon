import express from "express";
import limiter from "../../utlis/rateLimiter.js";
import process from "process";

const router = express.Router();
const rateLimitMaxRequests  = process.env.RATE_LIMITER_MAX_REQUESTS;

router.use(limiter);

/**
 * GET /
 * Health check and rate limit info
 * Response: { status, message, rateLimit: { limit, remaining, reset } }
 */
router.get("/", (req, res) => {
    res.json({
        status: "200",
        message: "i'm alive!",
        rateLimit: {
            limit: req.rateLimit?.limit || rateLimitMaxRequests || "unlimited",
            remaining: req.rateLimit?.remaining ?? "unlimited",
            reset: req.rateLimit?.resetTime
                ? new Date(req.rateLimit.resetTime).toISOString()
                : new Date(Date.now() + 60000).toISOString()
        }
    });
});

export default router;