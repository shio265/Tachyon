import express from "express";
import { adminAuth } from "../../../utils/auth.js";
import {
  getAllApiKeys,
  createApiKey,
  deactivateApiKey
} from "../../../database/queries/api_keys.js";
import crypto from "crypto";

const router = express.Router();

// require admin authentication
router.use(adminAuth);

/**
 * GET /api/v1/admin/keys
 * Get all API keys
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
 * POST /api/v1/admin/keys
 * Create a new API key
 * Body: { name, description? }
 */
router.post("/", async (req, res) => {
  try {
    const { name, description } = req.body;
    
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
    
    // Log only unexpected errors
    console.error("Error creating API key:", error);
    
    res.status(500).json({
      success: false,
      error: "Failed to create API key"
    });
  }
});

/**
 * DELETE /api/v1/admin/keys/:key
 * Deactivate an API key
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
