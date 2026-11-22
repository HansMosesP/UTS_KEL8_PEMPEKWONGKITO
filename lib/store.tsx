"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Swal from "sweetalert2";
import {
  DEFAULT_ANATOMY,
  DEFAULT_FAQS,
  DEFAULT_FEATURES,
  DEFAULT_GALLERY,
  DEFAULT_IMAGES,
  DEFAULT_MENU,
  DEFAULT_PAYMENTS,
  DEFAULT_SETTINGS,
  DEFAULT_SHIPPING,
  DEFAULT_TESTIMONIALS,
} from "./defaults";
import type {
  AnatomyItem,
  AppStore,
  CartItem,
  ContentKey,
  ContentValue,
  FaqItem,
  FeatureItem,
  GalleryItem,
  MenuItem,
  Notification,
  Order,
  PaymentMethod,
  ShippingCity,
  SiteImages,
  SiteSettings,
  SiteTexts,
  Testimonial,
  User,
} from "./types";

const StoreContext = createContext<AppStore | null>(null);
const CHANNEL = "pempek-wong-kito-store";
const ADMIN_POLL_MS = 15000;

type StoreResponse = {
  user: User | null;
  /** Keranjang browser ini (tersimpan di PostgreSQL): hanya id menu + jumlah. */
  cart: { id: number; qty: number }[];
  store: ContentValue & {
    usersData: User[];
    ordersData: Order[];
    adminNotifs: Notification[];
  };
};

function normalizeMenu(items: MenuItem[]) {
  return items.map((item) => ({
    ...item,
    img: item.img
      .replace(/^image\//, "/image/")
      .replace("/image/kapal-selam.jpg", "/image/kapal-Selam.jpg"),
  }));
}

async function api<T = { ok: true }>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Permintaan gagal diproses.");
  return data;
}

const showError = (title: string, error: unknown) =>
  void Swal.fire({
    icon: "error",
    title,
    text: error instanceof Error ? error.message : "Server tidak dapat dihubungi.",
  });

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>(DEFAULT_MENU);
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [siteTexts, setSiteTexts] = useState<SiteTexts>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(DEFAULT_TESTIMONIALS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [anatomy, setAnatomy] = useState<AnatomyItem[]>(DEFAULT_ANATOMY);
  const [features, setFeatures] = useState<FeatureItem[]>(DEFAULT_FEATURES);
  const [gallery, setGallery] = useState<GalleryItem[]>(DEFAULT_GALLERY);
  const [images, setImages] = useState<SiteImages>(DEFAULT_IMAGES);
  const [shippingCities, setShippingCities] = useState<ShippingCity[]>(DEFAULT_SHIPPING);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(DEFAULT_PAYMENTS);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const cartRef = useRef<CartItem[]>([]);

  const replaceCart = useCallback((next: CartItem[]) => {
    cartRef.current = next;
    setCartState(next);
  }, []);

  const apply = useCallback((payload: StoreResponse) => {
    const { store } = payload;
    const nextMenu = normalizeMenu(store.menuData);
    setCurrentUser(payload.user);
    setMenu(nextMenu);
    // Nama, harga & gambar keranjang selalu diambil dari menu terbaru.
    replaceCart(
      payload.cart.flatMap(({ id, qty }) => {
        const item = nextMenu.find((entry) => entry.id === id);
        return item ? [{ ...item, qty }] : [];
      }),
    );
    setUsers(store.usersData);
    setOrders(store.ordersData);
    setSiteTexts(store.siteTexts);
    setNotifications(store.adminNotifs);
    setFaqs(store.faqData);
    setTestimonials(store.testimoniData);
    setSettings(store.siteSettings);
    setAnatomy(store.anatomyData);
    setFeatures(store.featureData);
    setGallery(store.galleryData);
    setImages(store.siteImages);
    setShippingCities(store.shippingData);
    setPaymentMethods(store.paymentData);
  }, [replaceCart]);

  const refresh = useCallback(async () => {
    try {
      apply(await api<StoreResponse>("/api/store"));
    } catch (error) {
      console.error(error);
    }
  }, [apply]);

  const broadcast = () => channelRef.current?.postMessage("changed");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const payload = await api<StoreResponse>("/api/store");
        if (active) apply(payload);
      } catch (error) {
        console.error(error);
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [apply]);

  // Sinkron antar-tab di browser yang sama (konten, login, dan keranjang).
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = () => void refresh();
    channelRef.current = channel;
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [refresh]);

  // Admin: ambil pesanan baru dari perangkat lain secara berkala.
  useEffect(() => {
    if (currentUser?.role !== "admin") return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, ADMIN_POLL_MS);
    return () => window.clearInterval(timer);
  }, [currentUser?.role, refresh]);

  /** Ubah keranjang: tampil langsung, lalu disimpan ke PostgreSQL lewat /api/session. */
  const setCart = useCallback<AppStore["setCart"]>(
    (next) => {
      const value = typeof next === "function" ? next(cartRef.current) : next;
      replaceCart(value);
      api("/api/session", {
        method: "PUT",
        body: JSON.stringify({ cart: value.map(({ id, qty }) => ({ id, qty })) }),
      })
        .then(() => channelRef.current?.postMessage("changed"))
        .catch((error: unknown) => console.error(error));
    },
    [replaceCart],
  );

  const value = useMemo<AppStore>(
    () => ({
      ready,
      menu,
      cart,
      users,
      orders,
      currentUser,
      siteTexts,
      notifications,
      faqs,
      testimonials,
      settings,
      anatomy,
      features,
      gallery,
      images,
      shippingCities,
      paymentMethods,
      setCart,
      refresh,
      authenticate: async (mode, data) => {
        try {
          const result = await api<{ user: User }>("/api/auth", {
            method: "POST",
            body: JSON.stringify({ action: mode, ...data }),
          });
          await refresh();
          broadcast();
          return { ok: true, user: result.user };
        } catch (error) {
          return {
            ok: false,
            error: error instanceof Error ? error.message : "Server tidak terhubung.",
          };
        }
      },
      logout: async () => {
        try {
          await api("/api/auth", {
            method: "POST",
            body: JSON.stringify({ action: "logout" }),
          });
        } catch (error) {
          console.error(error);
        }
        // Sesi (beserta keranjangnya) sudah dihapus di server.
        replaceCart([]);
        setCurrentUser(null);
        await refresh();
        broadcast();
      },
      saveContent: async <K extends ContentKey>(key: K, next: ContentValue[K]) => {
        try {
          await api("/api/store", {
            method: "PUT",
            body: JSON.stringify({ key, value: next }),
          });
          await refresh();
          broadcast();
          return true;
        } catch (error) {
          showError("Gagal menyimpan", error);
          await refresh();
          return false;
        }
      },
      placeOrder: async (payload) => {
        const { order } = await api<{ order: Order }>("/api/orders", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        // Server sudah mengosongkan keranjang di sesi.
        replaceCart([]);
        await refresh();
        broadcast();
        return order;
      },
      updateOrderStatus: async (id, status) => {
        try {
          await api("/api/orders", {
            method: "PATCH",
            body: JSON.stringify({ id, status }),
          });
          await refresh();
          broadcast();
          return true;
        } catch (error) {
          showError("Status gagal diubah", error);
          await refresh();
          return false;
        }
      },
      deleteOrder: async (id) => {
        try {
          await api(`/api/orders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
          await refresh();
          broadcast();
          return true;
        } catch (error) {
          showError("Pesanan gagal dihapus", error);
          return false;
        }
      },
      markNotificationsRead: async (ids) => {
        setNotifications((items) =>
          items.map((item) =>
            ids === "all" || ids.includes(item.id) ? { ...item, read: true } : item,
          ),
        );
        try {
          await api("/api/notifications", {
            method: "PATCH",
            body: JSON.stringify({ ids }),
          });
          broadcast();
        } catch (error) {
          console.error(error);
          await refresh();
        }
      },
    }),
    [
      ready,
      menu,
      cart,
      users,
      orders,
      currentUser,
      siteTexts,
      notifications,
      faqs,
      testimonials,
      settings,
      anatomy,
      features,
      gallery,
      images,
      shippingCities,
      paymentMethods,
      setCart,
      refresh,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
