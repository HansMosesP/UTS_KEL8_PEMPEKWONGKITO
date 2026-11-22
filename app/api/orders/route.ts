import { NextResponse } from "next/server";
import {
  createOrder,
  deleteOrder,
  OrderError,
  updateOrderStatus,
} from "../../../lib/database";
import { jsonError, requireUser, saveCart } from "../../../lib/session";
import type { CheckoutPayload, OrderStatus } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["pending", "process", "shipped", "done", "cancel"];

/** Buat pesanan — wajib login sebagai customer. */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;
  if (user.role !== "customer")
    return jsonError("Akun admin tidak dapat membuat pesanan.", 403);
  try {
    const body = (await request.json()) as Partial<CheckoutPayload>;
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").replace(/[^\d+]/g, "");
    const address = String(body.address ?? "").trim();
    const payment = String(body.payment ?? "");
    if (!name || name.length > 120) return jsonError("Nama penerima wajib diisi.", 400);
    if (!/^(\+62|62|0)8\d{7,12}$/.test(phone))
      return jsonError("Nomor HP tidak valid. Gunakan format 08xx.", 400);
    if (address.length < 10 || address.length > 500)
      return jsonError("Alamat terlalu pendek, isi dengan lengkap.", 400);
    if (!payment || payment.length > 80) return jsonError("Metode pembayaran tidak valid.", 400);
    if (!Array.isArray(body.items) || body.items.length > 50)
      return jsonError("Keranjang tidak valid.", 400);

    const order = await createOrder(user, {
      name,
      phone,
      address,
      payment,
      cityId: Number(body.cityId),
      items: body.items.map((item) => ({ id: Number(item?.id), qty: Number(item?.qty) })),
    });
    // Pesanan sudah tercatat → kosongkan keranjang yang tersimpan di sesi.
    await saveCart([]);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof OrderError) return jsonError(error.message, 400);
    console.error("Failed to create order.", error);
    return jsonError("Gagal menyimpan pesanan.", 500);
  }
}

/** Ubah status satu pesanan — admin. Tidak menimpa pesanan lain. */
export async function PATCH(request: Request) {
  const { response } = await requireUser("admin");
  if (response) return response;
  const body = (await request.json().catch(() => ({}))) as { id?: string; status?: OrderStatus };
  if (!body.id || !body.status || !STATUSES.includes(body.status))
    return jsonError("Data tidak valid.", 400);
  return (await updateOrderStatus(body.id, body.status))
    ? NextResponse.json({ ok: true })
    : jsonError("Pesanan tidak ditemukan.", 404);
}

export async function DELETE(request: Request) {
  const { response } = await requireUser("admin");
  if (response) return response;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("ID pesanan wajib diisi.", 400);
  return (await deleteOrder(id))
    ? NextResponse.json({ ok: true })
    : jsonError("Pesanan tidak ditemukan.", 404);
}
