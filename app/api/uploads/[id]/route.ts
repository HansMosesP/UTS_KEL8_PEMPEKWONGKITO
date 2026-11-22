import { NextResponse } from "next/server";
import { getUpload } from "../../../../lib/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Tampilkan gambar hasil upload admin. Publik, karena dipakai di halaman utama. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = /^[a-f0-9]{32}$/.test(id) ? await getUpload(id) : null;
  if (!file) return new NextResponse("Gambar tidak ditemukan.", { status: 404 });
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mime,
      // ID baru dibuat setiap upload, jadi isi file tidak pernah berubah.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
