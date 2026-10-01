/* ===================================================
   ADMIN PANEL — dengan Pesanan, Notifikasi, Chart,
   dan Edit Menu lengkap
   =================================================== */

/* ============== KONFIGURASI SWEETALERT2 ============== */
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

function swalSuccess(title, text) {
  return Swal.fire({
    icon: "success",
    title: title,
    text: text || "",
    confirmButtonColor: "#24160D",
    confirmButtonText: "Oke"
  });
}

function swalError(title, text) {
  return Swal.fire({
    icon: "error",
    title: title,
    text: text || "",
    confirmButtonColor: "#24160D",
    confirmButtonText: "Oke"
  });
}

function swalConfirm(title, text, confirmText) {
  return Swal.fire({
    title: title,
    text: text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#B54A24",
    cancelButtonColor: "#24160D",
    confirmButtonText: confirmText || "Ya, Lanjut",
    cancelButtonText: "Batal"
  });
}

/* ============== CEK AUTH ============== */
(function checkAuth() {
  const stored = localStorage.getItem("loggedInUser");
  const user = stored ? JSON.parse(stored) : null;

  if (!user || user.role !== "admin") {
    Swal.fire({
      icon: "error",
      title: "Akses ditolak",
      text: "Silakan login sebagai admin terlebih dahulu.",
      confirmButtonColor: "#24160D",
      confirmButtonText: "Ke Halaman Login"
    }).then(() => {
      window.location.href = "index.html";
    });
    return;
  }

  const nameEl = document.getElementById("adminName");
  if (nameEl) nameEl.textContent = user.name;
})();

/* ============== GET / SAVE MENU ============== */
function getMenu() {
  try {
    const stored = JSON.parse(localStorage.getItem("menuData"));
    if (Array.isArray(stored)) return stored;
  } catch (e) {}
  return [];
}

function saveMenu(menu) {
  localStorage.setItem("menuData", JSON.stringify(menu));
}

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem("ordersData")) || [];
  } catch (e) {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem("ordersData", JSON.stringify(orders));
}

/* ============== TAB ============== */
function switchTab(tab, e) {
  if (e) e.preventDefault();
  document.querySelectorAll(".tab-content").forEach((el) => el.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((el) => el.classList.remove("active"));

  const content = document.getElementById("tab-" + tab);
  if (content) content.classList.add("active");
  if (e && e.target) e.target.classList.add("active");

  if (tab === "dashboard") renderDashboard();
  if (tab === "menu") renderAdminMenu();
  if (tab === "orders") renderOrders("all");
  if (tab === "texts") renderTextsEditor();
}

/* ============== RENDER MENU ============== */
function renderAdminMenu() {
  const wrap = document.getElementById("adminMenu");
  if (!wrap) return;

  const menu = getMenu();

  if (!menu.length) {
    wrap.innerHTML = '<p style="color:#715A45;text-align:center;padding:20px 0;">Belum ada menu.</p>';
    return;
  }

  wrap.innerHTML = menu
    .map(
      (x) => `
    <div class="admin-menu-item">
      <img src="${x.img}" alt="${x.name}" onerror="this.src='image/Pempek_palembang.jpg'">
      <div class="admin-menu-info">
        <h4>${x.name}</h4>
        <p>${x.desc || "-"}</p>
        <strong>Rp ${Number(x.price).toLocaleString("id-ID")}</strong>
      </div>
      <div class="admin-menu-actions">
        <button class="btn-edit" onclick="openEdit(${x.id})">✏️ Edit</button>
        <button class="btn-delete" onclick="deleteMenu(${x.id})">Hapus</button>
      </div>
    </div>`
    )
    .join("");
}

/* ============== PREVIEW FOTO TAMBAH ============== */
function initPreview() {
  const input = document.getElementById("newFoto");
  const preview = document.getElementById("preview");
  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) {
      preview.style.display = "none";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}

/* ============== TAMBAH MENU ============== */
function addMenu(e) {
  e.preventDefault();

  const name = document.getElementById("newName").value.trim();
  const price = parseInt(document.getElementById("newPrice").value, 10);
  const desc = document.getElementById("newDesc").value.trim();
  const file = document.getElementById("newFoto").files[0];

  if (!name || !price) {
    Toast.fire({ icon: "warning", title: "Nama dan harga wajib diisi" });
    return;
  }

  const doSave = (imgData) => {
    const menu = getMenu();
    menu.push({
      id: Date.now(),
      name,
      price,
      desc,
      img: imgData || "image/Pempek_palembang.jpg"
    });
    saveMenu(menu);

    Toast.fire({ icon: "success", title: "Menu berhasil ditambahkan" });
    document.getElementById("menuForm").reset();
    const preview = document.getElementById("preview");
    if (preview) preview.style.display = "none";
    renderAdminMenu();
  };

  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      swalError("Foto terlalu besar", "Ukuran foto maksimal 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => doSave(ev.target.result);
    reader.readAsDataURL(file);
  } else {
    doSave(null);
  }
}

/* ===================================================
   EDIT MENU
   =================================================== */
let editPhotoData = null;
let editOriginalImg = null;

function openEdit(id) {
  const menu = getMenu();
  const item = menu.find((m) => m.id === id);
  if (!item) {
    swalError("Menu tidak ditemukan", "Mungkin sudah dihapus.");
    return;
  }

  editPhotoData = null;
  editOriginalImg = item.img;

  document.getElementById("editId").value = item.id;
  document.getElementById("editName").value = item.name;
  document.getElementById("editPrice").value = item.price;
  document.getElementById("editDesc").value = item.desc || "";
  document.getElementById("editPreview").src = item.img;
  document.getElementById("editFoto").value = "";

  const modal = document.getElementById("editModal");
  modal.classList.add("show");
  modal.style.display = "flex";
}

function closeEdit() {
  const modal = document.getElementById("editModal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.style.display = "none";
  editPhotoData = null;
  editOriginalImg = null;
}

/* Preview foto baru saat edit */
document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "editFoto") {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      swalError("Foto terlalu besar", "Ukuran foto maksimal 2MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      editPhotoData = ev.target.result;
      document.getElementById("editPreview").src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }
});

function saveEdit() {
  const id = parseInt(document.getElementById("editId").value, 10);
  const name = document.getElementById("editName").value.trim();
  const price = parseInt(document.getElementById("editPrice").value, 10);
  const desc = document.getElementById("editDesc").value.trim();

  if (!name || !price) {
    Toast.fire({ icon: "warning", title: "Nama dan harga wajib diisi" });
    return;
  }

  const menu = getMenu();
  const idx = menu.findIndex((m) => m.id === id);
  if (idx === -1) {
    swalError("Menu tidak ditemukan", "Mungkin sudah dihapus.");
    closeEdit();
    return;
  }

  menu[idx].name = name;
  menu[idx].price = price;
  menu[idx].desc = desc;

  // Kalau ada foto baru, pakai
  if (editPhotoData) {
    menu[idx].img = editPhotoData;
  } else if (editOriginalImg) {
    menu[idx].img = editOriginalImg;
  }

  saveMenu(menu);
  closeEdit();
  renderAdminMenu();

  Toast.fire({ icon: "success", title: "Menu berhasil diupdate" });
}

/* ============== HAPUS MENU ============== */
function deleteMenu(id) {
  swalConfirm("Hapus menu ini?", "Menu akan dihapus permanen dari daftar.", "Ya, Hapus").then((result) => {
    if (!result.isConfirmed) return;
    let menu = getMenu();
    menu = menu.filter((m) => m.id !== id);
    saveMenu(menu);
    renderAdminMenu();
    Toast.fire({ icon: "success", title: "Menu dihapus" });
  });
}

/* ===================================================
   DASHBOARD
   =================================================== */
function renderDashboard() {
  const orders = getOrders();
  const users = JSON.parse(localStorage.getItem("usersData") || "[]");

  const today = new Date().toDateString();
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === today
  );

  const todayRevenue = todayOrders
    .filter((o) => o.status !== "cancel")
    .reduce((sum, o) => sum + o.total, 0);

  const menuCount = {};
  orders.forEach((o) => {
    if (o.status !== "cancel") {
      o.items.forEach((i) => {
        menuCount[i.name] = (menuCount[i.name] || 0) + i.qty;
      });
    }
  });
  const bestMenu = Object.entries(menuCount).sort((a, b) => b[1] - a[1])[0];

  document.getElementById("statTodayOrders").textContent = todayOrders.length;
  document.getElementById("statTodayRevenue").textContent =
    "Rp " + todayRevenue.toLocaleString("id-ID");
  document.getElementById("statBestMenu").textContent = bestMenu ? bestMenu[0] : "-";
  document.getElementById("statNewCustomers").textContent = users.length;

  const statuses = [
    { key: "pending", label: "Menunggu" },
    { key: "process", label: "Diproses" },
    { key: "shipped", label: "Dikirim" },
    { key: "done", label: "Selesai" },
    { key: "cancel", label: "Dibatalkan" }
  ];

  const counts = {};
  statuses.forEach((s) => {
    counts[s.key] = orders.filter((o) => o.status === s.key).length;
  });
  const maxCount = Math.max(1, ...Object.values(counts));

  document.getElementById("statusChart").innerHTML = statuses
    .map(
      (s) => `
    <div class="chart-row">
      <span class="chart-label">${s.label}</span>
      <div class="chart-track">
        <div class="chart-fill ${s.key}" style="width:${(counts[s.key] / maxCount) * 100}%"></div>
      </div>
      <span class="chart-count">${counts[s.key]}</span>
    </div>`
    )
    .join("");

  const topMenus = Object.entries(menuCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topWrap = document.getElementById("topMenuList");
  if (topMenus.length) {
    topWrap.innerHTML = topMenus
      .map(
        ([name, count], i) => `
      <div class="top-menu-item">
        <span class="top-menu-rank">${i + 1}</span>
        <span class="top-menu-name">${name}</span>
        <span class="top-menu-count">${count}×</span>
      </div>`
      )
      .join("");
  } else {
    topWrap.innerHTML = '<p style="color:#715A45;text-align:center;padding:20px 0;font-size:13.5px;">Belum ada data.</p>';
  }

  const recent = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const statusLabel = {
    pending: { text: "Menunggu", cls: "status-pending" },
    process: { text: "Diproses", cls: "status-process" },
    shipped: { text: "Dikirim", cls: "status-shipped" },
    done: { text: "Selesai", cls: "status-done" },
    cancel: { text: "Dibatalkan", cls: "status-cancel" }
  };

  const wrap = document.getElementById("recentOrders");
  if (!recent.length) {
    wrap.innerHTML = '<p style="text-align:center;color:#715A45;padding:20px 0;">Belum ada pesanan.</p>';
  } else {
    wrap.innerHTML = recent
      .map((o) => {
        const st = statusLabel[o.status] || statusLabel.pending;
        return `
        <div class="recent-item">
          <div>
            <div class="order-id">${o.id}</div>
            <div class="order-meta">${o.userName} · ${o.items.length} item · Rp ${o.total.toLocaleString("id-ID")}</div>
          </div>
          <span class="order-status ${st.cls}">${st.text}</span>
        </div>`;
      })
      .join("");
  }
}

/* ===================================================
   PESANAN
   =================================================== */
let currentFilter = "all";

function filterOrders(filter, e) {
  if (e) e.preventDefault();
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  if (e && e.target) e.target.classList.add("active");
  renderOrders(filter);
}

function renderOrders(filter = "all") {
  const wrap = document.getElementById("ordersList");
  if (!wrap) return;

  let orders = getOrders().slice().sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (filter !== "all") {
    orders = orders.filter((o) => o.status === filter);
  }

  if (!orders.length) {
    wrap.innerHTML = '<p style="text-align:center;color:#715A45;padding:30px 0;">Belum ada pesanan.</p>';
    return;
  }

  const statusLabel = {
    pending: { text: "Menunggu", cls: "status-pending" },
    process: { text: "Diproses", cls: "status-process" },
    shipped: { text: "Dikirim", cls: "status-shipped" },
    done: { text: "Selesai", cls: "status-done" },
    cancel: { text: "Dibatalkan", cls: "status-cancel" }
  };

  wrap.innerHTML = orders
    .map((o) => {
      const st = statusLabel[o.status] || statusLabel.pending;
      const date = new Date(o.createdAt).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      return `
      <div class="order-card-admin">
        <div class="order-head">
          <div>
            <div class="order-id">${o.id}</div>
            <div style="font-size:12px;color:#715A45;">${date}</div>
          </div>
          <span class="order-status ${st.cls}">${st.text}</span>
        </div>

        <div class="order-info-grid">
          <div><strong>Nama:</strong> ${o.userName}</div>
          <div><strong>HP:</strong> ${o.phone}</div>
          <div><strong>Kota:</strong> ${o.city}</div>
          <div><strong>Bayar:</strong> ${o.payment}</div>
          <div style="grid-column:1/-1;"><strong>Alamat:</strong> ${o.address}</div>
        </div>

        <div class="order-items-list">
          ${o.items
            .map(
              (i) =>
                `<div><span>${i.name} × ${i.qty}</span><span>Rp ${(i.price * i.qty).toLocaleString("id-ID")}</span></div>`
            )
            .join("")}
          <div style="border-top:1px dashed #D8BF8A;margin-top:6px;padding-top:6px;font-weight:700;">
            <span>Ongkir</span><span>Rp ${o.ongkir.toLocaleString("id-ID")}</span>
          </div>
          <div style="font-weight:700;font-family:'Playfair Display',serif;">
            <span>Total</span><span>Rp ${o.total.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div class="order-actions">
          <select onchange="changeOrderStatus('${o.id}', this.value)">
            <option value="pending" ${o.status === "pending" ? "selected" : ""}>Menunggu</option>
            <option value="process" ${o.status === "process" ? "selected" : ""}>Diproses</option>
            <option value="shipped" ${o.status === "shipped" ? "selected" : ""}>Dikirim</option>
            <option value="done" ${o.status === "done" ? "selected" : ""}>Selesai</option>
            <option value="cancel" ${o.status === "cancel" ? "selected" : ""}>Dibatalkan</option>
          </select>
          <button class="btn-cancel-order" onclick="deleteOrder('${o.id}')">Hapus</button>
        </div>
      </div>`;
    })
    .join("");
}

function changeOrderStatus(orderId, status) {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  order.status = status;
  order.updatedAt = new Date().toISOString();
  saveOrders(orders);

  if (status === "shipped") {
    addNotification(`Pesanan ${orderId} dikirim`, `ke ${order.userName} - ${order.city}`);
  } else if (status === "done") {
    addNotification(`Pesanan ${orderId} selesai`, `${order.userName} - Rp ${order.total.toLocaleString("id-ID")}`);
  }

  Toast.fire({ icon: "success", title: "Status pesanan diubah" });
  renderDashboard();
  renderOrders(currentFilter);
}

function deleteOrder(orderId) {
  swalConfirm("Hapus pesanan ini?", "Pesanan akan hilang dari daftar.", "Ya, Hapus").then((result) => {
    if (!result.isConfirmed) return;
    let orders = getOrders();
    orders = orders.filter((o) => o.id !== orderId);
    saveOrders(orders);
    renderDashboard();
    renderOrders(currentFilter);
    Toast.fire({ icon: "success", title: "Pesanan dihapus" });
  });
}

/* ===================================================
   NOTIFIKASI
   =================================================== */
function getNotifs() {
  try {
    return JSON.parse(localStorage.getItem("adminNotifs")) || [];
  } catch (e) {
    return [];
  }
}

function saveNotifs(notifs) {
  localStorage.setItem("adminNotifs", JSON.stringify(notifs));
  updateNotifBadge();
}

function addNotification(title, body) {
  const notifs = getNotifs();
  notifs.unshift({
    id: Date.now(),
    title,
    body,
    read: false,
    time: new Date().toISOString()
  });
  saveNotifs(notifs);
  renderNotifList();

  Toast.fire({ icon: "info", title: title });
}

function updateNotifBadge() {
  const notifs = getNotifs();
  const unread = notifs.filter((n) => !n.read).length;
  const badge = document.getElementById("notifCount");
  if (badge) {
    badge.textContent = unread;
    badge.style.display = unread ? "inline-block" : "none";
  }
}

function openNotif(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById("notifPanel");
  if (panel) panel.classList.toggle("show");
  renderNotifList();
}

function renderNotifList() {
  const wrap = document.getElementById("notifList");
  if (!wrap) return;

  const notifs = getNotifs();

  if (!notifs.length) {
    wrap.innerHTML = '<div class="notif-empty">Belum ada notifikasi.</div>';
    return;
  }

  wrap.innerHTML = notifs
    .slice(0, 20)
    .map((n) => {
      const t = new Date(n.time).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
      return `
      <div class="notif-item ${n.read ? "" : "unread"}" onclick="markRead(${n.id})">
        <strong>${n.title}</strong>
        <span>${n.body} · ${t}</span>
      </div>`;
    })
    .join("");
}

function markRead(id) {
  const notifs = getNotifs();
  const n = notifs.find((x) => x.id === id);
  if (n) n.read = true;
  saveNotifs(notifs);
  renderNotifList();
}

function markAllRead() {
  const notifs = getNotifs();
  notifs.forEach((n) => (n.read = true));
  saveNotifs(notifs);
  renderNotifList();
  Toast.fire({ icon: "success", title: "Semua notif ditandai dibaca" });
}

document.addEventListener("click", function (e) {
  const panel = document.getElementById("notifPanel");
  const btn = document.querySelector(".btn-notif");
  if (panel && panel.classList.contains("show") && !panel.contains(e.target) && !btn.contains(e.target)) {
    panel.classList.remove("show");
  }
});

/* ============== DETEKSI PESANAN BARU ============== */
let lastOrderCount = -1;

function checkNewOrders() {
  const orders = getOrders();
  if (lastOrderCount === -1) {
    lastOrderCount = orders.length;
    return;
  }

  if (orders.length > lastOrderCount) {
    const newOrders = orders.slice(lastOrderCount);
    newOrders.forEach((o) => {
      addNotification(
        `Pesanan Baru: ${o.id}`,
        `${o.userName} - ${o.items.length} item - Rp ${o.total.toLocaleString("id-ID")}`
      );
    });
    lastOrderCount = orders.length;
    renderDashboard();
    if (document.getElementById("tab-orders")?.classList.contains("active")) {
      renderOrders(currentFilter);
    }
  }
}

/* ===================================================
   EDIT TEKS WEBSITE
   Daftar field & default ada di site-texts.js
   =================================================== */
let currentTextGroup = "all";

function getTextGroups() {
  return [...new Set(SITE_TEXT_FIELDS.map((f) => f.group))];
}

function renderTextsEditor() {
  const wrap = document.getElementById("textsFields");
  const filterWrap = document.getElementById("textGroupFilter");
  if (!wrap || !filterWrap) return;

  const texts = getSiteTexts();
  const groups = getTextGroups();

  filterWrap.innerHTML = ["all", ...groups]
    .map(
      (g) => `<button type="button" class="filter-btn ${g === currentTextGroup ? "active" : ""}"
        onclick="filterTextGroup('${g}')">${g === "all" ? "Semua Bagian" : g}</button>`
    )
    .join("");

  wrap.innerHTML = groups
    .map((group) => {
      const fields = SITE_TEXT_FIELDS.filter((f) => f.group === group);
      return `
      <div class="text-group" data-group="${escapeHtml(group)}"
        style="${currentTextGroup === "all" || currentTextGroup === group ? "" : "display:none"}">
        <h3 class="text-group-title">${group}</h3>
        ${fields.map((f) => renderTextField(f, texts)).join("")}
      </div>`;
    })
    .join("");

  updateTextsDirty();
}

function renderTextField(field, texts) {
  const value = typeof texts[field.key] === "string" ? texts[field.key] : field.default;
  const changed = value !== field.default;
  const input = field.multiline
    ? `<textarea data-key="${field.key}" rows="3">${escapeHtml(value)}</textarea>`
    : `<input type="text" data-key="${field.key}" value="${escapeHtml(value)}">`;

  return `
  <div class="text-field ${changed ? "changed" : ""}">
    <div class="text-field-head">
      <label class="edit-label">${field.label}</label>
      <span class="text-field-badge">diubah</span>
      <button type="button" class="btn-reset-field" title="Kembalikan ke teks awal"
        onclick="resetTextField('${field.key}')">↺ Awal</button>
    </div>
    ${input}
    ${field.multiline ? '<small class="text-field-hint">Tekan Enter untuk pindah baris.</small>' : ""}
  </div>`;
}

function filterTextGroup(group) {
  currentTextGroup = group;
  document.querySelectorAll("#textGroupFilter .filter-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("onclick").includes(`'${group}'`));
  });
  document.querySelectorAll(".text-group").forEach((el) => {
    el.style.display = group === "all" || el.dataset.group === group ? "" : "none";
  });
}

/* Nilai form saat ini → hanya simpan yang beda dari default */
function collectTextsForm() {
  const result = {};
  document.querySelectorAll("#textsFields [data-key]").forEach((el) => {
    const field = SITE_TEXT_FIELDS.find((f) => f.key === el.dataset.key);
    if (field && el.value !== field.default) result[field.key] = el.value;
  });
  return result;
}

function updateTextsDirty() {
  const saved = getSiteTexts();
  const current = collectTextsForm();
  const savedKeys = Object.keys(saved).filter((k) => SITE_TEXT_FIELDS.some((f) => f.key === k));
  const dirty =
    savedKeys.length !== Object.keys(current).length ||
    Object.keys(current).some((k) => current[k] !== saved[k]);

  const el = document.getElementById("textsDirty");
  if (el) el.textContent = dirty ? "● Ada perubahan yang belum disimpan" : "";

  document.querySelectorAll("#textsFields [data-key]").forEach((input) => {
    const field = SITE_TEXT_FIELDS.find((f) => f.key === input.dataset.key);
    input.closest(".text-field").classList.toggle("changed", input.value !== field.default);
  });
  return dirty;
}

document.addEventListener("input", function (e) {
  if (e.target && e.target.closest && e.target.closest("#textsFields")) updateTextsDirty();
});

function saveTexts(e) {
  if (e) e.preventDefault();

  const words = (document.querySelector('[data-key="hero.typingWords"]')?.value || "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);
  if (!words.length) {
    Toast.fire({ icon: "warning", title: "Teks berjalan minimal berisi 1 kata" });
    return;
  }

  saveSiteTexts(collectTextsForm());
  updateTextsDirty();
  Toast.fire({ icon: "success", title: "Teks website berhasil disimpan" });
}

function resetTextField(key) {
  const field = SITE_TEXT_FIELDS.find((f) => f.key === key);
  const input = document.querySelector(`#textsFields [data-key="${key}"]`);
  if (!field || !input) return;
  input.value = field.default;
  updateTextsDirty();
  Toast.fire({ icon: "info", title: "Dikembalikan — klik Simpan untuk menerapkan" });
}

function resetAllTexts() {
  swalConfirm(
    "Kembalikan semua teks?",
    "Semua teks website akan kembali seperti semula. Perubahan yang pernah disimpan akan hilang.",
    "Ya, Kembalikan"
  ).then((result) => {
    if (!result.isConfirmed) return;
    saveSiteTexts({});
    renderTextsEditor();
    Toast.fire({ icon: "success", title: "Semua teks dikembalikan ke awal" });
  });
}

window.addEventListener("beforeunload", function (e) {
  if (document.getElementById("textsFields")?.children.length && updateTextsDirty()) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ============== LOGOUT ============== */
function logout() {
  Swal.fire({
    title: "Yakin mau keluar?",
    text: "Kamu akan logout dari panel admin.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#24160D",
    cancelButtonColor: "#B54A24",
    confirmButtonText: "Ya, Logout",
    cancelButtonText: "Batal"
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("loggedInUser");
      window.location.href = "index.html";
    }
  });
}

/* ============== INIT ============== */
document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  renderAdminMenu();
  initPreview();
  renderNotifList();
  updateNotifBadge();

  setInterval(checkNewOrders, 3000);
});