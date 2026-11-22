"use client";

import { useState } from "react";
import { IMAGE_ACCEPT, uploadImage } from "./shared";

const PLACEHOLDER = "/image/Pempek_palembang.jpg";

/** Pratinjau gambar + tombol ganti. Gambar langsung diunggah saat dipilih. */
export default function ImageInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  return (
    <div className="image-input">
      {value ? (
        <img
          src={value}
          alt="Pratinjau"
          className="image-input-preview"
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER;
          }}
        />
      ) : (
        <div className="image-input-preview image-input-empty">Belum ada gambar</div>
      )}
      <div className="image-input-actions">
        <label className="edit-photo-btn" aria-disabled={uploading}>
          <span>{uploading ? "Mengunggah..." : value ? "📷 Ganti Gambar" : "📷 Pilih Gambar"}</span>
          <input
            id={id}
            type="file"
            accept={IMAGE_ACCEPT}
            disabled={uploading}
            onChange={async (event) => {
              const input = event.currentTarget;
              setUploading(true);
              const url = await uploadImage(input.files?.[0]);
              setUploading(false);
              input.value = "";
              if (url) onChange(url);
            }}
          />
        </label>
        <small>JPG, PNG, WEBP, atau GIF · maks. 2MB</small>
      </div>
    </div>
  );
}
