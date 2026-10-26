"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LogOut,
  Menu as MenuIcon,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { useStore } from "../../lib/store";
import Swal from "sweetalert2";

export default function SiteHeader({
  onCart,
  onLogin,
  onOrders,
}: {
  onCart: () => void;
  onLogin: () => void;
  onOrders: () => void;
}) {
  const { cart, currentUser, setCurrentUser } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const count = cart.reduce((total, item) => total + item.qty, 0);
  const links = [
    ["Cerita", "#cerita"],
    ["Keunggulan", "#keunggulan"],
    ["Anatomi", "#anatomi"],
    ["Menu", "#menu"],
    ["Testimoni", "#testimoni"],
    ["Galeri", "#galeri"],
    ["Lokasi", "#lokasi"],
  ];

  const logout = async () => {
    const result = await Swal.fire({
      title: "Yakin mau keluar?",
      text: "Kamu akan logout dari akun ini.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal",
      confirmButtonColor: "#24160D",
    });
    if (result.isConfirmed) setCurrentUser(null);
  };

  return (
    <header>
      <nav className="container">
        <Link href="/" className="logo">
          <img
            src="/image/logo.png"
            alt="Logo Pempek Wong Kito"
            className="logo-img"
          />
          <span className="logo-text">Pempek Wong Kito</span>
        </Link>
        <ul className={`nav-menu ${mobileOpen ? "open" : ""}`}>
          {links.map(([label, href]) => (
            <li key={href}>
              <a href={href} onClick={() => setMobileOpen(false)}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <button
            className="btn-cart"
            onClick={onCart}
            aria-label="Buka keranjang"
          >
            <ShoppingBag size={18} />
            <span className="cart-count">{count}</span>
          </button>
          {currentUser ? (
            <div className="user-menu">
              <button
                className="user-btn"
                onClick={() => setUserOpen((open) => !open)}
                aria-expanded={userOpen}
              >
                <span className="user-avatar">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <span className="user-name">{currentUser.name}</span>
                <span className="user-caret">▾</span>
              </button>
              {userOpen && (
                <div className="user-dropdown show">
                  {currentUser.role === "admin" ? (
                    <Link href="/admin">Panel Admin</Link>
                  ) : (
                    <button
                      onClick={() => {
                        onOrders();
                        setUserOpen(false);
                      }}
                    >
                      Pesanan Saya
                    </button>
                  )}
                  <button onClick={logout}>
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-login" onClick={onLogin}>
              <UserRound size={16} /> Masuk
            </button>
          )}
          <button
            className="menu-btn"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X /> : <MenuIcon />}
          </button>
        </div>
      </nav>
    </header>
  );
}
