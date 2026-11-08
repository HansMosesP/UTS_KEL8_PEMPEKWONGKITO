import { NextRequest, NextResponse } from "next/server";
import {
  authenticateCustomer,
  createBrowserSessionToken,
  deleteBrowserSession,
  getBrowserSession,
  registerCustomer,
  saveBrowserSession,
} from "../../../lib/database";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      action?: string;
      name?: string;
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (
      !email ||
      !password ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length > 256
    ) {
      return NextResponse.json(
        { error: "Email atau password tidak valid." },
        { status: 400 },
      );
    }

    if (body.action === "register") {
      const name = body.name?.trim();
      if (!name || name.length > 120 || password.length < 6) {
        return NextResponse.json(
          { error: "Nama wajib diisi dan password minimal 6 karakter." },
          { status: 400 },
        );
      }
      const user = await registerCustomer(name, email, password);
      if (!user) {
        return NextResponse.json(
          { error: "Email sudah terdaftar." },
          { status: 409 },
        );
      }
      return createAuthenticatedResponse(request, user, 201);
    }

    if (body.action === "login") {
      const user = await authenticateCustomer(email, password);
      if (!user) {
        return NextResponse.json(
          { error: "Email atau password salah." },
          { status: 401 },
        );
      }
      return createAuthenticatedResponse(request, user);
    }

    return NextResponse.json(
      { error: "Aksi autentikasi tidak valid." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Authentication request failed.", error);
    return NextResponse.json(
      { error: "Server gagal memproses autentikasi." },
      { status: 500 },
    );
  }
}

async function createAuthenticatedResponse(
  request: NextRequest,
  user: NonNullable<Awaited<ReturnType<typeof authenticateCustomer>>>,
  status = 200,
) {
  const oldToken = request.cookies.get("pwk_session")?.value;
  const existing = oldToken ? await getBrowserSession(oldToken) : null;
  const token = createBrowserSessionToken();
  await saveBrowserSession(token, {
    cart: existing?.cart ?? [],
    user,
  });
  if (oldToken) await deleteBrowserSession(oldToken);

  const response = NextResponse.json({ user }, { status });
  response.cookies.set("pwk_session", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
