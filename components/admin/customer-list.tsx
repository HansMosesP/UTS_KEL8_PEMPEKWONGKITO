"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { Order, User } from "../../lib/types";
import { money } from "./shared";

type CustomerRow = {
  key: string;
  name: string;
  email: string;
  registered: boolean;
  joinedAt?: string;
  orderCount: number;
  spent: number;
  lastOrder?: string;
  lastPhone?: string;
  lastCity?: string;
};
type SortKey = "name" | "joinedAt" | "orderCount" | "spent" | "lastOrder";
type Filter = "all" | "buyers" | "noOrders";

function buildRows(users: User[], orders: Order[]): CustomerRow[] {
  const rows = new Map<string, CustomerRow>();
  for (const user of users) {
    if (user.role !== "customer") continue;
    const email = user.email.toLowerCase();
    rows.set(email, {
      key: email,
      name: user.name,
      email: user.email,
      registered: true,
      // Akun lama belum punya createdAt; id-nya dibuat dari Date.now().
      joinedAt: user.createdAt ?? (user.id && user.id > 1e12 ? new Date(user.id).toISOString() : undefined),
      orderCount: 0,
      spent: 0,
    });
  }
  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  for (const order of sorted) {
    const email = order.userEmail.toLowerCase();
    const row =
      rows.get(email) ??
      // Pesanan lama (mis. dari tamu) tetap tampil agar bisa dipantau.
      ({
        key: email === "guest" ? `guest:${order.phone}` : email,
        name: order.userName,
        email: email === "guest" ? "-" : order.userEmail,
        registered: false,
        orderCount: 0,
        spent: 0,
      } satisfies CustomerRow);
    row.orderCount += 1;
    if (order.status !== "cancel") row.spent += order.total;
    row.lastOrder = order.createdAt;
    row.lastPhone = order.phone;
    row.lastCity = order.city.replace(/\s*\(.*\)$/, "");
    rows.set(row.key, row);
  }
  return [...rows.values()];
}

function toCsv(rows: CustomerRow[]) {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const header = ["Nama", "Email", "Status", "Terdaftar", "No. HP", "Kota", "Jumlah Pesanan", "Total Belanja", "Pesanan Terakhir"];
  const lines = rows.map((row) =>
    [
      row.name,
      row.email,
      row.registered ? "Terdaftar" : "Tamu",
      row.joinedAt ? new Date(row.joinedAt).toLocaleDateString("id-ID") : "-",
      row.lastPhone ?? "-",
      row.lastCity ?? "-",
      row.orderCount,
      row.spent,
      row.lastOrder ? new Date(row.lastOrder).toLocaleString("id-ID") : "-",
    ]
      .map(escape)
      .join(","),
  );
  return "﻿" + [header.map(escape).join(","), ...lines].join("\n");
}

export default function CustomerList({
  users,
  orders,
  onViewOrders,
}: {
  users: User[];
  orders: Order[];
  onViewOrders: (keyword: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "lastOrder", desc: true });
  const allRows = useMemo(() => buildRows(users, orders), [users, orders]);

  const keyword = search.trim().toLowerCase();
  const rows = allRows
    .filter((row) => (filter === "buyers" ? row.orderCount > 0 : filter === "noOrders" ? row.orderCount === 0 : true))
    .filter(
      (row) =>
        !keyword ||
        [row.name, row.email, row.lastPhone ?? ""].some((field) => field.toLowerCase().includes(keyword)),
    )
    .sort((a, b) => {
      const left = a[sort.key] ?? "";
      const right = b[sort.key] ?? "";
      const result =
        typeof left === "number" && typeof right === "number"
          ? left - right
          : String(left).localeCompare(String(right), "id");
      return sort.desc ? -result : result;
    });

  const registered = allRows.filter((row) => row.registered).length;
  const buyers = allRows.filter((row) => row.orderCount > 0).length;
  const totalSpent = allRows.reduce((sum, row) => sum + row.spent, 0);

  const header = (key: SortKey, label: string) => (
    <th aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button
        type="button"
        className="th-sort"
        onClick={() => setSort((current) => ({ key, desc: current.key === key ? !current.desc : true }))}
      >
        {label} {sort.key === key ? (sort.desc ? "↓" : "↑") : ""}
      </button>
    </th>
  );

  const exportCsv = () => {
    const url = URL.createObjectURL(new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `pelanggan-pempek-wong-kito-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="tab-content active">
      <div className="stats-grid row g-3">
        {[
          { tone: "kayu", label: "Akun Terdaftar", value: String(registered), note: "pelanggan punya akun" },
          { tone: "kunyit", label: "Pernah Belanja", value: String(buyers), note: "minimal 1 pesanan" },
          { tone: "musi", label: "Total Belanja Pelanggan", value: money(totalSpent), note: "tidak termasuk pesanan batal" },
        ].map((stat) => (
          <div className="col-12 col-md-4" key={stat.label}>
            <div className={`stat-card stat-${stat.tone} h-100`}>
              <p className="stat-label">{stat.label}</p>
              <h3>{stat.value}</h3>
              <p className="stat-note">{stat.note}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2>List Pelanggan</h2>
        <div className="customer-toolbar">
          <input
            className="form-control admin-search"
            type="search"
            placeholder="Cari nama, email, atau no. HP..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="button" className="btn btn-outline-secondary btn-export" onClick={exportCsv} disabled={!rows.length}>
            <Download size={15} /> Ekspor CSV
          </button>
        </div>
        <div className="filter-row">
          {(
            [
              ["all", "Semua"],
              ["buyers", "Pernah Transaksi"],
              ["noOrders", "Belum Transaksi"],
            ] as [Filter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              className={`filter-btn btn btn-sm ${filter === key ? "active btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        {rows.length ? (
          <div className="table-wrap">
            <table className="customer-table">
              <thead>
                <tr>
                  {header("name", "Pelanggan")}
                  <th>Kontak</th>
                  {header("joinedAt", "Terdaftar")}
                  {header("orderCount", "Pesanan")}
                  {header("spent", "Total Belanja")}
                  {header("lastOrder", "Terakhir Pesan")}
                  <th aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-initial">{row.name.charAt(0).toUpperCase()}</span>
                        <div>
                          <strong>{row.name}</strong>
                          <span className={`customer-badge ${row.registered ? "member" : "guest"}`}>
                            {row.registered ? "Terdaftar" : "Tamu"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-stack">
                        <span>{row.email}</span>
                        <small>{row.lastPhone ?? "-"}{row.lastCity ? ` · ${row.lastCity}` : ""}</small>
                      </div>
                    </td>
                    <td>{row.joinedAt ? new Date(row.joinedAt).toLocaleDateString("id-ID") : "-"}</td>
                    <td className="num">{row.orderCount}</td>
                    <td className="num">{money(row.spent)}</td>
                    <td>{row.lastOrder ? new Date(row.lastOrder).toLocaleDateString("id-ID") : "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled={!row.orderCount}
                        onClick={() => onViewOrders(row.email !== "-" ? row.email : row.lastPhone ?? row.name)}
                      >
                        Lihat Pesanan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-empty">{allRows.length ? "Tidak ada pelanggan yang cocok." : "Belum ada pelanggan terdaftar."}</p>
        )}
      </div>
    </section>
  );
}
