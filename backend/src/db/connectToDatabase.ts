import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connect() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  await mongoose.connect(env.DBHOST);

  if (!mongoose.connection.db) {
    throw new Error("Database connection is not established");
  }

  await mongoose.connection.db.admin().command({ ping: 1 });
}

export async function disconnect() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  await mongoose.disconnect();
}
