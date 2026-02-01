import express from "express";
import { adminAuth } from "../../../utils/auth.js";
import {
  getAllUploaders,
  getUploaderById,
  getUploaderByDiscordUid,
  createUploader,
  updateUploaderStatus
} from "../../../database/queries/uploaders.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/uploaders:
 *   get:
 *     summary: Get all uploaders
 *     description: Retrieve a list of all uploaders
 *     tags: [Uploaders]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of uploaders retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       discord_uid:
 *                         type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const uploaders = await getAllUploaders();
    
    res.json({
      success: true,
      count: uploaders.length,
      data: uploaders
    });
  } catch (error) {
    console.error("Error fetching uploaders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch uploaders"
    });
  }
});

/**
 * @swagger
 * /api/v1/uploaders/{id}:
 *   get:
 *     summary: Get uploader by ID
 *     description: Retrieve a specific uploader by MongoDB ObjectId
 *     tags: [Uploaders]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the uploader
 *     responses:
 *       200:
 *         description: Uploader retrieved successfully
 *       404:
 *         description: Uploader not found
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const uploader = await getUploaderById(id);
    
    if (!uploader) {
      return res.status(404).json({
        success: false,
        error: "Uploader not found"
      });
    }
    
    res.json({
      success: true,
      data: uploader
    });
  } catch (error) {
    if (error.message?.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    console.error("Error fetching uploader:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch uploader"
    });
  }
});

/**
 * @swagger
 * /api/v1/uploaders/discord/{discordUid}:
 *   get:
 *     summary: Get uploader by Discord user ID
 *     description: Retrieve an uploader by their Discord user ID
 *     tags: [Uploaders]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: discordUid
 *         required: true
 *         schema:
 *           type: string
 *         description: Discord user ID
 *     responses:
 *       200:
 *         description: Uploader retrieved successfully
 *       404:
 *         description: Uploader not found
 *       500:
 *         description: Server error
 */
router.get("/discord/:discordUid", async (req, res) => {
  try {
    const { discordUid } = req.params;
    const uploader = await getUploaderByDiscordUid(discordUid);
    
    if (!uploader) {
      return res.status(404).json({
        success: false,
        error: "Uploader not found with this Discord ID"
      });
    }
    
    res.json({
      success: true,
      data: uploader
    });
  } catch (error) {
    console.error("Error fetching uploader by Discord UID:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch uploader"
    });
  }
});

/**
 * @swagger
 * /api/v1/uploaders:
 *   post:
 *     summary: Create a new uploader
 *     description: Create a new uploader with name and Discord user ID (requires admin authentication)
 *     tags: [Uploaders]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - discord_uid
 *             properties:
 *               name:
 *                 type: string
 *                 description: Uploader's name
 *                 example: Shiorin625
 *               discord_uid:
 *                 type: string
 *                 description: Discord user ID
 *                 example: 123456789012345678
 *               status:
 *                 type: string
 *                 enum: [active, suspended, banned]
 *                 default: active
 *                 description: Uploader status
 *     responses:
 *       201:
 *         description: Uploader created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     discord_uid:
 *                       type: string
 *                     status:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - Missing required fields
 *       409:
 *         description: Conflict - Uploader with this Discord ID already exists
 *       500:
 *         description: Server error
 */
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, discord_uid, type, status } = req.body;
    
    if (!name || !discord_uid) {
      return res.status(400).json({
        success: false,
        error: "name and discord_uid are required"
      });
    }
    
    // Validate type if provided
    if (type && !["default", "manager", "admin"].includes(type)) {
      return res.status(400).json({
        success: false,
        error: "Invalid type. Must be: default, manager, or admin"
      });
    }
    
    // Validate status if provided
    if (status && !["active", "suspended", "banned"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "status must be: active, suspended, or banned"
      });
    }
    
    const newUploader = await createUploader({
      name,
      discord_uid,
      type,
      status
    });
    
    res.status(201).json({
      success: true,
      data: newUploader
    });
  } catch (error) {
    if (error.code === 11000 || error.message?.includes("already exists")) {
      return res.status(409).json({
        success: false,
        error: "Uploader with this Discord ID already exists"
      });
    }
    
    console.error("Error creating uploader:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create uploader"
    });
  }
});

/**
 * @swagger
 * /api/v1/uploaders/{id}/status:
 *   patch:
 *     summary: Update uploader status
 *     description: Update an uploader's status (requires admin authentication)
 *     tags: [Uploaders]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the uploader
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, suspended, banned]
 *                 description: New status for the uploader
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *         description: Bad request - Invalid status or ID format
 *       404:
 *         description: Uploader not found
 *       500:
 *         description: Server error
 */
router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: "status is required"
      });
    }
    
    const success = await updateUploaderStatus(id, status);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Uploader not found"
      });
    }
    
    res.json({
      success: true,
      message: "Uploader status updated successfully"
    });
  } catch (error) {
    if (error.message?.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    console.error("Error updating uploader status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update uploader status"
    });
  }
});

export default router;
