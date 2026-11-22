"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { RotateCcw, Save } from "lucide-react";
import Swal from "sweetalert2";
import { SITE_TEXT_DEFAULTS, SITE_TEXT_FIELDS } from "../../lib/defaults";
import type { SiteTexts } from "../../lib/types";
import { confirmDanger, toastSuccess } from "./shared";

const GROUPS = [...new Set(SITE_TEXT_FIELDS.map((field) => field.group))];

export default function TextEditor({
  savedTexts,
  initialGroup = "all",
  onSave,
}: {
  savedTexts: SiteTexts;
  initialGroup?: string;
  onSave: (texts: SiteTexts) => Promise<boolean>;
}) {
  const [group, setGroup] = useState(initialGroup);
  const [draft, setDraft] = useState<SiteTexts>(savedTexts);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sinkron dari server hanya jika admin tidak sedang mengedit
  // (agar refresh otomatis tidak menghapus ketikan).
  useEffect(() => {
    if (!dirty) setDraft(savedTexts);
  }, [savedTexts, dirty]);
  useEffect(() => setGroup(initialGroup), [initialGroup]);

  const handleChange = (key: string, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const persist = async (texts: SiteTexts, message: string) => {
    setBusy(true);
    const ok = await onSave(texts);
    setBusy(false);
    if (ok) {
      setDirty(false);
      toastSuccess(message);
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const words = (draft["hero.typingWords"] ?? SITE_TEXT_DEFAULTS["hero.typingWords"])
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
    if (!words.length) {
      void Swal.fire({ icon: "warning", title: "Teks berjalan minimal berisi 1 kata" });
      return;
    }
    // Simpan hanya teks yang berbeda dari bawaan & masih dipakai.
    const compact = Object.fromEntries(
      Object.entries(draft).filter(
        ([key, value]) => key in SITE_TEXT_DEFAULTS && value !== SITE_TEXT_DEFAULTS[key],
      ),
    );
    await persist(compact, "Teks website berhasil disimpan");
  };

  const resetAll = async () => {
    if (!(await confirmDanger("Kembalikan semua teks?", "Semua teks website akan kembali seperti semula.")))
      return;
    setDraft({});
    await persist({}, "Semua teks dikembalikan ke awal");
  };

  return (
    <section className="tab-content active">
      <div className="card">
        <h2>Edit Teks Website</h2>
        <p className="texts-intro">
          Ubah tulisan yang tampil di halaman utama tanpa menyentuh kode. Klik <strong>Simpan Perubahan</strong>{" "}
          untuk menerapkan. Daftar seperti FAQ, anatomi, dan keunggulan diatur di tab <strong>Konten Halaman</strong>.
        </p>
        <div className="texts-toolbar">
          <Link href="/" target="_blank" className="btn-view-site">
            🌐 Lihat Website
          </Link>
          <button type="button" className="btn-reset-all btn btn-outline-danger" onClick={() => void resetAll()}>
            <RotateCcw size={15} /> Kembalikan Semua ke Awal
          </button>
        </div>
        <div className="filter-row">
          {["all", ...GROUPS].map((item) => (
            <button
              type="button"
              className={`filter-btn btn btn-sm ${group === item ? "active btn-primary" : "btn-outline-secondary"}`}
              key={item}
              onClick={() => setGroup(item)}
            >
              {item === "all" ? "Semua Bagian" : item}
            </button>
          ))}
        </div>
        <form onSubmit={save}>
          <div className="texts-fields">
            {GROUPS.filter((item) => group === "all" || group === item).map((item) => (
              <div className="text-group" key={item}>
                <h3 className="text-group-title">{item}</h3>
                {SITE_TEXT_FIELDS.filter((field) => field.group === item).map((field) => {
                  const value = draft[field.key] ?? field.default;
                  const changed = value !== field.default;
                  return (
                    <div className={`text-field ${changed ? "changed" : ""}`} key={field.key}>
                      <div className="text-field-head">
                        <label className="edit-label" htmlFor={field.key}>
                          {field.label}
                        </label>
                        {changed && <span className="text-field-badge">diubah</span>}
                        <button
                          type="button"
                          className="btn-reset-field btn btn-sm btn-outline-secondary"
                          title="Kembalikan ke teks awal"
                          onClick={() => handleChange(field.key, field.default)}
                        >
                          ↺ Awal
                        </button>
                      </div>
                      {field.multiline ? (
                        <textarea
                          className="form-control"
                          id={field.key}
                          rows={3}
                          value={value}
                          onChange={(event) => handleChange(field.key, event.target.value)}
                        />
                      ) : (
                        <input
                          className="form-control"
                          id={field.key}
                          value={value}
                          onChange={(event) => handleChange(field.key, event.target.value)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="texts-savebar">
            <span className="texts-dirty">{dirty ? "● Ada perubahan yang belum disimpan" : ""}</span>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              <Save size={15} /> {busy ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
