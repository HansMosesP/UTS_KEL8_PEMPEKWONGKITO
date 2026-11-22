"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import { useStore } from "../../lib/store";
import type { CartItem, OrderStatus } from "../../lib/types";
import Modal from "../shared/modal";

const formatPrice = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;
export const STATUS_TEXT: Record<OrderStatus, string> = {
  pending: "Menunggu",
  process: "Diproses",
  shipped: "Dikirim",
  done: "Selesai",
  cancel: "Dibatalkan",
};

/** Keranjang disinkronkan dengan menu terbaru (harga baru / menu dihapus admin). */
function useLiveCart() {
  const { cart, menu, setCart } = useStore();
  const items = useMemo<CartItem[]>(
    () =>
      cart.flatMap((entry) => {
        const item = menu.find((menuItem) => menuItem.id === entry.id);
        return item ? [{ ...item, qty: entry.qty }] : [];
      }),
    [cart, menu],
  );
  useEffect(() => {
    if (items.length !== cart.length) setCart(items);
  }, [items, cart.length, setCart]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return { items, subtotal, setCart };
}

export function CartModal({
  open,
  onClose,
  onCheckout,
  onLogin,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  onLogin: () => void;
}) {
  const { currentUser } = useStore();
  const { items, subtotal, setCart } = useLiveCart();
  const changeQty = (id: number, delta: number) =>
    setCart((current) =>
      current.flatMap((item) =>
        item.id !== id
          ? [item]
          : item.qty + delta > 0
            ? [{ ...item, qty: Math.min(99, item.qty + delta) }]
            : [],
      ),
    );

  return (
    <Modal open={open} onClose={onClose} className="cart-box">
      <button className="auth-close" onClick={onClose} aria-label="Tutup">
        ×
      </button>
      <h3>Keranjang Belanja</h3>
      <p className="auth-sub">Cek pesanan kamu sebelum checkout.</p>
      {!currentUser ? (
        <div className="cart-login-gate">
          <p>Kamu perlu masuk ke akun untuk mulai memesan.</p>
          <button className="btn btn-primary" onClick={onLogin}>
            Masuk / Daftar
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {items.length ? (
              items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <img src={item.img} alt={item.name} />
                  <div className="cart-item-info">
                    <h4>{item.name}</h4>
                    <p>{formatPrice(item.price)}</p>
                    <div className="cart-qty">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => changeQty(item.id, -1)}
                        aria-label={`Kurangi ${item.name}`}
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => changeQty(item.id, 1)}
                        aria-label={`Tambah ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="cart-remove"
                    onClick={() => setCart((current) => current.filter((entry) => entry.id !== item.id))}
                    aria-label={`Hapus ${item.name}`}
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <p className="cart-empty">Keranjang masih kosong.</p>
            )}
          </div>
          <div className="cart-summary">
            <div className="cart-row total">
              <span>Subtotal</span>
              <strong>{formatPrice(subtotal)}</strong>
            </div>
            <p className="cart-note">Ongkos kirim dihitung saat checkout sesuai kota tujuan.</p>
          </div>
          <button className="btn-checkout btn btn-primary" onClick={onCheckout} disabled={!items.length}>
            Lanjut Checkout
          </button>
        </>
      )}
    </Modal>
  );
}

export function CheckoutModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}) {
  const { currentUser, placeOrder, shippingCities, paymentMethods } = useStore();
  const { items, subtotal } = useLiveCart();
  const [cityId, setCityId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  // Kota & ongkir diatur admin; bila kota terpilih dihapus, kembali ke kota pertama.
  const city = shippingCities.find((entry) => entry.id === cityId) ?? shippingCities[0];
  const shipping = city?.fee ?? 0;
  const canOrder = Boolean(city && paymentMethods.length);

  useEffect(() => {
    if (open) setCityId(null);
  }, [open]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length || busy || !city) return;
    const data = new FormData(event.currentTarget);
    const phone = String(data.get("phone") ?? "").replace(/[\s-]/g, "");
    if (!/^(\+62|62|0)8\d{7,12}$/.test(phone)) {
      void Swal.fire({
        icon: "error",
        title: "Nomor HP tidak valid",
        text: "Gunakan format 08xxxxxxxxxx.",
      });
      return;
    }
    setBusy(true);
    try {
      const order = await placeOrder({
        items: items.map(({ id, qty }) => ({ id, qty })),
        name: String(data.get("name") ?? "").trim(),
        phone,
        address: String(data.get("address") ?? "").trim(),
        cityId: city.id,
        payment: String(data.get("payment")),
      });
      onSuccess(order.id);
    } catch (error) {
      void Swal.fire({
        icon: "error",
        title: "Pesanan gagal dibuat",
        text: error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="checkout-box">
      <button className="auth-close" onClick={onClose} aria-label="Tutup">
        ×
      </button>
      <h3>Checkout</h3>
      <p className="auth-sub">Isi data pengiriman dengan lengkap.</p>
      <form className="checkout-form" onSubmit={submit}>
        <input
          className="form-control"
          name="name"
          type="text"
          placeholder="Nama Penerima"
          defaultValue={currentUser?.name ?? ""}
          maxLength={120}
          required
        />
        <input
          className="form-control"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="No. HP (08xx)"
          autoComplete="tel"
          required
        />
        <textarea
          className="form-control"
          name="address"
          placeholder="Alamat Lengkap (Jalan, No, RT/RW, Kelurahan, Kecamatan)"
          minLength={10}
          maxLength={500}
          required
        />
        <label className="co-label" htmlFor="coCity">
          Kota Tujuan
        </label>
        <select
          className="form-select"
          id="coCity"
          value={city?.id ?? ""}
          onChange={(event) => setCityId(Number(event.target.value))}
        >
          {shippingCities.map((entry) => (
            <option value={entry.id} key={entry.id}>
              {entry.name} ({entry.fee ? formatPrice(entry.fee) : "Gratis"})
            </option>
          ))}
        </select>
        <label className="co-label" htmlFor="coPayment">
          Metode Pembayaran
        </label>
        <select id="coPayment" name="payment" className="form-select">
          {paymentMethods.map((method) => (
            <option key={method.id}>{method.name}</option>
          ))}
        </select>
        {!canOrder && (
          <p className="cart-note" role="alert">
            Pengiriman atau pembayaran belum tersedia. Silakan hubungi kami lewat WhatsApp.
          </p>
        )}
        <div className="cart-summary">
          <div className="cart-row">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>
          <div className="cart-row">
            <span>Ongkir</span>
            <strong>{formatPrice(shipping)}</strong>
          </div>
          <div className="cart-row total">
            <span>Total Bayar</span>
            <strong>{formatPrice(subtotal + shipping)}</strong>
          </div>
        </div>
        <button type="submit" className="btn-checkout btn btn-primary" disabled={busy || !items.length || !canOrder}>
          {busy ? "Memproses..." : "Buat Pesanan"}
        </button>
      </form>
    </Modal>
  );
}

export function SuccessModal({
  orderId,
  onClose,
  onViewOrders,
}: {
  orderId: string;
  onClose: () => void;
  onViewOrders: () => void;
}) {
  return (
    <Modal open={Boolean(orderId)} onClose={onClose} className="auth-box success-box">
      <div className="success-icon">✓</div>
      <h3>Pesanan Berhasil!</h3>
      <p className="auth-sub">Nomor pesanan kamu:</p>
      <p className="order-number">{orderId}</p>
      <p className="auth-sub">Kami akan segera memproses pesanan kamu.</p>
      <div className="success-actions">
        <button className="btn btn-outline-secondary" onClick={onViewOrders}>
          Lihat Pesanan
        </button>
        <button className="btn btn-primary" onClick={onClose}>
          Tutup
        </button>
      </div>
    </Modal>
  );
}

export function CustomerOrdersModal({
  open,
  onClose,
  onAddItem,
}: {
  open: boolean;
  onClose: () => void;
  onAddItem: (id: number) => void;
}) {
  const { currentUser, menu, orders } = useStore();
  const userOrders = orders
    .filter((order) => order.userEmail === currentUser?.email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const lastOrder = userOrders[0];

  // "Menu favorit" = menu yang paling sering dipesan user; fallback 2 menu pertama.
  const favorites = useMemo(() => {
    const counts = new Map<number, number>();
    userOrders.forEach((order) =>
      order.items.forEach((item) => counts.set(item.id, (counts.get(item.id) ?? 0) + item.qty)),
    );
    const ranked = menu
      .filter((item) => counts.has(item.id))
      .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
    return (ranked.length ? ranked : menu).slice(0, 2);
  }, [menu, userOrders]);

  if (!currentUser) return null;
  return (
    <Modal open={open} onClose={onClose} className="customer-box">
      <button className="auth-close" onClick={onClose} aria-label="Tutup">
        ×
      </button>
      <div className="customer-head">
        <div className="customer-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
        <div>
          <h3>Halo, {currentUser.name} 👋</h3>
          <p className="customer-sub">{currentUser.email}</p>
        </div>
      </div>
      <div className="customer-section">
        <h4>Pesanan Terakhir</h4>
        {lastOrder ? (
          <div className="last-order-box">
            <div className="last-order-head">
              <span className="last-order-id">{lastOrder.id}</span>
              <span className="last-order-status">{STATUS_TEXT[lastOrder.status]}</span>
            </div>
            <p className="last-order-detail">
              {lastOrder.items.length} item · {formatPrice(lastOrder.total)}
            </p>
          </div>
        ) : (
          <p className="customer-empty">Belum ada pesanan. Yuk, pesan sekarang!</p>
        )}
      </div>
      <div className="customer-section">
        <h4>Menu Favorit Kamu</h4>
        <div className="fav-menu-box">
          {favorites.map((item) => (
            <button
              className="fav-menu-item"
              key={item.id}
              onClick={() => {
                onClose();
                onAddItem(item.id);
              }}
            >
              <h5>{item.name}</h5>
              <span>{formatPrice(item.price)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="customer-section">
        <h4>Riwayat Pesanan</h4>
        <div className="order-history">
          {userOrders.length ? (
            userOrders.map((order) => (
              <div className="order-history-item" key={order.id}>
                <div>
                  <strong>{order.id}</strong>
                  <br />
                  <span>
                    {new Date(order.createdAt).toLocaleDateString("id-ID")} · {order.items.length} item ·{" "}
                    {formatPrice(order.total)}
                  </span>
                </div>
                <span className={`status-mini ${order.status}`}>{STATUS_TEXT[order.status]}</span>
              </div>
            ))
          ) : (
            <p className="customer-empty">Belum ada riwayat.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
