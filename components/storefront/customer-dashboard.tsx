"use client";

import Link from "next/link";
import { useStore } from "../../lib/store";
import { STATUS_TEXT } from "./commerce-modals";

export default function CustomerDashboard() {
  const { ready, currentUser, orders } = useStore();
  const userOrders = orders
    .filter((order) => order.userEmail === currentUser?.email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <header className="customer-header">
        <h2>Selamat Datang di Pempek Wong Kito</h2>
      </header>
      <main className="section customer-dashboard">
        <div className="container">
          <h2>Pesanan Anda</h2>
          {!ready ? (
            <p>Memuat data...</p>
          ) : !currentUser ? (
            <p>
              Anda belum masuk. <Link href="/">Masuk di halaman utama</Link> untuk melihat
              pesanan.
            </p>
          ) : (
            <>
              <p>Halo, {currentUser.name}. Berikut riwayat pesanan Anda.</p>
              {userOrders.length ? (
                <div className="order-history">
                  {userOrders.map((order) => (
                    <article className="order-history-item" key={order.id}>
                      <div>
                        <strong>{order.id}</strong>
                        <br />
                        <span>
                          {new Date(order.createdAt).toLocaleString("id-ID")} ·{" "}
                          {order.items.map((item) => `${item.name} ×${item.qty}`).join(", ")} · Rp{" "}
                          {order.total.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <span className={`status-mini ${order.status}`}>{STATUS_TEXT[order.status]}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p>Belum ada pesanan. Yuk pilih menu favorit kami!</p>
              )}
            </>
          )}
          <Link href="/#menu">← Kembali ke Menu</Link>
        </div>
      </main>
    </>
  );
}
