import mongoose from 'mongoose';
import { ensureDatabaseSeeded } from './auto-seed';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/newtonite_ops';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) {
    if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
      ensureDatabaseSeeded().catch(() => {});
    }
    return mongoose;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      if (!process.env.VITEST && process.env.NODE_ENV !== 'test') {
        ensureDatabaseSeeded().catch(() => {});
      }
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;

