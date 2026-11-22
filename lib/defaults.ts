import type {
  AnatomyItem,
  FaqItem,
  FeatureItem,
  GalleryItem,
  MenuItem,
  PaymentMethod,
  ShippingCity,
  SiteImages,
  SiteSettings,
  SiteTextField,
  Testimonial,
} from "./types";

export const DEFAULT_MENU: MenuItem[] = [
  {
    id: 1,
    name: "Pempek Kapal Selam",
    price: 15000,
    img: "/image/kapal-Selam.jpg",
    desc: "Pempek besar berisi telur ayam, disajikan dengan cuko khas.",
  },
  {
    id: 2,
    name: "Pempek Lenjer",
    price: 5000,
    img: "/image/pempek-lenjer.jpg",
    desc: "Pempek panjang tanpa isi, cocok untuk camilan.",
  },
  {
    id: 3,
    name: "Tekwan",
    price: 18000,
    img: "/image/Tekwan.jpg",
    desc: "Sup ikan khas Palembang dengan bihun dan jamur.",
  },
  {
    id: 4,
    name: "Es Kacang Merah",
    price: 10000,
    img: "/image/Es-Kacang-Merah.jpg",
    desc: "Minuman manis dingin dari kacang merah.",
  },
];

export const SITE_TEXT_FIELDS: SiteTextField[] = [
  [
    "hero.eyebrow",
    "Hero (Bagian Atas)",
    "Teks kecil di atas judul",
    "Kuliner Khas Palembang",
  ],
  [
    "hero.titlePrefix",
    "Hero (Bagian Atas)",
    "Judul — sebelum teks berjalan",
    "Pempek Asli",
  ],
  [
    "hero.typingWords",
    "Hero (Bagian Atas)",
    "Teks berjalan (pisahkan dengan koma)",
    "Wong Kito, Khas Palembang, Rasa Juara, Sejak Dulu",
  ],
  [
    "hero.titleSuffix",
    "Hero (Bagian Atas)",
    "Judul — setelah teks berjalan",
    ", Rasa yang Selalu Diingat",
  ],
  [
    "hero.desc",
    "Hero (Bagian Atas)",
    "Deskripsi",
    "Berawal dari kecintaan pada rasa khas Palembang, Pempek Wong Kito menjaga resep tradisional dengan ikan tenggiri segar dan cuko yang khas.",
    true,
  ],
  ["hero.btnMenu", "Hero (Bagian Atas)", "Tombol 1", "Lihat Menu"],
  ["hero.btnAnatomi", "Hero (Bagian Atas)", "Tombol 2", "Kenali Lapisannya"],
  ["hero.stat1Value", "Hero (Bagian Atas)", "Statistik 1 — angka", "100%"],
  [
    "hero.stat1Label",
    "Hero (Bagian Atas)",
    "Statistik 1 — keterangan",
    "Ikan pilihan segar",
  ],
  ["hero.stat2Value", "Hero (Bagian Atas)", "Statistik 2 — angka", "6+"],
  [
    "hero.stat2Label",
    "Hero (Bagian Atas)",
    "Statistik 2 — keterangan",
    "Varian pempek",
  ],
  [
    "hero.stat3Value",
    "Hero (Bagian Atas)",
    "Statistik 3 — angka",
    "Sejak 1998",
  ],
  [
    "hero.stat3Label",
    "Hero (Bagian Atas)",
    "Statistik 3 — keterangan",
    "Resep turun-temurun",
  ],
  ["cerita.badge", "Cerita Kami", "Label", "Cerita Kami"],
  [
    "cerita.title",
    "Cerita Kami",
    "Judul",
    "Dari Sungai Musi ke Meja Makan Anda",
  ],
  [
    "cerita.journeyFrom",
    "Cerita Kami",
    "Perjalanan — dari",
    "Dari Sungai Musi",
  ],
  ["cerita.journeyTo", "Cerita Kami", "Perjalanan — ke", "ke Meja Anda"],
  [
    "cerita.lead",
    "Cerita Kami",
    "Paragraf pembuka",
    "Berawal dari kecintaan terhadap cita rasa Palembang, Wong Kito menghadirkan pempek dengan resep khas yang diwariskan dari generasi ke generasi.",
    true,
  ],
  ["cerita.p1Title", "Cerita Kami", "Paragraf 2 — judul", "Ikan segar setiap pagi"],
  [
    "cerita.p1",
    "Cerita Kami",
    "Paragraf 2",
    "Setiap pagi, ikan pilihan datang dari pasar, digiling dengan tangan, dibumbui dengan takaran yang sudah dihafal di luar kepala. Tidak ada jalan pintas — karena rasa asli memang tidak bisa dipalsukan.",
    true,
  ],
  ["cerita.p2Title", "Cerita Kami", "Paragraf 3 — judul", "Cuko direbus perlahan"],
  [
    "cerita.p2",
    "Cerita Kami",
    "Paragraf 3",
    "Cuko kami direbus perlahan dengan gula aren asli, cabai, dan asam jawa. Rasa manis, asam, dan pedasnya seimbang — persis seperti yang disantap keluarga Palembang di tepian Sungai Musi sejak dulu.",
    true,
  ],
  ["cerita.signGreeting", "Cerita Kami", "Salam penutup", "Salam hangat,"],
  [
    "cerita.signName",
    "Cerita Kami",
    "Nama penanda tangan",
    "Keluarga Wong Kito",
  ],
  ["keunggulan.badge", "Keunggulan", "Label", "Keunggulan"],
  ["keunggulan.title", "Keunggulan", "Judul", "Kenapa Wong Kito?"],
  [
    "keunggulan.subtitle",
    "Keunggulan",
    "Subjudul",
    "Tiga alasan sederhana kenapa pelanggan balik lagi.",
  ],
  ["favorit.badge", "Favorit", "Label", "Favorit"],
  ["favorit.title", "Favorit", "Judul", "Favorit Wong Kito"],
  [
    "favorit.subtitle",
    "Favorit",
    "Subjudul",
    "Yang paling sering dipesan pelanggan setia kami.",
  ],
  ["favorit.tag", "Favorit", "Tag pada foto", "⭐ Best Seller"],
  ["favorit.name", "Favorit", "Nama menu", "Pempek Kapal Selam"],
  [
    "favorit.desc",
    "Favorit",
    "Deskripsi",
    "Pempek besar berisi telur ayam utuh, dibalut adonan ikan pilihan dengan tekstur kenyal lembut. Disajikan dengan cuko khas Palembang yang bikin nagih.",
    true,
  ],
  ["favorit.price", "Favorit", "Harga (teks)", "Rp 20.000"],
  ["favorit.button", "Favorit", "Tombol", "Pesan Sekarang"],
  ["menu.badge", "Menu", "Label", "Menu"],
  ["menu.title", "Menu", "Judul", "Semua Pilihan Pempek"],
  [
    "menu.subtitle",
    "Menu",
    "Subjudul",
    'Klik "Pesan" untuk menambah ke keranjang.',
  ],
  ["anatomi.badge", "Anatomi", "Label", "Kenali Produk"],
  ["anatomi.title", "Anatomi", "Judul", "Anatomi Pempek Kapal Selam"],
  [
    "anatomi.subtitle",
    "Anatomi",
    "Subjudul",
    "Pilih lapisan untuk mengenal bahan dan teksturnya.",
  ],
  ["anatomi.introTitle", "Anatomi", "Judul awal", "Enam bagian, satu rasa khas"],
  [
    "anatomi.introDesc",
    "Anatomi",
    "Deskripsi awal",
    "Pempek diracik dari ikan pilihan, tekstur kenyal, dan cuko yang seimbang.",
    true,
  ],
  [
    "anatomi.hint",
    "Anatomi",
    "Petunjuk klik",
    "Klik salah satu bagian untuk melihat penjelasannya.",
  ],
  ["testimoni.badge", "Testimoni", "Label", "Cerita Pelanggan"],
  ["testimoni.title", "Testimoni", "Judul", "Kata Mereka"],
  ["galeri.badge", "Galeri", "Label", "Galeri"],
  ["galeri.title", "Galeri", "Judul", "Suasana Wong Kito"],
  ["galeri.subtitle", "Galeri", "Subjudul", "Sedikit cerita dari dapur kami."],
  ["lokasi.badge", "Lokasi & Kontak", "Label", "Lokasi"],
  ["lokasi.title", "Lokasi & Kontak", "Judul", "Temukan Wong Kito"],
  [
    "lokasi.subtitle",
    "Lokasi & Kontak",
    "Subjudul",
    "Mampir langsung, atau pesan antar ke rumah.",
  ],
  [
    "lokasi.address",
    "Lokasi & Kontak",
    "Alamat",
    "Jl. Merdeka No. 123, Ilir Barat I,\nPalembang, Sumatra Selatan 30131",
    true,
  ],
  [
    "lokasi.hours",
    "Lokasi & Kontak",
    "Jam buka",
    "Setiap hari\n09.00 - 21.00 WIB",
    true,
  ],
  [
    "lokasi.phone",
    "Lokasi & Kontak",
    "Telepon / WhatsApp",
    "(0711) 000-0000\n+62 812-3456-7890",
    true,
  ],
  ["faq.badge", "FAQ", "Label", "FAQ"],
  ["faq.title", "FAQ", "Judul", "Pertanyaan yang Sering Ditanyakan"],
  ["footer.tagline", "Footer", "Tagline", "Rasa Asli Palembang"],
  [
    "footer.copy",
    "Footer",
    "Teks hak cipta",
    "© 2026 Pempek Wong Kito · Dibuat dengan ❤️ di Palembang",
  ],
].map(([key, group, label, value, multiline]) => ({
  key: key as string,
  group: group as string,
  label: label as string,
  default: value as string,
  multiline: Boolean(multiline),
}));

export const SITE_TEXT_DEFAULTS = Object.fromEntries(
  SITE_TEXT_FIELDS.map((field) => [field.key, field.default]),
);

export const DEFAULT_FAQS: FaqItem[] = [
  [
    "Pempek kalian terbuat dari ikan apa?",
    "Pempek kita terbuat dari 100% ikan tenggiri asli, dipilih langsung setiap pagi.",
  ],
  [
    "Apakah pempeknya pakai bahan pengawet?",
    "Tidak, pempek kami dibuat tanpa bahan pengawet sama sekali.",
  ],
  [
    "Apakah pempek ini sudah bersertifikat halal?",
    "Sudah, seluruh produk kami bersertifikat halal.",
  ],
  [
    "Berapa lama pempek bisa disimpan?",
    "Pempek tahan sekitar 2-3 hari di suhu ruang, atau lebih lama kalau disimpan di dalam freezer.",
  ],
  [
    "Bisa pesan dalam jumlah banyak untuk acara?",
    "Bisa, silakan hubungi kami lewat WhatsApp untuk pemesanan dalam jumlah besar.",
  ],
].map(([question, answer], index) => ({ id: index + 1, question, answer }));

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  [
    '"Rasa cukonya khas banget. Berasa makan pempek asli Palembang di rumah nenek dulu."',
    "Dinda",
    "Palembang",
  ],
  [
    '"Pempek kapal selamnya mantap. Telurnya utuh, ikannya berasa banget. Harga masih ramah."',
    "Rizky",
    "Jakarta",
  ],
  [
    '"Pesan buat acara keluarga, semua pada nanya beli di mana. Fresh dan rapi packing-nya."',
    "Anisa",
    "Bandung",
  ],
].map(([text, name, city], index) => ({ id: index + 1, text, name, city, rating: 5 }));

export const DEFAULT_SETTINGS: SiteSettings = {
  mapEmbedUrl:
    "https://www.google.com/maps?q=Jembatan+Ampera+Palembang&output=embed",
  mapLinkUrl: "https://maps.google.com/?q=Jembatan+Ampera+Palembang",
  whatsapp: "6281234567890",
};

/** Ongkir per kota (bawaan). Admin bisa mengubahnya di tab "Ongkir & Pembayaran". */
export const DEFAULT_SHIPPING: ShippingCity[] = [
  ["Palembang", 8000],
  ["Lahat / Prabumulih", 15000],
  ["Jambi / Bandar Lampung", 25000],
  ["Jakarta / Bandung", 35000],
  ["Surabaya / Makassar", 45000],
].map(([name, fee], index) => ({ id: index + 1, name: name as string, fee: fee as number }));

export const DEFAULT_PAYMENTS: PaymentMethod[] = [
  "Transfer Bank",
  "COD (Bayar di Tempat)",
  "QRIS",
  "E-Wallet (OVO/Dana)",
].map((name, index) => ({ id: index + 1, name }));

export const DEFAULT_ANATOMY: AnatomyItem[] = [
  ["Kulit Luar Pempek", "Lapisan luar memberi tekstur khas serta melindungi isian di dalamnya.", "Pelindung & tekstur"],
  ["Adonan Ikan", "Ikan tenggiri pilihan memberi rasa gurih khas Palembang.", "Rasa gurih utama"],
  ["Campuran Tapioka / Sagu", "Memberi tekstur kenyal yang menjadi ciri khas pempek.", "Tekstur kenyal"],
  ["Isian Telur", "Telur utuh di bagian tengah membuat rasanya lebih kaya dan mengenyangkan.", "Isian khas"],
  ["Cuko", "Saus khas Palembang dari gula aren, cabai, dan asam jawa.", "Saus khas Palembang"],
  ["Pelengkap", "Timun segar dan mie kuning menyeimbangkan rasa gurih pempek.", "Pelengkap sajian"],
].map(([title, desc, tag], index) => ({ id: index + 1, title, desc, tag }));

export const DEFAULT_FEATURES: FeatureItem[] = [
  [
    "/image/pempek-lenjer.jpg",
    "Ikan Pilihan",
    "Menggunakan ikan pilihan dengan tekstur lembut dan rasa gurih alami. Dipilih langsung setiap pagi sebelum matahari terbit.",
  ],
  [
    "/image/Pempek-Adaan.jpg",
    "Cuko Racikan Sendiri",
    "Rasa manis, asam, pedas khas Palembang. Direbus perlahan dengan gula aren asli, cabai rawit, dan asam jawa pilihan.",
  ],
  [
    "/image/Pempek-Kulit.jpg",
    "Dibuat Setiap Hari",
    "Diproduksi segar untuk menjaga rasa asli. Tidak ada stok lama, tidak ada bahan pengawet. Setiap gigitan baru dibuat pagi itu.",
  ],
].map(([img, title, desc], index) => ({ id: index + 1, img, title, desc }));

/** Foto bawaan kartu keunggulan ke-n (dipakai juga untuk data lama yang masih ber-emoji). */
export const defaultFeatureImg = (index: number) =>
  DEFAULT_FEATURES[index % DEFAULT_FEATURES.length].img;

export const DEFAULT_GALLERY: GalleryItem[] = [
  ["/image/Pempek_palembang.jpg", "Pempek Palembang"],
  ["/image/kapal-Selam.jpg", "Pempek Kapal Selam"],
  ["/image/pempek-lenjer.jpg", "Pempek Lenjer"],
  ["/image/Tekwan.jpg", "Tekwan"],
  ["/image/Pempek-Adaan.jpg", "Pempek Adaan"],
].map(([img, caption], index) => ({ id: index + 1, img, caption }));

export const DEFAULT_IMAGES: SiteImages = {
  heroBg: "/image/ampera.png",
  heroPhoto: "/image/Pempek_palembang.jpg",
  anatomyImg: "/image/Pempek_palembang.jpg",
  ceritaImg: "/image/ampera.png",
};

export const SITE_IMAGE_FIELDS: { key: keyof SiteImages; label: string; hint: string }[] = [
  { key: "heroBg", label: "Latar Hero (paling atas)", hint: "Gambar besar di belakang judul. Sebaiknya landscape." },
  { key: "heroPhoto", label: "Foto Hero", hint: "Foto produk di samping judul." },
  { key: "anatomyImg", label: "Foto Anatomi", hint: "Foto potongan pempek. Sebaiknya persegi." },
  { key: "ceritaImg", label: "Foto Cerita Kami", hint: "Foto di bagian Tentang Kami." },
];

/**
 * Sumber gambar yang diizinkan: file bawaan di /public/image,
 * hasil upload admin (/api/uploads/...), atau data URL lama dari menu.
 */
export function isImageRef(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return (
    /^\/image\/[\w.-]+$/.test(value) ||
    /^\/api\/uploads\/[a-f0-9]{32}$/.test(value) ||
    (value.length <= 3_000_000 && /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(value))
  );
}

const GOOGLE_HOST = /^(www\.)?google\.[a-z.]+$|^maps\.google\.[a-z.]+$|^maps\.app\.goo\.gl$|^goo\.gl$/i;

function parseGoogleUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && GOOGLE_HOST.test(url.hostname)
      ? url
      : null;
  } catch {
    return null;
  }
}

/**
 * Mengubah input admin (alamat/nama tempat, link Google Maps, atau kode
 * <iframe> dari menu "Sematkan peta") menjadi URL embed + URL tautan.
 * Mengembalikan null bila input berupa URL non-Google (demi keamanan iframe).
 */
export function resolveMapInput(
  input: string,
): { embedUrl: string; linkUrl: string } | null {
  const value = input.trim();
  if (!value) return null;
  const iframeSrc = value.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i)?.[1];
  const candidate = iframeSrc ?? value;

  if (/^https?:\/\//i.test(candidate)) {
    const url = parseGoogleUrl(candidate);
    if (!url) return null;
    const isEmbed =
      url.pathname.startsWith("/maps/embed") ||
      url.searchParams.get("output") === "embed";
    if (isEmbed) {
      const query = url.searchParams.get("q");
      return {
        embedUrl: url.toString(),
        linkUrl: query
          ? `https://maps.google.com/?q=${encodeURIComponent(query)}`
          : url.toString().replace("/maps/embed", "/maps"),
      };
    }
    // Link biasa (mis. maps.google.com/?q=... atau /maps/place/Nama+Tempat/...)
    const place =
      url.searchParams.get("q") ??
      url.searchParams.get("query") ??
      decodeURIComponent(
        url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/)?.[1] ?? "",
      ).replace(/\+/g, " ");
    if (!place) return null;
    return {
      embedUrl: `https://www.google.com/maps?q=${encodeURIComponent(place)}&output=embed`,
      linkUrl: url.toString(),
    };
  }

  // Teks biasa → dianggap alamat / nama tempat.
  const query = encodeURIComponent(value);
  return {
    embedUrl: `https://www.google.com/maps?q=${query}&output=embed`,
    linkUrl: `https://maps.google.com/?q=${query}`,
  };
}

export function isSafeMapUrl(raw: string): boolean {
  return parseGoogleUrl(raw) !== null;
}
