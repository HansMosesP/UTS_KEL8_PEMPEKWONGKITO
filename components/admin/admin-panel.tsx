"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bell, LogOut } from "lucide-react";
import Swal from "sweetalert2";
import { useStore } from "../../lib/store";
import CheckoutEditor from "./checkout-editor";
import ContentEditor from "./content-editor";
import CustomerList from "./customer-list";
import Dashboard from "./dashboard";
import MediaEditor from "./media-editor";
import MenuManager from "./menu-manager";
import OrderManager from "./order-manager";
import SettingsEditor from "./settings-editor";
import TextEditor from "./text-editor";

type AdminTab =
  | "dashboard"
  | "orders"
  | "customers"
  | "menu"
  | "content"
  | "media"
  | "checkout"
  | "settings"
  | "texts";

/** row 1 = baris atas, row 2 = baris bawah (ditaruh di tengah). */
const TABS: { key: AdminTab; label: string; row: 1 | 2 }[] = [
  { key: "dashboard", label: "Dashboard", row: 1 },
  { key: "orders", label: "Pesanan", row: 1 },
  { key: "customers", label: "Pelanggan", row: 1 },
  { key: "menu", label: "Kelola Menu", row: 1 },
  { key: "content", label: "Konten Halaman", row: 1 },
  { key: "media", label: "Gambar & Galeri", row: 1 },
  { key: "checkout", label: "Ongkir & Pembayaran", row: 1 },
  { key: "settings", label: "Peta & Kontak", row: 2 },
  { key: "texts", label: "Edit Teks Website", row: 2 },
];

function AdminLogin({ blocked }: { blocked: boolean }) {
  const { authenticate, logout } = useStore();
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    const result = await authenticate("login", {
      email: String(data.get("email") ?? "").trim().toLowerCase(),
      password: String(data.get("password") ?? ""),
    });
    setBusy(false);
    if (!result.ok) {
      void Swal.fire({ icon: "error", title: "Login gagal", text: result.error });
    } else if (result.user.role !== "admin") {
      void Swal.fire({ icon: "error", title: "Bukan akun admin", text: "Akun ini tidak punya akses panel admin." });
    }
  };
  return (
    <div className="admin-app">
      <main className="admin-loading">
        <form className="card admin-login" onSubmit={submit}>
          <img src="/image/logo.png" alt="Logo Pempek Wong Kito" className="admin-logo-img" />
          <h2>Masuk Panel Admin</h2>
          {blocked ? (
            <>
              <p className="texts-intro">Akun yang sedang login bukan admin.</p>
              <button type="button" className="btn btn-primary" onClick={() => void logout()}>
                Logout &amp; masuk sebagai admin
              </button>
            </>
          ) : (
            <>
              <input className="form-control" name="email" type="email" placeholder="Email admin" autoComplete="username" required />
              <input
                className="form-control"
                name="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
              />
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? "Memproses..." : "Masuk"}
              </button>
            </>
          )}
          <Link href="/" className="admin-back">
            ← Kembali ke website
          </Link>
        </form>
      </main>
    </div>
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
    settings,
    logout,
    saveContent,
    updateOrderStatus,
    deleteOrder,
    markNotificationsRead,
  } = useStore();
  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [textGroup, setTextGroup] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const pendingCount = orders.filter((order) => order.status === "pending").length;
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const seenNotif = useRef<number | null>(null);
  const unread = notifications.filter((item) => !item.read).length;
  const customerCount = users.filter((user) => user.role === "customer").length;

  // Toast ketika ada notifikasi baru (pesanan masuk) dari polling.
  useEffect(() => {
    if (!ready || currentUser?.role !== "admin") return;
    const newest = notifications[0]?.id ?? 0;
    if (seenNotif.current !== null && newest > seenNotif.current && !notifications[0].read) {
      void Swal.fire({
        toast: true,
        position: "top-end",
        timer: 4000,
        showConfirmButton: false,
        icon: "info",
        title: notifications[0].title,
        text: notifications[0].body,
      });
    }
    seenNotif.current = Math.max(seenNotif.current ?? 0, newest);
  }, [notifications, ready, currentUser?.role]);

  // Tutup panel notifikasi saat klik di luar.
  useEffect(() => {
    if (!notificationsOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!notifPanelRef.current?.contains(event.target as Node)) setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [notificationsOpen]);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Yakin mau keluar?",
      text: "Kamu akan logout dari panel admin.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;
    await logout();
    window.location.assign("/");
  };

  if (!ready)
    return (
      <div className="admin-app">
        <main className="admin-loading">
          <p>Memeriksa akses admin...</p>
        </main>
      </div>
    );
  if (currentUser?.role !== "admin") return <AdminLogin blocked={Boolean(currentUser)} />;

  return (
    <div className="admin-app">
      <header className="admin-nav">
        <div className="admin-nav-inner">
          <div className="admin-brand">
            <img src="/image/logo.png" alt="Logo Pempek Wong Kito" className="admin-logo-img" />
            <h2>Admin Panel — Pempek Wong Kito</h2>
          </div>
          <div className="admin-nav-right" ref={notifPanelRef}>
            <Link href="/" target="_blank" className="btn-view-site btn-sm-nav">
              Lihat Website
            </Link>
            <button
              className="btn-notif"
              onClick={() => setNotificationsOpen((open) => !open)}
              aria-label={`Notifikasi (${unread} belum dibaca)`}
              aria-expanded={notificationsOpen}
            >
              <Bell size={18} />
              {unread > 0 && <span className="notif-count">{unread}</span>}
            </button>
            <span className="admin-name">{currentUser.name}</span>
            <button className="btn-logout" onClick={() => void handleLogout()}>
              <LogOut size={15} /> Logout
            </button>
            <aside className={`notif-panel ${notificationsOpen ? "show" : ""}`}>
              <div className="notif-head">
                <strong>Notifikasi Pesanan</strong>
                <button onClick={() => void markNotificationsRead("all")} disabled={!unread}>
                  Tandai semua dibaca
                </button>
              </div>
              <div className="notif-list">
                {notifications.length ? (
                  notifications.slice(0, 20).map((item) => (
                    <button
                      className={`notif-item ${item.read ? "" : "unread"}`}
                      key={item.id}
                      onClick={() => {
                        if (!item.read) void markNotificationsRead([item.id]);
                        const orderId = item.title.match(/PWK-[\w]+/)?.[0];
                        if (orderId) {
                          setOrderSearch(orderId);
                          setTab("orders");
                          setNotificationsOpen(false);
                        }
                      }}
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
          </div>
        </div>
      </header>
      <main className="container admin-container">
        <nav className="tab-nav nav nav-pills" aria-label="Navigasi admin">
          {([1, 2] as const).map((row) => (
            <div className="tab-row" key={row}>
              {TABS.filter((item) => item.row === row).map((item) => (
                <button
                  key={item.key}
                  className={`tab-btn nav-link ${tab === item.key ? "active" : ""}`}
                  aria-current={tab === item.key ? "page" : undefined}
                  onClick={() => {
                    setTab(item.key);
                    if (item.key === "texts") setTextGroup("all");
                  }}
                >
                  {item.label}
                  {item.key === "orders" && pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        {tab === "dashboard" && <Dashboard orders={orders} customerCount={customerCount} />}
        {tab === "orders" && (
          <OrderManager
            orders={orders}
            search={orderSearch}
            onSearch={setOrderSearch}
            onStatus={updateOrderStatus}
            onDelete={deleteOrder}
          />
        )}
        {tab === "customers" && (
          <CustomerList
            users={users}
            orders={orders}
            onViewOrders={(keyword) => {
              setOrderSearch(keyword);
              setTab("orders");
            }}
          />
        )}
        {tab === "menu" && <MenuManager menu={menu} onSave={(items) => saveContent("menuData", items)} />}
        {tab === "content" && <ContentEditor />}
        {tab === "media" && <MediaEditor />}
        {tab === "checkout" && <CheckoutEditor />}
        {tab === "settings" && (
          <SettingsEditor
            settings={settings}
            onSave={(value) => saveContent("siteSettings", value)}
            onEditContactTexts={() => {
              setTextGroup("Lokasi & Kontak");
              setTab("texts");
            }}
          />
        )}
        {tab === "texts" && (
          <TextEditor
            savedTexts={siteTexts}
            initialGroup={textGroup}
            onSave={(texts) => saveContent("siteTexts", texts)}
          />
        )}
      </main>
    </div>
  );
}
