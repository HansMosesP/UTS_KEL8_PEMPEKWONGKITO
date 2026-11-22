"use client";

import { useEffect, useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import { useStore } from "../../lib/store";
import type { AuthMode, User } from "../../lib/types";
import Modal from "../shared/modal";

export default function AuthModal({
  open,
  initialMode = "login",
  notice,
  onClose,
  onSuccess,
}: {
  open: boolean;
  initialMode?: AuthMode;
  /** Pesan tambahan, mis. "Silakan masuk dulu untuk memesan." */
  notice?: string;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}) {
  const { authenticate } = useStore();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim().toLowerCase();
    const password = String(data.get("password") ?? "");
    if (mode === "register" && (!name || password.length < 6)) {
      void Swal.fire({
        icon: "warning",
        title: "Data belum lengkap",
        text: "Isi semua kolom. Password minimal 6 karakter.",
      });
      return;
    }

    setBusy(true);
    const result = await authenticate(mode, { name, email, password });
    setBusy(false);
    if (!result.ok) {
      void Swal.fire({
        icon: "error",
        title: mode === "register" ? "Pendaftaran gagal" : "Login gagal",
        text: result.error,
      });
      return;
    }
    onClose();
    if (result.user.role === "admin") {
      window.location.assign("/admin");
      return;
    }
    void Swal.fire({
      toast: true,
      position: "top-end",
      timer: 2200,
      showConfirmButton: false,
      icon: "success",
      title:
        mode === "register"
          ? `Pendaftaran berhasil! Selamat datang, ${result.user.name}`
          : `Selamat datang, ${result.user.name}!`,
    });
    onSuccess?.(result.user);
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
      {notice && <p className="auth-notice">{notice}</p>}
      <form onSubmit={submit} className="auth-form" key={mode}>
        {mode === "register" && (
          <input
            className="form-control"
            name="name"
            type="text"
            placeholder="Nama Lengkap"
            autoComplete="name"
            maxLength={120}
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
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
        </button>
      </form>
      <p className="auth-switch">
        {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Daftar" : "Masuk"}
        </button>
      </p>
    </Modal>
  );
}
