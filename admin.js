/* ============== PENYIMPANAN & UTILITAS ADMIN ============== */
const ADMIN_DEFAULT_MENU = [
  { id: 1, name: "Pempek Kapal Selam", price: 15000, img: "image/kapal-Selam.jpg", desc: "Pempek besar berisi telur ayam, disajikan dengan cuko khas." },
  { id: 2, name: "Pempek Lenjer", price: 5000, img: "image/pempek-lenjer.jpg", desc: "Pempek panjang tanpa isi, cocok untuk camilan." },
  { id: 3, name: "Tekwan", price: 18000, img: "image/Tekwan.jpg", desc: "Sup ikan khas Palembang dengan bihun dan jamur." },
  { id: 4, name: "Es Kacang Merah", price: 10000, img: "image/Es-Kacang-Merah.jpg", desc: "Minuman manis dingin dari kacang merah." }
];

const ORDER_STATUSES = [
  { value: "pending", label: "Menunggu" },
  { value: "process", label: "Diproses" },
  { value: "shipped", label: "Dikirim" },
  { value: "done", label: "Selesai" },
  { value: "cancel", label: "Dibatalkan" }
];

let currentOrderFilter = "all";
let currentTextGroup = "Semua";
let originalTextValues = {};
let draftTextValues = {};

function adminEscapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function adminAlert(icon, title, text) {
  if (window.Swal) {
    return Swal.fire({
      icon,
      title,
      text: text || "",
      confirmButtonColor: "#24160D"
    });
  }
  window.alert(text ? `${title}\n${text}` : title);
  return Promise.resolve();
}

function adminToast(icon, title) {
  if (window.Swal) {
    return Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true
    });
  }
  return Promise.resolve();
}

function readAdminArray(key, fallback) {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;

  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
    throw new Error(`Data ${key} bukan berupa daftar.`);
  } catch (error) {
    console.error(`Gagal membaca ${key}:`, error);
    adminAlert("error", "Data tidak dapat dibaca", `Data ${key} rusak atau tidak valid.`);
    return fallback;
  }
}

function writeAdminData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Gagal menyimpan ${key}:`, error);
    adminAlert("error", "Perubahan gagal disimpan", "Penyimpanan browser penuh atau tidak tersedia.");
    return false;
  }
}

function getAdminMenu() {
  return readAdminArray("menuData", ADMIN_DEFAULT_MENU);
}

function getAdminOrders() {
  return readAdminArray("ordersData", []);
}

function formatRupiah(value) {
  const amount = Number(value);
  return `Rp ${Number.isFinite(amount) ? amount.toLocaleString("id-ID") : "0"}`;
}

function formatOrderDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function statusLabel(status) {
  const entry = ORDER_STATUSES.find((item) => item.value === status);
  return entry ? entry.label : "Tidak diketahui";
}

function getCurrentAdmin() {
  try {
    return JSON.parse(localStorage.getItem("loggedInUser") || "null");
  } catch (error) {
    console.error("Gagal membaca sesi administrator:", error);
    return null;
  }
}

function requireAdministrator() {
  const user = getCurrentAdmin();
  if (!user || user.role !== "admin") {
    window.location.replace("index.html");
    return false;
  }

  const name = document.getElementById("adminName");
  if (name) name.textContent = user.name || "Admin";
  return true;
}

function initializeAdminStorage() {
  if (localStorage.getItem("menuData") === null) {
    writeAdminData("menuData", ADMIN_DEFAULT_MENU);
  }
  if (localStorage.getItem("ordersData") === null) {
    writeAdminData("ordersData", []);
  }
  if (localStorage.getItem("adminReadNotifications") === null) {
    writeAdminData("adminReadNotifications", []);
  }
}

/* ============== NAVIGASI & MENU ============== */
function switchTab(tabName, event) {
  document.querySelectorAll(".tab-btn").forEach((button) => button.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((tab) => tab.classList.remove("active"));

  if (event && event.currentTarget) event.currentTarget.classList.add("active");
  const tab = document.getElementById(`tab-${tabName}`);
  if (tab) tab.classList.add("active");
}

function renderAdminMenu() {
  const container = document.getElementById("adminMenu");
  if (!container) return;

  const menu = getAdminMenu();
  if (!menu.length) {
    container.innerHTML = '<p>Belum ada menu. Tambahkan menu baru untuk mulai.</p>';
    return;
  }

  container.innerHTML = menu.map((item) => `
    <article class="admin-menu-item">
      <img src="${adminEscapeHtml(item.img || "image/Pempek_palembang.jpg")}" alt="${adminEscapeHtml(item.name)}" onerror="this.src='image/Pempek_palembang.jpg'">
      <div class="admin-menu-info">
        <h4>${adminEscapeHtml(item.name)}</h4>
        <p>${adminEscapeHtml(item.desc || "Tidak ada deskripsi.")}</p>
        <strong>${formatRupiah(item.price)}</strong>
      </div>
      <div class="admin-menu-actions">
        <button type="button" class="btn-status" data-action="edit-menu" data-id="${adminEscapeHtml(item.id)}">Edit</button>
        <button type="button" class="btn-delete" data-action="delete-menu" data-id="${adminEscapeHtml(item.id)}">Hapus</button>
      </div>
    </article>
  `).join("");
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("File yang dipilih harus berupa gambar."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Foto menu gagal dibaca."));
    reader.readAsDataURL(file);
  });
}

async function addMenu(event) {
  event.preventDefault();

  const name = document.getElementById("newName").value.trim();
  const price = Number(document.getElementById("newPrice").value);
  const description = document.getElementById("newDesc").value.trim();
  const photoInput = document.getElementById("newFoto");

  if (!name || !Number.isFinite(price) || price <= 0) {
    adminAlert("warning", "Data menu belum valid", "Nama menu dan harga lebih dari nol wajib diisi.");
    return;
  }

  try {
    const image = await readImageFile(photoInput.files[0]);
    const menu = getAdminMenu();
    menu.push({
      id: Date.now(),
      name,
      price,
      desc: description,
      img: image || "image/Pempek_palembang.jpg"
    });
    if (!writeAdminData("menuData", menu)) return;

    document.getElementById("menuForm").reset();
    const preview = document.getElementById("preview");
    preview.removeAttribute("src");
    preview.style.display = "none";
    renderAdminMenu();
    adminToast("success", "Menu berhasil ditambahkan");
  } catch (error) {
    console.error("Gagal menambahkan menu:", error);
    adminAlert("error", "Menu gagal ditambahkan", error.message);
  }
}

function openEditMenu(id) {
  const item = getAdminMenu().find((menu) => String(menu.id) === String(id));
  if (!item) {
    adminAlert("error", "Menu tidak ditemukan", "Data menu mungkin sudah dihapus.");
    return;
  }

  document.getElementById("editId").value = item.id;
  document.getElementById("editName").value = item.name || "";
  document.getElementById("editPrice").value = item.price || "";
  document.getElementById("editDesc").value = item.desc || "";
  document.getElementById("editPreview").src = item.img || "image/Pempek_palembang.jpg";
  document.getElementById("editFoto").value = "";
  document.getElementById("editModal").classList.add("show");
}

function closeEdit() {
  document.getElementById("editModal").classList.remove("show");
}

async function saveEdit() {
  const id = document.getElementById("editId").value;
  const name = document.getElementById("editName").value.trim();
  const price = Number(document.getElementById("editPrice").value);
  const description = document.getElementById("editDesc").value.trim();
  const photoInput = document.getElementById("editFoto");

  if (!name || !Number.isFinite(price) || price <= 0) {
    adminAlert("warning", "Data menu belum valid", "Nama menu dan harga lebih dari nol wajib diisi.");
    return;
  }

  try {
    const image = await readImageFile(photoInput.files[0]);
    const menu = getAdminMenu();
    const index = menu.findIndex((item) => String(item.id) === String(id));
    if (index < 0) {
      adminAlert("error", "Menu tidak ditemukan", "Data menu mungkin sudah dihapus.");
      return;
    }

    menu[index] = {
      ...menu[index],
      name,
      price,
      desc: description,
      img: image || menu[index].img || "image/Pempek_palembang.jpg"
    };
    if (!writeAdminData("menuData", menu)) return;

    closeEdit();
    renderAdminMenu();
    adminToast("success", "Perubahan menu berhasil disimpan");
  } catch (error) {
    console.error("Gagal mengedit menu:", error);
    adminAlert("error", "Perubahan menu gagal disimpan", error.message);
  }
}

function deleteMenu(id) {
  const confirmDelete = window.Swal
    ? Swal.fire({
      title: "Hapus menu ini?",
      text: "Menu yang dihapus tidak dapat dipulihkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#a63b1c",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal"
    }).then((result) => result.isConfirmed)
    : Promise.resolve(window.confirm("Hapus menu ini?"));

  confirmDelete.then((confirmed) => {
    if (!confirmed) return;
    const menu = getAdminMenu().filter((item) => String(item.id) !== String(id));
    if (!writeAdminData("menuData", menu)) return;
    renderAdminMenu();
    adminToast("success", "Menu berhasil dihapus");
  });
}

function setupMenuPhotoPreviews() {
  const previews = [
    ["newFoto", "preview"],
    ["editFoto", "editPreview"]
  ];

  previews.forEach(([inputId, imageId]) => {
    const input = document.getElementById(inputId);
    input.addEventListener("change", async () => {
      if (!input.files[0]) return;
      try {
        const dataUrl = await readImageFile(input.files[0]);
        document.getElementById(imageId).src = dataUrl;
        document.getElementById(imageId).style.display = "";
      } catch (error) {
        input.value = "";
        adminAlert("error", "Foto tidak dapat digunakan", error.message);
      }
    });
  });
}

/* ============== PESANAN & STATISTIK ============== */
function renderOrders() {
  const container = document.getElementById("ordersList");
  if (!container) return;

  const orders = getAdminOrders()
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((order) => currentOrderFilter === "all" || order.status === currentOrderFilter);

  if (!orders.length) {
    container.innerHTML = '<p>Belum ada pesanan pada filter ini.</p>';
    return;
  }

  container.innerHTML = orders.map((order) => {
    const items = Array.isArray(order.items) ? order.items : [];
    const options = ORDER_STATUSES.map((status) => `
      <option value="${status.value}" ${order.status === status.value ? "selected" : ""}>${status.label}</option>
    `).join("");
    return `
      <article class="order-card-admin">
        <div class="order-head">
          <span class="order-id">${adminEscapeHtml(order.id)}</span>
          <span class="order-status status-${adminEscapeHtml(order.status)}">${adminEscapeHtml(statusLabel(order.status))}</span>
        </div>
        <div class="order-info-grid">
          <div><strong>Pelanggan:</strong> ${adminEscapeHtml(order.userName)}</div>
          <div><strong>Tanggal:</strong> ${adminEscapeHtml(formatOrderDate(order.createdAt))}</div>
          <div><strong>No. HP:</strong> ${adminEscapeHtml(order.phone)}</div>
          <div><strong>Pembayaran:</strong> ${adminEscapeHtml(order.payment)}</div>
          <div><strong>Alamat:</strong> ${adminEscapeHtml([order.address, order.city].filter(Boolean).join(", "))}</div>
          <div><strong>Total:</strong> ${formatRupiah(order.total)}</div>
        </div>
        <div class="order-items-list">
          ${items.map((item) => `<div><span>${adminEscapeHtml(item.name)} × ${adminEscapeHtml(item.qty)}</span><strong>${formatRupiah(Number(item.price) * Number(item.qty))}</strong></div>`).join("") || "<div>Rincian item tidak tersedia.</div>"}
        </div>
        <div class="order-actions">
          <select aria-label="Status pesanan ${adminEscapeHtml(order.id)}" data-order-status="${adminEscapeHtml(order.id)}">${options}</select>
          <button type="button" class="btn-status" data-action="save-status" data-id="${adminEscapeHtml(order.id)}">Simpan Status</button>
        </div>
      </article>
    `;
  }).join("");
}

function filterOrders(filter, event) {
  currentOrderFilter = filter;
  document.querySelectorAll("#tab-orders .filter-btn").forEach((button) => button.classList.remove("active"));
  if (event && event.currentTarget) event.currentTarget.classList.add("active");
  renderOrders();
}

function updateOrderStatus(id) {
  const select = Array.from(document.querySelectorAll("[data-order-status]"))
    .find((element) => element.dataset.orderStatus === String(id));
  if (!select || !ORDER_STATUSES.some((status) => status.value === select.value)) {
    adminAlert("error", "Status tidak valid", "Pilih status pesanan yang tersedia.");
    return;
  }

  const orders = getAdminOrders();
  const order = orders.find((item) => String(item.id) === String(id));
  if (!order) {
    adminAlert("error", "Pesanan tidak ditemukan", "Data pesanan mungkin telah berubah.");
    return;
  }

  order.status = select.value;
  if (!writeAdminData("ordersData", orders)) return;
  renderOrders();
  renderDashboard();
  renderNotifications();
  adminToast("success", "Status pesanan berhasil diperbarui");
}

function renderDashboard() {
  const orders = getAdminOrders();
  const today = new Date().toDateString();
  const todaysOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === today);
  const paidToday = todaysOrders.filter((order) => order.status !== "cancel");
  const todayRevenue = paidToday.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const customers = new Set(orders.map((order) => order.userEmail).filter((email) => email && email !== "guest"));
  const menuSales = new Map();

  orders.filter((order) => order.status !== "cancel").forEach((order) => {
    (Array.isArray(order.items) ? order.items : []).forEach((item) => {
      const name = item.name || "Menu";
      menuSales.set(name, (menuSales.get(name) || 0) + (Number(item.qty) || 0));
    });
  });

  const bestMenu = Array.from(menuSales.entries()).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("statTodayOrders").textContent = String(todaysOrders.length);
  document.getElementById("statTodayRevenue").textContent = formatRupiah(todayRevenue);
  document.getElementById("statBestMenu").textContent = bestMenu ? bestMenu[0] : "-";
  document.getElementById("statNewCustomers").textContent = String(customers.size);

  const statusCounts = ORDER_STATUSES.map((status) => ({
    ...status,
    count: orders.filter((order) => order.status === status.value).length
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((status) => status.count));
  document.getElementById("statusChart").innerHTML = statusCounts.map((status) => `
    <div class="chart-row">
      <span class="chart-label">${status.label}</span>
      <div class="chart-track"><div class="chart-fill ${status.value}" style="width:${status.count ? Math.max(4, (status.count / maxStatusCount) * 100) : 0}%"></div></div>
      <span class="chart-count">${status.count}</span>
    </div>
  `).join("");

  const topMenu = Array.from(menuSales.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById("topMenuList").innerHTML = topMenu.length
    ? topMenu.map(([name, quantity], index) => `
      <div class="top-menu-item">
        <span class="top-menu-rank">${index + 1}</span>
        <span class="top-menu-name">${adminEscapeHtml(name)}</span>
        <strong>${quantity} terjual</strong>
      </div>
    `).join("")
    : "<p>Belum ada data penjualan.</p>";

  const recentOrders = orders.slice().sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5);
  document.getElementById("recentOrders").innerHTML = recentOrders.length
    ? recentOrders.map((order) => `
      <div class="recent-item">
        <div><div class="order-id">${adminEscapeHtml(order.id)}</div><div class="order-meta">${adminEscapeHtml(order.userName)} · ${adminEscapeHtml(formatOrderDate(order.createdAt))}</div></div>
        <span class="order-status status-${adminEscapeHtml(order.status)}">${adminEscapeHtml(statusLabel(order.status))}</span>
      </div>
    `).join("")
    : "<p>Belum ada pesanan.</p>";
}

/* ============== NOTIFIKASI ============== */
function getReadNotificationIds() {
  return readAdminArray("adminReadNotifications", []);
}

function renderNotifications() {
  const unreadOrders = getAdminOrders().filter((order) =>
    !getReadNotificationIds().includes(order.id)
  );
  const count = document.getElementById("notifCount");
  count.textContent = String(unreadOrders.length);

  const list = document.getElementById("notifList");
  list.innerHTML = unreadOrders.length
    ? unreadOrders.map((order) => `
      <div class="notif-item unread" data-order-notification="${adminEscapeHtml(order.id)}">
        <strong>Pesanan baru ${adminEscapeHtml(order.id)}</strong>
        <span>${adminEscapeHtml(order.userName)} · ${formatRupiah(order.total)}</span>
      </div>
    `).join("")
    : '<p class="notif-empty">Tidak ada notifikasi baru.</p>';
}

function openNotif() {
  document.getElementById("notifPanel").classList.toggle("show");
  renderNotifications();
}

function markAllRead() {
  const ids = getAdminOrders().map((order) => order.id);
  if (!writeAdminData("adminReadNotifications", ids)) return;
  renderNotifications();
  adminToast("success", "Semua notifikasi ditandai telah dibaca");
}

/* ============== TEKS WEBSITE ============== */
function getEditableTextFields() {
  return SITE_TEXT_FIELDS;
}

function getTextValues() {
  try {
    const parsed = JSON.parse(localStorage.getItem("siteTexts") || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.error("Gagal membaca teks website:", error);
    adminAlert("error", "Teks website tidak dapat dibaca", "Data teks tersimpan rusak.");
    return {};
  }
}

function renderTextGroupFilters() {
  const groups = ["Semua", ...new Set(getEditableTextFields().map((field) => field.group))];
  document.getElementById("textGroupFilter").innerHTML = groups.map((group) => `
    <button type="button" class="filter-btn ${currentTextGroup === group ? "active" : ""}" data-text-group="${adminEscapeHtml(group)}">${adminEscapeHtml(group)}</button>
  `).join("");
}

function renderTextFields() {
  const fields = getEditableTextFields().filter((field) =>
    currentTextGroup === "Semua" || field.group === currentTextGroup
  );
  const savedValues = getTextValues();
  const container = document.getElementById("textsFields");

  if (!Object.keys(originalTextValues).length) {
    originalTextValues = Object.fromEntries(getEditableTextFields().map((field) => [
      field.key,
      typeof savedValues[field.key] === "string" ? savedValues[field.key] : field.default
    ]));
    draftTextValues = { ...originalTextValues };
  }

  container.innerHTML = fields.map((field) => {
    const value = typeof draftTextValues[field.key] === "string"
      ? draftTextValues[field.key]
      : typeof savedValues[field.key] === "string" ? savedValues[field.key] : field.default;
    const input = field.multiline
      ? `<textarea data-text-key="${adminEscapeHtml(field.key)}" rows="3">${adminEscapeHtml(value)}</textarea>`
      : `<input type="text" data-text-key="${adminEscapeHtml(field.key)}" value="${adminEscapeHtml(value)}">`;
    return `<label class="text-field"><span>${adminEscapeHtml(field.label)}</span>${input}</label>`;
  }).join("");
  updateTextDirtyState();
}

function updateTextDirtyState() {
  document.querySelectorAll("[data-text-key]").forEach((input) => {
    draftTextValues[input.dataset.textKey] = input.value;
  });
  const dirty = getEditableTextFields().some((field) =>
    draftTextValues[field.key] !== originalTextValues[field.key]
  );
  const indicator = document.getElementById("textsDirty");
  indicator.textContent = dirty ? "Ada perubahan yang belum disimpan" : "Semua perubahan tersimpan";
}

function saveTexts(event) {
  event.preventDefault();
  const texts = getTextValues();
  document.querySelectorAll("[data-text-key]").forEach((input) => {
    draftTextValues[input.dataset.textKey] = input.value;
  });
  Object.assign(texts, draftTextValues);

  try {
    saveSiteTexts(texts);
    originalTextValues = { ...draftTextValues };
    updateTextDirtyState();
    adminToast("success", "Teks website berhasil disimpan");
  } catch (error) {
    console.error("Gagal menyimpan teks website:", error);
    adminAlert("error", "Teks website gagal disimpan", "Penyimpanan browser tidak tersedia.");
  }
}

function resetAllTexts() {
  const confirmReset = window.Swal
    ? Swal.fire({
      title: "Kembalikan semua teks?",
      text: "Semua teks website akan dikembalikan ke nilai awal.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#a63b1c",
      cancelButtonText: "Batal",
      confirmButtonText: "Ya, kembalikan"
    }).then((result) => result.isConfirmed)
    : Promise.resolve(window.confirm("Kembalikan semua teks website ke nilai awal?"));

  confirmReset.then((confirmed) => {
    if (!confirmed) return;
    try {
      localStorage.removeItem("siteTexts");
      originalTextValues = Object.fromEntries(getEditableTextFields().map((field) => [field.key, field.default]));
      draftTextValues = { ...originalTextValues };
      renderTextFields();
      adminToast("success", "Teks website dikembalikan ke nilai awal");
    } catch (error) {
      console.error("Gagal mengembalikan teks website:", error);
      adminAlert("error", "Teks website gagal direset", "Penyimpanan browser tidak tersedia.");
    }
  });
}

/* ============== AKSI HALAMAN ============== */
function logout() {
  const confirmLogout = window.Swal
    ? Swal.fire({
      title: "Yakin mau keluar?",
      text: "Kamu akan logout dari akun administrator.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#24160D",
      cancelButtonColor: "#B54A24",
      confirmButtonText: "Ya, Logout",
      cancelButtonText: "Batal"
    }).then((result) => result.isConfirmed)
    : Promise.resolve(window.confirm("Logout dari akun administrator?"));

  confirmLogout.then((confirmed) => {
    if (!confirmed) return;
    localStorage.removeItem("loggedInUser");
    window.location.replace("index.html");
  });
}

function handleAdminClick(event) {
  const target = event.target.closest("[data-action], [data-order-notification], [data-text-group]");
  if (!target) return;

  if (target.dataset.action === "edit-menu") openEditMenu(target.dataset.id);
  if (target.dataset.action === "delete-menu") deleteMenu(target.dataset.id);
  if (target.dataset.action === "save-status") updateOrderStatus(target.dataset.id);
  if (target.dataset.orderNotification) {
    currentOrderFilter = "all";
    switchTab("orders");
    document.querySelectorAll("#tab-orders .filter-btn").forEach((button) => {
      button.classList.toggle("active", button.textContent.trim() === "Semua");
    });
    document.getElementById("notifPanel").classList.remove("show");
    renderOrders();
  }
  if (target.dataset.textGroup) {
    currentTextGroup = target.dataset.textGroup;
    renderTextGroupFilters();
    renderTextFields();
  }
}

function initializeAdminPage() {
  if (!requireAdministrator()) return;
  initializeAdminStorage();
  renderAdminMenu();
  renderOrders();
  renderDashboard();
  renderNotifications();
  renderTextGroupFilters();
  renderTextFields();
  setupMenuPhotoPreviews();

  document.getElementById("textsFields").addEventListener("input", updateTextDirtyState);
  document.addEventListener("click", handleAdminClick);
  document.getElementById("editModal").addEventListener("click", (event) => {
    if (event.target.id === "editModal") closeEdit();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeEdit();
      document.getElementById("notifPanel").classList.remove("show");
    }
  });
}

document.addEventListener("DOMContentLoaded", initializeAdminPage);

window.addEventListener("storage", (event) => {
  if (event.key === "menuData") renderAdminMenu();
  if (event.key === "ordersData") {
    renderOrders();
    renderDashboard();
    renderNotifications();
  }
  if (event.key === "siteTexts") {
    originalTextValues = {};
    draftTextValues = {};
    renderTextFields();
  }
  if (event.key === "loggedInUser" && !getCurrentAdmin()) {
    window.location.replace("index.html");
  }
});
