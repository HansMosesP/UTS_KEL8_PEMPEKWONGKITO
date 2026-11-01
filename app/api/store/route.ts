import { NextResponse } from "next/server";
import {
  getStoreSnapshot,
  importLegacyStore,
  isLegacyImported,
  saveStoreValue,
  WRITABLE_STORE_KEYS,
  type LegacyStore,
  type WritableStoreKey,
} from "../../../lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { store: getStoreSnapshot(), legacyImported: isLegacyImported() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { key?: string; value?: unknown };
    if (
      !body.key ||
      !WRITABLE_STORE_KEYS.includes(body.key as WritableStoreKey) ||
      !Object.hasOwn(body, "value")
    ) {
      return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
    }
    saveStoreValue(body.key as WritableStoreKey, body.value);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan data ke SQLite." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { legacy?: LegacyStore };
    if (!body.legacy || typeof body.legacy !== "object") {
      return NextResponse.json(
        { error: "Data migrasi tidak valid." },
        { status: 400 },
      );
    }
    importLegacyStore(body.legacy);
    return NextResponse.json(getStoreSnapshot());
  } catch {
    return NextResponse.json(
      { error: "Gagal memindahkan data lama ke SQLite." },
      { status: 500 },
    );
  }
}