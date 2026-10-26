"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { useStore } from "../../lib/store";
import AuthModal from "./auth-modal";
import {
  CartModal,
  CheckoutModal,
  CustomerOrdersModal,
  SuccessModal,
} from "./commerce-modals";
import SiteHeader from "./site-header";
import { Hero, StorefrontSections } from "./site-sections";

export default function Storefront() {
  const { ready, menu, cart, setCart } = useStore();
  const [authOpen, setAuthOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [successOrder, setSuccessOrder] = useState("");

  const addToCart = (id: number) => {
    const item = menu.find((entry) => entry.id === id);
    if (!item) return;
    const existing = cart.find((entry) => entry.id === id);
    setCart(
      existing
        ? cart.map((entry) =>
            entry.id === id ? { ...entry, qty: entry.qty + 1 } : entry,
          )
        : [...cart, { ...item, qty: 1 }],
    );
    void Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2200,
      showConfirmButton: false,
      icon: "success",
      title: `${item.name} masuk keranjang`,
    });
  };

  return (
    <>
      <SiteHeader
        onCart={() => setCartOpen(true)}
        onLogin={() => setAuthOpen(true)}
        onOrders={() => setOrdersOpen(true)}
      />
      <Hero />
      <StorefrontSections onAddItem={addToCart} />
      {ready && (
        <>
          <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
          <CartModal
            open={cartOpen}
            onClose={() => setCartOpen(false)}
            onCheckout={() => {
              setCartOpen(false);
              setCheckoutOpen(true);
            }}
          />
          <CheckoutModal
            open={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            onSuccess={(id) => {
              setCheckoutOpen(false);
              setSuccessOrder(id);
            }}
          />
          <SuccessModal
            orderId={successOrder}
            onClose={() => setSuccessOrder("")}
          />
          <CustomerOrdersModal
            open={ordersOpen}
            onClose={() => setOrdersOpen(false)}
            onAddItem={addToCart}
          />
        </>
      )}
    </>
  );
}
