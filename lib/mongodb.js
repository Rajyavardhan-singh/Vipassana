import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "vipassana_tracker";

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable. Set it in .env.local (dev) or your Vercel project settings (prod).");
}

let clientPromise;

// Reuse the connection across hot reloads in dev, and across warm serverless
// invocations in prod, instead of opening a new connection every request.
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
