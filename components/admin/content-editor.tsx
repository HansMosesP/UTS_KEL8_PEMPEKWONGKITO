"use client";

import {
  DEFAULT_ANATOMY,
  DEFAULT_FAQS,
  DEFAULT_FEATURES,
  DEFAULT_TESTIMONIALS,
} from "../../lib/defaults";
import { useStore } from "../../lib/store";
import type { AnatomyItem, FaqItem, FeatureItem, Testimonial } from "../../lib/types";
import ListEditor from "./list-editor";

const SECTIONS = [
  ["edit-anatomi", "Anatomi"],
  ["edit-keunggulan", "Keunggulan"],
  ["edit-testimoni", "Testimoni"],
  ["edit-faq", "FAQ"],
] as const;

/** Semua daftar isi halaman utama, urut sesuai posisi di website. */
export default function ContentEditor() {
  const { anatomy, features, testimonials, faqs, saveContent } = useStore();
  return (
    <section className="tab-content active">
      <nav className="section-jump" aria-label="Lompat ke bagian">
        {SECTIONS.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>
      <ListEditor<AnatomyItem>
        id="edit-anatomi"
        title="Anatomi Pempek"
        description="Lapisan yang bisa diklik pengunjung di bagian Anatomi. Judul & pengantar bagian ini ada di Edit Teks Website → Anatomi."
        itemLabel="Lapisan"
        items={anatomy}
        defaults={DEFAULT_ANATOMY}
        maxItems={20}
        blank={() => ({ title: "", desc: "", tag: "" })}
        fields={[
          { key: "title", label: "Nama lapisan", required: true, maxLength: 120, placeholder: "Contoh: Isian Telur" },
          { key: "desc", label: "Penjelasan", required: true, multiline: true, maxLength: 1000 },
          { key: "tag", label: "Label singkat", maxLength: 80, placeholder: "Contoh: Isian khas" },
        ]}
        onSave={(items) => saveContent("anatomyData", items)}
      />
      <ListEditor<FeatureItem>
        id="edit-keunggulan"
        title="Kartu Keunggulan"
        description="Kartu di bagian “Kenapa Wong Kito?”. Judul & subjudul bagian ini ada di Edit Teks Website → Keunggulan."
        itemLabel="Kartu"
        items={features}
        defaults={DEFAULT_FEATURES}
        maxItems={12}
        blank={() => ({ img: "", title: "", desc: "" })}
        fields={[
          { key: "img", label: "Foto", type: "image", required: true },
          { key: "title", label: "Judul", required: true, maxLength: 120 },
          { key: "desc", label: "Deskripsi", required: true, multiline: true, maxLength: 1000 },
        ]}
        onSave={(items) => saveContent("featureData", items)}
      />
      <ListEditor<Testimonial>
        id="edit-testimoni"
        title="Testimoni"
        description="Ulasan pelanggan yang tampil di halaman utama."
        itemLabel="Testimoni"
        items={testimonials}
        defaults={DEFAULT_TESTIMONIALS}
        maxItems={12}
        blank={() => ({ text: "", name: "", city: "", rating: 5 })}
        fields={[
          { key: "text", label: "Isi testimoni", required: true, multiline: true, maxLength: 1000 },
          { key: "name", label: "Nama", required: true, maxLength: 80 },
          { key: "city", label: "Kota", maxLength: 80 },
          { key: "rating", label: "Rating", type: "rating" },
        ]}
        onSave={(items) => saveContent("testimoniData", items)}
      />
      <ListEditor<FaqItem>
        id="edit-faq"
        title="FAQ"
        description="Daftar pertanyaan yang sering ditanyakan. Gunakan + untuk menambah dan − untuk menghapus."
        itemLabel="Pertanyaan"
        items={faqs}
        defaults={DEFAULT_FAQS}
        blank={() => ({ question: "", answer: "" })}
        fields={[
          { key: "question", label: "Pertanyaan", required: true, maxLength: 300, placeholder: "Contoh: Apakah bisa dikirim ke luar kota?" },
          { key: "answer", label: "Jawaban", required: true, multiline: true, maxLength: 2000 },
        ]}
        onSave={(items) => saveContent("faqData", items)}
      />
    </section>
  );
}
