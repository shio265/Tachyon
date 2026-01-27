import { ObjectId } from "mongodb";
import { dbClient } from "../client.js";
import process from "process";

const DB_NAME = process.env.MONGODB_DBNAME;

/**
 * Get reward by ID
 * @param {string} id - Reward ID
 * @returns {Promise<Object|null>}
 */
async function getRewardById(id) {
  const db = dbClient.db(DB_NAME);
  const reward = await db.collection("rewards").findOne({
    _id: new ObjectId(id)
  });
  
  if (!reward) return null;
  
  return {
    id: reward._id.toString(),
    name: reward.name,
    icon: reward.icon
  };
}

/**
 * Get all rewards
 * @returns {Promise<Array>}
 */
async function getAllRewards() {
  const db = dbClient.db(DB_NAME);
  const rewards = await db.collection("rewards").find({}).toArray();
  
  return rewards.map(reward => ({
    id: reward._id.toString(),
    name: reward.name,
    icon: reward.icon
  }));
}

/**
 * Create a new reward
 * @param {Object} rewardData - { name, icon }
 * @returns {Promise<Object>}
 */
async function createReward(rewardData) {
  const db = dbClient.db(DB_NAME);
  const result = await db.collection("rewards").insertOne({
    name: rewardData.name,
    icon: rewardData.icon || null
  });
  
  return {
    id: result.insertedId.toString(),
    name: rewardData.name,
    icon: rewardData.icon
  };
}

export { getRewardById, getAllRewards, createReward };
