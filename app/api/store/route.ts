import { NextResponse } from "next/server";
import {
  CONTENT_KEYS,
  getNotifications,
  getOrders,
  getPublicContent,
  getUsers,
  saveContent,
} from "../../../lib/database";
import { isImageRef, isSafeMapUrl, SITE_IMAGE_FIELDS } from "../../../lib/defaults";
import { getSessionState, jsonError, requireUser } from "../../../lib/session";
import type { ContentKey } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pengunjung umum hanya menerima konten publik + keranjangnya sendiri.
 * Customer menerima pesanan miliknya sendiri.
 * Admin menerima semua pesanan, daftar user, dan notifikasi.
 */
async function snapshot() {
  const [{ user, cart }, content, orders] = await Promise.all([
    getSessionState(),
    getPublicContent(),
    getOrders(),
  ]);
  const isAdmin = user?.role === "admin";
  const [usersData, adminNotifs] = isAdmin
    ? await Promise.all([getUsers(), getNotifications()])
    : [[], []];
  return {
    user,
    cart,
    store: {
      ...content,
      ordersData: isAdmin
        ? orders
        : user
          ? orders.filter((order) => order.userEmail === user.email)
          : [],
      usersData,
      adminNotifs,
    },
  };
}

export async function GET() {
  try {
    return NextResponse.json(await snapshot(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to read PostgreSQL store.", error);
    return jsonError("Gagal membaca data dari PostgreSQL.", 500);
  }
}

const isText = (value: unknown, max = 5000) =>
  typeof value === "string" && value.length <= max;
const isId = (value: unknown) => typeof value === "number" && Number.isFinite(value);
const isFilled = (value: unknown, max: number) =>
  isText(value, max) && (value as string).trim().length > 0;
const isInt = (value: unknown, min: number, max: number) =>
  Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
/** Array berisi objek dengan id, panjang minItems..maxItems, dan tiap item lolos `check`. */
function isList(
  value: unknown,
  check: (item: Record<string, unknown>) => boolean,
  maxItems: number,
  minItems = 0,
) {
  return (
    Array.isArray(value) &&
    value.length >= minItems &&
    value.length <= maxItems &&
    value.every((item) => item && typeof item === "object" && isId(item.id) && check(item))
  );
}

function validate(key: ContentKey, value: unknown): string | null {
  switch (key) {
    case "menuData":
      return Array.isArray(value) &&
        value.every(
          (item) =>
            isId(item?.id) &&
            isText(item?.name, 120) &&
            item.name.trim() &&
            typeof item?.price === "number" &&
            item.price > 0 &&
            isText(item?.desc, 1000) &&
            isText(item?.img, 3_000_000),
        )
        ? null
        : "Data menu tidak valid.";
    case "siteTexts":
      return value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.values(value).every((text) => isText(text))
        ? null
        : "Teks website tidak valid.";
    case "faqData":
      return Array.isArray(value) &&
        value.every(
          (item) =>
            isId(item?.id) &&
            isText(item?.question, 300) &&
            item.question.trim() &&
            isText(item?.answer, 2000) &&
            item.answer.trim(),
        )
        ? null
        : "Pertanyaan dan jawaban FAQ wajib diisi.";
    case "testimoniData":
      return Array.isArray(value) &&
        value.every(
          (item) =>
            isId(item?.id) &&
            isText(item?.text, 1000) &&
            item.text.trim() &&
            isText(item?.name, 80) &&
            item.name.trim() &&
            isText(item?.city, 80) &&
            (item.rating === undefined || isInt(item.rating, 1, 5)),
        )
        ? null
        : "Isi dan nama testimoni wajib diisi, rating 1–5.";
    case "anatomyData":
      return isList(
        value,
        (item) => isFilled(item.title, 120) && isFilled(item.desc, 1000) && isText(item.tag, 80),
        20,
      )
        ? null
        : "Nama dan penjelasan setiap lapisan anatomi wajib diisi (maks. 20 lapisan).";
    case "featureData":
      return isList(
        value,
        (item) => isImageRef(item.img) && isFilled(item.title, 120) && isFilled(item.desc, 1000),
        12,
      )
        ? null
        : "Foto, judul, dan deskripsi setiap keunggulan wajib diisi (maks. 12 kartu).";
    case "galleryData":
      return isList(value, (item) => isImageRef(item.img) && isFilled(item.caption, 120), 24)
        ? null
        : "Setiap foto galeri wajib punya gambar dan keterangan (maks. 24 foto).";
    case "siteImages": {
      const images = value as Record<string, unknown> | null;
      return images &&
        typeof images === "object" &&
        SITE_IMAGE_FIELDS.every((field) => isImageRef(images[field.key]))
        ? null
        : "Gambar halaman tidak valid.";
    }
    case "shippingData":
      return isList(value, (item) => isFilled(item.name, 80) && isInt(item.fee, 0, 10_000_000), 50, 1)
        ? null
        : "Minimal 1 kota. Nama kota wajib diisi dan ongkir berupa angka 0–10.000.000.";
    case "paymentData":
      return isList(value, (item) => isFilled(item.name, 80), 20, 1)
        ? null
        : "Minimal 1 metode pembayaran dan namanya wajib diisi.";
    case "siteSettings": {
      const settings = value as Record<string, unknown> | null;
      if (!settings || typeof settings !== "object") return "Pengaturan tidak valid.";
      if (!isText(settings.mapEmbedUrl, 2000) || !isSafeMapUrl(settings.mapEmbedUrl as string))
        return "URL embed peta harus berasal dari Google Maps.";
      if (!isText(settings.mapLinkUrl, 2000) || !isSafeMapUrl(settings.mapLinkUrl as string))
        return "Link peta harus berasal dari Google Maps.";
      if (!isText(settings.whatsapp, 20) || !/^\d{8,15}$/.test(settings.whatsapp as string))
        return "Nomor WhatsApp harus 8–15 digit angka (contoh 6281234567890).";
      return null;
    }
  }
}

export async function PUT(request: Request) {
  try {
    const { response } = await requireUser("admin");
    if (response) return response;
    const body = (await request.json()) as { key?: string; value?: unknown };
    const key = body.key as ContentKey;
    if (!CONTENT_KEYS.includes(key) || !Object.hasOwn(body, "value"))
      return jsonError("Data tidak valid.", 400);
    const problem = validate(key, body.value);
    if (problem) return jsonError(problem, 400);
    await saveContent(key, body.value);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save PostgreSQL store value.", error);
    return jsonError("Gagal menyimpan data ke PostgreSQL.", 500);
  }
}
