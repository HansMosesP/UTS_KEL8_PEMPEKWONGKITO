import { NextResponse } from "next/server";
import { authenticateUser, registerCustomer } from "../../../lib/database";
import {
  endSession,
  getCurrentUser,
  jsonError,
  startSession,
} from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ user: await getCurrentUser() });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      name?: string;
      email?: string;
      password?: string;
    };

    if (body.action === "logout") {
      await endSession();
      return NextResponse.json({ ok: true });
    }

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (
      !email ||
      !password ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length > 256
    ) {
      return jsonError("Email atau password tidak valid.", 400);
    }

    if (body.action === "register") {
      const name = body.name?.trim();
      if (!name || name.length > 120 || password.length < 6) {
        return jsonError("Nama wajib diisi dan password minimal 6 karakter.", 400);
      }
      const user = await registerCustomer(name, email, password);
      if (!user) return jsonError("Email sudah terdaftar.", 409);
      await startSession(user);
      return NextResponse.json({ user }, { status: 201 });
    }

    if (body.action === "login") {
      const user = await authenticateUser(email, password);
      if (!user) return jsonError("Email atau password salah.", 401);
      await startSession(user);
      return NextResponse.json({ user });
    }

    return jsonError("Aksi autentikasi tidak valid.", 400);
  } catch (error) {
    console.error("Authentication request failed.", error);
    return jsonError("Server gagal memproses autentikasi.", 500);
  }
}
