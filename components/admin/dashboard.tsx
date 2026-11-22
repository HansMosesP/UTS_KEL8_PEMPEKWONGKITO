"use client";

import type { Order } from "../../lib/types";
import { money, statusOf, statuses } from "./shared";

export default function Dashboard({
  orders,
  customerCount,
}: {
  orders: Order[];
  customerCount: number;
}) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  const revenue = todayOrders
    .filter((order) => order.status !== "cancel")
    .reduce((sum, order) => sum + order.total, 0);
  const counts = orders.reduce<Record<string, number>>((result, order) => {
    if (order.status !== "cancel")
      order.items.forEach((item) => {
        result[item.name] = (result[item.name] ?? 0) + item.qty;
      });
    return result;
  }, {});
  const topMenus = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const sortedOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const statusCounts = statuses.map((status) => ({
    ...status,
    count: orders.filter((order) => order.status === status.key).length,
  }));
  const maximum = Math.max(1, ...statusCounts.map((status) => status.count));
  // Tanpa ikon: tiap kartu diberi warna aksen + keterangan kecil dari data.
  const stats = [
    { tone: "kunyit", label: "Pesanan Hari Ini", value: String(todayOrders.length), note: `dari ${orders.length} pesanan total` },
    { tone: "musi", label: "Pendapatan Hari Ini", value: money(revenue), note: "tidak termasuk pesanan batal" },
    {
      tone: "bata",
      label: "Menu Terlaris",
      value: topMenus[0]?.[0] ?? "-",
      note: topMenus[0] ? `${topMenus[0][1]}× dipesan` : "belum ada pesanan",
    },
    { tone: "kayu", label: "Total Pelanggan", value: String(customerCount), note: "akun terdaftar" },
  ];

  return (
    <section className="tab-content active">
      <div className="dashboard-hero">
        <div>
          <p className="dash-eyebrow">Hari ini</p>
          <h2 className="dash-title">Selamat datang kembali</h2>
          <p className="dash-sub">Ringkasan performa Wong Kito hari ini.</p>
        </div>
      </div>
      <div className="stats-grid row g-3">
        {stats.map((stat) => (
          <div className="col-12 col-sm-6 col-xl-3" key={stat.label}>
            <div className={`stat-card stat-${stat.tone} h-100`}>
              <p className="stat-label">{stat.label}</p>
              <h3>{stat.value}</h3>
              <p className="stat-note">{stat.note}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="dash-two-col">
        <div className="card">
          <h2>Statistik Pesanan</h2>
          <div className="chart-bars">
            {statusCounts.map((status) => (
              <div className="chart-row" key={status.key}>
                <span className="chart-label">{status.label}</span>
                <div className="chart-track">
                  <div
                    className={`chart-fill ${status.key}`}
                    style={{ width: `${(status.count / maximum) * 100}%` }}
                  />
                </div>
                <span className="chart-count">{status.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>Top Menu</h2>
          <div className="top-menu-list">
            {topMenus.length ? (
              topMenus.map(([name, count], index) => (
                <div className="top-menu-item" key={name}>
                  <span className="top-menu-rank">{index + 1}</span>
                  <span className="top-menu-name">{name}</span>
                  <span className="top-menu-count">{count}×</span>
                </div>
              ))
            ) : (
              <p className="admin-empty">Belum ada data.</p>
            )}
          </div>
        </div>
      </div>
      <div className="card">
        <h2>Pesanan Terbaru</h2>
        <div className="recent-orders">
          {sortedOrders.length ? (
            sortedOrders.slice(0, 5).map((order) => {
              const status = statusOf(order.status);
              return (
                <div className="recent-item" key={order.id}>
                  <div>
                    <div className="order-id">{order.id}</div>
                    <div className="order-meta">
                      {order.userName} · {order.items.length} item · {money(order.total)}
                    </div>
                  </div>
                  <span className={`order-status ${status.className}`}>{status.label}</span>
                </div>
              );
            })
          ) : (
            <p className="admin-empty">Belum ada pesanan.</p>
          )}
        </div>
      </div>
    </section>
  );
}
