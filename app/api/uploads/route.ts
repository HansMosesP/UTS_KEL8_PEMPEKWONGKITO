import { NextResponse } from "next/server";
import { saveUpload } from "../../../lib/database";
import { jsonError, requireUser } from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;

/** Tentukan jenis gambar dari isi file (bukan dari nama/header yang bisa dipalsukan). */
function detectImageType(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP")
    return "image/webp";
  return null;
}

/** Upload satu gambar (isi body = file mentah) — hanya admin. */
export async function POST(request: Request) {
  const { response } = await requireUser("admin");
  if (response) return response;
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES)
    return jsonError("Ukuran gambar maksimal 2MB.", 413);
  const bytes = Buffer.from(await request.arrayBuffer());
  if (!bytes.length) return jsonError("File gambar kosong.", 400);
  if (bytes.length > MAX_BYTES) return jsonError("Ukuran gambar maksimal 2MB.", 413);
  const mime = detectImageType(bytes);
  if (!mime) return jsonError("Format gambar harus JPG, PNG, WEBP, atau GIF.", 415);
  try {
    const id = await saveUpload(mime, bytes);
    return NextResponse.json({ url: `/api/uploads/${id}` }, { status: 201 });
  } catch {
    return jsonError("Gagal menyimpan gambar.", 500);
  }
}
