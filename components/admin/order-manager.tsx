"use client";

import { useState } from "react";
import type { Order, OrderStatus } from "../../lib/types";
import { confirmDanger, money, statusOf, statuses, toastSuccess } from "./shared";

type OrderFilter = "all" | OrderStatus;

export default function OrderManager({
  orders,
  search,
  onSearch,
  onStatus,
  onDelete,
}: {
  orders: Order[];
  search: string;
  onSearch: (value: string) => void;
  onStatus: (id: string, status: OrderStatus) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const keyword = search.trim().toLowerCase();
  const visibleOrders = orders
    .filter((order) => filter === "all" || order.status === filter)
    .filter(
      (order) =>
        !keyword ||
        [order.id, order.userName, order.userEmail, order.phone].some((field) =>
          field.toLowerCase().includes(keyword),
        ),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const removeOrder = async (id: string) => {
    if (!(await confirmDanger("Hapus pesanan ini?", "Data pesanan akan hilang permanen."))) return;
    if (await onDelete(id)) toastSuccess("Pesanan dihapus");
  };

  return (
    <section className="tab-content active">
      <div className="card">
        <h2>Daftar Pesanan</h2>
        <input
          className="form-control admin-search"
          type="search"
          placeholder="Cari ID pesanan, nama, email, atau no. HP..."
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
        <div className="filter-row">
          {[{ key: "all", label: "Semua" }, ...statuses].map((item) => (
            <button
              key={item.key}
              className={`filter-btn btn btn-sm ${filter === item.key ? "active btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setFilter(item.key as OrderFilter)}
            >
              {item.label} (
              {item.key === "all" ? orders.length : orders.filter((order) => order.status === item.key).length})
            </button>
          ))}
        </div>
        <div className="orders-list">
          {visibleOrders.length ? (
            visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatus={onStatus}
                onDelete={() => void removeOrder(order.id)}
              />
            ))
          ) : (
            <p className="admin-empty">{keyword || filter !== "all" ? "Tidak ada pesanan yang cocok." : "Belum ada pesanan."}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function OrderCard({
  order,
  onStatus,
  onDelete,
}: {
  order: Order;
  onStatus: (id: string, status: OrderStatus) => Promise<boolean>;
  onDelete: () => void;
}) {
  const status = statusOf(order.status);
  const [saving, setSaving] = useState(false);
  return (
    <article className="order-card-admin">
      <div className="order-head">
        <div>
          <div className="order-id">{order.id}</div>
          <div className="order-date">{new Date(order.createdAt).toLocaleString("id-ID")}</div>
        </div>
        <span className={`order-status ${status.className}`}>{status.label}</span>
      </div>
      <div className="order-info-grid">
        <div>
          <strong>Nama:</strong> {order.userName}
        </div>
        <div>
          <strong>Akun:</strong> {order.userEmail}
        </div>
        <div>
          <strong>HP:</strong> {order.phone}
        </div>
        <div>
          <strong>Kota:</strong> {order.city}
        </div>
        <div>
          <strong>Bayar:</strong> {order.payment}
        </div>
        <div className="order-address">
          <strong>Alamat:</strong> {order.address}
        </div>
      </div>
      <div className="order-items-list">
        {order.items.map((item) => (
          <div key={item.id}>
            <span>
              {item.name} × {item.qty}
            </span>
            <span>{money(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="order-total-line">
          <span>Ongkir</span>
          <span>{money(order.ongkir)}</span>
        </div>
        <div className="order-total-line">
          <strong>Total</strong>
          <strong>{money(order.total)}</strong>
        </div>
      </div>
      <div className="order-actions">
        <select
          className="form-select"
          aria-label={`Status ${order.id}`}
          value={order.status}
          disabled={saving}
          onChange={async (event) => {
            setSaving(true);
            if (await onStatus(order.id, event.target.value as OrderStatus))
              toastSuccess("Status pesanan diperbarui");
            setSaving(false);
          }}
        >
          {statuses.map((item) => (
            <option value={item.key} key={item.key}>
              {item.label}
            </option>
          ))}
        </select>
        <button className="btn-cancel-order btn btn-outline-danger" onClick={onDelete}>
          Hapus
        </button>
      </div>
    </article>
  );
}
