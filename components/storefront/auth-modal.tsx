"use client";

import { useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import { DEFAULT_ADMIN } from "../../lib/defaults";
import { useStore } from "../../lib/store";
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

  const submit = (event: FormEvent<HTMLFormElement>) => {
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
      if (users.some((user) => user.email.toLowerCase() === email)) {
        void Swal.fire({ icon: "error", title: "Email sudah terdaftar" });
        return;
      }
      const user = {
        id: Date.now(),
        name,
        email,
        password,
        role: "customer" as const,
      };
      setUsers([...users, user]);
      setCurrentUser(user);
      onClose();
      void Swal.fire({
        icon: "success",
        title: "Pendaftaran berhasil!",
        text: `Selamat datang, ${name}!`,
      });
      return;
    }

    if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
      setCurrentUser(DEFAULT_ADMIN);
      window.location.assign("/admin");
      return;
    }
    const user = users.find(
      (item) =>
        item.email.toLowerCase() === email && item.password === password,
    );
    if (!user) {
      void Swal.fire({
        icon: "error",
        title: "Login gagal",
        text: "Email atau password salah.",
      });
      return;
    }
    setCurrentUser({ name: user.name, email: user.email, role: "customer" });
    onClose();
    void Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2200,
      showConfirmButton: false,
      icon: "success",
      title: `Selamat datang, ${user.name}!`,
    });
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
