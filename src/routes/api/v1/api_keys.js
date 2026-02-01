import express from "express";
import { adminAuth } from "../../../utils/auth.js";
import {
  getAllApiKeys,
  createApiKey,
  deactivateApiKey,
  getApiKeyByDiscordUid
} from "../../../database/queries/api_keys.js";
import crypto from "crypto";

const router = express.Router();

// require admin authentication
router.use(adminAuth);

/**
 * @swagger
 * /api/v1/admin/keys:
 *   get:
 *     summary: Get all API keys
 *     description: Retrieve a list of all API keys (requires admin authentication)
 *     tags: [Admin - API Keys]
 *     security:
 *       - AdminAuth: []
 *     responses:
 *       200:
 *         description: List of API keys retrieved successfully
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
 *                     $ref: '#/components/schemas/ApiKey'
 *       401:
 *         description: Unauthorized - Invalid or missing admin key
 *       500:
 *         description: Server error
 */
router.get("/", async (req, res) => {
  try {
    const keys = await getAllApiKeys();
    
    res.json({
      success: true,
      count: keys.length,
      data: keys
    });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch API keys"
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/keys:
 *   post:
 *     summary: Create a new API key
 *     description: Generate a new API key with a secure random value (requires admin authentication)
 *     tags: [Admin - API Keys]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the API key
 *                 example: New API Key
 *               discord_uid:
 *                 type: string
 *                 description: Discord user ID
 *                 example: 123456789012345678
 *               description:
 *                 type: string
 *                 description: Description of the key's purpose
 *                 example: API key for production use
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ApiKey'
 *       400:
 *         description: Bad request - Missing required field
 *       409:
 *         description: Conflict - API key with this name already exists
 *       500:
 *         description: Server error
 */
router.post("/", async (req, res) => {
  try {
    const { name, discord_uid, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required"
      });
    }
    
    // Generate a secure random API key
    const key = crypto.randomBytes(32).toString('hex');
    
    const newKey = await createApiKey({
      key,
      name,
      discord_uid,
      description
    });
    
    res.status(201).json({
      success: true,
      data: newKey
    });
  } catch (error) {
    // Handle duplicate name error (expected validation error)
    if (error.code === 11000 || error.message?.includes("already exists")) {
      return res.status(409).json({
        success: false,
        error: "API key with this name already exists"
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Failed to create API key"
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/keys/discord/{discordUid}:
 *   get:
 *     summary: Get API key by Discord user ID
 *     description: Retrieve an active API key associated with a Discord user (requires admin authentication)
 *     tags: [Admin - API Keys]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: discordUid
 *         required: true
 *         schema:
 *           type: string
 *         description: Discord user ID
 *         example: 123456789012345678
 *     responses:
 *       200:
 *         description: API key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ApiKey'
 *       404:
 *         description: No active API key found for this Discord user
 *       500:
 *         description: Server error
 */
router.get("/discord/:discordUid", async (req, res) => {
  try {
    const { discordUid } = req.params;
    
    const apiKey = await getApiKeyByDiscordUid(discordUid);
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: "No active API key found for this Discord user"
      });
    }
    
    res.json({
      success: true,
      data: apiKey
    });
  } catch (error) {
    console.error("Error fetching API key by Discord UID:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch API key"
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/keys/{key}:
 *   delete:
 *     summary: Deactivate an API key
 *     description: Deactivate an existing API key (requires admin authentication)
 *     tags: [Admin - API Keys]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The API key to deactivate
 *         example: fbd384e7f16f2a51546ba24b002a35cf
 *     responses:
 *       200:
 *         description: API key deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: API key deactivated successfully
 *       404:
 *         description: API key not found
 *       500:
 *         description: Server error
 */
router.delete("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    
    const success = await deactivateApiKey(key);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: "API key not found"
      });
    }
    
    res.json({
      success: true,
      message: "API key deactivated successfully"
    });
  } catch (error) {
    console.error("Error deactivating API key:", error);
    res.status(500).json({
      success: false,
      error: "Failed to deactivate API key"
    });
  }
});

export default router;
