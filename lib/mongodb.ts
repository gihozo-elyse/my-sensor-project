import { MongoClient, type Db } from "mongodb";

// Reuse one client across hot reloads and route handlers.
const globalForMongo = globalThis as unknown as { _mongoClient?: Promise<MongoClient> };

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");
  }

  if (!globalForMongo._mongoClient) {
    globalForMongo._mongoClient = new MongoClient(uri).connect().catch((err) => {
      // Don't cache a failed connection; retry on the next request.
      globalForMongo._mongoClient = undefined;
      throw err;
    });
  }

  const client = await globalForMongo._mongoClient;
  return client.db(process.env.MONGODB_DB || "mine_safety");
}
