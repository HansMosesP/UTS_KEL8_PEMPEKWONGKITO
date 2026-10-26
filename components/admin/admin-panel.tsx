"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Pencil,
  RotateCcw,
  Save,
  Utensils,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  DEFAULT_ADMIN,
  DEFAULT_MENU,
  SITE_TEXT_DEFAULTS,
  SITE_TEXT_FIELDS,
} from "../../lib/defaults";
import { useStore } from "../../lib/store";
import type { MenuItem, Order, OrderStatus, SiteTexts } from "../../lib/types";

type AdminTab = "dashboard" | "menu" | "orders" | "texts";
type OrderFilter = "all" | OrderStatus;
const statuses: { key: OrderStatus; label: string; className: string }[] = [
  { key: "pending", label: "Menunggu", className: "status-pending" },
  { key: "process", label: "Diproses", className: "status-process" },
  { key: "shipped", label: "Dikirim", className: "status-shipped" },
  { key: "done", label: "Selesai", className: "status-done" },
  { key: "cancel", label: "Dibatalkan", className: "status-cancel" },
];
const money = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Gagal membaca foto"));
    reader.onerror = () => reject(new Error("Gagal membaca foto"));
    reader.readAsDataURL(file);
  });
}

function AdminHeader({
  name,
  unread,
  onToggleNotifications,
  onLogout,
}: {
  name: string;
  unread: number;
  onToggleNotifications: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="admin-nav">
      <div className="admin-nav-inner">
        <div className="admin-brand">
          <img
            src="/image/logo.png"
            alt="Logo Pempek Wong Kito"
            className="admin-logo-img"
          />
          <h2>Admin Panel — Pempek Wong Kito</h2>
        </div>
        <div className="admin-nav-right">
          <button
            className="btn-notif"
            onClick={onToggleNotifications}
            aria-label="Notifikasi"
          >
            <Bell size={18} />
            <span className="notif-count">{unread}</span>
          </button>
          <span className="admin-name">{name}</span>
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function Dashboard({ orders, users }: { orders: Order[]; users: number }) {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (order) => new Date(order.createdAt).toDateString() === today,
  );
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
  const bestMenu = topMenus[0]?.[0] ?? "-";
  const sortedOrders = [...orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const maximum = Math.max(
    1,
    ...statuses.map(
      ({ key }) => orders.filter((order) => order.status === key).length,
    ),
  );
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
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card h-100">
            <div className="stat-icon">📦</div>
            <div>
              <p className="stat-label">Pesanan Hari Ini</p>
              <h3>{todayOrders.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card h-100">
            <div className="stat-icon">💰</div>
            <div>
              <p className="stat-label">Pendapatan Hari Ini</p>
              <h3>{money(revenue)}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card h-100">
            <div className="stat-icon">🏆</div>
            <div>
              <p className="stat-label">Menu Terlaris</p>
              <h3>{bestMenu}</h3>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="stat-card h-100">
            <div className="stat-icon">👥</div>
            <div>
              <p className="stat-label">Total Customer</p>
              <h3>{users}</h3>
            </div>
          </div>
        </div>
      </div>
      <div className="dash-two-col">
        <div className="card">
          <h2>Statistik Pesanan</h2>
          <div className="chart-bars">
            {statuses.map((status) => {
              const count = orders.filter(
                (order) => order.status === status.key,
              ).length;
              return (
                <div className="chart-row" key={status.key}>
                  <span className="chart-label">{status.label}</span>
                  <div className="chart-track">
                    <div
                      className={`chart-fill ${status.key}`}
                      style={{ width: `${(count / maximum) * 100}%` }}
                    />
                  </div>
                  <span className="chart-count">{count}</span>
                </div>
              );
            })}
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
            sortedOrders.slice(0, 5).map((order) => (
              <div className="recent-item" key={order.id}>
                <div>
                  <div className="order-id">{order.id}</div>
                  <div className="order-meta">
                    {order.userName} · {order.items.length} item ·{" "}
                    {money(order.total)}
                  </div>
                </div>
                <span
                  className={`order-status ${statuses.find((status) => status.key === order.status)?.className}`}
                >
                  {
                    statuses.find((status) => status.key === order.status)
                      ?.label
                  }
                </span>
              </div>
            ))
          ) : (
            <p className="admin-empty">Belum ada pesanan.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function MenuManager({
  menu,
  onSave,
}: {
  menu: MenuItem[];
  onSave: (items: MenuItem[]) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState("");
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const addMenu = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedPrice = Number(price);
    if (!name.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0)
      return;
    onSave([
      ...menu,
      {
        id: Date.now(),
        name: name.trim(),
        price: parsedPrice,
        desc: desc.trim(),
        img: photo || "/image/Pempek_palembang.jpg",
      },
    ]);
    setName("");
    setPrice("");
    setDesc("");
    setPhoto("");
    event.currentTarget.reset();
    void Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
      icon: "success",
      title: "Menu berhasil ditambahkan",
    });
  };

  const selectPhoto = async (
    file: File | undefined,
    callback: (image: string) => void,
  ) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      void Swal.fire({
        icon: "error",
        title: "Foto terlalu besar",
        text: "Ukuran foto maksimal 2MB.",
      });
      return;
    }
    try {
      callback(await readFile(file));
    } catch {
      void Swal.fire({ icon: "error", title: "Foto tidak dapat dibaca" });
    }
  };

  const deleteMenu = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Hapus menu ini?",
      text: "Menu akan dihapus dari daftar.",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) onSave(menu.filter((item) => item.id !== id));
  };

  const saveEdit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    const updated = {
      ...editing,
      name: String(data.get("name")).trim(),
      price: Number(data.get("price")),
      desc: String(data.get("desc")).trim(),
    };
    if (!updated.name || updated.price <= 0) return;
    onSave(menu.map((item) => (item.id === updated.id ? updated : item)));
    setEditing(null);
  };

  return (
    <section className="tab-content active">
      <div className="card">
        <h2>Tambah Menu Baru</h2>
        <form className="menu-create-form" onSubmit={addMenu}>
          <input
            className="form-control"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nama Menu"
            required
          />
          <input
            className="form-control"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            type="number"
            min="1"
            placeholder="Harga (contoh: 15000)"
            required
          />
          <input
            className="form-control"
            value={desc}
            onChange={(event) => setDesc(event.target.value)}
            placeholder="Deskripsi (opsional)"
          />
          <label className="file-label">
            <span>📷 Pilih Foto Menu</span>
            <input
              className="form-control"
              type="file"
              accept="image/*"
              onChange={(event) =>
                void selectPhoto(event.target.files?.[0], setPhoto)
              }
            />
          </label>
          {photo && (
            <div className="preview-wrap">
              <img src={photo} alt="Pratinjau menu baru" />
            </div>
          )}
          <button type="submit" className="btn-primary btn">
            Tambah Menu
          </button>
        </form>
      </div>
      <div className="card">
        <h2>Kelola Menu</h2>
        <div className="admin-menu">
          {menu.length ? (
            menu.map((item) => (
              <article className="admin-menu-item" key={item.id}>
                <img src={item.img} alt={item.name} />
                <div className="admin-menu-info">
                  <h4>{item.name}</h4>
                  <p>{item.desc || "-"}</p>
                  <strong>{money(item.price)}</strong>
                </div>
                <div className="admin-menu-actions">
                  <button
                    className="btn-edit btn btn-outline-secondary"
                    onClick={() => setEditing(item)}
                  >
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    className="btn-delete btn btn-outline-danger"
                    onClick={() => void deleteMenu(item.id)}
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="admin-empty">Belum ada menu.</p>
          )}
        </div>
      </div>
      {editing && (
        <div
          className="edit-modal show"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setEditing(null)
          }
        >
          <form className="edit-box" onSubmit={saveEdit}>
            <button
              type="button"
              className="edit-close"
              onClick={() => setEditing(null)}
              aria-label="Tutup"
            >
              ×
            </button>
            <h3>Edit Menu</h3>
            <p className="edit-sub">Ubah data menu sesuai kebutuhan.</p>
            <label className="edit-label">Foto Menu</label>
            <div className="edit-photo">
              <img src={editing.img} alt={`Pratinjau ${editing.name}`} />
              <label className="edit-photo-btn">
                <span>📷 Ganti Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    void selectPhoto(event.target.files?.[0], (image) =>
                      setEditing({ ...editing, img: image }),
                    )
                  }
                />
              </label>
            </div>
            <label className="edit-label">Nama Menu</label>
            <input
              className="form-control"
              name="name"
              defaultValue={editing.name}
              required
            />
            <label className="edit-label">Harga (Rp)</label>
            <input
              className="form-control"
              name="price"
              type="number"
              min="1"
              defaultValue={editing.price}
              required
            />
            <label className="edit-label">Deskripsi</label>
            <textarea
              className="form-control"
              name="desc"
              defaultValue={editing.desc}
            />
            <div className="edit-actions">
              <button
                type="button"
                className="btn-cancel-edit btn btn-outline-secondary"
                onClick={() => setEditing(null)}
              >
                Batal
              </button>
              <button className="btn-save-edit btn btn-primary" type="submit">
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function OrderManager({
  orders,
  onSave,
}: {
  orders: Order[];
  onSave: (items: Order[]) => void;
}) {
  const [filter, setFilter] = useState<OrderFilter>("all");
  const visibleOrders = orders
    .filter((order) => filter === "all" || order.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const updateStatus = (id: string, status: OrderStatus) =>
    onSave(
      orders.map((order) =>
        order.id === id
          ? { ...order, status, updatedAt: new Date().toISOString() }
          : order,
      ),
    );
  const removeOrder = async (id: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Hapus pesanan ini?",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) onSave(orders.filter((order) => order.id !== id));
  };
  return (
    <section className="tab-content active">
      <div className="card">
        <h2>Daftar Pesanan</h2>
        <div className="filter-row">
          {[
            { key: "all", label: "Semua" },
            ...statuses.map(({ key, label }) => ({ key, label })),
          ].map((item) => (
            <button
              key={item.key}
              className={`filter-btn btn btn-sm ${filter === item.key ? "active btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setFilter(item.key as OrderFilter)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="orders-list">
          {visibleOrders.length ? (
            visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatus={updateStatus}
                onDelete={() => void removeOrder(order.id)}
              />
            ))
          ) : (
            <p className="admin-empty">Belum ada pesanan.</p>
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
  onStatus: (id: string, status: OrderStatus) => void;
  onDelete: () => void;
}) {
  const status =
    statuses.find((item) => item.key === order.status) ?? statuses[0];
  return (
    <article className="order-card-admin">
      <div className="order-head">
        <div>
          <div className="order-id">{order.id}</div>
          <div className="order-date">
            {new Date(order.createdAt).toLocaleString("id-ID")}
          </div>
        </div>
        <span className={`order-status ${status.className}`}>
          {status.label}
        </span>
      </div>
      <div className="order-info-grid">
        <div>
          <strong>Nama:</strong> {order.userName}
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
          onChange={(event) =>
            onStatus(order.id, event.target.value as OrderStatus)
          }
        >
          {statuses.map((item) => (
            <option value={item.key} key={item.key}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          className="btn-cancel-order btn btn-outline-danger"
          onClick={onDelete}
        >
          Hapus
        </button>
      </div>
    </article>
  );
}

function TextEditor({
  savedTexts,
  onSave,
}: {
  savedTexts: SiteTexts;
  onSave: (texts: SiteTexts) => void;
}) {
  const [group, setGroup] = useState("all");
  const [draft, setDraft] = useState<SiteTexts>(savedTexts);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setDraft(savedTexts);
    setDirty(false);
  }, [savedTexts]);
  const groups = [...new Set(SITE_TEXT_FIELDS.map((field) => field.group))];
  const handleChange = (key: string, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const words = (
      draft["hero.typingWords"] ?? SITE_TEXT_DEFAULTS["hero.typingWords"]
    )
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean);
    if (!words.length) {
      void Swal.fire({
        icon: "warning",
        title: "Teks berjalan minimal berisi 1 kata",
      });
      return;
    }
    const compact = Object.fromEntries(
      Object.entries(draft).filter(
        ([key, value]) => value !== SITE_TEXT_DEFAULTS[key],
      ),
    );
    onSave(compact);
    setDirty(false);
    void Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
      icon: "success",
      title: "Teks website berhasil disimpan",
    });
  };
  const resetAll = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Kembalikan semua teks?",
      text: "Semua teks website akan kembali seperti semula.",
      showCancelButton: true,
      confirmButtonText: "Ya, Kembalikan",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      setDraft({});
      onSave({});
      setDirty(false);
    }
  };

  return (
    <section className="tab-content active">
      <div className="card">
        <h2>Edit Teks Website</h2>
        <p className="texts-intro">
          Ubah tulisan yang tampil di halaman utama tanpa menyentuh kode. Klik{" "}
          <strong>Simpan Perubahan</strong> untuk menerapkan.
        </p>
        <div className="texts-toolbar">
          <Link href="/" target="_blank" className="btn-view-site">
            🌐 Lihat Website
          </Link>
          <button
            type="button"
            className="btn-reset-all btn btn-outline-danger"
            onClick={() => void resetAll()}
          >
            <RotateCcw size={15} /> Kembalikan Semua ke Awal
          </button>
        </div>
        <div className="filter-row">
          {["all", ...groups].map((item) => (
            <button
              className={`filter-btn btn btn-sm ${group === item ? "active btn-primary" : "btn-outline-secondary"}`}
              key={item}
              onClick={() => setGroup(item)}
            >
              {item === "all" ? "Semua Bagian" : item}
            </button>
          ))}
        </div>
        <form onSubmit={save}>
          <div className="texts-fields">
            {groups
              .filter((item) => group === "all" || group === item)
              .map((item) => (
                <div className="text-group" key={item}>
                  <h3 className="text-group-title">{item}</h3>
                  {SITE_TEXT_FIELDS.filter((field) => field.group === item).map(
                    (field) => {
                      const value = draft[field.key] ?? field.default;
                      const changed = value !== field.default;
                      return (
                        <div
                          className={`text-field ${changed ? "changed" : ""}`}
                          key={field.key}
                        >
                          <div className="text-field-head">
                            <label className="edit-label" htmlFor={field.key}>
                              {field.label}
                            </label>
                            {changed && (
                              <span className="text-field-badge">diubah</span>
                            )}
                            <button
                              type="button"
                              className="btn-reset-field btn btn-sm btn-outline-secondary"
                              title="Kembalikan ke teks awal"
                              onClick={() =>
                                handleChange(field.key, field.default)
                              }
                            >
                              ↺ Awal
                            </button>
                          </div>
                          {field.multiline ? (
                            <textarea
                              className="form-control"
                              id={field.key}
                              rows={3}
                              value={value}
                              onChange={(event) =>
                                handleChange(field.key, event.target.value)
                              }
                            />
                          ) : (
                            <input
                              className="form-control"
                              id={field.key}
                              value={value}
                              onChange={(event) =>
                                handleChange(field.key, event.target.value)
                              }
                            />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              ))}
          </div>
          <div className="texts-savebar">
            <span className="texts-dirty">
              {dirty ? "● Ada perubahan yang belum disimpan" : ""}
            </span>
            <button type="submit" className="btn btn-primary">
              <Save size={15} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default function AdminPanel() {
  const {
    ready,
    currentUser,
    users,
    menu,
    orders,
    notifications,
    siteTexts,
    setCurrentUser,
    setMenu,
    setOrders,
    setNotifications,
    setSiteTexts,
  } = useStore();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const lastOrderCount = useRef(-1);
  const unread = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    if (ready && currentUser?.role !== "admin") window.location.replace("/");
  }, [ready, currentUser]);

  useEffect(() => {
    if (!ready) return;
    if (lastOrderCount.current < 0) {
      lastOrderCount.current = orders.length;
      return;
    }
    if (orders.length <= lastOrderCount.current) {
      lastOrderCount.current = orders.length;
      return;
    }
    const newOrders = orders.slice(lastOrderCount.current);
    lastOrderCount.current = orders.length;
    const next = newOrders.map((order) => ({
      id: Date.now() + Math.random(),
      title: `Pesanan Baru: ${order.id}`,
      body: `${order.userName} - ${order.items.length} item - ${money(order.total)}`,
      read: false,
      time: new Date().toISOString(),
    }));
    setNotifications([...next, ...notifications]);
  }, [orders, ready]);

  const sortedNotifications = useMemo(
    () => notifications.slice(0, 20),
    [notifications],
  );
  const addStatusNotification = (order: Order) => {
    const item = {
      id: Date.now(),
      title: `Pesanan ${order.id} ${order.status === "shipped" ? "dikirim" : "selesai"}`,
      body: `${order.userName} - ${money(order.total)}`,
      read: false,
      time: new Date().toISOString(),
    };
    setNotifications([item, ...notifications]);
  };
  const updateOrders = (next: Order[]) => {
    const changed = next.find((item) =>
      orders.some((old) => old.id === item.id && old.status !== item.status),
    );
    if (changed && (changed.status === "shipped" || changed.status === "done"))
      addStatusNotification(changed);
    setOrders(next);
  };
  const logout = async () => {
    const result = await Swal.fire({
      title: "Yakin mau keluar?",
      text: "Kamu akan logout dari panel admin.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
    });
    if (result.isConfirmed) {
      setCurrentUser(null);
      window.location.assign("/");
    }
  };
  const markAllRead = () =>
    setNotifications(notifications.map((item) => ({ ...item, read: true })));

  if (!ready || currentUser?.role !== "admin")
    return (
      <main className="admin-loading">
        <p>Memeriksa akses admin...</p>
      </main>
    );
  return (
    <div className="admin-app">
      <AdminHeader
        name={currentUser.name}
        unread={unread}
        onToggleNotifications={() => setNotificationsOpen((open) => !open)}
        onLogout={() => void logout()}
      />
      <aside className={`notif-panel ${notificationsOpen ? "show" : ""}`}>
        <div className="notif-head">
          <strong>Notifikasi Pesanan</strong>
          <button onClick={markAllRead}>Tandai semua dibaca</button>
        </div>
        <div className="notif-list">
          {sortedNotifications.length ? (
            sortedNotifications.map((item) => (
              <button
                className={`notif-item ${item.read ? "" : "unread"}`}
                key={item.id}
                onClick={() =>
                  setNotifications(
                    notifications.map((entry) =>
                      entry.id === item.id ? { ...entry, read: true } : entry,
                    ),
                  )
                }
              >
                <strong>{item.title}</strong>
                <span>
                  {item.body} · {new Date(item.time).toLocaleString("id-ID")}
                </span>
              </button>
            ))
          ) : (
            <div className="notif-empty">Belum ada notifikasi.</div>
          )}
        </div>
      </aside>
      <main className="container admin-container">
        <nav
          className="tab-nav nav nav-pills gap-2"
          aria-label="Navigasi admin"
        >
          <button
            className={`tab-btn nav-link ${tab === "dashboard" ? "active" : ""}`}
            onClick={() => setTab("dashboard")}
          >
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button
            className={`tab-btn nav-link ${tab === "menu" ? "active" : ""}`}
            onClick={() => setTab("menu")}
          >
            <Utensils size={16} /> Kelola Menu
          </button>
          <button
            className={`tab-btn nav-link ${tab === "orders" ? "active" : ""}`}
            onClick={() => setTab("orders")}
          >
            <ClipboardList size={16} /> Pesanan
          </button>
          <button
            className={`tab-btn nav-link ${tab === "texts" ? "active" : ""}`}
            onClick={() => setTab("texts")}
          >
            <Pencil size={16} /> Edit Teks Website
          </button>
        </nav>
        {tab === "dashboard" && (
          <Dashboard orders={orders} users={users.length} />
        )}
        {tab === "menu" && <MenuManager menu={menu} onSave={setMenu} />}
        {tab === "orders" && (
          <OrderManager orders={orders} onSave={updateOrders} />
        )}
        {tab === "texts" && (
          <TextEditor savedTexts={siteTexts} onSave={setSiteTexts} />
        )}
      </main>
    </div>
  );
}
