import express from "express";
import { getAllRedeemCodes, createRedeemCode, updateRedeemCode, deleteRedeemCode } from "../../../database/queries/redeem_codes.js";
import { getUploaderByDiscordUid } from "../../../database/queries/uploaders.js";
import limiter from "../../../utils/rateLimiter.js";
import process from "process";

const router = express.Router();
const rateLimitMaxRequests  = process.env.RATE_LIMITER_MAX_REQUESTS;

// Apply rate limiter to all routes in this router
router.use(limiter);

/**
 * @swagger
 * /api/v1/strinova:
 *   get:
 *     summary: Strinova API health check
 *     description: Returns operational status and rate limit information
 *     tags: [Strinova]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: API is operational
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
 *                   example: "Strinova API is operational"
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
    message: "Strinova API is operational",
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
 * @swagger
 * /api/v1/strinova/code:
 *   get:
 *     summary: Get all redeem codes
 *     description: Retrieve all redeem codes with optional filtering
 *     tags: [Strinova]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter active codes (not expired). Use true or false
 *       - in: query
 *         name: reward
 *         schema:
 *           type: string
 *         description: Filter by reward name (case-insensitive partial match)
 *     responses:
 *       200:
 *         description: List of redeem codes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RedeemCode'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 * @swagger
 * /api/v1/strinova/code:
 *   post:
 *     summary: Create a new redeem code
 *     description: Create a new redeem code with optional rewards and expiration date
 *     tags: [Strinova]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploader_id
 *               - code
 *             properties:
 *               uploader_id:
 *                 type: string
 *                 description: MongoDB ObjectId of the uploader
 *                 example: 6979f06fd05710e613574c79
 *               code:
 *                 type: string
 *                 description: Unique redeem code
 *                 example: STRINOVA2026
 *               expired_at:
 *                 type: string
 *                 description: Expiration date (YYYY-MM-DD, DD/MM/YYYY, or ISO 8601)
 *                 example: 2026-12-31
 *               rewards:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     reward_id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     icon:
 *                       type: string
 *                     amount:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Redeem code created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RedeemCode'
 *       400:
 *         description: Bad request - Missing required fields or invalid date format
 *       409:
 *         description: Conflict - Redeem code already exists
 *       500:
 *         description: Server error
 */
router.post("/code", async (req, res) => {
  try {
    const { uploader_id, discord_uid, code, expired_at, rewards } = req.body;
    
    // Validation - accept either uploader_id OR discord_uid
    if (!code) {
      return res.status(400).json({
        success: false,
        error: "code is required"
      });
    }
    
    if (!uploader_id && !discord_uid) {
      return res.status(400).json({
        success: false,
        error: "Either uploader_id or discord_uid is required"
      });
    }
    
    // If discord_uid is provided, look up the uploader_id
    let finalUploaderId = uploader_id;
    if (discord_uid) {
      const uploader = await getUploaderByDiscordUid(discord_uid);
      if (!uploader) {
        return res.status(404).json({
          success: false,
          error: "Uploader not found with this Discord ID. Please create uploader first."
        });
      }
      finalUploaderId = uploader.id;
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
      uploader_id: finalUploaderId,
      code,
      expired_at: parsedExpiredAt,
      rewards: rewards || []
    });
    
    res.status(201).json({
      success: true,
      data: newCode
    });
  } catch (error) {
    // Handle duplicate code error (expected validation error)
    if (error.code === 11000 || error.message?.includes("already exists")) {
      return res.status(409).json({
        success: false,
        error: "Redeem code already exists"
      });
    }
    
    // Handle ObjectId validation errors
    if (error.message?.includes("Invalid") && error.message?.includes("format")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    // Log only unexpected errors
    console.error("Error creating redeem code:", error);
    
    res.status(500).json({
      success: false,
      error: "Failed to create redeem code"
    });
  }
});

/**
 * @swagger
 * /api/v1/strinova/code/{id}:
 *   patch:
 *     summary: Update a redeem code
 *     description: Update an existing redeem code's details
 *     tags: [Strinova]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the redeem code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: New redeem code value
 *                 example: UPDATED2026
 *               expired_at:
 *                 type: string
 *                 description: New expiration date (YYYY-MM-DD, DD/MM/YYYY, or ISO 8601)
 *                 example: 2026-12-31
 *               rewards:
 *                 type: array
 *                 description: Updated rewards array
 *                 items:
 *                   type: object
 *                   properties:
 *                     reward_id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     icon:
 *                       type: string
 *                     amount:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Redeem code updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RedeemCode'
 *       400:
 *         description: Bad request - Invalid data or format
 *       404:
 *         description: Redeem code not found
 *       409:
 *         description: Conflict - Code already exists
 *       500:
 *         description: Server error
 */
router.patch("/code/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { code, expired_at, rewards } = req.body;
    
    // Parse expired_at if provided
    let parsedExpiredAt = undefined;
    if (expired_at !== undefined) {
      if (expired_at === null) {
        parsedExpiredAt = null;
      } else {
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
    }
    
    // Build update data
    const updateData = {};
    if (code !== undefined) updateData.code = code;
    if (parsedExpiredAt !== undefined) updateData.expired_at = parsedExpiredAt;
    if (rewards !== undefined) updateData.rewards = rewards;
    
    const updatedCode = await updateRedeemCode(id, updateData);
    
    res.json({
      success: true,
      data: updatedCode
    });
  } catch (error) {
    // Handle duplicate code error
    if (error.code === 11000 || error.message?.includes("already exists")) {
      return res.status(409).json({
        success: false,
        error: "Redeem code already exists"
      });
    }
    
    // Handle not found error
    if (error.message?.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    // Handle validation errors
    if (error.message?.includes("Invalid") || error.message?.includes("No valid fields")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    console.error("Error updating redeem code:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update redeem code"
    });
  }
});

/**
 * @swagger
 * /api/v1/strinova/code/{id}:
 *   delete:
 *     summary: Delete a redeem code
 *     tags: [Strinova]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The redeem code ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Redeem code deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Redeem code not found
 *       500:
 *         description: Server error
 */
router.delete("/code/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await deleteRedeemCode(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Redeem code not found"
      });
    }
    
    res.json({
      success: true,
      message: "Redeem code deleted successfully"
    });
  } catch (error) {
    if (error.message === "Invalid redeem code ID format") {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    console.error("Error deleting redeem code:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete redeem code"
    });
  }
});

export default router;
