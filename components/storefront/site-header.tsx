"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  ShoppingBag,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import Swal from "sweetalert2";
import { useStore } from "../../lib/store";
import type { AuthMode } from "../../lib/types";

/** Urutan mengikuti alur pengguna & urutan section di halaman. */
export const NAV_LINKS = [
  ["Beranda", "beranda"],
  ["Menu", "menu"],
  ["Tentang Kami", "cerita"],
  ["Testimoni", "testimoni"],
  ["FAQ", "faq"],
  ["Kontak", "lokasi"],
] as const;

export default function SiteHeader({
  onCart,
  onAuth,
  onOrders,
}: {
  onCart: () => void;
  onAuth: (mode: AuthMode) => void;
  onOrders: () => void;
}) {
  const { ready, cart, currentUser, logout } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [active, setActive] = useState<string>("beranda");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const count = cart.reduce((total, item) => total + item.qty, 0);
  const isAdmin = currentUser?.role === "admin";

  // Tutup dropdown profil saat klik di luar / tekan Escape.
  useEffect(() => {
    if (!userOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setUserOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setUserOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [userOpen]);

  // Sorot menu sesuai section yang sedang terlihat.
  useEffect(() => {
    const sections = NAV_LINKS.map(([, id]) => document.getElementById(id)).filter(
      (element): element is HTMLElement => Boolean(element),
    );
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ready]);

  const handleLogout = async () => {
    setUserOpen(false);
    const result = await Swal.fire({
      title: "Yakin mau keluar?",
      text: "Kamu akan logout dari akun ini.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      confirmButtonColor: "#24160D",
    });
    if (!result.isConfirmed) return;
    await logout();
    void Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2000,
      showConfirmButton: false,
      icon: "success",
      title: "Berhasil logout",
    });
  };

  return (
    <header>
      <nav className="container">
        <a href="#beranda" className="logo">
          <img src="/image/logo.png" alt="Logo Pempek Wong Kito" className="logo-img" />
          <span className="logo-text">Pempek Wong Kito</span>
        </a>
        <ul className={`nav-menu ${mobileOpen ? "open" : ""}`}>
          {NAV_LINKS.map(([label, id]) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={active === id ? "active" : ""}
                aria-current={active === id ? "true" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            </li>
          ))}
          {/* Di layar kecil tombol auth ikut masuk ke menu agar tidak sesak */}
          {ready && !currentUser && (
            <li className="nav-auth-mobile">
              <button className="btn-login" onClick={() => { setMobileOpen(false); onAuth("login"); }}>
                Masuk
              </button>
              <button className="btn-register" onClick={() => { setMobileOpen(false); onAuth("register"); }}>
                Daftar
              </button>
            </li>
          )}
        </ul>
        <div className="nav-right">
          {!isAdmin && (
            <button className="btn-cart" onClick={onCart} aria-label={`Buka keranjang (${count} item)`}>
              <ShoppingBag size={18} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </button>
          )}
          {!ready ? (
            <span className="nav-auth-placeholder" aria-hidden="true" />
          ) : currentUser ? (
            <div className="user-menu" ref={userMenuRef}>
              <button
                className="user-btn"
                onClick={() => setUserOpen((open) => !open)}
                aria-expanded={userOpen}
                aria-haspopup="menu"
              >
                <span className="user-avatar">{currentUser.name.charAt(0).toUpperCase()}</span>
                <span className="user-name">{currentUser.name}</span>
                <span className="user-caret">▾</span>
              </button>
              {userOpen && (
                <div className="user-dropdown show" role="menu">
                  <div className="user-dropdown-head">
                    <strong>{currentUser.name}</strong>
                    <span>{currentUser.email}</span>
                  </div>
                  {isAdmin ? (
                    <Link href="/admin" role="menuitem">
                      <LayoutDashboard size={14} /> Panel Admin
                    </Link>
                  ) : (
                    <>
                      <button role="menuitem" onClick={() => { setUserOpen(false); onOrders(); }}>
                        <UserRound size={14} /> Profil & Pesanan Saya
                      </button>
                      <Link href="/beranda" role="menuitem">
                        <ClipboardList size={14} /> Riwayat Pesanan
                      </Link>
                    </>
                  )}
                  <button role="menuitem" className="danger" onClick={() => void handleLogout()}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-auth">
              <button className="btn-login-outline" onClick={() => onAuth("login")}>
                <UserRound size={16} /> Masuk
              </button>
              <button className="btn-login" onClick={() => onAuth("register")}>
                <UserPlus size={16} /> Daftar
              </button>
            </div>
          )}
          <button
            className="menu-btn"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X /> : <MenuIcon />}
          </button>
        </div>
      </nav>
    </header>
  );
}
