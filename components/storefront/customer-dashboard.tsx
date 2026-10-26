"use client";

import Link from "next/link";
import { useStore } from "../../lib/store";

export default function CustomerDashboard() {
  const { currentUser, orders } = useStore();
  const userOrders = orders
    .filter((order) => order.userEmail === currentUser?.email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <header className="customer-header">
        <h2>Selamat Datang di Pempek Wong Kito</h2>
      </header>
      <main className="section customer-dashboard">
        <h2>Pesanan Anda</h2>
        <p>
          {currentUser
            ? `Halo, ${currentUser.name}. Berikut riwayat pesanan Anda.`
            : "Silahkan pilih menu favorit kami."}
        </p>
        {currentUser && userOrders.length > 0 && (
          <div className="order-history">
            {userOrders.map((order) => (
              <article className="order-history-item" key={order.id}>
                <div>
                  <strong>{order.id}</strong>
                  <br />
                  <span>
                    {order.items.length} item · Rp{" "}
                    {order.total.toLocaleString("id-ID")}
                  </span>
                </div>
                <span className={`status-mini ${order.status}`}>
                  {order.status}
                </span>
              </article>
            ))}
          </div>
        )}
        {!currentUser && (
          <p>
            <Link href="/">Masuk untuk melihat pesanan</Link>
          </p>
        )}
        <Link href="/">Kembali</Link>
      </main>
    </>
  );
}
