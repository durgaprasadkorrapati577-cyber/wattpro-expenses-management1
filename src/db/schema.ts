import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["owner", "employee"]);
export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);
export const expenseStatusEnum = pgEnum("expense_status", [
  "pending",
  "approved",
  "rejected",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("employee"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tokenHash: text("token_hash").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const invites = pgTable("invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: text("token").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  invitedById: uuid("invited_by_id")
    .notNull()
    .references(() => users.id),
  status: inviteStatusEnum("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    vendor: text("vendor"),
    category: text("category").notNull(),
    amountCents: integer("amount_cents").notNull(),
    expenseDate: date("expense_date").notNull(),
    notes: text("notes"),
    receiptPath: text("receipt_path"),
    receiptName: text("receipt_name"),
    receiptMime: text("receipt_mime"),
    status: expenseStatusEnum("status").notNull().default("pending"),
    reviewNote: text("review_note"),
    reviewedById: uuid("reviewed_by_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("expenses_user_idx").on(t.userId),
    index("expenses_status_idx").on(t.status),
    index("expenses_date_idx").on(t.expenseDate),
  ],
);

export const companySettings = pgTable("company_settings", {
  id: integer("id").primaryKey().default(1),
  companyName: text("company_name").notNull().default("WattPro"),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type CompanySettings = typeof companySettings.$inferSelect;
