const USERS_KEY   = 'kutubxona-users';
const SESSION_KEY = 'kutubxona-session';

// Agar allaqachon kirilgan bo'lsa — bosh sahifaga o'tkazish
if (localStorage.getItem(SESSION_KEY)) {
  window.location.replace('index.html');
}

/* ── Yordamchi funksiyalar ── */
function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password) {
  const buf  = new TextEncoder().encode(password + ':kutubxona2024');
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function showError(elId, msg) {
  const el = document.getElementById(elId);
  el.textContent = msg;
  el.classList.add('visible');
}
function clearError(elId) {
  const el = document.getElementById(elId);
  el.textContent = '';
  el.classList.remove('visible');
}

/* ── Aylanuvchi sitatlar ── */
const QUOTES = [
  '"Kitob o\'qigan odam hech qachon yolg\'iz bo\'lmaydi"',
  '"Bir kitob ming tajriba beradi"',
  '"Kitob — insonning eng sodiq do\'sti"',
  '"O\'qish — bu ko\'z ko\'rmagan dunyolarga sayohat"',
  '"Kitobxon odam — har doim boy odam"',
];
let quoteIdx = 0;
const quoteEl = document.getElementById('rotatingQuote');
if (quoteEl) {
  setInterval(() => {
    quoteEl.style.opacity = '0';
    setTimeout(() => {
      quoteIdx = (quoteIdx + 1) % QUOTES.length;
      quoteEl.textContent = QUOTES[quoteIdx];
      quoteEl.style.opacity = '';
    }, 520);
  }, 4000);
}

/* ── Tab almashtirish ── */
const tabBtns  = document.querySelectorAll('.auth-tab');
const forms    = document.querySelectorAll('.auth-form');
const slider   = document.getElementById('tabSlider');

tabBtns.forEach((tab, idx) => {
  tab.addEventListener('click', () => {
    tabBtns.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    slider.classList.toggle('right', idx === 1);
    forms.forEach(f => {
      f.classList.remove('active');
      f.style.animation = 'none';
    });
    const target = document.getElementById(tab.dataset.tab + 'Form');
    target.classList.add('active');
    target.style.animation = '';
    clearError('loginError');
    clearError('registerError');
  });
});

/* ── Parol ko'rish ── */
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input   = btn.parentElement.querySelector('input');
    const isText  = input.type === 'text';
    input.type    = isText ? 'password' : 'text';
    btn.querySelector('.eye-open').style.display  = isText ? '' : 'none';
    btn.querySelector('.eye-closed').style.display = isText ? 'none' : '';
  });
});

/* ── KIRISH ── */
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError('loginError');
  const form     = e.target;
  const btn      = form.querySelector('.submit-btn');
  const username = form.username.value.trim().toLowerCase();
  const password = form.password.value;

  if (!username || !password) { showError('loginError', "Barcha maydonlarni to'ldiring."); return; }

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Tekshirilmoqda...';

  const users = getUsers();
  const user  = users.find(u => u.username === username);
  if (!user) {
    showError('loginError', "Foydalanuvchi topilmadi. Ro'yxatdan o'ting.");
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Kirish';
    return;
  }

  const hash = await hashPassword(password);
  if (user.passwordHash !== hash) {
    showError('loginError', "Parol noto'g'ri. Qayta urinib ko'ring.");
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Kirish';
    return;
  }

  localStorage.setItem(SESSION_KEY, username);
  window.location.replace('index.html');
});

/* ── RO'YXATDAN O'TISH ── */
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError('registerError');
  const form        = e.target;
  const btn         = form.querySelector('.submit-btn');
  const displayName = form.displayName.value.trim();
  const username    = form.username.value.trim().toLowerCase();
  const password    = form.password.value;

  // Validatsiya
  if (!displayName || displayName.length < 2) {
    showError('registerError', "Ism kamida 2 ta belgidan iborat bo'lishi kerak."); return;
  }
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    showError('registerError', "Foydalanuvchi nomi: 3–20 ta lotin harfi, raqam yoki _ bo'lishi kerak."); return;
  }
  if (password.length < 6) {
    showError('registerError', "Parol kamida 6 ta belgidan iborat bo'lishi kerak."); return;
  }

  const users = getUsers();
  if (users.find(u => u.username === username)) {
    showError('registerError', "Bu foydalanuvchi nomi band. Boshqasini tanlang."); return;
  }

  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Yaratilmoqda...';

  const hash = await hashPassword(password);
  users.push({ username, displayName, passwordHash: hash, createdAt: Date.now() });
  saveUsers(users);

  localStorage.setItem(SESSION_KEY, username);
  window.location.replace('index.html');
});
