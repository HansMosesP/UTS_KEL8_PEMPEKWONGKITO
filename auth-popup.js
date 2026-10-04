function openAuth() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.add("show");
  modal.style.display = "flex";
  showLogin();
}

function closeAuth() {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.style.display = "none";
}

function showLogin(event) {
  if (event) event.preventDefault();
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (!loginForm || !registerForm) return;
  loginForm.style.display = "block";
  registerForm.style.display = "none";
}

function showRegister(event) {
  if (event) event.preventDefault();
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  if (!loginForm || !registerForm) return;
  loginForm.style.display = "none";
  registerForm.style.display = "block";
}

function login() {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    Toast.fire({ icon: "warning", title: "Email dan password wajib diisi" });
    return;
  }

  let admin;
  let users;
  try {
    admin = JSON.parse(localStorage.getItem("adminData") || "{}");
    users = JSON.parse(localStorage.getItem("usersData") || "[]");
  } catch (error) {
    console.error("Gagal membaca data akun:", error);
    swalError("Data akun tidak dapat dibaca", "Silakan muat ulang halaman dan coba lagi.");
    return;
  }

  if (admin.email === email && admin.password === password) {
    localStorage.setItem("loggedInUser", JSON.stringify({
      name: admin.name,
      email: admin.email,
      role: "admin"
    }));
    window.location.href = "admin.html";
    return;
  }

  const user = Array.isArray(users)
    ? users.find((account) => account.email === email && account.password === password)
    : null;

  if (!user) {
    swalError("Login gagal", "Email atau password salah.");
    return;
  }

  localStorage.setItem("loggedInUser", JSON.stringify({
    name: user.name,
    email: user.email,
    role: "customer"
  }));
  closeAuth();
  updateNavUser();
  Toast.fire({ icon: "success", title: `Selamat datang, ${user.name}!` });
}

function register() {
  const nameInput = document.getElementById("regName");
  const emailInput = document.getElementById("regEmail");
  const passwordInput = document.getElementById("regPassword");
  if (!nameInput || !emailInput || !passwordInput) return;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!name || !email || !password) {
    Toast.fire({ icon: "warning", title: "Semua kolom wajib diisi" });
    return;
  }
  if (password.length < 6) {
    Toast.fire({ icon: "warning", title: "Password minimal 6 karakter" });
    return;
  }

  let users;
  try {
    users = JSON.parse(localStorage.getItem("usersData") || "[]");
    if (!Array.isArray(users)) throw new Error("Data akun bukan berupa daftar.");
  } catch (error) {
    console.error("Gagal membaca data akun:", error);
    swalError("Data akun tidak dapat dibaca", "Silakan muat ulang halaman dan coba lagi.");
    return;
  }

  if (users.some((user) => user.email === email)) {
    swalError("Email sudah terdaftar", "Silakan login atau pakai email lain.");
    return;
  }

  const newUser = { id: Date.now(), name, email, password, role: "customer" };
  try {
    users.push(newUser);
    localStorage.setItem("usersData", JSON.stringify(users));
    localStorage.setItem("loggedInUser", JSON.stringify({ name, email, role: "customer" }));
  } catch (error) {
    console.error("Gagal menyimpan akun:", error);
    swalError("Pendaftaran gagal", "Penyimpanan browser tidak tersedia. Coba lagi.");
    return;
  }

  closeAuth();
  updateNavUser();
  swalSuccess("Pendaftaran berhasil!", `Selamat datang, ${name}!`);
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAuth();
});

document.getElementById("authModal").addEventListener("click", (event) => {
  if (event.target.id === "authModal") closeAuth();
});
