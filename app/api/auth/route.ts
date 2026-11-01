import { NextResponse } from "next/server";
import {
  authenticateCustomer,
  registerCustomer,
} from "../../../lib/database";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
      const user = registerCustomer(name, email, password);
      if (!user) {
        return NextResponse.json(
          { error: "Email sudah terdaftar." },
          { status: 409 },
        );
      }
      return NextResponse.json({ user }, { status: 201 });
    }

    if (body.action === "login") {
      const user = authenticateCustomer(email, password);
      if (!user) {
        return NextResponse.json(
          { error: "Email atau password salah." },
          { status: 401 },
        );
      }
      return NextResponse.json({ user });
    }

    return NextResponse.json({ error: "Aksi autentikasi tidak valid." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: "Server gagal memproses autentikasi." },
      { status: 500 },
    );
  }
}