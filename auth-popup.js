function openAuth() {
  document.getElementById('authModal').classList.add('show');
  showLogin();
}

function closeAuth() {
  document.getElementById('authModal').classList.remove('show');
}

function showLogin() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}

function showRegister(e) {
  if (e) e.preventDefault();
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  if (!email || !password) {
    alert('Email dan password wajib diisi.');
    return;
  }

  alert('Login berhasil (demo). Selamat datang di Pempek Wong Kito!');
  closeAuth();
}

function register() {
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!name || !email || !password) {
    alert('Semua kolom wajib diisi.');
    return;
  }

  alert('Pendaftaran berhasil (demo). Silakan login.');
  showLogin();
}

// Tutup modal kalau klik di luar box
document.addEventListener('click', function (e) {
  const modal = document.getElementById('authModal');
  if (modal && e.target === modal) {
    closeAuth();
  }
});