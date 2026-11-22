import Swal from "sweetalert2";
import type { OrderStatus } from "../../lib/types";

export const statuses: { key: OrderStatus; label: string; className: string }[] = [
  { key: "pending", label: "Menunggu", className: "status-pending" },
  { key: "process", label: "Diproses", className: "status-process" },
  { key: "shipped", label: "Dikirim", className: "status-shipped" },
  { key: "done", label: "Selesai", className: "status-done" },
  { key: "cancel", label: "Dibatalkan", className: "status-cancel" },
];

export const statusOf = (key: OrderStatus) =>
  statuses.find((status) => status.key === key) ?? statuses[0];

export const money = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

export const toastSuccess = (title: string) =>
  void Swal.fire({
    toast: true,
    position: "top-end",
    timer: 2000,
    showConfirmButton: false,
    icon: "success",
    title,
  });

export async function confirmDanger(title: string, text?: string) {
  const result = await Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: "Ya, Lanjutkan",
    cancelButtonText: "Batal",
    confirmButtonColor: "#a63b1c",
  });
  return result.isConfirmed;
}

/** ID unik sederhana untuk item baru di list (FAQ, testimoni, menu). */
export const newId = () => Date.now() + Math.floor(Math.random() * 1000);

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/**
 * Upload gambar ke server (/api/uploads) lalu kembalikan URL-nya.
 * Gambar disimpan terpisah dari data konten supaya halaman tetap ringan.
 */
export async function uploadImage(file: File | undefined): Promise<string | null> {
  if (!file) return null;
  if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
    void Swal.fire({ icon: "error", title: "Format tidak didukung", text: "Gunakan gambar JPG, PNG, WEBP, atau GIF." });
    return null;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    void Swal.fire({ icon: "error", title: "Gambar terlalu besar", text: "Ukuran gambar maksimal 2MB." });
    return null;
  }
  try {
    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!response.ok || !data.url) throw new Error(data.error ?? "Upload gagal.");
    return data.url;
  } catch (error) {
    void Swal.fire({
      icon: "error",
      title: "Gambar gagal diunggah",
      text: error instanceof Error ? error.message : "Coba lagi beberapa saat.",
    });
    return null;
  }
}
