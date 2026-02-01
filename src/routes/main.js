import express from "express";
import limiter from "../utils/rateLimiter.js";
import process from "process";

const router = express.Router();
const rateLimitMaxRequests = process.env.RATE_LIMITER_MAX_REQUESTS;

router.use(limiter);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns server status and rate limit information
 *     tags: [Health Check]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Server is operational
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "200"
 *                 message:
 *                   type: string
 *                   example: "i'm alive!"
 *                 rateLimit:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: number
 *                     remaining:
 *                       type: number
 *                     reset:
 *                       type: string
 *                       format: date-time
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
