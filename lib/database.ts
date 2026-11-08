import { PrismaClient } from "@prisma/client";
import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { DEFAULT_ADMIN, DEFAULT_MENU } from "./defaults";
import type { CartItem, User } from "./types";

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
export type StoreSnapshot = Record<StoreKey, unknown>;
export type BrowserSession = { cart: CartItem[]; user: User | null };

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const initialState: StoreSnapshot = {
  menuData: DEFAULT_MENU,
  usersData: [],
  ordersData: [],
  siteTexts: {},
  adminNotifs: [],
};

let initialization: Promise<void> | undefined;

async function ensureInitialized(): Promise<void> {
  if (!initialization) {
    initialization = (async () => {
      await prisma.appState.createMany({
        data: Object.entries(initialState).map(([key, value]) => ({
          key,
          value: JSON.stringify(value),
        })),
        skipDuplicates: true,
      });
    })().catch((error: unknown) => {
      initialization = undefined;
      throw error;
    });
  }
  await initialization;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

function makeUserSafe(user: User): User {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

async function readUsers(): Promise<User[]> {
  const row = await prisma.appState.findUniqueOrThrow({
    where: { key: "usersData" },
  });
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

async function upsertStoreValue(key: StoreKey, value: unknown): Promise<void> {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  await prisma.appState.upsert({
    where: { key },
    create: { key, value: serialized },
    update: { value: serialized },
  });
}

async function secureExistingUsers(): Promise<void> {
  const users = await readUsers();
  let usersNeedHashing = false;
  const securedUsers = users.map((user) => {
    if (user.password && !user.password.startsWith("scrypt$")) {
      usersNeedHashing = true;
      return { ...user, password: hashPassword(user.password) };
    }
    return user;
  });
  if (usersNeedHashing) await upsertStoreValue("usersData", securedUsers);
}

export async function getStoreSnapshot(): Promise<StoreSnapshot> {
  await ensureInitialized();
  await secureExistingUsers();
  const rows = await prisma.appState.findMany({
    where: { key: { in: [...STORE_KEYS] } },
  });
  const values = new Map(rows.map((row) => [row.key, JSON.parse(row.value)]));
  return Object.fromEntries(
    STORE_KEYS.map((key) => [
      key,
      key === "usersData" && Array.isArray(values.get(key))
        ? (values.get(key) as User[]).map(makeUserSafe)
        : values.get(key),
    ]),
  ) as StoreSnapshot;
}

export async function saveStoreValue(
  key: WritableStoreKey,
  value: unknown,
): Promise<void> {
  await ensureInitialized();
  await upsertStoreValue(key, value);
}

export async function registerCustomer(
  name: string,
  email: string,
  password: string,
): Promise<User | null> {
  await ensureInitialized();
  const created = await prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT key FROM "AppState" WHERE key = 'usersData' FOR UPDATE`;
    const row = await transaction.appState.findUniqueOrThrow({
      where: { key: "usersData" },
    });
    const users = JSON.parse(row.value) as User[];
    if (users.some((user) => user.email.toLowerCase() === email)) return null;

    const user: User = {
      id: Date.now(),
      name,
      email,
      password: hashPassword(password),
      role: "customer",
    };
    await transaction.appState.update({
      where: { key: "usersData" },
      data: { value: JSON.stringify([...users, user]) },
    });
    return user;
  });
  return created ? makeUserSafe(created) : null;
}

export async function authenticateCustomer(
  email: string,
  password: string,
): Promise<User | null> {
  await ensureInitialized();
  if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
    return makeUserSafe(DEFAULT_ADMIN);
  }
  const user = (await readUsers()).find(
    (entry) => entry.email.toLowerCase() === email,
  );
  return user && verifyPassword(user.password, password)
    ? makeUserSafe(user)
    : null;
}

function sessionKey(token: string): string {
  return `browser_session_${createHash("sha256").update(token).digest("hex")}`;
}

export function createBrowserSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function getBrowserSession(
  token: string,
): Promise<BrowserSession | null> {
  await ensureInitialized();
  const row = await prisma.appState.findUnique({
    where: { key: sessionKey(token) },
  });
  return row ? (JSON.parse(row.value) as BrowserSession) : null;
}

export async function saveBrowserSession(
  token: string,
  session: BrowserSession,
): Promise<void> {
  await ensureInitialized();
  await prisma.appState.upsert({
    where: { key: sessionKey(token) },
    create: {
      key: sessionKey(token),
      value: JSON.stringify(session),
    },
    update: { value: JSON.stringify(session) },
  });
}

export async function deleteBrowserSession(token: string): Promise<void> {
  await ensureInitialized();
  await prisma.appState.deleteMany({ where: { key: sessionKey(token) } });
}
