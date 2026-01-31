import { dbClient } from "../client.js";
import process from "process";

const DB_NAME = process.env.MONGODB_DBNAME;

/**
 * Check if API key is valid
 * @param {string} key - API key to validate
 * @returns {Promise<boolean>}
 */
async function isValidApiKey(key) {
  if (!key) return false;
  
  const db = dbClient.db(DB_NAME);
  const apiKey = await db.collection("api_keys").findOne({
    key: key,
    is_active: true
  });
  
  return !!apiKey;
}

/**
 * Update last used timestamp for API key
 * @param {string} key - API key
 * @returns {Promise<void>}
 */
async function updateApiKeyLastUsed(key) {
  const db = dbClient.db(DB_NAME);
  await db.collection("api_keys").updateOne(
    { key: key },
    { $set: { last_used_at: new Date() } }
  );
}

/**
 * Get all API keys
 * @returns {Promise<Array>}
 */
async function getAllApiKeys() {
  const db = dbClient.db(DB_NAME);
  const keys = await db.collection("api_keys").find({}).toArray();
  
  return keys.map(key => ({
    id: key._id.toString(),
    key: key.key,
    name: key.name,
    description: key.description || null,
    is_active: key.is_active,
    created_at: key.created_at.toISOString(),
    last_used_at: key.last_used_at?.toISOString() || null
  }));
}

/**
 * Create a new API key
 * @param {Object} keyData - { key, name, description }
 * @returns {Promise<Object>}
 */
async function createApiKey(keyData) {
  const db = dbClient.db(DB_NAME);
  
  // Check if API key with the same name already exists
  const existingKey = await db.collection("api_keys").findOne({ name: keyData.name });
  if (existingKey) {
    const error = new Error("API key with this name already exists");
    error.code = 11000; // MongoDB duplicate key error code
    throw error;
  }
  
  const result = await db.collection("api_keys").insertOne({
    key: keyData.key,
    name: keyData.name,
    description: keyData.description || null,
    is_active: true,
    created_at: new Date(),
    last_used_at: null
  });
  
  return {
    id: result.insertedId.toString(),
    key: keyData.key,
    name: keyData.name,
    description: keyData.description || null,
    is_active: true,
    created_at: new Date().toISOString(),
    last_used_at: null
  };
}

/**
 * Deactivate an API key
 * @param {string} key - API key to deactivate
 * @returns {Promise<boolean>}
 */
async function deactivateApiKey(key) {
  const db = dbClient.db(DB_NAME);
  const result = await db.collection("api_keys").updateOne(
    { key: key },
    { $set: { is_active: false } }
  );
  
  return result.modifiedCount > 0;
}

export {
  isValidApiKey,
  updateApiKeyLastUsed,
  getAllApiKeys,
  createApiKey,
  deactivateApiKey
};
