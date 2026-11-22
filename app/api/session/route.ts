import { NextResponse } from "next/server";
import { jsonError, saveCart } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isCartLine = (item: unknown): item is { id: number; qty: number } => {
  const line = item as { id?: unknown; qty?: unknown } | null;
  return (
    Boolean(line) &&
    typeof line === "object" &&
    Number.isInteger(line!.id) &&
    Number.isInteger(line!.qty) &&
    (line!.qty as number) > 0 &&
    (line!.qty as number) <= 99
  );
};

/**
 * Simpan keranjang browser ini ke PostgreSQL (hanya id menu + jumlah;
 * nama & harga selalu diambil dari menu terbaru). Isi keranjang ikut
 * terbaca lagi lewat GET /api/store.
 */
export async function PUT(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { cart?: unknown };
  if (!Array.isArray(body.cart) || body.cart.length > 50 || !body.cart.every(isCartLine))
    return jsonError("Data keranjang tidak valid.", 400);
  try {
    await saveCart(body.cart.map(({ id, qty }) => ({ id, qty })));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save browser cart.", error);
    return jsonError("Gagal menyimpan keranjang ke PostgreSQL.", 500);
  }
}
