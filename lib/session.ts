import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  deleteSession,
  getSession,
  getUserByEmail,
  saveSession,
  SESSION_MAX_AGE,
  type CartLine,
  type SessionData,
} from "./database";
import type { User } from "./types";

export const SESSION_COOKIE = "pwk_session";

const newExpiry = () => Date.now() + SESSION_MAX_AGE * 1000;

async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Sesi browser ini berdasarkan cookie HttpOnly (bukan localStorage). */
async function currentSession(): Promise<{ token: string; session: SessionData } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await getSession(token);
  return token && session ? { token, session } : null;
}

/** User yang sedang login + isi keranjang browser ini. */
export async function getSessionState(): Promise<{ user: User | null; cart: CartLine[] }> {
  const current = await currentSession();
  if (!current) return { user: null, cart: [] };
  const user = current.session.email ? await getUserByEmail(current.session.email) : null;
  return { user, cart: current.session.cart };
}

export async function getCurrentUser(): Promise<User | null> {
  return (await getSessionState()).user;
}

/** Login: selalu buat token baru (mencegah session fixation); keranjang tamu ikut dibawa. */
export async function startSession(user: User) {
  const previous = await currentSession();
  const token = createSessionToken();
  await saveSession(token, {
    email: user.email.toLowerCase(),
    cart: previous?.session.cart ?? [],
    expiresAt: newExpiry(),
  });
  if (previous) await deleteSession(previous.token);
  await setSessionCookie(token);
}

export async function endSession() {
  const store = await cookies();
  await deleteSession(store.get(SESSION_COOKIE)?.value);
  store.delete(SESSION_COOKIE);
}

/** Simpan keranjang ke PostgreSQL. Tamu yang belum punya sesi dibuatkan sesi baru. */
export async function saveCart(cart: CartLine[]) {
  const current = await currentSession();
  const token = current?.token ?? createSessionToken();
  await saveSession(token, {
    email: current?.session.email ?? null,
    cart,
    expiresAt: current?.session.expiresAt ?? newExpiry(),
  });
  if (!current) await setSessionCookie(token);
}

export const jsonError = (error: string, status: number) =>
  NextResponse.json({ error }, { status });

export async function requireUser(role?: User["role"]) {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: jsonError("Silakan login terlebih dahulu.", 401) };
  if (role && user.role !== role)
    return { user: null, response: jsonError("Akses ditolak.", 403) };
  return { user, response: null };
}
