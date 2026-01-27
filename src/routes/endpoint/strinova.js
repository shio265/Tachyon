import express from "express";
import { getAllRedeemCodes, createRedeemCode } from "../../database/queries/redeem_codes.js";
import { adminAuth } from "../../utils/auth.js";
import limiter from "../../utils/rateLimiter.js";
import process from "process";

const router = express.Router();
const rateLimitMaxRequests  = process.env.RATE_LIMITER_MAX_REQUESTS;

// Apply rate limiter to all routes in this router
router.use(limiter);

/**
 * GET /api/v1/strinova
 * Health check and rate limit info
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

/**
 * GET /api/v1/strinova/code
 * Get all redeem codes with filtering options
 * Query params:
 *   - active: true/false - filter active codes (not expired)
 *   - reward: reward name - filter by reward name
 */
router.get("/code", async (req, res) => {
  try {
    const { active, reward } = req.query;
    
    let codes = await getAllRedeemCodes();
    
    // Filter by active status
    if (active !== undefined) {
      const isActive = active === "true";
      const now = new Date();
      
      codes = codes.filter(code => {
        const expired = code.expired_at ? new Date(code.expired_at) < now : false;
        return isActive ? !expired : expired;
      });
    }
    
    // Filter by reward name
    if (reward) {
      codes = codes.filter(code => 
        code.rewards?.some(r => 
          r.name.toLowerCase().includes(reward.toLowerCase())
        )
      );
    }
    
    res.json({
      success: true,
      count: codes.length,
      data: codes
    });
  } catch (error) {
    console.error("Error fetching redeem codes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch redeem codes"
    });
  }
});

/**
 * POST /api/v1/strinova/code
 * Create a new redeem code
 * Body: { uploader_id, code, expired_at?, rewards? }
 * Response: { success, data?, error? }
 * Note: Requires authentication via Authorization header
 * 
 * Supported date formats for expired_at:
 * - "2026-12-31" (YYYY-MM-DD)
 * - "31/12/2026" (DD/MM/YYYY)
 * - "2026-12-31T23:59:59.000Z" (ISO)
 */
router.post("/code", adminAuth, async (req, res) => {
  try {
    const { uploader_id, code, expired_at, rewards } = req.body;
    
    // Validation
    if (!uploader_id || !code) {
      return res.status(400).json({
        success: false,
        error: "uploader_id and code are required"
      });
    }
    
    // Parse expired_at if provided
    let parsedExpiredAt = null;
    if (expired_at) {
      // Try to parse different date formats
      let dateObj = null;
      
      // Format: YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(expired_at)) {
        dateObj = new Date(expired_at + "T23:59:59.999Z");
      }
      // Format: DD/MM/YYYY
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(expired_at)) {
        const [day, month, year] = expired_at.split('/');
        dateObj = new Date(`${year}-${month}-${day}T23:59:59.999Z`);
      }
      // ISO format or other Date parseable formats
      else {
        dateObj = new Date(expired_at);
      }
      
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid date format. Use YYYY-MM-DD or DD/MM/YYYY"
        });
      }
      
      parsedExpiredAt = dateObj.toISOString();
    }
    
    // Create redeem code
    const newCode = await createRedeemCode({
      uploader_id,
      code,
      expired_at: parsedExpiredAt,
      rewards: rewards || []
    });
    
    res.status(201).json({
      success: true,
      data: newCode
    });
  } catch (error) {
    console.error("Error creating redeem code:", error);
    
    // Handle duplicate code error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: "Redeem code already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to create redeem code"
    });
  }
});

export default router;
