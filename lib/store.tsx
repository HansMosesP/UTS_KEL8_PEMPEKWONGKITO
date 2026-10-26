"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_ADMIN, DEFAULT_MENU } from "./defaults";
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

function persist<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
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

  useEffect(() => {
    if (!localStorage.getItem("menuData"))
      localStorage.setItem("menuData", JSON.stringify(DEFAULT_MENU));
    if (!localStorage.getItem("adminData"))
      localStorage.setItem("adminData", JSON.stringify(DEFAULT_ADMIN));
    if (!localStorage.getItem("usersData"))
      localStorage.setItem("usersData", "[]");
    if (!localStorage.getItem("ordersData"))
      localStorage.setItem("ordersData", "[]");

    const storedMenu = readValue<MenuItem[]>("menuData", DEFAULT_MENU).map(
      (item) => ({
        ...item,
        img: item.img
          .replace(/^image\//, "/image/")
          .replace("/image/kapal-selam.jpg", "/image/kapal-Selam.jpg"),
      }),
    );
    setMenuState(storedMenu);
    setCartState(readValue<CartItem[]>("cartData", []));
    setUsersState(readValue<User[]>("usersData", []));
    setOrdersState(readValue<Order[]>("ordersData", []));
    setCurrentUserState(readValue<User | null>("loggedInUser", null));
    setSiteTextsState(readValue<SiteTexts>("siteTexts", {}));
    setNotificationsState(readValue<Notification[]>("adminNotifs", []));
    setReady(true);
  }, []);

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
        persist("menuData", next);
      },
      setCart: (next) => {
        setCartState(next);
        persist("cartData", next);
      },
      setUsers: (next) => {
        setUsersState(next);
        persist("usersData", next);
      },
      setOrders: (next) => {
        setOrdersState(next);
        persist("ordersData", next);
      },
      setCurrentUser: (next) => {
        const session = next
          ? { name: next.name, email: next.email, role: next.role }
          : null;
        setCurrentUserState(session);
        if (session) persist("loggedInUser", session);
        else localStorage.removeItem("loggedInUser");
      },
      setSiteTexts: (next) => {
        setSiteTextsState(next);
        persist("siteTexts", next);
      },
      setNotifications: (next) => {
        setNotificationsState(next);
        persist("adminNotifs", next);
      },
    }),
    [ready, menu, cart, users, orders, currentUser, siteTexts, notifications],
  );

  useEffect(() => {
    const sync = (event: Event) => {
      const key = (event as StorageEvent).key;
      if (key === "menuData") setMenuState(readValue("menuData", DEFAULT_MENU));
      if (key === "cartData") setCartState(readValue("cartData", []));
      if (key === "usersData") setUsersState(readValue("usersData", []));
      if (key === "ordersData") setOrdersState(readValue("ordersData", []));
      if (key === "loggedInUser")
        setCurrentUserState(readValue("loggedInUser", null));
      if (key === "siteTexts") setSiteTextsState(readValue("siteTexts", {}));
      if (key === "adminNotifs")
        setNotificationsState(readValue("adminNotifs", []));
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
