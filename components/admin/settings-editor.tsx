"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MapPin, RotateCcw, Save } from "lucide-react";
import Swal from "sweetalert2";
import { DEFAULT_SETTINGS, resolveMapInput } from "../../lib/defaults";
import type { SiteSettings } from "../../lib/types";
import { toastSuccess } from "./shared";

export default function SettingsEditor({
  settings,
  onSave,
  onEditContactTexts,
}: {
  settings: SiteSettings;
  onSave: (settings: SiteSettings) => Promise<boolean>;
  onEditContactTexts: () => void;
}) {
  const [mapInput, setMapInput] = useState("");
  const [preview, setPreview] = useState(settings.mapEmbedUrl);
  const [linkUrl, setLinkUrl] = useState(settings.mapLinkUrl);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dirty =
    preview !== settings.mapEmbedUrl || linkUrl !== settings.mapLinkUrl || whatsapp !== settings.whatsapp;

  useEffect(() => {
    if (dirty) return;
    setPreview(settings.mapEmbedUrl);
    setLinkUrl(settings.mapLinkUrl);
    setWhatsapp(settings.whatsapp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const applyMap = () => {
    const resolved = resolveMapInput(mapInput);
    if (!resolved) {
      setError(
        "Input tidak dikenali. Masukkan alamat/nama tempat, link Google Maps, atau kode <iframe> dari Google Maps → Bagikan → Sematkan peta. Link pendek maps.app.goo.gl belum didukung.",
      );
      return;
    }
    setError("");
    setPreview(resolved.embedUrl);
    setLinkUrl(resolved.linkUrl);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phone = whatsapp.replace(/\D/g, "").replace(/^0/, "62");
    if (phone && !/^\d{8,15}$/.test(phone)) {
      void Swal.fire({ icon: "warning", title: "Nomor WhatsApp tidak valid", text: "Contoh: 6281234567890" });
      return;
    }
    setBusy(true);
    const ok = await onSave({ mapEmbedUrl: preview, mapLinkUrl: linkUrl, whatsapp: phone || DEFAULT_SETTINGS.whatsapp });
    setBusy(false);
    if (ok) {
      setWhatsapp(phone || DEFAULT_SETTINGS.whatsapp);
      setMapInput("");
      toastSuccess("Pengaturan lokasi tersimpan");
    }
  };

  return (
    <section className="tab-content active">
      <form className="card" onSubmit={save}>
        <h2>Peta Lokasi Toko</h2>
        <p className="texts-intro">
          Ketik alamat atau nama tempat, <strong>atau</strong> tempel link Google Maps / kode{" "}
          <code>&lt;iframe&gt;</code> dari menu <em>Bagikan → Sematkan peta</em>, lalu klik{" "}
          <strong>Terapkan</strong> untuk melihat pratinjau.
        </p>
        <label className="edit-label" htmlFor="map-input">
          Alamat / Link / Kode Embed
        </label>
        <div className="map-input-row">
          <textarea
            id="map-input"
            className="form-control"
            rows={2}
            value={mapInput}
            placeholder='Contoh: Jl. Merdeka No. 123 Palembang  —atau—  <iframe src="https://www.google.com/maps/embed?pb=..."></iframe>'
            onChange={(event) => setMapInput(event.target.value)}
          />
          <button type="button" className="btn btn-outline-secondary" onClick={applyMap} disabled={!mapInput.trim()}>
            <MapPin size={15} /> Terapkan
          </button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="map-preview">
          <iframe title="Pratinjau peta" src={preview} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <label className="edit-label" htmlFor="map-link">
          Link tombol &quot;Buka Google Maps&quot;
        </label>
        <input id="map-link" className="form-control" value={linkUrl} readOnly />

        <h2 className="mt-4">Kontak WhatsApp</h2>
        <label className="edit-label" htmlFor="wa-number">
          Nomor WhatsApp (untuk tombol &quot;Chat WhatsApp&quot;)
        </label>
        <input
          id="wa-number"
          className="form-control"
          inputMode="tel"
          value={whatsapp}
          placeholder="6281234567890"
          onChange={(event) => setWhatsapp(event.target.value)}
        />
        <p className="text-field-hint">
          Alamat, jam buka, dan nomor telepon yang tampil di halaman diatur di{" "}
          <button type="button" className="link-btn" onClick={onEditContactTexts}>
            Edit Teks Website → Lokasi &amp; Kontak
          </button>
          .
        </p>
        <div className="texts-savebar">
          <span className="texts-dirty">{dirty ? "● Ada perubahan yang belum disimpan" : ""}</span>
          <div className="savebar-actions">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => {
                setPreview(DEFAULT_SETTINGS.mapEmbedUrl);
                setLinkUrl(DEFAULT_SETTINGS.mapLinkUrl);
                setWhatsapp(DEFAULT_SETTINGS.whatsapp);
              }}
            >
              <RotateCcw size={14} /> Bawaan
            </button>
            <button type="submit" className="btn btn-primary" disabled={!dirty || busy}>
              <Save size={15} /> {busy ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
