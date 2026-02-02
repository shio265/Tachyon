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

/**
 * Update a reward
 * @param {string} id - Reward ID
 * @param {Object} updateData - { name?, icon? }
 * @returns {Promise<Object>}
 */
async function updateReward(id, updateData) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid reward ID format");
  }

  const db = dbClient.db(DB_NAME);
  
  // Build update object
  const updateDoc = {};
  if (updateData.name !== undefined) updateDoc.name = updateData.name;
  if (updateData.icon !== undefined) updateDoc.icon = updateData.icon;
  
  if (Object.keys(updateDoc).length === 0) {
    throw new Error("No valid fields to update");
  }
  
  const result = await db.collection("rewards").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateDoc },
    { returnDocument: 'after' }
  );
  
  if (!result) {
    throw new Error("Reward not found");
  }
  
  return {
    id: result._id.toString(),
    name: result.name,
    icon: result.icon
  };
}

/**
 * Delete a reward
 * @param {string} id - Reward ID
 * @returns {Promise<boolean>}
 */
async function deleteReward(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid reward ID format");
  }
  
  const db = dbClient.db(DB_NAME);
  const result = await db.collection("rewards").deleteOne({
    _id: new ObjectId(id)
  });
  
  return result.deletedCount > 0;
}

export { getRewardById, getAllRewards, createReward, updateReward, deleteReward };
