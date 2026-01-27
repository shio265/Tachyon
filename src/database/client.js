import { MongoClient, ServerApiVersion } from 'mongodb';
import process from 'process';
import dns from "node:dns/promises";
dns.setServers(["1.1.1.1"]);

const uri = process.env.MONGODB_URI;
console.log('\x1b[36m%s\x1b[0m', `MongoDB URI: ${uri}`);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const dbClient = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function initCollections(db) {
  const existingCollections = await db.listCollections().toArray();
  const collectionNames = existingCollections.map(col => col.name);

  /* ========= uploaders ========= */
  if (!collectionNames.includes("uploaders")) {
    await db.createCollection("uploaders", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["name", "discord_uid", "created_at"],
          properties: {
            name: { bsonType: "string" },
            discord_uid: { bsonType: "string" },
            created_at: { bsonType: "date" }
          }
        }
      }
    });

    await db.collection("uploaders").createIndex(
      { discord_uid: 1 },
      { unique: true }
    );
  }

  /* ========= rewards ========= */
  if (!collectionNames.includes("rewards")) {
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

    await db.collection("rewards").createIndex({ name: 1 });
  }

  /* ========= redeem_codes ========= */
  if (!collectionNames.includes("redeem_codes")) {
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

    await db.collection("redeem_codes").createIndex(
      { code: 1 },
      { unique: true }
    );
    await db.collection("redeem_codes").createIndex({ expired_at: 1 });
    await db.collection("redeem_codes").createIndex({ uploader_id: 1 });
  }

  /* ========= api_keys ========= */
  if (!collectionNames.includes("api_keys")) {
    await db.createCollection("api_keys", {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["key", "name", "created_at"],
          properties: {
            key: { bsonType: "string" },
            name: { bsonType: "string" },
            description: { bsonType: ["string", "null"] },
            is_active: { bsonType: "bool" },
            created_at: { bsonType: "date" },
            last_used_at: { bsonType: ["date", "null"] }
          }
        }
      }
    });

    await db.collection("api_keys").createIndex(
      { key: 1 },
      { unique: true }
    );
    await db.collection("api_keys").createIndex({ is_active: 1 });
  }

  console.log('\x1b[32m%s\x1b[0m', 'Collections initialized');
}

async function connectDB() {
  try {
    await dbClient.connect();
    const database = dbClient.db(process.env.MONGODB_DBNAME);
    console.log('\x1b[32m%s\x1b[0m', 'Connected to database:', database.databaseName);

    // Initialize collections
    await initCollections(database);
    
    console.log('\x1b[32m%s\x1b[0m', 'MongoDB is ready');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  connectDB()
    .then(() => dbClient.close())
    .catch(console.error);
}

// export the client and connect function
export { dbClient, connectDB };