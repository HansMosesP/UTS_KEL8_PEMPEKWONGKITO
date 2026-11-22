"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Minus, Plus, RotateCcw, Save } from "lucide-react";
import Swal from "sweetalert2";
import ImageInput from "./image-input";
import { confirmDanger, newId, toastSuccess } from "./shared";

export type ListField<T> = {
  key: keyof T & string;
  label: string;
  /** text (bawaan) | textarea | number (angka bulat) | rating (1–5 bintang) | image (upload gambar) */
  type?: "text" | "textarea" | "number" | "rating" | "image";
  placeholder?: string;
  /** Sama dengan type: "textarea" (dipertahankan untuk kode lama). */
  multiline?: boolean;
  required?: boolean;
  maxLength?: number;
  /** Batas nilai untuk type "number". */
  min?: number;
  max?: number;
  hint?: string;
};

const kindOf = <T,>(field: ListField<T>) => field.type ?? (field.multiline ? "textarea" : "text");
const isNumeric = <T,>(field: ListField<T>) => ["number", "rating"].includes(kindOf(field));

/**
 * Editor list generik: tombol (+) menambah item, (−) menghapus item,
 * panah untuk mengubah urutan. Perubahan baru tersimpan setelah klik Simpan.
 * Dipakai untuk FAQ, testimoni, anatomi, keunggulan, galeri, ongkir, dan pembayaran.
 */
export default function ListEditor<T extends { id: number }>({
  id,
  title,
  description,
  itemLabel,
  items,
  defaults,
  fields,
  blank,
  minItems = 0,
  maxItems = 30,
  onSave,
}: {
  /** id HTML untuk tautan "lompat ke". */
  id?: string;
  title: string;
  description: string;
  itemLabel: string;
  items: T[];
  defaults: T[];
  fields: ListField<T>[];
  blank: () => Omit<T, "id">;
  minItems?: number;
  maxItems?: number;
  onSave: (items: T[]) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState<T[]>(items);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!dirty) setDraft(items);
  }, [items, dirty]);

  const change = (next: T[]) => {
    setDraft(next);
    setDirty(true);
  };
  const update = (id: number, key: keyof T, value: string | number) =>
    change(draft.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  const add = (afterIndex?: number) => {
    if (draft.length >= maxItems) return;
    const item = { ...blank(), id: newId() } as T;
    const index = afterIndex === undefined ? draft.length : afterIndex + 1;
    change([...draft.slice(0, index), item, ...draft.slice(index)]);
    // Fokus ke input pertama item baru.
    window.setTimeout(() => document.getElementById(`${item.id}-${fields[0].key}`)?.focus(), 30);
  };
  const remove = async (item: T, index: number) => {
    if (draft.length <= minItems) return;
    const isEmpty = fields
      .filter((field) => !isNumeric(field))
      .every((field) => !String(item[field.key] ?? "").trim());
    if (!isEmpty && !(await confirmDanger(`Hapus ${itemLabel} #${index + 1}?`))) return;
    change(draft.filter((entry) => entry.id !== item.id));
  };
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= draft.length) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    change(next);
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = draft.map((item) => {
      const copy = { ...item } as Record<string, unknown>;
      fields.forEach((field) => {
        const raw = item[field.key];
        copy[field.key] = isNumeric(field)
          ? raw === "" || raw === null || raw === undefined
            ? Number.NaN
            : Math.round(Number(raw))
          : String(raw ?? "").trim();
      });
      return copy as T;
    });
    const problem = findProblem(cleaned, fields, itemLabel, minItems);
    if (problem) {
      void Swal.fire({ icon: "warning", title: problem.title, text: problem.text });
      return;
    }
    setBusy(true);
    const ok = await onSave(cleaned);
    setBusy(false);
    if (ok) {
      setDirty(false);
      toastSuccess(`${title} berhasil disimpan`);
    }
  };

  const discard = () => {
    setDraft(items);
    setDirty(false);
  };
  const resetDefault = async () => {
    if (!(await confirmDanger(`Kembalikan ${title} ke bawaan?`, "Daftar saat ini akan diganti isi awal.")))
      return;
    change(defaults.map((item) => ({ ...item })));
  };

  return (
    <div className="card list-editor" id={id}>
      <h2>
        {title} <span className="list-count">{draft.length} item</span>
      </h2>
      <p className="texts-intro">{description}</p>
      <form onSubmit={save}>
        {draft.length === 0 && (
          <p className="admin-empty">Belum ada {itemLabel.toLowerCase()}. Klik tombol + untuk menambah.</p>
        )}
        <ol className="list-editor-items">
          {draft.map((item, index) => (
            <li className="list-editor-item" key={item.id}>
              <div className="list-editor-head">
                <span className="list-editor-number">
                  {itemLabel} #{index + 1}
                </span>
                <div className="list-editor-actions">
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Naikkan ${itemLabel} #${index + 1}`}
                    title="Naikkan"
                  >
                    <ArrowUp size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => move(index, 1)}
                    disabled={index === draft.length - 1}
                    aria-label={`Turunkan ${itemLabel} #${index + 1}`}
                    title="Turunkan"
                  >
                    <ArrowDown size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon add"
                    onClick={() => add(index)}
                    disabled={draft.length >= maxItems}
                    aria-label={`Tambah ${itemLabel} setelah #${index + 1}`}
                    title="Tambah di bawah ini"
                  >
                    <Plus size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon remove"
                    onClick={() => void remove(item, index)}
                    disabled={draft.length <= minItems}
                    aria-label={`Hapus ${itemLabel} #${index + 1}`}
                    title="Hapus"
                  >
                    <Minus size={15} />
                  </button>
                </div>
              </div>
              {fields.map((field) => {
                const inputId = `${item.id}-${field.key}`;
                const raw = item[field.key];
                // NaN dipakai sebagai "belum diisi" pada kolom angka item baru.
                const value = typeof raw === "number" && !Number.isFinite(raw) ? "" : String(raw ?? "");
                const onChange = (next: string | number) => update(item.id, field.key, next);
                const kind = kindOf(field);
                return (
                  <div className="list-editor-field" key={field.key}>
                    <label className="edit-label" htmlFor={inputId}>
                      {field.label}
                      {(field.required || isNumeric(field)) && <span className="required">*</span>}
                    </label>
                    {kind === "textarea" ? (
                      <textarea
                        id={inputId}
                        className="form-control"
                        rows={3}
                        value={value}
                        placeholder={field.placeholder}
                        maxLength={field.maxLength}
                        onChange={(event) => onChange(event.target.value)}
                      />
                    ) : kind === "image" ? (
                      <ImageInput id={inputId} value={value} onChange={onChange} />
                    ) : kind === "rating" ? (
                      <select
                        id={inputId}
                        className="form-select list-editor-select"
                        value={value || "5"}
                        onChange={(event) => onChange(Number(event.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <option key={stars} value={stars}>
                            {"★".repeat(stars) + "☆".repeat(5 - stars)} ({stars})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={inputId}
                        className="form-control"
                        type={kind === "number" ? "number" : "text"}
                        inputMode={kind === "number" ? "numeric" : undefined}
                        min={field.min}
                        max={field.max}
                        value={value}
                        placeholder={field.placeholder}
                        maxLength={kind === "number" ? undefined : field.maxLength}
                        onChange={(event) => onChange(event.target.value)}
                      />
                    )}
                    {field.hint && <p className="text-field-hint list-editor-hint">{field.hint}</p>}
                  </div>
                );
              })}
            </li>
          ))}
        </ol>
        <button
          type="button"
          className="btn-add-item"
          onClick={() => add()}
          disabled={draft.length >= maxItems}
        >
          <Plus size={16} /> Tambah {itemLabel}
        </button>
        <div className="texts-savebar">
          <span className="texts-dirty">{dirty ? "● Ada perubahan yang belum disimpan" : ""}</span>
          <div className="savebar-actions">
            <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => void resetDefault()}>
              <RotateCcw size={14} /> Isi Bawaan
            </button>
            {dirty && (
              <button type="button" className="btn btn-outline-secondary" onClick={discard}>
                Batalkan
              </button>
            )}
            <button type="submit" className="btn btn-primary" disabled={!dirty || busy}>
              <Save size={15} /> {busy ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/** Cari kolom pertama yang belum valid, untuk ditampilkan ke admin. */
function findProblem<T extends { id: number }>(
  items: T[],
  fields: ListField<T>[],
  itemLabel: string,
  minItems: number,
): { title: string; text: string } | null {
  if (items.length < minItems)
    return { title: `Minimal ${minItems} ${itemLabel.toLowerCase()}`, text: "Tambahkan item sebelum menyimpan." };
  for (const [index, item] of items.entries()) {
    for (const field of fields) {
      const value = item[field.key] as unknown;
      const title = `${itemLabel} #${index + 1} belum lengkap`;
      if (isNumeric(field)) {
        const number = value as number;
        const min = kindOf(field) === "rating" ? 1 : field.min;
        const max = kindOf(field) === "rating" ? 5 : field.max;
        if (!Number.isFinite(number) || (min !== undefined && number < min) || (max !== undefined && number > max)) {
          const range =
            min !== undefined && max !== undefined
              ? ` antara ${min.toLocaleString("id-ID")}–${max.toLocaleString("id-ID")}`
              : "";
          return { title, text: `"${field.label}" harus diisi angka${range}.` };
        }
      } else if (field.required && !String(value ?? "").trim()) {
        return { title, text: `"${field.label}" wajib diisi, atau hapus item tersebut.` };
      }
    }
  }
  return null;
}
