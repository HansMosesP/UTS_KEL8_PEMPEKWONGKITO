"use client";

import { useEffect, useState, type FormEvent } from "react";
import { RotateCcw, Save } from "lucide-react";
import { DEFAULT_GALLERY, DEFAULT_IMAGES, SITE_IMAGE_FIELDS } from "../../lib/defaults";
import { useStore } from "../../lib/store";
import type { GalleryItem, SiteImages } from "../../lib/types";
import ImageInput from "./image-input";
import ListEditor from "./list-editor";
import { toastSuccess } from "./shared";

function SiteImagesForm() {
  const { images, saveContent } = useStore();
  const [draft, setDraft] = useState<SiteImages>(images);
  const [busy, setBusy] = useState(false);
  const dirty = SITE_IMAGE_FIELDS.some((field) => draft[field.key] !== images[field.key]);

  // Ikuti data server selama admin belum mengubah apa pun.
  useEffect(() => {
    if (!dirty) setDraft(images);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const ok = await saveContent("siteImages", draft);
    setBusy(false);
    if (ok) toastSuccess("Gambar halaman tersimpan");
  };

  return (
    <form className="card" onSubmit={save}>
      <h2>Gambar Halaman</h2>
      <p className="texts-intro">
        Ganti foto tetap di halaman utama. Gambar langsung diunggah saat dipilih, lalu klik <strong>Simpan</strong>{" "}
        untuk menampilkannya di website.
      </p>
      <div className="image-grid">
        {SITE_IMAGE_FIELDS.map((field) => (
          <div className="image-slot" key={field.key}>
            <label className="edit-label" htmlFor={`site-${field.key}`}>
              {field.label}
            </label>
            <ImageInput
              id={`site-${field.key}`}
              value={draft[field.key]}
              onChange={(url) => setDraft((current) => ({ ...current, [field.key]: url }))}
            />
            <p className="text-field-hint">{field.hint}</p>
          </div>
        ))}
      </div>
      <div className="texts-savebar">
        <span className="texts-dirty">{dirty ? "● Ada perubahan yang belum disimpan" : ""}</span>
        <div className="savebar-actions">
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setDraft(DEFAULT_IMAGES)}>
            <RotateCcw size={14} /> Bawaan
          </button>
          {dirty && (
            <button type="button" className="btn btn-outline-secondary" onClick={() => setDraft(images)}>
              Batalkan
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={!dirty || busy}>
            <Save size={15} /> {busy ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function MediaEditor() {
  const { gallery, saveContent } = useStore();
  return (
    <section className="tab-content active">
      <SiteImagesForm />
      <ListEditor<GalleryItem>
        title="Galeri"
        description="Foto di bagian Galeri. Foto pertama tampil paling besar. Judul galeri ada di Edit Teks Website → Galeri."
        itemLabel="Foto"
        items={gallery}
        defaults={DEFAULT_GALLERY}
        maxItems={24}
        blank={() => ({ img: "", caption: "" })}
        fields={[
          { key: "img", label: "Gambar", type: "image", required: true },
          {
            key: "caption",
            label: "Keterangan foto",
            required: true,
            maxLength: 120,
            placeholder: "Contoh: Pempek Kapal Selam",
            hint: "Dibaca oleh pembaca layar & mesin pencari.",
          },
        ]}
        onSave={(items) => saveContent("galleryData", items)}
      />
    </section>
  );
}
