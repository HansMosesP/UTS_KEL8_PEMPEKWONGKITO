export type UserRole = "admin" | "customer";
export type OrderStatus = "pending" | "process" | "shipped" | "done" | "cancel";

export type MenuItem = {
  id: number;
  name: string;
  price: number;
  img: string;
  desc: string;
};

export type CartItem = MenuItem & { qty: number };
export type User = {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: string;
};
export type Order = {
  id: string;
  userEmail: string;
  userName: string;
  phone: string;
  address: string;
  city: string;
  payment: string;
  items: CartItem[];
  subtotal: number;
  ongkir: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
};
export type SiteTextField = {
  key: string;
  group: string;
  label: string;
  default: string;
  multiline?: boolean;
};
export type Notification = {
  id: number;
  title: string;
  body: string;
  read: boolean;
  time: string;
};
export type SiteTexts = Record<string, string>;

export type FaqItem = { id: number; question: string; answer: string };
export type Testimonial = {
  id: number;
  text: string;
  name: string;
  city: string;
  /** Jumlah bintang 1–5. */
  rating: number;
};
export type AnatomyItem = { id: number; title: string; desc: string; tag: string };
export type FeatureItem = { id: number; img: string; title: string; desc: string };
export type GalleryItem = { id: number; img: string; caption: string };
export type ShippingCity = { id: number; name: string; fee: number };
export type PaymentMethod = { id: number; name: string };
/** Gambar tetap di halaman utama yang bisa diganti admin. */
export type SiteImages = {
  heroBg: string;
  heroPhoto: string;
  anatomyImg: string;
  ceritaImg: string;
};
export type SiteSettings = {
  /** URL yang dipakai pada <iframe> peta (selalu domain google.com). */
  mapEmbedUrl: string;
  /** URL tombol "Buka Google Maps". */
  mapLinkUrl: string;
  /** Nomor WhatsApp format internasional tanpa "+", mis. 6281234567890. */
  whatsapp: string;
};

export type CheckoutPayload = {
  items: { id: number; qty: number }[];
  name: string;
  phone: string;
  address: string;
  cityId: number;
  payment: string;
};

/** Data yang boleh diubah admin lewat PUT /api/store. */
export type ContentKey =
  | "menuData"
  | "siteTexts"
  | "faqData"
  | "testimoniData"
  | "siteSettings"
  | "anatomyData"
  | "featureData"
  | "galleryData"
  | "siteImages"
  | "shippingData"
  | "paymentData";

export type AuthMode = "login" | "register";
export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

export type AppStore = {
  ready: boolean;
  menu: MenuItem[];
  cart: CartItem[];
  users: User[];
  orders: Order[];
  currentUser: User | null;
  siteTexts: SiteTexts;
  notifications: Notification[];
  faqs: FaqItem[];
  testimonials: Testimonial[];
  settings: SiteSettings;
  anatomy: AnatomyItem[];
  features: FeatureItem[];
  gallery: GalleryItem[];
  images: SiteImages;
  shippingCities: ShippingCity[];
  paymentMethods: PaymentMethod[];
  setCart: (cart: CartItem[] | ((current: CartItem[]) => CartItem[])) => void;
  authenticate: (
    mode: AuthMode,
    data: { name?: string; email: string; password: string },
  ) => Promise<AuthResult>;
  logout: () => Promise<void>;
  saveContent: <K extends ContentKey>(key: K, value: ContentValue[K]) => Promise<boolean>;
  placeOrder: (payload: CheckoutPayload) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  markNotificationsRead: (ids: number[] | "all") => Promise<void>;
  refresh: () => Promise<void>;
};

export type ContentValue = {
  menuData: MenuItem[];
  siteTexts: SiteTexts;
  faqData: FaqItem[];
  testimoniData: Testimonial[];
  siteSettings: SiteSettings;
  anatomyData: AnatomyItem[];
  featureData: FeatureItem[];
  galleryData: GalleryItem[];
  siteImages: SiteImages;
  shippingData: ShippingCity[];
  paymentData: PaymentMethod[];
};
