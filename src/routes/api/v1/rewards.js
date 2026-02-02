import express from "express";
import multer from "multer";
import process from "process";
import { adminAuth } from "../../../utils/auth.js";
import {
  getAllRewards,
  getRewardById,
  createReward,
  updateReward,
  deleteReward
} from "../../../database/queries/rewards.js";
import { uploadImage, isConfigured } from "../../../utils/cloudinary.js";

const router = express.Router();

// Parse MAX_FILE_SIZE from env (supports formats like "5MB", "10MB", etc.)
function parseFileSize(sizeString) {
  if (!sizeString) return 5 * 1024 * 1024; // Default 5MB
  
  const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*(MB|KB|GB)?$/i);
  if (!match) return 5 * 1024 * 1024;
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'MB').toUpperCase();
  
  switch (unit) {
    case 'GB': return value * 1024 * 1024 * 1024;
    case 'MB': return value * 1024 * 1024;
    case 'KB': return value * 1024;
    default: return value;
  }
}

const MAX_FILE_SIZE = parseFileSize(process.env.MAX_FILE_SIZE);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

/**
 * @swagger
 * /api/v1/rewards:
 *   get:
 *     summary: Get all rewards
 *     description: Retrieve a list of all available rewards
 *     tags: [Rewards]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of rewards retrieved successfully
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
 *                     $ref: '#/components/schemas/Reward'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/", async (req, res) => {
  try {
    const rewards = await getAllRewards();
    
    res.json({
      success: true,
      count: rewards.length,
      data: rewards
    });
  } catch (error) {
    console.error("Error fetching rewards:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch rewards"
    });
  }
});

/**
 * @swagger
 * /api/v1/rewards/{id}:
 *   get:
 *     summary: Get reward by ID
 *     description: Retrieve a specific reward by its MongoDB ObjectId
 *     tags: [Rewards]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the reward
 *     responses:
 *       200:
 *         description: Reward retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reward'
 *       404:
 *         description: Reward not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const reward = await getRewardById(id);
    
    if (!reward) {
      return res.status(404).json({
        success: false,
        error: "Reward not found"
      });
    }
    
    res.json({
      success: true,
      data: reward
    });
  } catch (error) {
    console.error("Error fetching reward:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch reward"
    });
  }
});

/**
 * @swagger
 * /api/v1/rewards:
 *   post:
 *     summary: Create a new reward
 *     description: Create a new reward with optional image upload (requires admin authentication)
 *     tags: [Rewards]
 *     security:
 *       - AdminAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bablo
 *               icon:
 *                 type: string
 *                 format: binary
 *                 description: Icon image file (jpg, png, gif, webp - max 5MB)
 *               iconUrl:
 *                 type: string
 *                 example: https://example.domain/bablo.png
 *                 description: Or provide direct URL if not uploading file
 *     responses:
 *       201:
 *         description: Reward created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reward'
 *       400:
 *         description: Missing required fields or invalid file
 *       500:
 *         description: Server error
 */
router.post("/", adminAuth, upload.single('icon'), async (req, res) => {
  try {
    const { name, iconUrl } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required"
      });
    }

    let finalIconUrl = iconUrl || null;

    // If file is uploaded, upload to Cloudinary
    if (req.file) {
      if (!isConfigured()) {
        return res.status(500).json({
          success: false,
          error: "Image server is not configured. Cannot upload image."
        });
      }

      try {
        const uploadResult = await uploadImage(req.file.buffer, 'rewards');
        finalIconUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Error uploading:', uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload image"
        });
      }
    }
    
    const newReward = await createReward({
      name,
      icon: finalIconUrl
    });
    
    res.status(201).json({
      success: true,
      data: newReward
    });
  } catch (error) {
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        return res.status(400).json({
          success: false,
          error: `File size too large. Maximum size is ${maxSizeMB}MB`
        });
      }
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.error("Error creating reward:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create reward"
    });
  }
});

/**
 * @swagger
 * /api/v1/rewards/{id}:
 *   patch:
 *     summary: Update a reward
 *     description: Update an existing reward (requires admin authentication)
 *     tags: [Rewards]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the reward
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Bablo
 *               icon:
 *                 type: string
 *                 format: binary
 *                 description: New icon image file
 *               iconUrl:
 *                 type: string
 *                 example: https://example.domain/new-icon.png
 *                 description: Or provide direct URL
 *     responses:
 *       200:
 *         description: Reward updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Reward'
 *       404:
 *         description: Reward not found
 *       500:
 *         description: Server error
 */
router.patch("/:id", adminAuth, upload.single('icon'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, iconUrl } = req.body;
    
    const updateData = {};
    
    if (name !== undefined) {
      updateData.name = name;
    }
    
    // Handle icon update
    if (req.file) {
      if (!isConfigured()) {
        return res.status(500).json({
          success: false,
          error: "Image server is not configured. Cannot upload image."
        });
      }

      try {
        const uploadResult = await uploadImage(req.file.buffer, 'rewards');
        updateData.icon = uploadResult.url;
      } catch (uploadError) {
        console.error('Error uploading:', uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload image"
        });
      }
    } else if (iconUrl !== undefined) {
      updateData.icon = iconUrl;
    }
    
    const updatedReward = await updateReward(id, updateData);
    
    res.json({
      success: true,
      data: updatedReward
    });
  } catch (error) {
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        return res.status(400).json({
          success: false,
          error: `File size too large. Maximum size is ${maxSizeMB}MB`
        });
      }
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (error.message?.includes("not found")) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }

    if (error.message?.includes("Invalid") || error.message?.includes("No valid fields")) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    console.error("Error updating reward:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update reward"
    });
  }
});

/**
 * @swagger
 * /api/v1/rewards/{id}:
 *   delete:
 *     summary: Delete a reward
 *     description: Delete a reward by ID (requires admin authentication)
 *     tags: [Rewards]
 *     security:
 *       - AdminAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the reward
 *     responses:
 *       200:
 *         description: Reward deleted successfully
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
 *         description: Reward not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await deleteReward(id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: "Reward not found"
      });
    }
    
    res.json({
      success: true,
      message: "Reward deleted successfully"
    });
  } catch (error) {
    if (error.message === "Invalid reward ID format") {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    console.error("Error deleting reward:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete reward"
    });
  }
});

export default router;
