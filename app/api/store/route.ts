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
  try {
    const [store, legacyImported] = await Promise.all([
      getStoreSnapshot(),
      isLegacyImported(),
    ]);
    return NextResponse.json(
      { store, legacyImported },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to read PostgreSQL store.", error);
    return NextResponse.json(
      { error: "Gagal membaca data dari PostgreSQL." },
      { status: 500 },
    );
  }
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
    await saveStoreValue(body.key as WritableStoreKey, body.value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save PostgreSQL store value.", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data ke PostgreSQL." },
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
    await importLegacyStore(body.legacy);
    return NextResponse.json(await getStoreSnapshot());
  } catch (error) {
    console.error("Failed to import legacy store into PostgreSQL.", error);
    return NextResponse.json(
      { error: "Gagal memindahkan data lama ke PostgreSQL." },
      { status: 500 },
    );
  }
}