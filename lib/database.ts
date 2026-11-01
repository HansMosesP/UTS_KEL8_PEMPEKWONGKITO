import Database from "better-sqlite3";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DEFAULT_MENU } from "./defaults";
import type { User } from "./types";

export const STORE_KEYS = [
  "menuData",
  "usersData",
  "ordersData",
  "siteTexts",
  "adminNotifs",
] as const;
export const WRITABLE_STORE_KEYS = [
  "menuData",
  "ordersData",
  "siteTexts",
  "adminNotifs",
] as const;

export type StoreKey = (typeof STORE_KEYS)[number];
export type WritableStoreKey = (typeof WRITABLE_STORE_KEYS)[number];
export type LegacyStore = Partial<Record<StoreKey, unknown>>;
export type StoreSnapshot = Record<StoreKey, unknown>;

const databasePath =
  process.env.SQLITE_DB_PATH ||
  join(process.cwd(), "data", "pempek-wong-kito.db");
mkdirSync(dirname(databasePath), { recursive: true });

const database = new Database(databasePath);
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");
database.exec(`
  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )
`);

const initialState: StoreSnapshot = {
  menuData: DEFAULT_MENU,
  usersData: [],
  ordersData: [],
  siteTexts: {},
  adminNotifs: [],
};
const insertState = database.prepare(
  "INSERT OR IGNORE INTO app_state (key, value) VALUES (?, ?)",
);
for (const key of STORE_KEYS) {
  insertState.run(key, JSON.stringify(initialState[key]));
}
insertState.run("__legacy_imported__", "false");

const selectState = database.prepare(
  "SELECT value FROM app_state WHERE key = ?",
);
const updateState = database.prepare(
  "INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

function makeUserSafe(user: User): User {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

function readUsers(): User[] {
  const row = selectState.get("usersData") as { value: string };
  return JSON.parse(row.value) as User[];
}

function verifyPassword(stored: string | undefined, password: string): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const existingUsers = readUsers();
let usersNeedHashing = false;
const securedUsers = existingUsers.map((user) => {
  if (user.password && !user.password.startsWith("scrypt$")) {
    usersNeedHashing = true;
    return { ...user, password: hashPassword(user.password) };
  }
  return user;
});
if (usersNeedHashing) {
  updateState.run("usersData", JSON.stringify(securedUsers));
}

export function getStoreSnapshot(): StoreSnapshot {
  return Object.fromEntries(
    STORE_KEYS.map((key) => {
      const row = selectState.get(key) as { value: string };
      const value = JSON.parse(row.value) as unknown;
      return [
        key,
        key === "usersData" && Array.isArray(value)
          ? value.map((user) => makeUserSafe(user as User))
          : value,
      ];
    }),
  ) as StoreSnapshot;
}

export function isLegacyImported(): boolean {
  const row = selectState.get("__legacy_imported__") as
    | { value: string }
    | undefined;
  return row?.value === "true";
}

export function saveStoreValue(key: WritableStoreKey, value: unknown): void {
  updateState.run(key, JSON.stringify(value));
}

export function importLegacyStore(legacy: LegacyStore): void {
  const importOnce = database.transaction(() => {
    if (isLegacyImported()) return;
    for (const key of STORE_KEYS) {
      if (Object.hasOwn(legacy, key)) {
        const value =
          key === "usersData" && Array.isArray(legacy[key])
            ? (legacy[key] as User[]).map((user) => ({
                ...user,
                ...(user.password
                  ? { password: hashPassword(user.password) }
                  : {}),
              }))
            : legacy[key];
        updateState.run(key, JSON.stringify(value));
      }
    }
    updateState.run("__legacy_imported__", "true");
  });
  importOnce();
}

export function registerCustomer(
  name: string,
  email: string,
  password: string,
): User | null {
  let created: User | null = null;
  const register = database.transaction(() => {
    const users = readUsers();
    if (users.some((user) => user.email.toLowerCase() === email)) return;
    created = {
      id: Date.now(),
      name,
      email,
      password: hashPassword(password),
      role: "customer",
    };
    updateState.run("usersData", JSON.stringify([...users, created]));
  });
  register();
  return created ? makeUserSafe(created) : null;
}

export function authenticateCustomer(
  email: string,
  password: string,
): User | null {
  const user = readUsers().find(
    (entry) => entry.email.toLowerCase() === email,
  );
  return user && verifyPassword(user.password, password)
    ? makeUserSafe(user)
    : null;
}