"use client";

import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { useStore } from "../../lib/store";
import type { AuthMode, User } from "../../lib/types";
import AuthModal from "./auth-modal";
import {
  CartModal,
  CheckoutModal,
  CustomerOrdersModal,
  SuccessModal,
} from "./commerce-modals";
import SiteHeader from "./site-header";
import { StorefrontSections } from "./site-sections";

type AuthState = { open: boolean; mode: AuthMode; notice?: string };

export default function Storefront() {
  const { ready, menu, currentUser, setCart } = useStore();
  const [auth, setAuth] = useState<AuthState>({ open: false, mode: "login" });
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState("");
  /** Aksi yang dijalankan otomatis setelah user berhasil login. */
  const pendingAction = useRef<((user: User) => void) | null>(null);

  /**
   * Pemesanan hanya untuk customer yang sudah login.
   * Jika belum login → tampilkan pop-up login, lalu lanjutkan aksi.
   */
  const requireCustomer = (action: (user: User) => void, notice: string) => {
    if (!ready) return;
    if (!currentUser) {
      pendingAction.current = action;
      setAuth({ open: true, mode: "login", notice });
      return;
    }
    if (currentUser.role === "admin") {
      void Swal.fire({
        icon: "info",
        title: "Akun admin",
        text: "Akun admin tidak dapat membuat pesanan. Gunakan akun customer.",
      });
      return;
    }
    action(currentUser);
  };

  const addToCart = (id: number) =>
    requireCustomer(() => {
      const item = menu.find((entry) => entry.id === id);
      if (!item) return;
      // Updater function → aman walau dipanggil tertunda setelah login.
      setCart((current) =>
        current.some((entry) => entry.id === id)
          ? current.map((entry) => (entry.id === id ? { ...entry, qty: entry.qty + 1 } : entry))
          : [...current, { ...item, qty: 1 }],
      );
      void Swal.fire({
        toast: true,
        position: "top-end",
        timer: 2200,
        showConfirmButton: false,
        icon: "success",
        title: `${item.name} masuk keranjang`,
      });
    }, "Silakan masuk atau daftar terlebih dahulu untuk memesan.");

  const goToCheckout = () => {
    setCartOpen(false);
    requireCustomer(
      () => setCheckoutOpen(true),
      "Silakan masuk terlebih dahulu untuk melanjutkan checkout.",
    );
  };

  return (
    <>
      <SiteHeader
        onCart={() => setCartOpen(true)}
        onAuth={(mode) => {
          pendingAction.current = null;
          setAuth({ open: true, mode });
        }}
        onOrders={() => setOrdersOpen(true)}
      />
      <StorefrontSections onAddItem={addToCart} />
      {ready && (
        <>
          <AuthModal
            open={auth.open}
            initialMode={auth.mode}
            notice={auth.notice}
            onClose={() => setAuth((state) => ({ ...state, open: false }))}
            onSuccess={(user) => {
              const action = pendingAction.current;
              pendingAction.current = null;
              if (action && user.role === "customer") action(user);
            }}
          />
          <CartModal
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            onCheckout={goToCheckout}
            onLogin={() => {
              setCartOpen(false);
              setAuth({
                open: true,
                mode: "login",
                notice: "Masuk untuk mulai memesan.",
              });
            }}
          />
          <CheckoutModal
            open={checkoutOpen && Boolean(currentUser)}
            onClose={() => setCheckoutOpen(false)}
            onSuccess={(id) => {
              setCheckoutOpen(false);
              setSuccessOrder(id);
            }}
          />
          <SuccessModal
            orderId={successOrder}
            onClose={() => setSuccessOrder("")}
            onViewOrders={() => {
              setSuccessOrder("");
              setOrdersOpen(true);
            }}
          />
          <CustomerOrdersModal
            open={ordersOpen && Boolean(currentUser)}
            onClose={() => setOrdersOpen(false)}
            onAddItem={addToCart}
          />
        </>
      )}
    </>
  );
}
