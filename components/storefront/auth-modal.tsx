"use client";

import { useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import { useStore } from "../../lib/store";
import type { User } from "../../lib/types";
import Modal from "../shared/modal";

export default function AuthModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { users, setUsers, setCurrentUser } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(data.get("password") ?? "");
    if (mode === "register") {
      const name = String(data.get("name") ?? "").trim();
      if (!name || !email || password.length < 6) {
        void Swal.fire({
          icon: "warning",
          title: "Data belum lengkap",
          text: "Isi semua kolom. Password minimal 6 karakter.",
        });
        return;
      }
    }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          name:
            mode === "register"
              ? String(data.get("name") ?? "").trim()
              : undefined,
          email,
          password,
        }),
      });
      const result = (await response.json()) as {
        user?: User;
        error?: string;
      };
      if (!response.ok || !result.user) {
        void Swal.fire({
          icon: "error",
          title: mode === "register" ? "Pendaftaran gagal" : "Login gagal",
          text: result.error ?? "Permintaan tidak dapat diproses.",
        });
        return;
      }
      if (mode === "register") setUsers([...users, result.user]);
      setCurrentUser(result.user);
      onClose();
      if (result.user.role === "admin") {
        window.location.assign("/admin");
        return;
      }
      void Swal.fire(
        mode === "register"
          ? {
              icon: "success",
              title: "Pendaftaran berhasil!",
              text: `Selamat datang, ${result.user.name}!`,
            }
          : {
              toast: true,
              position: "top-end",
              timer: 2200,
              showConfirmButton: false,
              icon: "success",
              title: `Selamat datang, ${result.user.name}!`,
            },
      );
    } catch {
      void Swal.fire({
        icon: "error",
        title: "Server tidak terhubung",
        text: "Coba lagi setelah koneksi server tersedia.",
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} className="auth-box">
      <button className="auth-close" onClick={onClose} aria-label="Tutup">
        ×
      </button>
      <h3>{mode === "login" ? "Masuk" : "Daftar Akun"}</h3>
      <p className="auth-sub">
        {mode === "login"
          ? "Selamat datang kembali di Pempek Wong Kito"
          : "Buat akun untuk mulai pesan pempek"}
      </p>
      <form onSubmit={submit} className="auth-form">
        {mode === "register" && (
          <input
            className="form-control"
            name="name"
            type="text"
            placeholder="Nama Lengkap"
            autoComplete="name"
            required
          />
        )}
        <input
          className="form-control"
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
        />
        <input
          className="form-control"
          name="password"
          type="password"
          placeholder="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          minLength={mode === "register" ? 6 : undefined}
          required
        />
        <button className="btn btn-primary" type="submit">
          {mode === "login" ? "Masuk" : "Daftar"}
        </button>
      </form>
      <p className="auth-switch">
        {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
        <button
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Daftar" : "Masuk"}
        </button>
      </p>
    </Modal>
  );
}
