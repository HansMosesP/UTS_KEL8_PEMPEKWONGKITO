const SITE_TEXT_FIELDS = [
  { key: "hero.eyebrow", group: "Hero (Bagian Atas)", label: "Teks kecil di atas judul", default: "Kuliner Khas Palembang" },
  { key: "hero.titlePrefix", group: "Hero (Bagian Atas)", label: "Judul — sebelum teks berjalan", default: "Pempek Asli" },
  { key: "hero.typingWords", group: "Hero (Bagian Atas)", label: "Teks berjalan (pisahkan dengan koma)", default: "Wong Kito, Khas Palembang, Rasa Juara, Sejak Dulu" },
  { key: "hero.titleSuffix", group: "Hero (Bagian Atas)", label: "Judul — setelah teks berjalan", default: ", Rasa yang Selalu Diingat" },
  { key: "hero.desc", group: "Hero (Bagian Atas)", label: "Deskripsi", multiline: true, default: "Berawal dari kecintaan pada rasa khas Palembang, Pempek Wong Kito menjaga resep tradisional dengan ikan tenggiri segar dan cuko yang khas." },
  { key: "hero.btnMenu", group: "Hero (Bagian Atas)", label: "Tombol 1", default: "Lihat Menu" },
  { key: "hero.btnAnatomi", group: "Hero (Bagian Atas)", label: "Tombol 2", default: "Kenali Lapisannya" },
  { key: "hero.stat1Value", group: "Hero (Bagian Atas)", label: "Statistik 1 — angka", default: "100%" },
  { key: "hero.stat1Label", group: "Hero (Bagian Atas)", label: "Statistik 1 — keterangan", default: "Ikan pilihan segar" },
  { key: "hero.stat2Value", group: "Hero (Bagian Atas)", label: "Statistik 2 — angka", default: "6+" },
  { key: "hero.stat2Label", group: "Hero (Bagian Atas)", label: "Statistik 2 — keterangan", default: "Varian pempek" },
  { key: "hero.stat3Value", group: "Hero (Bagian Atas)", label: "Statistik 3 — angka", default: "Sejak 1998" },
  { key: "hero.stat3Label", group: "Hero (Bagian Atas)", label: "Statistik 3 — keterangan", default: "Resep turun-temurun" },

  { key: "cerita.badge", group: "Cerita Kami", label: "Label", default: "Cerita Kami" },
  { key: "cerita.title", group: "Cerita Kami", label: "Judul", default: "Dari Sungai Musi ke Meja Makan Anda" },
  { key: "cerita.journeyFrom", group: "Cerita Kami", label: "Perjalanan — dari", default: "Dari Sungai Musi" },
  { key: "cerita.journeyTo", group: "Cerita Kami", label: "Perjalanan — ke", default: "ke Meja Anda" },
  { key: "cerita.lead", group: "Cerita Kami", label: "Paragraf pembuka", multiline: true, default: "Berawal dari kecintaan terhadap cita rasa Palembang, Wong Kito menghadirkan pempek dengan resep khas yang diwariskan dari generasi ke generasi." },
  { key: "cerita.p1", group: "Cerita Kami", label: "Paragraf 2", multiline: true, default: "Setiap pagi, ikan pilihan datang dari pasar, digiling dengan tangan, dibumbui dengan takaran yang sudah dihafal di luar kepala. Tidak ada jalan pintas — karena rasa asli memang tidak bisa dipalsukan." },
  { key: "cerita.p2", group: "Cerita Kami", label: "Paragraf 3", multiline: true, default: "Cuko kami direbus perlahan dengan gula aren asli, cabai, dan asam jawa. Rasa manis, asam, dan pedasnya seimbang — persis seperti yang disantap keluarga Palembang di tepian Sungai Musi sejak dulu." },
  { key: "cerita.signGreeting", group: "Cerita Kami", label: "Salam penutup", default: "Salam hangat," },
  { key: "cerita.signName", group: "Cerita Kami", label: "Nama penanda tangan", default: "Keluarga Wong Kito" },

  { key: "keunggulan.badge", group: "Keunggulan", label: "Label", default: "Keunggulan" },
  { key: "keunggulan.title", group: "Keunggulan", label: "Judul", default: "Kenapa Wong Kito?" },
  { key: "keunggulan.subtitle", group: "Keunggulan", label: "Subjudul", default: "Tiga alasan sederhana kenapa pelanggan balik lagi." },
  { key: "keunggulan.card1Title", group: "Keunggulan", label: "Kartu 1 — judul", default: "Ikan Pilihan" },
  { key: "keunggulan.card1Desc", group: "Keunggulan", label: "Kartu 1 — deskripsi", multiline: true, default: "Menggunakan ikan pilihan dengan tekstur lembut dan rasa gurih alami. Dipilih langsung setiap pagi sebelum matahari terbit." },
  { key: "keunggulan.card2Title", group: "Keunggulan", label: "Kartu 2 — judul", default: "Cuko Racikan Sendiri" },
  { key: "keunggulan.card2Desc", group: "Keunggulan", label: "Kartu 2 — deskripsi", multiline: true, default: "Rasa manis, asam, pedas khas Palembang. Direbus perlahan dengan gula aren asli, cabai rawit, dan asam jawa pilihan." },
  { key: "keunggulan.card3Title", group: "Keunggulan", label: "Kartu 3 — judul", default: "Dibuat Setiap Hari" },
  { key: "keunggulan.card3Desc", group: "Keunggulan", label: "Kartu 3 — deskripsi", multiline: true, default: "Diproduksi segar untuk menjaga rasa asli. Tidak ada stok lama, tidak ada bahan pengawet. Setiap gigitan baru dibuat pagi itu." },

  { key: "favorit.badge", group: "Favorit", label: "Label", default: "Favorit" },
  { key: "favorit.title", group: "Favorit", label: "Judul", default: "Favorit Wong Kito" },
  { key: "favorit.subtitle", group: "Favorit", label: "Subjudul", default: "Yang paling sering dipesan pelanggan setia kami." },
  { key: "favorit.tag", group: "Favorit", label: "Tag pada foto", default: "⭐ Best Seller" },
  { key: "favorit.name", group: "Favorit", label: "Nama menu", default: "Pempek Kapal Selam" },
  { key: "favorit.desc", group: "Favorit", label: "Deskripsi", multiline: true, default: "Pempek besar berisi telur ayam utuh, dibalut adonan ikan pilihan dengan tekstur kenyal lembut. Disajikan dengan cuko khas Palembang yang bikin nagih." },
  { key: "favorit.price", group: "Favorit", label: "Harga (teks)", default: "Rp 20.000" },
  { key: "favorit.button", group: "Favorit", label: "Tombol", default: "Pesan Sekarang" },

  { key: "menu.badge", group: "Menu", label: "Label", default: "Menu" },
  { key: "menu.title", group: "Menu", label: "Judul", default: "Semua Pilihan Pempek" },
  { key: "menu.subtitle", group: "Menu", label: "Subjudul", default: "Klik \"Pesan\" untuk menambah ke keranjang." },

  { key: "testimoni.badge", group: "Testimoni", label: "Label", default: "Cerita Pelanggan" },
  { key: "testimoni.title", group: "Testimoni", label: "Judul", default: "Kata Mereka" },
  { key: "testimoni.t1Text", group: "Testimoni", label: "Testimoni 1 — isi", multiline: true, default: "\"Rasa cukonya khas banget. Berasa makan pempek asli Palembang di rumah nenek dulu.\"" },
  { key: "testimoni.t1Name", group: "Testimoni", label: "Testimoni 1 — nama", default: "Dinda" },
  { key: "testimoni.t1City", group: "Testimoni", label: "Testimoni 1 — kota", default: "Palembang" },
  { key: "testimoni.t2Text", group: "Testimoni", label: "Testimoni 2 — isi", multiline: true, default: "\"Pempek kapal selamnya mantap. Telurnya utuh, ikannya berasa banget. Harga masih ramah.\"" },
  { key: "testimoni.t2Name", group: "Testimoni", label: "Testimoni 2 — nama", default: "Rizky" },
  { key: "testimoni.t2City", group: "Testimoni", label: "Testimoni 2 — kota", default: "Jakarta" },
  { key: "testimoni.t3Text", group: "Testimoni", label: "Testimoni 3 — isi", multiline: true, default: "\"Pesan buat acara keluarga, semua pada nanya beli di mana. Fresh dan rapi packing-nya.\"" },
  { key: "testimoni.t3Name", group: "Testimoni", label: "Testimoni 3 — nama", default: "Anisa" },
  { key: "testimoni.t3City", group: "Testimoni", label: "Testimoni 3 — kota", default: "Bandung" },

  { key: "galeri.badge", group: "Galeri", label: "Label", default: "Galeri" },
  { key: "galeri.title", group: "Galeri", label: "Judul", default: "Suasana Wong Kito" },
  { key: "galeri.subtitle", group: "Galeri", label: "Subjudul", default: "Sedikit cerita dari dapur kami." },

  { key: "lokasi.badge", group: "Lokasi & Kontak", label: "Label", default: "Lokasi" },
  { key: "lokasi.title", group: "Lokasi & Kontak", label: "Judul", default: "Temukan Wong Kito" },
  { key: "lokasi.subtitle", group: "Lokasi & Kontak", label: "Subjudul", default: "Mampir langsung, atau pesan antar ke rumah." },
  { key: "lokasi.address", group: "Lokasi & Kontak", label: "Alamat", multiline: true, default: "Jl. Merdeka No. 123, Ilir Barat I,\nPalembang, Sumatra Selatan 30131" },
  { key: "lokasi.hours", group: "Lokasi & Kontak", label: "Jam buka", multiline: true, default: "Setiap hari\n09.00 - 21.00 WIB" },
  { key: "lokasi.phone", group: "Lokasi & Kontak", label: "Telepon / WhatsApp", multiline: true, default: "(0711) 000-0000\n+62 812-3456-7890" },

  { key: "faq.badge", group: "FAQ", label: "Label", default: "FAQ" },
  { key: "faq.title", group: "FAQ", label: "Judul", default: "Pertanyaan yang Sering Ditanyakan" },
  { key: "faq.q1", group: "FAQ", label: "Pertanyaan 1", default: "Pempek kalian terbuat dari ikan apa?" },
  { key: "faq.a1", group: "FAQ", label: "Jawaban 1", multiline: true, default: "Pempek kita terbuat dari 100% ikan tenggiri asli, dipilih langsung setiap pagi." },
  { key: "faq.q2", group: "FAQ", label: "Pertanyaan 2", default: "Apakah pempeknya pakai bahan pengawet?" },
  { key: "faq.a2", group: "FAQ", label: "Jawaban 2", multiline: true, default: "Tidak, pempek kami dibuat tanpa bahan pengawet sama sekali." },
  { key: "faq.q3", group: "FAQ", label: "Pertanyaan 3", default: "Apakah pempek ini sudah bersertifikat halal?" },
  { key: "faq.a3", group: "FAQ", label: "Jawaban 3", multiline: true, default: "Sudah, seluruh produk kami bersertifikat halal." },
  { key: "faq.q4", group: "FAQ", label: "Pertanyaan 4", default: "Berapa lama pempek bisa disimpan?" },
  { key: "faq.a4", group: "FAQ", label: "Jawaban 4", multiline: true, default: "Pempek tahan sekitar 2-3 hari di suhu ruang, atau lebih lama kalau disimpan di dalam freezer." },
  { key: "faq.q5", group: "FAQ", label: "Pertanyaan 5", default: "Bisa pesan dalam jumlah banyak untuk acara?" },
  { key: "faq.a5", group: "FAQ", label: "Jawaban 5", multiline: true, default: "Bisa, silakan hubungi kami lewat WhatsApp untuk pemesanan dalam jumlah besar." },

  { key: "footer.tagline", group: "Footer", label: "Tagline", default: "Rasa Asli Palembang" },
  { key: "footer.copy", group: "Footer", label: "Teks hak cipta", default: "© 2026 Pempek Wong Kito · Dibuat dengan ❤️ di Palembang" }
];

function getSiteTexts() {
  try {
    const stored = JSON.parse(localStorage.getItem("siteTexts"));
    if (stored && typeof stored === "object") return stored;
  } catch (e) {}
  return {};
}

function saveSiteTexts(texts) {
  localStorage.setItem("siteTexts", JSON.stringify(texts));
}

function getSiteText(key) {
  const texts = getSiteTexts();
  if (typeof texts[key] === "string") return texts[key];
  const field = SITE_TEXT_FIELDS.find((f) => f.key === key);
  return field ? field.default : "";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const originalHtml = new Map();

function applySiteTexts() {
  const texts = getSiteTexts();
  document.querySelectorAll("[data-edit]").forEach((el) => {
    if (!originalHtml.has(el)) originalHtml.set(el, el.innerHTML);
    const key = el.getAttribute("data-edit");
    el.innerHTML =
      typeof texts[key] === "string"
        ? escapeHtml(texts[key]).replace(/\n/g, "<br>")
        : originalHtml.get(el);
  });
}