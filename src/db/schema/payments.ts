import { pgTable, uuid, varchar, numeric, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { courses } from "./courses";
import { PAYMENT_STATUS } from "@/config/constants";

export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUS);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("TRY"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    providerPaymentId: varchar("provider_payment_id", { length: 200 }),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("payments_user_idx").on(table.userId),
    statusIdx: index("payments_status_idx").on(table.status),
  }),
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
