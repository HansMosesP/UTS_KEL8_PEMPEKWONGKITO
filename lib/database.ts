import { PrismaClient, type Prisma } from "@prisma/client";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  DEFAULT_ANATOMY,
  DEFAULT_FAQS,
  DEFAULT_FEATURES,
  DEFAULT_GALLERY,
  DEFAULT_IMAGES,
  DEFAULT_MENU,
  DEFAULT_PAYMENTS,
  DEFAULT_SETTINGS,
  DEFAULT_SHIPPING,
  DEFAULT_TESTIMONIALS,
  defaultFeatureImg,
} from "./defaults";
import type {
  AnatomyItem,
  CheckoutPayload,
  ContentKey,
  FaqItem,
  FeatureItem,
  GalleryItem,
  MenuItem,
  Notification,
  Order,
  OrderStatus,
  PaymentMethod,
  ShippingCity,
  SiteTexts,
  Testimonial,
  User,
} from "./types";

/**
 * Semua data disimpan di PostgreSQL lewat Prisma, di tabel AppState (key → JSON).
 * - Konten & data toko: key "menuData", "ordersData", "usersData", dst.
 * - Sesi browser (login + keranjang): key "browser_session_<sha256 token>".
 * - Gambar upload admin: key "upload_<id>" (isi base64).
 */

export const CONTENT_KEYS: readonly ContentKey[] = [
  "menuData",
  "siteTexts",
  "faqData",
  "testimoniData",
  "siteSettings",
  "anatomyData",
  "featureData",
  "galleryData",
  "siteImages",
  "shippingData",
  "paymentData",
];

const SESSION_DAYS = 7;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
const SESSION_PREFIX = "browser_session_";
const UPLOAD_PREFIX = "upload_";

/* ---------- Koneksi Prisma ---------- */
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Klien Prisma biasa, atau klien di dalam transaksi. */
type Db = PrismaClient | Prisma.TransactionClient;

function parse<T>(value: string | undefined, fallback: T): T {
  if (value === undefined) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function read<T>(key: string, fallback: T, db: Db = prisma): Promise<T> {
  const row = await db.appState.findUnique({ where: { key } });
  return parse(row?.value, fallback);
}

/** Ambil banyak key sekaligus dalam satu query. */
async function readMany(keys: readonly string[]): Promise<Map<string, string>> {
  const rows = await prisma.appState.findMany({ where: { key: { in: [...keys] } } });
  return new Map(rows.map((row) => [row.key, row.value]));
}

async function write(key: string, value: unknown, db: Db = prisma) {
  const serialized = JSON.stringify(value);
  await db.appState.upsert({
    where: { key },
    create: { key, value: serialized },
    update: { value: serialized },
  });
}

/** Kunci baris (SELECT ... FOR UPDATE) agar dua request tidak saling menimpa. */
async function lockRows(tx: Prisma.TransactionClient, keys: string[]) {
  for (const key of [...keys].sort())
    await tx.$queryRaw`SELECT key FROM "AppState" WHERE key = ${key} FOR UPDATE`;
}

/** Baca-ubah-tulis dalam satu transaksi dengan baris yang dikunci. */
async function locked<T>(
  keys: string[],
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  await ensureInitialized();
  return prisma.$transaction(
    async (tx) => {
      await lockRows(tx, keys);
      return fn(tx);
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
}

/* ---------- Password ---------- */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}
function verifyPassword(stored: string | undefined, password: string): boolean {
  if (!stored) return false;
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
function makeUserSafe(user: User): User {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

/* ---------- Inisialisasi (sekali per proses server) ---------- */
let initialization: Promise<void> | undefined;

function ensureInitialized(): Promise<void> {
  initialization ??= initialize().catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

async function initialize() {
  // FAQ, testimoni & keunggulan dulunya teks tetap (faq.q1, testimoni.t1Text, keunggulan.card1Title, ...).
  // Saat list-nya pertama kali dibuat, bawa ubahan lama admin ke struktur list baru.
  const texts = await read<SiteTexts>("siteTexts", {});
  const initial: Record<string, unknown> = {
    menuData: DEFAULT_MENU,
    usersData: [],
    ordersData: [],
    siteTexts: {},
    adminNotifs: [],
    siteSettings: DEFAULT_SETTINGS,
    anatomyData: DEFAULT_ANATOMY,
    galleryData: DEFAULT_GALLERY,
    siteImages: DEFAULT_IMAGES,
    shippingData: DEFAULT_SHIPPING,
    paymentData: DEFAULT_PAYMENTS,
    faqData: DEFAULT_FAQS.map((faq, index) => ({
      ...faq,
      question: texts[`faq.q${index + 1}`] ?? faq.question,
      answer: texts[`faq.a${index + 1}`] ?? faq.answer,
    })),
    testimoniData: DEFAULT_TESTIMONIALS.map((item, index) => ({
      ...item,
      text: texts[`testimoni.t${index + 1}Text`] ?? item.text,
      name: texts[`testimoni.t${index + 1}Name`] ?? item.name,
      city: texts[`testimoni.t${index + 1}City`] ?? item.city,
    })),
    featureData: DEFAULT_FEATURES.map((item, index) => ({
      ...item,
      title: texts[`keunggulan.card${index + 1}Title`] ?? item.title,
      desc: texts[`keunggulan.card${index + 1}Desc`] ?? item.desc,
    })),
  };
  // Hanya key yang belum ada yang dibuat; data yang sudah ada tidak ditimpa.
  await prisma.appState.createMany({
    data: Object.entries(initial).map(([key, value]) => ({ key, value: JSON.stringify(value) })),
    skipDuplicates: true,
  });

  // Hash password lama yang masih plaintext + pastikan ada akun admin.
  await prisma.$transaction(async (tx) => {
    await lockRows(tx, ["usersData"]);
    let changed = false;
    const users = (await read<User[]>("usersData", [], tx)).map((user) => {
      if (user.password && !user.password.startsWith("scrypt$")) {
        changed = true;
        return { ...user, password: hashPassword(user.password) };
      }
      return user;
    });
    if (!users.some((user) => user.role === "admin")) {
      users.push({
        id: 1,
        name: "Admin",
        email: (process.env.ADMIN_EMAIL || "admin@pempekwongkito.com").toLowerCase(),
        password: hashPassword(process.env.ADMIN_PASSWORD || "admin123"),
        role: "admin",
        createdAt: new Date().toISOString(),
      });
      changed = true;
    }
    if (changed) await write("usersData", users, tx);
  });

  // Hapus sesi yang sudah kedaluwarsa (termasuk sesi format lama tanpa masa berlaku).
  const sessions = await prisma.appState.findMany({ where: { key: { startsWith: SESSION_PREFIX } } });
  const expired = sessions
    .filter((row) => !isActive(parse<SessionData | null>(row.value, null)))
    .map((row) => row.key);
  if (expired.length) await prisma.appState.deleteMany({ where: { key: { in: expired } } });
}

/* ---------- Users ---------- */
function readUsers(db: Db = prisma): Promise<User[]> {
  return read<User[]>("usersData", [], db);
}

export async function getUsers(): Promise<User[]> {
  await ensureInitialized();
  return (await readUsers()).map(makeUserSafe);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  await ensureInitialized();
  const user = (await readUsers()).find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  return user ? makeUserSafe(user) : null;
}

export function registerCustomer(name: string, email: string, password: string): Promise<User | null> {
  return locked(["usersData"], async (tx) => {
    const users = await readUsers(tx);
    if (users.some((user) => user.email.toLowerCase() === email)) return null;
    const user: User = {
      id: Date.now(),
      name,
      email,
      password: hashPassword(password),
      role: "customer",
      createdAt: new Date().toISOString(),
    };
    await write("usersData", [...users, user], tx);
    return makeUserSafe(user);
  });
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  await ensureInitialized();
  const user = (await readUsers()).find((entry) => entry.email.toLowerCase() === email);
  return user && verifyPassword(user.password, password) ? makeUserSafe(user) : null;
}

/* ---------- Sesi browser: login + keranjang ---------- */
export type CartLine = { id: number; qty: number };
export type SessionData = { email: string | null; cart: CartLine[]; expiresAt: number };

/** Token di cookie tidak disimpan mentah; yang disimpan hanya hash-nya. */
const sessionKey = (token: string) =>
  SESSION_PREFIX + createHash("sha256").update(token).digest("hex");

function isActive(session: SessionData | null): session is SessionData {
  return Boolean(session && typeof session.expiresAt === "number" && session.expiresAt > Date.now());
}

export const isSessionToken = (value: string | undefined): value is string =>
  Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function getSession(token: string | undefined): Promise<SessionData | null> {
  if (!isSessionToken(token)) return null;
  await ensureInitialized();
  const session = await read<SessionData | null>(sessionKey(token), null);
  if (!isActive(session)) return null;
  return {
    email: typeof session.email === "string" ? session.email : null,
    cart: Array.isArray(session.cart) ? session.cart : [],
    expiresAt: session.expiresAt,
  };
}

export async function saveSession(token: string, session: SessionData) {
  await ensureInitialized();
  await write(sessionKey(token), session);
}

export async function deleteSession(token: string | undefined) {
  if (!isSessionToken(token)) return;
  await ensureInitialized();
  await prisma.appState.deleteMany({ where: { key: sessionKey(token) } });
}

/* ---------- Konten publik ---------- */
export async function getPublicContent() {
  await ensureInitialized();
  const rows = await readMany(CONTENT_KEYS);
  const get = <T>(key: ContentKey, fallback: T) => parse<T>(rows.get(key), fallback);
  return {
    menuData: get<MenuItem[]>("menuData", DEFAULT_MENU),
    siteTexts: get<SiteTexts>("siteTexts", {}),
    faqData: get<FaqItem[]>("faqData", DEFAULT_FAQS),
    // Testimoni lama belum punya rating → anggap 5 bintang.
    testimoniData: get<Testimonial[]>("testimoniData", DEFAULT_TESTIMONIALS).map((item) => ({
      ...item,
      rating: item.rating ?? 5,
    })),
    siteSettings: { ...DEFAULT_SETTINGS, ...get("siteSettings", {}) },
    anatomyData: get<AnatomyItem[]>("anatomyData", DEFAULT_ANATOMY),
    // Kartu keunggulan lama pakai emoji (icon) → ganti dengan foto bawaan sesuai urutan.
    featureData: get<(FeatureItem & { icon?: string })[]>("featureData", DEFAULT_FEATURES).map(
      ({ id, img, title, desc }, index) => ({ id, img: img || defaultFeatureImg(index), title, desc }),
    ),
    galleryData: get<GalleryItem[]>("galleryData", DEFAULT_GALLERY),
    siteImages: { ...DEFAULT_IMAGES, ...get("siteImages", {}) },
    shippingData: get<ShippingCity[]>("shippingData", DEFAULT_SHIPPING),
    paymentData: get<PaymentMethod[]>("paymentData", DEFAULT_PAYMENTS),
  };
}

export async function saveContent(key: ContentKey, value: unknown) {
  await ensureInitialized();
  await write(key, value);
}

/* ---------- Gambar upload admin ---------- */
export async function saveUpload(mime: string, data: Buffer): Promise<string> {
  const id = randomBytes(16).toString("hex");
  await prisma.appState.create({
    data: {
      key: UPLOAD_PREFIX + id,
      value: JSON.stringify({ mime, data: data.toString("base64"), createdAt: Date.now() }),
    },
  });
  return id;
}

export async function getUpload(id: string): Promise<{ mime: string; data: Buffer } | null> {
  const file = await read<{ mime: string; data: string } | null>(UPLOAD_PREFIX + id, null);
  return file ? { mime: file.mime, data: Buffer.from(file.data, "base64") } : null;
}

/* ---------- Pesanan & notifikasi ---------- */
export async function getOrders(): Promise<Order[]> {
  await ensureInitialized();
  return read<Order[]>("ordersData", []);
}

export async function getNotifications(): Promise<Notification[]> {
  await ensureInitialized();
  return read<Notification[]>("adminNotifs", []);
}

async function pushNotification(tx: Prisma.TransactionClient, title: string, body: string) {
  const notifications = await read<Notification[]>("adminNotifs", [], tx);
  const item: Notification = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title,
    body,
    read: false,
    time: new Date().toISOString(),
  };
  await write("adminNotifs", [item, ...notifications].slice(0, 100), tx);
}

const rupiah = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export class OrderError extends Error {}

/** Harga & ongkir dihitung ulang di server agar tidak bisa dimanipulasi. */
export function createOrder(user: User, payload: CheckoutPayload): Promise<Order> {
  return locked(["ordersData", "adminNotifs"], async (tx) => {
    const menu = await read<MenuItem[]>("menuData", DEFAULT_MENU, tx);
    const items = payload.items.flatMap(({ id, qty }) => {
      const item = menu.find((entry) => entry.id === id);
      const quantity = Math.floor(Number(qty));
      return item && quantity > 0 && quantity <= 99 ? [{ ...item, qty: quantity }] : [];
    });
    if (!items.length) throw new OrderError("Keranjang kosong atau menu sudah tidak tersedia.");
    if (items.length !== payload.items.length)
      throw new OrderError("Sebagian menu di keranjang sudah tidak tersedia. Muat ulang halaman.");
    const city = (await read<ShippingCity[]>("shippingData", DEFAULT_SHIPPING, tx)).find(
      (entry) => entry.id === payload.cityId,
    );
    if (!city) throw new OrderError("Kota tujuan tidak valid. Muat ulang halaman.");
    const payments = await read<PaymentMethod[]>("paymentData", DEFAULT_PAYMENTS, tx);
    if (!payments.some((method) => method.name === payload.payment))
      throw new OrderError("Metode pembayaran tidak tersedia. Muat ulang halaman.");

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const order: Order = {
      id: `PWK-${Date.now().toString().slice(-8)}${randomBytes(1).toString("hex").toUpperCase()}`,
      userEmail: user.email,
      userName: payload.name,
      phone: payload.phone,
      address: payload.address,
      city: `${city.name} (${rupiah(city.fee)})`,
      payment: payload.payment,
      items,
      subtotal,
      ongkir: city.fee,
      total: subtotal + city.fee,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const orders = await read<Order[]>("ordersData", [], tx);
    await write("ordersData", [...orders, order], tx);
    await pushNotification(
      tx,
      `Pesanan Baru: ${order.id}`,
      `${order.userName} - ${items.length} item - ${rupiah(order.total)}`,
    );
    return order;
  });
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "menunggu",
  process: "diproses",
  shipped: "dikirim",
  done: "selesai",
  cancel: "dibatalkan",
};

export function updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
  return locked(["ordersData", "adminNotifs"], async (tx) => {
    const orders = await read<Order[]>("ordersData", [], tx);
    const order = orders.find((entry) => entry.id === id);
    if (!order) return false;
    if (order.status === status) return true;
    await write(
      "ordersData",
      orders.map((entry) =>
        entry.id === id ? { ...entry, status, updatedAt: new Date().toISOString() } : entry,
      ),
      tx,
    );
    if (status === "shipped" || status === "done" || status === "cancel")
      await pushNotification(
        tx,
        `Pesanan ${id} ${STATUS_LABEL[status]}`,
        `${order.userName} - ${rupiah(order.total)}`,
      );
    return true;
  });
}

export function deleteOrder(id: string): Promise<boolean> {
  return locked(["ordersData"], async (tx) => {
    const orders = await read<Order[]>("ordersData", [], tx);
    const next = orders.filter((entry) => entry.id !== id);
    if (next.length === orders.length) return false;
    await write("ordersData", next, tx);
    return true;
  });
}

export function markNotificationsRead(ids: number[] | "all"): Promise<void> {
  return locked(["adminNotifs"], async (tx) => {
    const notifications = await read<Notification[]>("adminNotifs", [], tx);
    await write(
      "adminNotifs",
      notifications.map((item) =>
        ids === "all" || ids.includes(item.id) ? { ...item, read: true } : item,
      ),
      tx,
    );
  });
}
