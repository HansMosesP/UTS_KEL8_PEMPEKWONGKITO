"use client";

import { useEffect, useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import { useStore } from "../../lib/store";
import type { Order } from "../../lib/types";
import Modal from "../shared/modal";

const cities = [
  [8000, "Palembang"],
  [15000, "Lahat / Prabumulih"],
  [25000, "Jambi / Bandar Lampung"],
  [35000, "Jakarta / Bandung"],
  [45000, "Surabaya / Makassar"],
] as const;
const formatPrice = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;

export function CartModal({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const { cart, setCart } = useStore();
  const [shipping, setShipping] = useState(0);
  useEffect(() => {
    if (open) setShipping(Number(localStorage.getItem("lastOngkir") ?? 0));
  }, [open]);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const changeQty = (id: number, delta: number) =>
    setCart(
      cart.flatMap((item) =>
        item.id !== id
          ? [item]
          : item.qty + delta > 0
            ? [{ ...item, qty: item.qty + delta }]
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
      <div className="cart-items">
        {cart.length ? (
          cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.img} alt={item.name} />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <p>{formatPrice(item.price)}</p>
                <div className="cart-qty">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => changeQty(item.id, -1)}
                    aria-label="Kurangi"
                  >
                    −
                  </button>
                  <span>{item.qty}</span>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => changeQty(item.id, 1)}
                    aria-label="Tambah"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                className="cart-remove"
                onClick={() =>
                  setCart(cart.filter((entry) => entry.id !== item.id))
                }
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
        <div className="cart-row">
          <span>Subtotal</span>
          <strong>{formatPrice(subtotal)}</strong>
        </div>
        <div className="cart-row">
          <span>Ongkos Kirim</span>
          <strong>{formatPrice(shipping)}</strong>
        </div>
        <div className="cart-row total">
          <span>Total</span>
          <strong>{formatPrice(subtotal + shipping)}</strong>
        </div>
      </div>
      <button
        className="btn-checkout btn btn-primary"
        onClick={onCheckout}
        disabled={!cart.length}
      >
        Lanjut Checkout
      </button>
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
  const { cart, currentUser, orders, setCart, setOrders } = useStore();
  const [cityIndex, setCityIndex] = useState(0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = cities[cityIndex][0];

  useEffect(() => {
    if (open) {
      setCityIndex(0);
      localStorage.setItem("lastOngkir", String(cities[0][0]));
    }
  }, [open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cart.length) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const address = String(data.get("address") ?? "").trim();
    if (phone.length < 9) {
      void Swal.fire({
        icon: "error",
        title: "Nomor HP tidak valid",
        text: "Masukkan nomor HP yang benar.",
      });
      return;
    }
    const id = `PWK-${Date.now().toString().slice(-8)}`;
    const order: Order = {
      id,
      userEmail: currentUser?.email ?? "guest",
      userName: name,
      phone,
      address,
      city: `${cities[cityIndex][1]} (${formatPrice(shipping)})`,
      payment: String(data.get("payment")),
      items: cart,
      subtotal,
      ongkir: shipping,
      total: subtotal + shipping,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setOrders([...orders, order]);
    setCart([]);
    onSuccess(id);
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
          required
        />
        <input
          className="form-control"
          name="phone"
          type="tel"
          placeholder="No. HP (08xx)"
          required
        />
        <textarea
          className="form-control"
          name="address"
          placeholder="Alamat Lengkap (Jalan, No, RT/RW, Kelurahan, Kecamatan)"
          required
        />
        <label className="co-label" htmlFor="coCity">
          Kota Tujuan
        </label>
        <select
          className="form-select"
          id="coCity"
          value={cityIndex}
          onChange={(event) => {
            const index = Number(event.target.value);
            setCityIndex(index);
            localStorage.setItem("lastOngkir", String(cities[index][0]));
          }}
        >
          {cities.map(([price, city], index) => (
            <option value={index} key={city}>
              {city} ({formatPrice(price)})
            </option>
          ))}
        </select>
        <label className="co-label" htmlFor="coPayment">
          Metode Pembayaran
        </label>
        <select id="coPayment" name="payment" className="form-select">
          <option>Transfer Bank</option>
          <option>COD (Bayar di Tempat)</option>
          <option>QRIS</option>
          <option>E-Wallet (OVO/Dana)</option>
        </select>
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
        <button type="submit" className="btn-checkout btn btn-primary">
          Buat Pesanan
        </button>
      </form>
    </Modal>
  );
}

export function SuccessModal({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  return (
    <Modal
      open={Boolean(orderId)}
      onClose={onClose}
      className="auth-box success-box"
    >
      <div className="success-icon">✓</div>
      <h3>Pesanan Berhasil!</h3>
      <p className="auth-sub">Nomor pesanan kamu:</p>
      <p className="order-number">{orderId}</p>
      <p className="auth-sub">Kami akan segera memproses pesanan kamu.</p>
      <button className="btn btn-primary" onClick={onClose}>
        Tutup
      </button>
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
  const statusText = {
    pending: "Menunggu",
    process: "Diproses",
    shipped: "Dikirim",
    done: "Selesai",
    cancel: "Dibatalkan",
  };
  return (
    <Modal open={open} onClose={onClose} className="customer-box">
      <button className="auth-close" onClick={onClose} aria-label="Tutup">
        ×
      </button>
      <div className="customer-head">
        <div className="customer-avatar">
          {currentUser?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3>Halo, {currentUser?.name} 👋</h3>
          <p className="customer-sub">Selamat datang kembali di Wong Kito</p>
        </div>
      </div>
      <div className="customer-section">
        <h4>Pesanan Terakhir</h4>
        {lastOrder ? (
          <div className="last-order-box">
            <div className="last-order-head">
              <span className="last-order-id">{lastOrder.id}</span>
              <span className="last-order-status">
                {statusText[lastOrder.status]}
              </span>
            </div>
            <p className="last-order-detail">
              {lastOrder.items.length} item · {formatPrice(lastOrder.total)}
            </p>
          </div>
        ) : (
          <p className="customer-empty">
            Belum ada pesanan. Yuk, pesan sekarang!
          </p>
        )}
      </div>
      <div className="customer-section">
        <h4>Menu Favorit Kamu</h4>
        <div className="fav-menu-box">
          {menu.slice(0, 2).map((item) => (
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
                    {order.items.length} item · {formatPrice(order.total)}
                  </span>
                </div>
                <span className={`status-mini ${order.status}`}>
                  {statusText[order.status]}
                </span>
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
