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

function readValue<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : (JSON.parse(value) as T);
  } catch {
    return fallback;
  }
}

function persistLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

type StoreResponse = {
  store: {
    menuData: MenuItem[];
    usersData: User[];
    ordersData: Order[];
    siteTexts: SiteTexts;
    adminNotifs: Notification[];
  };
  legacyImported: boolean;
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

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        const response = await fetch("/api/store", { cache: "no-store" });
        if (!response.ok) throw new Error("Gagal membaca database PostgreSQL");
        let payload = (await response.json()) as StoreResponse;
        if (!payload.legacyImported) {
          const legacy = {
            ...(localStorage.getItem("menuData")
              ? { menuData: readValue<MenuItem[]>("menuData", DEFAULT_MENU) }
              : {}),
            ...(localStorage.getItem("usersData")
              ? { usersData: readValue<User[]>("usersData", []) }
              : {}),
            ...(localStorage.getItem("ordersData")
              ? { ordersData: readValue<Order[]>("ordersData", []) }
              : {}),
            ...(localStorage.getItem("siteTexts")
              ? { siteTexts: readValue<SiteTexts>("siteTexts", {}) }
              : {}),
            ...(localStorage.getItem("adminNotifs")
              ? {
                  adminNotifs: readValue<Notification[]>("adminNotifs", []),
                }
              : {}),
          };
          const migrated = await fetch("/api/store", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ legacy }),
          });
          if (!migrated.ok) throw new Error("Gagal migrasi data ke PostgreSQL");
          payload = {
            store: (await migrated.json()) as StoreResponse["store"],
            legacyImported: true,
          };
        }
        if (!active) return;
        setMenuState(normalizeMenu(payload.store.menuData));
        setUsersState(payload.store.usersData);
        setOrdersState(payload.store.ordersData);
        setSiteTextsState(payload.store.siteTexts);
        setNotificationsState(payload.store.adminNotifs);
      } catch (error) {
        console.error(error);
        if (!active) return;
        setMenuState(
          normalizeMenu(readValue<MenuItem[]>("menuData", DEFAULT_MENU)),
        );
        setUsersState(readValue<User[]>("usersData", []));
        setOrdersState(readValue<Order[]>("ordersData", []));
        setSiteTextsState(readValue<SiteTexts>("siteTexts", {}));
        setNotificationsState(readValue<Notification[]>("adminNotifs", []));
      }
      if (active) {
        setCartState(readValue<CartItem[]>("cartData", []));
        setCurrentUserState(readValue<User | null>("loggedInUser", null));
        setReady(true);
      }
    };
    void initialize();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const response = await fetch("/api/store", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as StoreResponse;
      setMenuState(normalizeMenu(payload.store.menuData));
      setUsersState(payload.store.usersData);
      setOrdersState(payload.store.ordersData);
      setSiteTextsState(payload.store.siteTexts);
      setNotificationsState(payload.store.adminNotifs);
    };
    if (typeof BroadcastChannel !== "undefined") {
      channelRef.current = new BroadcastChannel("pempek-wong-kito-store");
      channelRef.current.onmessage = () => void refresh();
    }
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
        persistLocal("cartData", next);
      },
      setUsers: (next) => {
        setUsersState(next);
        channelRef.current?.postMessage("usersData");
      },
      setOrders: (next) => {
        setOrdersState(next);
        persistShared("ordersData", next);
      },
      setCurrentUser: (next) => {
        const session = next
          ? { name: next.name, email: next.email, role: next.role }
          : null;
        setCurrentUserState(session);
        if (session) persistLocal("loggedInUser", session);
        else localStorage.removeItem("loggedInUser");
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
    [
      ready,
      menu,
      cart,
      users,
      orders,
      currentUser,
      siteTexts,
      notifications,
    ],
  );

  useEffect(() => {
    const sync = (event: Event) => {
      const key = (event as StorageEvent).key;
      if (key === "cartData") setCartState(readValue("cartData", []));
      if (key === "loggedInUser")
        setCurrentUserState(readValue("loggedInUser", null));
    };
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used inside StoreProvider");
  return store;
}
