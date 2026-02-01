import express from "express";
import { adminAuth } from "../../../utils/auth.js";
import {
  getAllRewards,
  getRewardById,
  createReward
} from "../../../database/queries/rewards.js";

const router = express.Router();

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
 *     description: Create a new reward (requires admin authentication)
 *     tags: [Rewards]
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
 *                 example: Bablo
 *               icon:
 *                 type: string
 *                 example: https://example.domain/bablo.png
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
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Name is required"
      });
    }
    
    const newReward = await createReward({
      name,
      icon: icon || null
    });
    
    res.status(201).json({
      success: true,
      data: newReward
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create reward"
    });
  }
});

export default router;
