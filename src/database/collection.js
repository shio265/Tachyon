import process from "process";
import { dbClient } from "./client";

const DB_NAME = process.env.MONGODB_DBNAME;

async function initMongo() {
  const client = dbClient;

  await client.connect();
  const db = client.db(DB_NAME);

  try {
    await db.createCollection("uploaders", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "discord_uid", "type", "created_at"],
          properties: {
            name: { bsonType: "string" },
            discord_uid: { bsonType: "string" },
            type: { 
              bsonType: "string",
              enum: ["default", "manager", "admin"]
            },
            status: {
              bsonType: "string",
              enum: ["active", "suspended", "banned"]
            },
            created_at: { bsonType: "date" }
          }
        }
      }
    });
  } catch {
    //
  }

  await db.collection("uploaders").createIndex(
    { discord_uid: 1 },
    { unique: true }
  );

  try {
    await db.createCollection("rewards", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name"],
          properties: {
            name: { bsonType: "string" },
            icon: { bsonType: ["string", "null"] }
          }
        }
      }
    });
  } catch {
    //
  }

  await db.collection("rewards").createIndex({ name: 1 });
  await db.collection("rewards").createIndex({ icon: 1 });

  try {
    await db.createCollection("redeem_codes", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["uploader_id", "code", "created_at"],
          properties: {
            uploader_id: { bsonType: "objectId" },
            code: { bsonType: "string" },
            expired_at: { bsonType: ["date", "null"] },
            created_at: { bsonType: "date" },
            rewards: {
              bsonType: "array",
              items: {
                bsonType: "object",
                required: ["reward_id", "amount"],
                properties: {
                  reward_id: { bsonType: "objectId" },
                  name: { bsonType: "string" },
                  icon: { bsonType: "string" },
                  amount: { bsonType: "int" }
                }
              }
            }
          }
        }
      }
    });
  } catch {
    //
  }

  await db.collection("redeem_codes").createIndex(
    { code: 1 },
    { unique: true }
  );
  await db.collection("redeem_codes").createIndex({ expired_at: 1 });
  await db.collection("redeem_codes").createIndex({ uploader_id: 1 });

  await client.close();
}

initMongo().catch(console.error);