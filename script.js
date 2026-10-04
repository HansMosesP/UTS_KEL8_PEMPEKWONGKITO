/* ===================================================
   PEMPEK WONG KITO — FRONTEND + CART + CHECKOUT +
   CUSTOMER + ANATOMI ADVANCED
   =================================================== */

/* ============== SWEETALERT2 ============== */
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  }
});

function swalError(title, text) {
  return Swal.fire({
    icon: "error",
    title: title,
    text: text || "",
    confirmButtonColor: "#24160D",
    confirmButtonText: "Oke"
  });
}

function swalSuccess(title, text) {
  return Swal.fire({
    icon: "success",
    title: title,
    text: text || "",
    confirmButtonColor: "#24160D",
    confirmButtonText: "Oke"
  });
}

const DEFAULT_MENU = [
  { id: 1, name: "Pempek Kapal Selam", price: 15000, img: "image/kapal-Selam.jpg", desc: "Pempek besar berisi telur ayam, disajikan dengan cuko khas." },
  { id: 2, name: "Pempek Lenjer", price: 5000, img: "image/pempek-lenjer.jpg", desc: "Pempek panjang tanpa isi, cocok untuk camilan." },
  { id: 3, name: "Tekwan", price: 18000, img: "image/Tekwan.jpg", desc: "Sup ikan khas Palembang dengan bihun dan jamur." },
  { id: 4, name: "Es Kacang Merah", price: 10000, img: "image/Es-Kacang-Merah.jpg", desc: "Minuman manis dingin dari kacang merah." }
];

const DEFAULT_ADMIN = {
  name: "Admin",
  email: "admin@pempekwongkito.com",
  password: "admin123"
};

/* ============== INIT STORAGE ============== */
function initStorage() {
  if (!localStorage.getItem("menuData")) localStorage.setItem("menuData", JSON.stringify(DEFAULT_MENU));
  if (!localStorage.getItem("adminData")) localStorage.setItem("adminData", JSON.stringify(DEFAULT_ADMIN));
  if (!localStorage.getItem("usersData")) localStorage.setItem("usersData", JSON.stringify([]));
  if (!localStorage.getItem("ordersData")) localStorage.setItem("ordersData", JSON.stringify([]));
  fixOldImagePaths();
}

/* Data menu lama menyimpan nama gambar dengan huruf besar/kecil yang salah
   (tidak tampil di hosting Linux). Perbaiki tanpa menghapus menu lain. */
function fixOldImagePaths() {
  const renamed = {
    "image/kapal-selam.jpg": "image/kapal-Selam.jpg",
    "image/tekwan.jpg": "image/Tekwan.jpg",
    "image/es-kacang-merah.jpg": "image/Es-Kacang-Merah.jpg"
  };
  try {
    const menu = JSON.parse(localStorage.getItem("menuData"));
    if (!Array.isArray(menu)) return;
    let changed = false;
    menu.forEach((m) => {
      if (renamed[m.img]) {
        m.img = renamed[m.img];
        changed = true;
      }
    });
    if (changed) localStorage.setItem("menuData", JSON.stringify(menu));
  } catch (e) {}
}

function getMenu() {
  try {
    const stored = JSON.parse(localStorage.getItem("menuData"));
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (e) {}
  return DEFAULT_MENU;
}

function renderMenu() {
  const menuGrid = document.getElementById("menuGrid");
  if (!menuGrid) return;

  const menu = getMenu();

  if (!menu.length) {
    menuGrid.innerHTML = '<p style="text-align:center;grid-column:1/-1;color:#715A45;">Belum ada menu.</p>';
    return;
  }

  menuGrid.innerHTML = menu
    .map(
      (x) => `
    <div class="menu-card">
      <img src="${x.img}" alt="${x.name}" onerror="this.src='image/Pempek_palembang.jpg'">
      <div class="menu-card-body">
        <h3>${x.name}</h3>
        ${x.desc ? `<p>${x.desc}</p>` : ""}
        <div class="menu-price">Rp ${Number(x.price).toLocaleString("id-ID")}</div>
        <button class="btn-order" onclick="addToCart(${x.id})">Pesan</button>
      </div>
    </div>`
    )
    .join("");
}

/* ============== CART ============== */
function getCart() {
  try { return JSON.parse(localStorage.getItem("cartData")) || []; }
  catch (e) { return []; }
}

function saveCart(cart) {
  localStorage.setItem("cartData", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cartCount");
  if (badge) badge.textContent = total;
}

function addToCart(menuId) {
  const menu = getMenu();
  const item = menu.find((m) => m.id === menuId);
  if (!item) return;

  const cart = getCart();
  const existing = cart.find((c) => c.id === menuId);

  if (existing) existing.qty += 1;
  else cart.push({ id: item.id, name: item.name, price: item.price, img: item.img, qty: 1 });

  saveCart(cart);
  Toast.fire({ icon: "success", title: `${item.name} masuk keranjang` });
}

function changeQty(menuId, delta) {
  const cart = getCart();
  const item = cart.find((c) => c.id === menuId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    const idx = cart.indexOf(item);
    cart.splice(idx, 1);
  }

  saveCart(cart);
  renderCart();
}

function removeFromCart(menuId) {
  let cart = getCart();
  cart = cart.filter((c) => c.id !== menuId);
  saveCart(cart);
  renderCart();
}

function cartSubtotal() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function openCart() {
  const modal = document.getElementById("cartModal");
  if (!modal) return;
  modal.classList.add("show");
  modal.style.display = "flex";
  renderCart();
}

function closeCart() {
  const modal = document.getElementById("cartModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.style.display = "none";
}

function renderCart() {
  const wrap = document.getElementById("cartItems");
  if (!wrap) return;

  const cart = getCart();

  if (!cart.length) {
    wrap.innerHTML = '<p style="text-align:center;color:#715A45;padding:20px 0;">Keranjang masih kosong.</p>';
    document.getElementById("cartSubtotal").textContent = "Rp 0";
    document.getElementById("cartOngkir").textContent = "Rp 0";
    document.getElementById("cartTotal").textContent = "Rp 0";
    return;
  }

  wrap.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <img src="${item.img}" alt="${item.name}" onerror="this.src='image/Pempek_palembang.jpg'">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <p>Rp ${Number(item.price).toLocaleString("id-ID")}</p>
        <div class="cart-qty">
          <button onclick="changeQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-remove" onclick="removeFromCart(${item.id})">×</button>
    </div>`
    )
    .join("");

  const subtotal = cartSubtotal();
  const ongkir = parseInt(localStorage.getItem("lastOngkir") || "0", 10);

  document.getElementById("cartSubtotal").textContent = `Rp ${subtotal.toLocaleString("id-ID")}`;
  document.getElementById("cartOngkir").textContent = `Rp ${ongkir.toLocaleString("id-ID")}`;
  document.getElementById("cartTotal").textContent = `Rp ${(subtotal + ongkir).toLocaleString("id-ID")}`;
}

/* ============== CHECKOUT ============== */
function openCheckout() {
  const cart = getCart();
  if (!cart.length) {
    Toast.fire({ icon: "warning", title: "Keranjang masih kosong" });
    return;
  }

  const stored = localStorage.getItem("loggedInUser");
  if (stored) {
    const user = JSON.parse(stored);
    const nameInput = document.getElementById("coName");
    if (nameInput && !nameInput.value) nameInput.value = user.name;
  }

  closeCart();
  const modal = document.getElementById("checkoutModal");
  if (!modal) return;
  modal.classList.add("show");
  modal.style.display = "flex";

  const city = document.getElementById("coCity");
  if (city) localStorage.setItem("lastOngkir", city.value);
  updateOngkir();
}

function closeCheckout() {
  const modal = document.getElementById("checkoutModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.style.display = "none";
}

function updateOngkir() {
  const city = document.getElementById("coCity");
  if (!city) return;

  const ongkir = parseInt(city.value, 10);
  localStorage.setItem("lastOngkir", ongkir);

  const subtotal = cartSubtotal();
  document.getElementById("coSubtotal").textContent = `Rp ${subtotal.toLocaleString("id-ID")}`;
  document.getElementById("coOngkir").textContent = `Rp ${ongkir.toLocaleString("id-ID")}`;
  document.getElementById("coTotal").textContent = `Rp ${(subtotal + ongkir).toLocaleString("id-ID")}`;
}

function placeOrder() {
  const name = document.getElementById("coName").value.trim();
  const phone = document.getElementById("coPhone").value.trim();
  const address = document.getElementById("coAddress").value.trim();
  const citySelect = document.getElementById("coCity");
  const city = citySelect.options[citySelect.selectedIndex].text;
  const payment = document.getElementById("coPayment").value;

  if (!name || !phone || !address) {
    swalError("Data belum lengkap", "Nama, No. HP, dan Alamat wajib diisi.");
    return;
  }

  if (phone.length < 9) {
    swalError("Nomor HP tidak valid", "Masukkan nomor HP yang benar.");
    return;
  }

  const cart = getCart();
  const subtotal = cartSubtotal();
  const ongkir = parseInt(citySelect.value, 10);
  const total = subtotal + ongkir;

  const stored = localStorage.getItem("loggedInUser");
  const user = stored ? JSON.parse(stored) : null;

  const orderId = "PWK-" + Date.now().toString().slice(-8);

  const order = {
    id: orderId,
    userEmail: user ? user.email : "guest",
    userName: name,
    phone,
    address,
    city,
    payment,
    items: cart,
    subtotal,
    ongkir,
    total,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  const orders = JSON.parse(localStorage.getItem("ordersData") || "[]");
  orders.push(order);
  localStorage.setItem("ordersData", JSON.stringify(orders));

  localStorage.removeItem("cartData");
  updateCartCount();
  closeCheckout();

  document.getElementById("orderNumber").textContent = orderId;
  const successModal = document.getElementById("successModal");
  successModal.classList.add("show");
  successModal.style.display = "flex";

  document.getElementById("coName").value = "";
  document.getElementById("coPhone").value = "";
  document.getElementById("coAddress").value = "";
}

function closeSuccess() {
  const modal = document.getElementById("successModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.style.display = "none";
}

/* ============== AUTH ============== */
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

function showLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("registerForm").style.display = "none";
}

function showRegister(e) {
  if (e) e.preventDefault();
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
}

function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    Toast.fire({ icon: "warning", title: "Email dan password wajib diisi" });
    return;
  }

  const admin = JSON.parse(localStorage.getItem("adminData") || "{}");
  if (admin.email === email && admin.password === password) {
    localStorage.setItem("loggedInUser", JSON.stringify({
      name: admin.name, email: admin.email, role: "admin"
    }));
    window.location.href = "admin.html";
    return;
  }

  const users = JSON.parse(localStorage.getItem("usersData") || "[]");
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem("loggedInUser", JSON.stringify({
      name: user.name, email: user.email, role: "customer"
    }));
    closeAuth();
    updateNavUser();
    Toast.fire({ icon: "success", title: `Selamat datang, ${user.name}!` });
  } else {
    swalError("Login gagal", "Email atau password salah.");
  }
}

function register() {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value.trim();

  if (!name || !email || !password) {
    Toast.fire({ icon: "warning", title: "Semua kolom wajib diisi" });
    return;
  }
  if (password.length < 6) {
    Toast.fire({ icon: "warning", title: "Password minimal 6 karakter" });
    return;
  }

  const users = JSON.parse(localStorage.getItem("usersData") || "[]");
  if (users.find((u) => u.email === email)) {
    swalError("Email sudah terdaftar", "Silakan login atau pakai email lain.");
    return;
  }

  users.push({ id: Date.now(), name, email, password, role: "customer" });
  localStorage.setItem("usersData", JSON.stringify(users));

  localStorage.setItem("loggedInUser", JSON.stringify({ name, email, role: "customer" }));
  closeAuth();
  updateNavUser();

  swalSuccess("Pendaftaran berhasil!", `Selamat datang, ${name}!`);
}

function logout() {
  Swal.fire({
    title: "Yakin mau keluar?",
    text: "Kamu akan logout dari akun ini.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#24160D",
    cancelButtonColor: "#B54A24",
    confirmButtonText: "Ya, Logout",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("loggedInUser");
      updateNavUser();
      Toast.fire({ icon: "success", title: "Kamu telah logout" });
      if (location.pathname.includes("admin.html")) location.href = "index.html";
    }
  });
}

function updateNavUser() {
  const navRight = document.querySelector(".nav-right");
  if (!navRight) return;

  const stored = localStorage.getItem("loggedInUser");
  const user = stored ? JSON.parse(stored) : null;

  const existing = navRight.querySelector(".user-menu");
  if (existing) existing.remove();

  const btnLogin = navRight.querySelector(".btn-login");

  if (user) {
    if (btnLogin) btnLogin.style.display = "none";

    const userMenu = document.createElement("div");
    userMenu.className = "user-menu";
    userMenu.innerHTML = `
      <button class="user-btn" onclick="toggleUserDropdown(event)">
        <span class="user-avatar">${user.name.charAt(0).toUpperCase()}</span>
        <span class="user-name">${user.name}</span>
        <span class="user-caret">▾</span>
      </button>
      <div class="user-dropdown" id="userDropdown">
        ${
          user.role === "admin"
            ? '<a href="admin.html">Panel Admin</a>'
            : '<a href="#" onclick="event.preventDefault();showMyOrders()">Pesanan Saya</a>'
        }
        <a href="#" onclick="event.preventDefault();logout()">Logout</a>
      </div>
    `;
    navRight.insertBefore(userMenu, navRight.querySelector(".menu-btn"));
  } else {
    if (btnLogin) {
      btnLogin.style.display = "";
      btnLogin.onclick = openAuth;
    }
  }
}

function toggleUserDropdown(e) {
  if (e) e.stopPropagation();
  const d = document.getElementById("userDropdown");
  if (d) d.classList.toggle("show");
}

document.addEventListener("click", function (e) {
  const d = document.getElementById("userDropdown");
  if (d && !e.target.closest(".user-menu")) d.classList.remove("show");
});

/* ============== CUSTOMER DASHBOARD ============== */
function showMyOrders() {
  const stored = localStorage.getItem("loggedInUser");
  const user = stored ? JSON.parse(stored) : null;
  if (!user) {
    Toast.fire({ icon: "warning", title: "Silakan login dulu" });
    return;
  }

  const modal = document.getElementById("customerModal");
  if (!modal) return;

  document.getElementById("customerAvatar").textContent = user.name.charAt(0).toUpperCase();
  document.getElementById("customerGreeting").textContent = `Halo, ${user.name} 👋`;
  document.getElementById("customerSub").textContent = "Selamat datang kembali di Wong Kito";

  const orders = JSON.parse(localStorage.getItem("ordersData") || "[]")
    .filter((o) => o.userEmail === user.email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const statusLabel = {
    pending: { text: "Menunggu", cls: "pending" },
    process: { text: "Diproses", cls: "process" },
    shipped: { text: "Dikirim", cls: "shipped" },
    done: { text: "Selesai", cls: "done" },
    cancel: { text: "Dibatalkan", cls: "cancel" }
  };

  const lastBox = document.getElementById("lastOrderBox");
  if (orders.length) {
    const last = orders[0];
    const st = statusLabel[last.status] || statusLabel.pending;
    lastBox.className = "last-order-box";
    lastBox.innerHTML = `
      <div class="last-order-head">
        <span class="last-order-id">${last.id}</span>
        <span class="last-order-status">${st.text}</span>
      </div>
      <p class="last-order-detail">${last.items.length} item · Rp ${last.total.toLocaleString("id-ID")}</p>
    `;
  } else {
    lastBox.className = "last-order-box";
    lastBox.innerHTML = '<p class="last-order-detail">Belum ada pesanan. Yuk, pesan sekarang!</p>';
  }

  const menu = getMenu();
  const favBox = document.getElementById("favMenuBox");
  if (menu.length) {
    favBox.innerHTML = menu
      .slice(0, 2)
      .map((m) => `
      <div class="fav-menu-item" onclick="closeCustomer();addToCart(${m.id})">
        <h5>${m.name}</h5>
        <span>Rp ${Number(m.price).toLocaleString("id-ID")}</span>
      </div>`)
      .join("");
  } else {
    favBox.innerHTML = '<p class="customer-empty">Belum ada menu.</p>';
  }

  const hist = document.getElementById("orderHistory");
  if (orders.length) {
    hist.innerHTML = orders
      .map((o) => {
        const st = statusLabel[o.status] || statusLabel.pending;
        return `
        <div class="order-history-item">
          <div>
            <strong>${o.id}</strong><br>
            <span style="font-size:12px;color:var(--teks-lembut);">${o.items.length} item · Rp ${o.total.toLocaleString("id-ID")}</span>
          </div>
          <span class="status-mini ${st.cls}">${st.text}</span>
        </div>`;
      })
      .join("");
  } else {
    hist.innerHTML = '<p class="customer-empty">Belum ada riwayat.</p>';
  }

  modal.classList.add("show");
  modal.style.display = "flex";
}

function closeCustomer() {
  const modal = document.getElementById("customerModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.style.display = "none";
}

/* ============== FAQ ============== */
function initFaq() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach((item) => {
    const q = item.querySelector(".faq-question");
    if (!q) return;
    q.addEventListener("click", () => {
      const active = item.classList.contains("active");
      items.forEach((i) => i.classList.remove("active"));
      if (!active) item.classList.add("active");
    });
  });
}

/* ============== MOBILE MENU ============== */
function initMobileMenu() {
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("navMenu");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => menu.classList.toggle("open"));
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => menu.classList.remove("open"))
  );
}

/* ============== TYPING ============== */
function initTypingEffect() {
  const el = document.getElementById("typingText");
  if (!el) return;

  // Teks berjalan bisa diubah admin dari tab "Edit Teks Website"
  function readWords() {
    const list = getSiteText("hero.typingWords")
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    return list.length ? list : ["Wong Kito"];
  }
  let words = readWords();
  const typeSpeed = 90, deleteSpeed = 50, holdTime = 1800;
  let wordIndex = 0, charIndex = 0, isDeleting = false;

  function tick() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      el.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
    }
    el.classList.remove("done");

    if (!isDeleting && charIndex === currentWord.length) {
      el.classList.add("done");
      isDeleting = true;
      setTimeout(tick, holdTime);
      return;
    }
    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      words = readWords();
      wordIndex = (wordIndex + 1) % words.length;
      setTimeout(tick, 300);
      return;
    }
    setTimeout(tick, isDeleting ? deleteSpeed : typeSpeed);
  }
  setTimeout(tick, 500);
}

/* ============== REVEAL ============== */
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => io.observe(el));
}

/* ===================================================
   ANATOMI PEMPEK — ADVANCED
   =================================================== */
const ANATOMI_DATA = {
  kulit: { num: 1, title: "Kulit Luar Pempek", desc: "Lapisan luar yang lembut saat mentah dan menjadi sedikit renyah setelah digoreng. Memberi tekstur khas serta melindungi isian di dalamnya.", role: "Pelindung & tekstur" },
  adonan: { num: 2, title: "Adonan Ikan", desc: "Dibuat dari ikan tenggiri pilihan yang memberi rasa gurih khas. Dipilih langsung setiap pagi untuk memastikan kualitas terbaik.", role: "Rasa gurih utama" },
  tapioka: { num: 3, title: "Campuran Tapioka / Sagu", desc: "Memberi tekstur kenyal yang menjadi ciri khas pempek. Perbandingan dengan ikan adalah rahasia yang sudah dijaga turun-temurun.", role: "Tekstur kenyal" },
  telur: { num: 4, title: "Isian Telur", desc: "Bagian tengah khas pempek kapal selam yang membuat rasanya lebih kaya dan mengenyangkan. Telur utuh yang dimasak bersama adonan.", role: "Isian khas" },
  cuko: { num: 5, title: "Cuko", desc: "Saus khas Palembang dengan perpaduan rasa manis, asam, gurih, dan pedas. Direbus perlahan dari gula aren, cabai, dan asam jawa asli.", role: "Saus khas Palembang" },
  pelengkap: { num: 6, title: "Pelengkap", desc: "Timun segar dan mie kuning sebagai pelengkap penyajian. Memberi sensasi segar dan menyeimbangkan rasa gurih pempek.", role: "Pelengkap sajian" }
};

const LAYER_ORDER = ["kulit", "adonan", "tapioka", "telur", "cuko", "pelengkap"];

let activeLayer = null;
let tourTimer = null;
let isExploded = false;

function initAnatomi() {
  const hotspots = document.querySelectorAll(".hotspot");
  const tabs = document.querySelectorAll(".anatomi-tab");
  const layers = document.querySelectorAll(".anatomi-layer");
  const dots = document.querySelectorAll(".anatomi-dot");
  const defaultBox = document.getElementById("anatomiDefault");
  const contentBox = document.getElementById("anatomiContent");
  const card = document.getElementById("anatomiCard");
  const model = document.getElementById("anatomiModel");
  const stage = document.getElementById("anatomiStage");

  if (!hotspots.length || !contentBox) return;

  function updateNavInfo() {
    const idx = LAYER_ORDER.indexOf(activeLayer);
    const info = document.getElementById("anatomiNavInfo");
    if (info) info.textContent = idx >= 0 ? `${idx + 1} / ${LAYER_ORDER.length}` : `- / ${LAYER_ORDER.length}`;
  }

  function updateDots(key) {
    dots.forEach((d) => {
      d.classList.toggle("active", d.getAttribute("data-layer") === key);
    });
  }

  function showLayer(key, opts = {}) {
    const data = ANATOMI_DATA[key];
    if (!data) return;

    defaultBox.style.display = "none";
    contentBox.style.display = "block";
    document.getElementById("anatomiNum").textContent = data.num;
    document.getElementById("anatomiTitle").textContent = data.title;
    document.getElementById("anatomiDesc").textContent = data.desc;
    document.getElementById("anatomiRole").textContent = data.role;

    contentBox.style.animation = "none";
    void contentBox.offsetWidth;
    contentBox.style.animation = "";

    card.classList.add("active");

    layers.forEach((layer) => {
      const group = layer.getAttribute("data-group");
      if (group === key || (key === "tapioka" && group === "adonan")) {
        layer.classList.remove("dim");
        layer.classList.add("highlight");
      } else {
        layer.classList.remove("highlight");
        layer.classList.add("dim");
      }
    });

    hotspots.forEach((h) => h.classList.remove("active"));
    const activeHotspot = document.querySelector(`.hotspot[data-layer="${key}"]`);
    if (activeHotspot) activeHotspot.classList.add("active");

    // Tab sync
    tabs.forEach((t) => {
      const l = t.getAttribute("data-layer");
      t.classList.toggle("active", l === key);
    });

    activeLayer = key;
    updateDots(key);
    updateNavInfo();
  }

  function showAll() {
    defaultBox.style.display = "block";
    contentBox.style.display = "none";
    card.classList.remove("active");
    layers.forEach((l) => l.classList.remove("dim", "highlight"));
    hotspots.forEach((h) => h.classList.remove("active"));
    tabs.forEach((t) => t.classList.remove("active"));
    const allTab = document.querySelector('.anatomi-tab[data-layer="semua"]');
    if (allTab) allTab.classList.add("active");
    activeLayer = null;
    updateDots(null);
    updateNavInfo();
  }

  // Hotspots click
  hotspots.forEach((h) => {
    h.addEventListener("click", () => {
      const key = h.getAttribute("data-layer");
      if (activeLayer === key) showAll();
      else showLayer(key);
    });
    h.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const key = h.getAttribute("data-layer");
        if (activeLayer === key) showAll();
        else showLayer(key);
      }
    });
  });

  // Tabs
  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      const layer = t.getAttribute("data-layer");
      tabs.forEach((x) => x.classList.remove("active"));
      t.classList.add("active");

      if (layer === "semua") {
        showAll();
      } else if (layer === "potongan") {
        // Show all inner layers highlighted + explode mode
        defaultBox.style.display = "none";
        contentBox.style.display = "block";
        document.getElementById("anatomiNum").textContent = "✦";
        document.getElementById("anatomiTitle").textContent = "Isi Dalam Pempek";
        document.getElementById("anatomiDesc").textContent = "Pempek kapal selam terdiri dari lapisan kulit luar yang lembut, adonan ikan tenggiri gurih, campuran tapioka kenyal, dan isian telur utuh di tengahnya. Setiap lapisan punya peran yang membuat rasanya khas.";
        document.getElementById("anatomiRole").textContent = "4 lapisan utama";
        card.classList.add("active");

        if (!isExploded) toggleExplode(true);

        layers.forEach((l) => {
          const group = l.getAttribute("data-group");
          if (["kulit", "adonan", "telur"].includes(group)) {
            l.classList.remove("dim");
            l.classList.add("highlight");
          } else {
            l.classList.remove("highlight");
            l.classList.add("dim");
          }
        });
        hotspots.forEach((h) => h.classList.remove("active"));
        activeLayer = null;
        updateDots(null);
        updateNavInfo();
      } else if (layer === "cuko" || layer === "pelengkap") {
        showLayer(layer);
      }
    });
  });

  // Dots click
  dots.forEach((d) => {
    d.addEventListener("click", () => {
      const key = d.getAttribute("data-layer");
      if (activeLayer === key) showAll();
      else showLayer(key);
    });
  });

  // Parallax mouse
  if (stage && window.innerWidth > 950) {
    stage.addEventListener("mousemove", (e) => {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      model.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
    });
    stage.addEventListener("mouseleave", () => {
      model.style.transform = "";
    });
  }
}

function toggleExplode(force) {
  const model = document.getElementById("anatomiModel");
  const btn = document.getElementById("anatomiExplodeBtn");
  if (!model) return;

  if (typeof force === "boolean") isExploded = !force; // toggle akan flip

  isExploded = !isExploded;
  model.classList.toggle("explode", isExploded);
  if (btn) btn.classList.toggle("active", isExploded);
}

function resetAnatomi() {
  const defaultBox = document.getElementById("anatomiDefault");
  const contentBox = document.getElementById("anatomiContent");
  const card = document.getElementById("anatomiCard");
  const model = document.getElementById("anatomiModel");
  const btn = document.getElementById("anatomiExplodeBtn");
  const tabs = document.querySelectorAll(".anatomi-tab");
  const layers = document.querySelectorAll(".anatomi-layer");
  const hotspots = document.querySelectorAll(".hotspot");
  const dots = document.querySelectorAll(".anatomi-dot");

  if (defaultBox) defaultBox.style.display = "block";
  if (contentBox) contentBox.style.display = "none";
  if (card) card.classList.remove("active");
  if (model) model.classList.remove("explode");
  if (btn) btn.classList.remove("active");
  isExploded = false;

  layers.forEach((l) => l.classList.remove("dim", "highlight"));
  hotspots.forEach((h) => h.classList.remove("active"));
  dots.forEach((d) => d.classList.remove("active"));

  tabs.forEach((t) => t.classList.remove("active"));
  const allTab = document.querySelector('.anatomi-tab[data-layer="semua"]');
  if (allTab) allTab.classList.add("active");

  activeLayer = null;
  const info = document.getElementById("anatomiNavInfo");
  if (info) info.textContent = `- / ${LAYER_ORDER.length}`;

  stopTour();
}

function nextLayer() {
  if (!activeLayer) {
    showLayerByKey(LAYER_ORDER[0]);
    return;
  }
  const idx = LAYER_ORDER.indexOf(activeLayer);
  const next = LAYER_ORDER[(idx + 1) % LAYER_ORDER.length];
  showLayerByKey(next);
}

function prevLayer() {
  if (!activeLayer) {
    showLayerByKey(LAYER_ORDER[LAYER_ORDER.length - 1]);
    return;
  }
  const idx = LAYER_ORDER.indexOf(activeLayer);
  const prev = LAYER_ORDER[(idx - 1 + LAYER_ORDER.length) % LAYER_ORDER.length];
  showLayerByKey(prev);
}

function showLayerByKey(key) {
  // Trigger click on the corresponding hotspot to reuse logic
  const hotspot = document.querySelector(`.hotspot[data-layer="${key}"]`);
  if (hotspot) hotspot.click();
}

/* Tour otomatis */
function toggleTour() {
  const btn = document.getElementById("anatomiTourBtn");
  if (!btn) return;

  if (tourTimer) {
    stopTour();
    return;
  }

  btn.classList.add("active");
  const icon = btn.querySelector(".anatomi-btn-icon");
  const text = btn.querySelector(".anatomi-btn-text");
  if (icon) icon.textContent = "⏸";
  if (text) text.textContent = "Jeda Tour";

  let idx = 0;
  showLayerByKey(LAYER_ORDER[0]);

  tourTimer = setInterval(() => {
    idx = (idx + 1) % LAYER_ORDER.length;
    showLayerByKey(LAYER_ORDER[idx]);
  }, 3200);
}

function stopTour() {
  const btn = document.getElementById("anatomiTourBtn");
  if (tourTimer) {
    clearInterval(tourTimer);
    tourTimer = null;
  }
  if (btn) {
    btn.classList.remove("active");
    const icon = btn.querySelector(".anatomi-btn-icon");
    const text = btn.querySelector(".anatomi-btn-text");
    if (icon) icon.textContent = "▶";
    if (text) text.textContent = "Putar Otomatis";
  }
}

/* ============== INIT ============== */
document.addEventListener("DOMContentLoaded", () => {
  initStorage();
  applySiteTexts();
  renderMenu();
  updateNavUser();
  updateCartCount();
  initFaq();
  initMobileMenu();
  initTypingEffect();
  initReveal();
  initAnatomi();
});

/* Kalau admin menyimpan teks di tab lain, halaman ini ikut terupdate */
window.addEventListener("storage", (e) => {
  if (e.key === "siteTexts") applySiteTexts();
});

/* Kembali dari admin pakai tombol Back: browser menampilkan halaman lama
   dari cache, jadi baca ulang teks terbaru */
window.addEventListener("pageshow", (e) => {
  if (e.persisted) {
    applySiteTexts();
    updateNavUser();
  }
});
