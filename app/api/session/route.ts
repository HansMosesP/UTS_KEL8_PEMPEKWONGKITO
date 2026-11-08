import { NextRequest, NextResponse } from "next/server";
import {
  createBrowserSessionToken,
  getBrowserSession,
  saveBrowserSession,
  type BrowserSession,
} from "../../../lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pwk_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function isSessionToken(value: string | undefined): value is string {
  return Boolean(value && /^[A-Za-z0-9_-]{43}$/.test(value));
}

function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

async function ensureSession(request: NextRequest) {
  const existingToken = request.cookies.get(COOKIE_NAME)?.value;
  if (isSessionToken(existingToken)) {
    const existing = await getBrowserSession(existingToken);
    if (existing)
      return { token: existingToken, session: existing, isNew: false };
  }

  const token = createBrowserSessionToken();
  const session: BrowserSession = { cart: [], user: null };
  await saveBrowserSession(token, session);
  return { token, session, isNew: true };
}

export async function GET(request: NextRequest) {
  try {
    const { token, session, isNew } = await ensureSession(request);
    const response = NextResponse.json(session, {
      headers: { "Cache-Control": "no-store" },
    });
    if (isNew) setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Failed to load browser session.", error);
    return NextResponse.json(
      { error: "Gagal membaca sesi dari PostgreSQL." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { cart?: unknown };
    if (
      !Array.isArray(body.cart) ||
      !body.cart.every(
        (item) =>
          item &&
          typeof item === "object" &&
          Number.isInteger(item.id) &&
          Number.isInteger(item.qty) &&
          item.qty > 0,
      )
    ) {
      return NextResponse.json(
        { error: "Data keranjang tidak valid." },
        { status: 400 },
      );
    }

    const { token, session, isNew } = await ensureSession(request);
    const updated = { ...session, cart: body.cart as BrowserSession["cart"] };
    await saveBrowserSession(token, updated);
    const response = NextResponse.json({ ok: true });
    if (isNew) setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Failed to save browser cart.", error);
    return NextResponse.json(
      { error: "Gagal menyimpan keranjang ke PostgreSQL." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { token, session, isNew } = await ensureSession(request);
    const updated = { ...session, user: null };
    await saveBrowserSession(token, updated);
    const response = NextResponse.json({ ok: true });
    if (isNew) setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Failed to log out browser session.", error);
    return NextResponse.json(
      { error: "Gagal mengakhiri sesi." },
      { status: 500 },
    );
  }
}
