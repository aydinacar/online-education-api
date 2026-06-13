import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "./env";
import * as schema from "@/db/schema";

const queryClient = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === "production" ? 20 : 5,
});

export const db = drizzle(queryClient, { schema });

export type Database = typeof db;
