"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_MENU } from "./defaults";
import type {
  AppStore,
  CartItem,
  MenuItem,
  Notification,
  Order,
  SiteTexts,
  User,
} from "./types";

const StoreContext = createContext<AppStore | null>(null);

type StoreResponse = {
  store: {
    menuData: MenuItem[];
    usersData: User[];
    ordersData: Order[];
    siteTexts: SiteTexts;
    adminNotifs: Notification[];
  };
};

type SessionResponse = {
  cart: CartItem[];
  user: User | null;
};

function normalizeMenu(items: MenuItem[]) {
  return items.map((item) => ({
    ...item,
    img: item.img
      .replace(/^image\//, "/image/")
      .replace("/image/kapal-selam.jpg", "/image/kapal-Selam.jpg"),
  }));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [menu, setMenuState] = useState<MenuItem[]>(DEFAULT_MENU);
  const [cart, setCartState] = useState<CartItem[]>([]);
  const [users, setUsersState] = useState<User[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [siteTexts, setSiteTextsState] = useState<SiteTexts>({});
  const [notifications, setNotificationsState] = useState<Notification[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const refreshStore = async () => {
    const [storeResponse, sessionResponse] = await Promise.all([
      fetch("/api/store", { cache: "no-store" }),
      fetch("/api/session", { cache: "no-store" }),
    ]);
    if (!storeResponse.ok || !sessionResponse.ok) {
      throw new Error("Gagal membaca data dari PostgreSQL");
    }
    const payload = (await storeResponse.json()) as StoreResponse;
    const session = (await sessionResponse.json()) as SessionResponse;
    setMenuState(normalizeMenu(payload.store.menuData));
    setUsersState(payload.store.usersData);
    setOrdersState(payload.store.ordersData);
    setSiteTextsState(payload.store.siteTexts);
    setNotificationsState(payload.store.adminNotifs);
    setCartState(session.cart);
    setCurrentUserState(session.user);
  };

  useEffect(() => {
    let active = true;
    void refreshStore()
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    channelRef.current = new BroadcastChannel("pempek-wong-kito-store");
    channelRef.current.onmessage = () => {
      void refreshStore().catch((error: unknown) => console.error(error));
    };
    return () => {
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, []);

  const persistShared = (key: string, value: unknown) => {
    void fetch("/api/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal menyimpan data ke PostgreSQL");
        channelRef.current?.postMessage(key);
      })
      .catch((error: unknown) => console.error(error));
  };

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
      setMenu: (next) => {
        setMenuState(next);
        persistShared("menuData", next);
      },
      setCart: (next) => {
        setCartState(next);
        void fetch("/api/session", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart: next }),
        })
          .then((response) => {
            if (!response.ok)
              throw new Error("Gagal menyimpan keranjang ke PostgreSQL");
            channelRef.current?.postMessage("session");
          })
          .catch((error: unknown) => console.error(error));
      },
      setUsers: setUsersState,
      setOrders: (next) => {
        setOrdersState(next);
        persistShared("ordersData", next);
      },
      setCurrentUser: (next) => {
        setCurrentUserState(next);
        if (next === null) {
          void fetch("/api/session", { method: "DELETE" })
            .then((response) => {
              if (!response.ok) throw new Error("Gagal mengakhiri sesi");
              channelRef.current?.postMessage("session");
            })
            .catch((error: unknown) => console.error(error));
        }
      },
      setSiteTexts: (next) => {
        setSiteTextsState(next);
        persistShared("siteTexts", next);
      },
      setNotifications: (next) => {
        setNotificationsState(next);
        persistShared("adminNotifs", next);
      },
    }),
    [ready, menu, cart, users, orders, currentUser, siteTexts, notifications],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
