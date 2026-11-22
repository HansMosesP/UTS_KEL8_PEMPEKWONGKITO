"use client";

import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import type { MenuItem } from "../../lib/types";
import { confirmDanger, IMAGE_ACCEPT, money, newId, toastSuccess, uploadImage } from "./shared";

export default function MenuManager({
  menu,
  onSave,
}: {
  menu: MenuItem[];
  onSave: (items: MenuItem[]) => Promise<boolean>;
}) {
  const [photo, setPhoto] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pickPhoto = async (input: HTMLInputElement) => {
    setUploading(true);
    const url = await uploadImage(input.files?.[0]);
    setUploading(false);
    input.value = "";
    return url;
  };

  const addMenu = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const price = Number(data.get("price"));
    if (!name || !Number.isFinite(price) || price <= 0) return;
    setBusy(true);
    const ok = await onSave([
      ...menu,
      {
        id: newId(),
        name,
        price: Math.round(price),
        desc: String(data.get("desc") ?? "").trim(),
        img: photo || "/image/Pempek_palembang.jpg",
      },
    ]);
    setBusy(false);
    if (!ok) return;
    form.reset();
    setPhoto("");
    toastSuccess("Menu berhasil ditambahkan");
  };

  const deleteMenu = async (item: MenuItem) => {
    if (!(await confirmDanger(`Hapus "${item.name}"?`, "Menu akan dihapus dari daftar.")))
      return;
    if (await onSave(menu.filter((entry) => entry.id !== item.id))) toastSuccess("Menu dihapus");
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    const updated = {
      ...editing,
      name: String(data.get("name")).trim(),
      price: Math.round(Number(data.get("price"))),
      desc: String(data.get("desc")).trim(),
    };
    if (!updated.name || !(updated.price > 0)) return;
    setBusy(true);
    const ok = await onSave(menu.map((item) => (item.id === updated.id ? updated : item)));
    setBusy(false);
    if (ok) {
      setEditing(null);
      toastSuccess("Menu diperbarui");
    }
  };

  return (
    <section className="tab-content active">
      <div className="card">
        <h2>Tambah Menu Baru</h2>
        <form className="menu-create-form" onSubmit={addMenu}>
          <input className="form-control" name="name" placeholder="Nama Menu" maxLength={120} required />
          <input
            className="form-control"
            name="price"
            type="number"
            min="1"
            step="500"
            placeholder="Harga (contoh: 15000)"
            required
          />
          <input className="form-control" name="desc" placeholder="Deskripsi (opsional)" maxLength={1000} />
          <label className="file-label">
            <span>{uploading ? "Mengunggah..." : "📷 Pilih Foto Menu"}</span>
            <input
              className="form-control"
              type="file"
              accept={IMAGE_ACCEPT}
              disabled={uploading}
              onChange={async (event) => {
                const image = await pickPhoto(event.currentTarget);
                if (image) setPhoto(image);
              }}
            />
          </label>
          {photo && (
            <div className="preview-wrap">
              <img src={photo} alt="Pratinjau menu baru" />
            </div>
          )}
          <button type="submit" className="btn-primary btn" disabled={busy || uploading}>
            {busy ? "Menyimpan..." : "Tambah Menu"}
          </button>
        </form>
      </div>
      <div className="card">
        <h2>Kelola Menu ({menu.length})</h2>
        <div className="admin-menu">
          {menu.length ? (
            menu.map((item) => (
              <article className="admin-menu-item" key={item.id}>
                <img src={item.img} alt={item.name} />
                <div className="admin-menu-info">
                  <h4>{item.name}</h4>
                  <p>{item.desc || "-"}</p>
                  <strong>{money(item.price)}</strong>
                </div>
                <div className="admin-menu-actions">
                  <button className="btn-edit btn btn-outline-secondary" onClick={() => setEditing(item)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="btn-delete btn btn-outline-danger" onClick={() => void deleteMenu(item)}>
                    Hapus
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="admin-empty">Belum ada menu.</p>
          )}
        </div>
      </div>
      {editing && (
        <div
          className="edit-modal show"
          onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}
        >
          <form className="edit-box" onSubmit={saveEdit} key={editing.id}>
            <button type="button" className="edit-close" onClick={() => setEditing(null)} aria-label="Tutup">
              ×
            </button>
            <h3>Edit Menu</h3>
            <p className="edit-sub">Ubah data menu sesuai kebutuhan.</p>
            <label className="edit-label">Foto Menu</label>
            <div className="edit-photo">
              <img src={editing.img} alt={`Pratinjau ${editing.name}`} />
              <label className="edit-photo-btn">
                <span>{uploading ? "Mengunggah..." : "📷 Ganti Foto"}</span>
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  disabled={uploading}
                  onChange={async (event) => {
                    const image = await pickPhoto(event.currentTarget);
                    if (image) setEditing((current) => (current ? { ...current, img: image } : current));
                  }}
                />
              </label>
            </div>
            <label className="edit-label" htmlFor="edit-name">Nama Menu</label>
            <input id="edit-name" className="form-control" name="name" defaultValue={editing.name} required />
            <label className="edit-label" htmlFor="edit-price">Harga (Rp)</label>
            <input
              id="edit-price"
              className="form-control"
              name="price"
              type="number"
              min="1"
              defaultValue={editing.price}
              required
            />
            <label className="edit-label" htmlFor="edit-desc">Deskripsi</label>
            <textarea id="edit-desc" className="form-control" name="desc" defaultValue={editing.desc} />
            <div className="edit-actions">
              <button
                type="button"
                className="btn-cancel-edit btn btn-outline-secondary"
                onClick={() => setEditing(null)}
              >
                Batal
              </button>
              <button className="btn-save-edit btn btn-primary" type="submit" disabled={busy || uploading}>
                {busy ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
