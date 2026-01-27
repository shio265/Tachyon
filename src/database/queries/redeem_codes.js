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
  const redeemCodes = await db.collection("redeem_codes").find({}).toArray();
  
  return redeemCodes.map(redeemCode => ({
    id: redeemCode._id.toString(),
    uploader_id: redeemCode.uploader_id.toString(),
    code: redeemCode.code,
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
  
  const redeemCodeDoc = {
    uploader_id: new ObjectId(codeData.uploader_id),
    code: codeData.code,
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
    expired_at: redeemCodeDoc.expired_at?.toISOString() || null,
    created_at: redeemCodeDoc.created_at.toISOString(),
    rewards: codeData.rewards || []
  };
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
  isRedeemCodeExpired 
};
