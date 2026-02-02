import { ObjectId } from "mongodb";
import { dbClient } from "../client.js";
import process from "process";

const DB_NAME = process.env.MONGODB_DBNAME;

/**
 * Get redeem code by code string
 * @param {string} code - Redeem code
 * @returns {Promise<Object|null>}
 */
async function getRedeemCodeByCode(code) {
  const db = dbClient.db(DB_NAME);
  const redeemCode = await db.collection("redeem_codes").findOne({ code });
  
  if (!redeemCode) return null;
  
  return {
    id: redeemCode._id.toString(),
    uploader_id: redeemCode.uploader_id.toString(),
    code: redeemCode.code,
    version: redeemCode.version || null,
    index: redeemCode.index || 0,
    expired_at: redeemCode.expired_at?.toISOString() || null,
    created_at: redeemCode.created_at.toISOString(),
    rewards: redeemCode.rewards?.map(reward => ({
      reward_id: reward.reward_id.toString(),
      name: reward.name,
      icon: reward.icon,
      amount: reward.amount
    })) || []
  };
}

/**
 * Get all redeem codes
 * @returns {Promise<Array>}
 */
async function getAllRedeemCodes() {
  const db = dbClient.db(DB_NAME);
  const redeemCodes = await db.collection("redeem_codes")
    .find({})
    .sort({ index: 1, created_at: -1 }) // Sort by index ascending, then by created_at descending
    .toArray();
  
  return redeemCodes.map(redeemCode => ({
    id: redeemCode._id.toString(),
    uploader_id: redeemCode.uploader_id.toString(),
    code: redeemCode.code,
    version: redeemCode.version || null,
    index: redeemCode.index || 0,
    expired_at: redeemCode.expired_at?.toISOString() || null,
    created_at: redeemCode.created_at.toISOString(),
    rewards: redeemCode.rewards?.map(reward => ({
      reward_id: reward.reward_id.toString(),
      name: reward.name,
      icon: reward.icon,
      amount: reward.amount
    })) || []
  }));
}

/**
 * Create a new redeem code
 * @param {Object} codeData - { uploader_id, code, expired_at, rewards }
 * @returns {Promise<Object>}
 */
async function createRedeemCode(codeData) {
  const db = dbClient.db(DB_NAME);
  
  // Validate ObjectId format
  if (!ObjectId.isValid(codeData.uploader_id)) {
    throw new Error("Invalid uploader_id format");
  }
  
  // Validate reward_id format in rewards array
  if (codeData.rewards && codeData.rewards.length > 0) {
    for (const reward of codeData.rewards) {
      if (reward.reward_id && !ObjectId.isValid(reward.reward_id)) {
        throw new Error(`Invalid reward_id format: ${reward.reward_id}`);
      }
    }
  }
  
  // Check if code already exists
  const existingCode = await db.collection("redeem_codes").findOne({ code: codeData.code });
  if (existingCode) {
    const error = new Error("Redeem code already exists");
    error.code = 11000; // MongoDB duplicate key error code
    throw error;
  }
  
  const redeemCodeDoc = {
    uploader_id: new ObjectId(codeData.uploader_id),
    code: codeData.code,
    version: codeData.version || null,
    index: codeData.index || 0,
    expired_at: codeData.expired_at ? new Date(codeData.expired_at) : null,
    created_at: new Date(),
    rewards: codeData.rewards?.map(reward => ({
      reward_id: new ObjectId(reward.reward_id),
      name: reward.name,
      icon: reward.icon,
      amount: reward.amount
    })) || []
  };
  
  const result = await db.collection("redeem_codes").insertOne(redeemCodeDoc);
  
  return {
    id: result.insertedId.toString(),
    uploader_id: codeData.uploader_id,
    code: codeData.code,
    version: codeData.version || null,
    index: codeData.index || 0,
    expired_at: redeemCodeDoc.expired_at?.toISOString() || null,
    created_at: redeemCodeDoc.created_at.toISOString(),
    rewards: codeData.rewards || []
  };
}

/**
 * Update redeem code
 * @param {string} id - Redeem code ID
 * @param {Object} updateData - { code?, expired_at?, rewards? }
 * @returns {Promise<Object>}
 */
async function updateRedeemCode(id, updateData) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid redeem code ID format");
  }
  
  const db = dbClient.db(DB_NAME);
  
  // Build update object
  const updateDoc = {};
  
  if (updateData.code !== undefined) {
    // Check if new code already exists
    const existingCode = await db.collection("redeem_codes").findOne({
      code: updateData.code,
      _id: { $ne: new ObjectId(id) }
    });
    
    if (existingCode) {
      const error = new Error("Redeem code already exists");
      error.code = 11000;
      throw error;
    }
    
    updateDoc.code = updateData.code;
  }
  
  if (updateData.expired_at !== undefined) {
    updateDoc.expired_at = updateData.expired_at ? new Date(updateData.expired_at) : null;
  }
  
  if (updateData.version !== undefined) {
    updateDoc.version = updateData.version;
  }
  
  if (updateData.index !== undefined) {
    updateDoc.index = updateData.index;
  }
  
  if (updateData.rewards !== undefined) {
    // Validate reward_id format in rewards array
    if (updateData.rewards.length > 0) {
      for (const reward of updateData.rewards) {
        if (reward.reward_id && !ObjectId.isValid(reward.reward_id)) {
          throw new Error(`Invalid reward_id format: ${reward.reward_id}`);
        }
      }
    }
    
    updateDoc.rewards = updateData.rewards.map(reward => ({
      reward_id: new ObjectId(reward.reward_id),
      name: reward.name,
      icon: reward.icon,
      amount: reward.amount
    }));
  }
  
  if (Object.keys(updateDoc).length === 0) {
    throw new Error("No valid fields to update");
  }
  
  const result = await db.collection("redeem_codes").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateDoc },
    { returnDocument: 'after' }
  );
  
  if (!result) {
    throw new Error("Redeem code not found");
  }
  
  return {
    id: result._id.toString(),
    uploader_id: result.uploader_id.toString(),
    code: result.code,
    version: result.version || null,
    index: result.index || 0,
    expired_at: result.expired_at?.toISOString() || null,
    created_at: result.created_at.toISOString(),
    rewards: result.rewards?.map(reward => ({
      reward_id: reward.reward_id.toString(),
      name: reward.name,
      icon: reward.icon,
      amount: reward.amount
    })) || []
  };
}

/**
 * Delete redeem code
 * @param {string} id - Redeem code ID
 * @returns {Promise<boolean>}
 */
async function deleteRedeemCode(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid redeem code ID format");
  }
  
  const db = dbClient.db(DB_NAME);
  const result = await db.collection("redeem_codes").deleteOne({
    _id: new ObjectId(id)
  });
  
  return result.deletedCount > 0;
}

/**
 * Check if redeem code is expired
 * @param {string} code - Redeem code
 * @returns {Promise<boolean>}
 */
async function isRedeemCodeExpired(code) {
  const redeemCode = await getRedeemCodeByCode(code);
  
  if (!redeemCode) return true;
  if (!redeemCode.expired_at) return false;
  
  return new Date(redeemCode.expired_at) < new Date();
}

export { 
  getRedeemCodeByCode, 
  getAllRedeemCodes, 
  createRedeemCode,
  updateRedeemCode,
  deleteRedeemCode,
  isRedeemCodeExpired 
};
