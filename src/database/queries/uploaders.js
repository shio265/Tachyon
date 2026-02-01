import { ObjectId } from "mongodb";
import { dbClient } from "../client.js";
import process from "process";

const DB_NAME = process.env.MONGODB_DBNAME;

/**
 * Get uploader by Discord UID
 * @param {string} discordUid - Discord user ID
 * @returns {Promise<Object|null>}
 */
async function getUploaderByDiscordUid(discordUid) {
  const db = dbClient.db(DB_NAME);
  const uploader = await db.collection("uploaders").findOne({
    discord_uid: discordUid
  });
  
  if (!uploader) return null;
  
  return {
    id: uploader._id.toString(),
    name: uploader.name,
    discord_uid: uploader.discord_uid,
    type: uploader.type || "default",
    status: uploader.status,
    created_at: uploader.created_at.toISOString()
  };
}

/**
 * Get uploader by ID
 * @param {string} id - Uploader ID
 * @returns {Promise<Object|null>}
 */
async function getUploaderById(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid uploader ID format");
  }
  
  const db = dbClient.db(DB_NAME);
  const uploader = await db.collection("uploaders").findOne({
    _id: new ObjectId(id)
  });
  
  if (!uploader) return null;
  
  return {
    id: uploader._id.toString(),
    name: uploader.name,
    discord_uid: uploader.discord_uid,
    type: uploader.type || "default",
    status: uploader.status,
    created_at: uploader.created_at.toISOString()
  };
}

/**
 * Get all uploaders
 * @returns {Promise<Array>}
 */
async function getAllUploaders() {
  const db = dbClient.db(DB_NAME);
  const uploaders = await db.collection("uploaders").find({}).toArray();
  
  return uploaders.map(uploader => ({
    id: uploader._id.toString(),
    name: uploader.name,
    discord_uid: uploader.discord_uid,
    type: uploader.type || "default",
    status: uploader.status,
    created_at: uploader.created_at.toISOString()
  }));
}

/**
 * Create a new uploader
 * @param {Object} uploaderData - { name, discord_uid }
 * @returns {Promise<Object>}
 */
async function createUploader(uploaderData) {
  const db = dbClient.db(DB_NAME);
  
  // Check if uploader with this discord_uid already exists
  const existingUploader = await db.collection("uploaders").findOne({
    discord_uid: uploaderData.discord_uid
  });
  
  if (existingUploader) {
    const error = new Error("Uploader with this Discord ID already exists");
    error.code = 11000;
    throw error;
  }
  
  const result = await db.collection("uploaders").insertOne({
    name: uploaderData.name,
    discord_uid: uploaderData.discord_uid,
    type: uploaderData.type || "default",
    status: uploaderData.status || "active",
    created_at: new Date()
  });
  
  return {
    id: result.insertedId.toString(),
    name: uploaderData.name,
    discord_uid: uploaderData.discord_uid,
    type: uploaderData.type || "default",
    status: uploaderData.status || "active",
    created_at: new Date().toISOString()
  };
}

/**
 * Update uploader status
 * @param {string} id - Uploader ID
 * @param {string} status - New status (active, suspended, banned)
 * @returns {Promise<boolean>}
 */
async function updateUploaderStatus(id, status) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid uploader ID format");
  }
  
  const validStatuses = ["active", "suspended", "banned"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status. Must be: active, suspended, or banned");
  }
  
  const db = dbClient.db(DB_NAME);
  const result = await db.collection("uploaders").updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );
  
  return result.modifiedCount > 0;
}

export {
  getUploaderByDiscordUid,
  getUploaderById,
  getAllUploaders,
  createUploader,
  updateUploaderStatus
};
