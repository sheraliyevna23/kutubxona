const SESSION_KEY = 'kutubxona-session';
const USERS_KEY   = 'kutubxona-users';
const THEME_KEY   = 'kutubxona-tema';

/* ── Auth tekshiruvi ── */
const currentUsername = localStorage.getItem(SESSION_KEY);
if (!currentUsername) window.location.replace('auth.html');

/* ── Joriy foydalanuvchi ── */
function getCurrentUser() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return users.find(u => u.username === currentUsername)
        || { displayName: currentUsername, username: currentUsername };
  } catch { return { displayName: currentUsername, username: currentUsername }; }
}

const currentUser = getCurrentUser();
const STORAGE_KEY = 'kitoblar-' + currentUsername;

/* ── Header ── */
const nameEl   = document.getElementById('userDisplayName');
const unameEl  = document.getElementById('userUsername');
const avatarEl = document.getElementById('userAvatar');
if (nameEl)  nameEl.textContent  = currentUser.displayName;
if (unameEl) unameEl.textContent = currentUser.email ? currentUser.email : '@' + currentUser.username;
if (avatarEl) {
  if (currentUser.picture) {
    avatarEl.innerHTML = `<img src="${currentUser.picture}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;display:block;">`;
  } else {
    avatarEl.textContent = currentUser.displayName.charAt(0).toUpperCase();
  }
}

/* Salomlashish (vaqtga ko'ra) */
function updateGreeting() {
  const h = new Date().getHours();
  const g = h < 5  ? 'Xayrli tun'
          : h < 12 ? 'Xayrli tong'
          : h < 17 ? 'Xayrli kun'
          : h < 21 ? 'Xayrli kech'
          :           'Xayrli tun';
  const el = document.getElementById('brandSub');
  if (el) el.textContent = `${g}, ${currentUser.displayName}!`;
}
updateGreeting();

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace('auth.html');
});

/* ═══════════════════════════════════════
   TEMA BOSHQARUVI
═══════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  buildBgDecor(saved);
}

function toggleTheme() {
  const cur  = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'day' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  buildBgDecor(next);
  showToast(
    next === 'dark' ? '🌙  Tungi rejim (moviy)' : '☀️  Kunduzgi rejim (qaymoq)',
    'toast-switch'
  );
}

document.getElementById('themeToggle').addEventListener('click', toggleTheme);

/* ═══════════════════════════════════════
   FON DEKORATSIYALARI
═══════════════════════════════════════ */
function buildBgDecor(theme) {
  const el = document.getElementById('bgDecor');
  if (!el) return;
  el.innerHTML = '';

  if (theme === 'dark') {
    /* ── Tungi (moviy): aurora + yulduzlar + oy ── */
    const a1 = document.createElement('div');
    a1.className = 'bg-aurora';
    el.appendChild(a1);

    const a2 = document.createElement('div');
    a2.className = 'bg-aurora-2';
    el.appendChild(a2);

    const moon = document.createElement('div');
    moon.className = 'bg-moon-glow';
    el.appendChild(moon);

    /* 90 ta yulduz */
    for (let i = 0; i < 90; i++) {
      const s    = document.createElement('div');
      s.className = 'bg-star';
      const sz   = (Math.random() * 2.2 + .6).toFixed(1);
      s.style.cssText =
        `left:${(Math.random()*100).toFixed(1)}vw;` +
        `top:${(Math.random()*100).toFixed(1)}vh;` +
        `width:${sz}px;height:${sz}px;` +
        `--d:${(Math.random()*8).toFixed(2)}s;` +
        `--dur:${(3+Math.random()*5).toFixed(2)}s;`;
      el.appendChild(s);
    }

  } else {
    /* ── Kunduzgi (qaymoq): issiqlik + quyosh + changlar ── */
    const warmth = document.createElement('div');
    warmth.className = 'bg-warmth';
    el.appendChild(warmth);

    const sun = document.createElement('div');
    sun.className = 'bg-day-sun';
    el.appendChild(sun);

    /* 16 ta chang zarrachasi */
    for (let i = 0; i < 16; i++) {
      const p    = document.createElement('div');
      p.className = 'bg-warm-dot';
      const sz   = (Math.random()*3 + 1.5).toFixed(1);
      p.style.cssText =
        `left:${(5+Math.random()*88).toFixed(1)}vw;` +
        `top:${(10+Math.random()*82).toFixed(1)}vh;` +
        `--s:${sz}px;` +
        `--d:${(Math.random()*10).toFixed(2)}s;` +
        `--dur:${(7+Math.random()*7).toFixed(2)}s;`;
      el.appendChild(p);
    }
  }
}

/* ═══════════════════════════════════════
   TOAST XABARLARI
═══════════════════════════════════════ */
function showToast(msg, cls = '') {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast' + (cls ? ' ' + cls : '');
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.classList.add('hide');
    setTimeout(() => t.remove(), 230);
  }, 2600);
}

/* ═══════════════════════════════════════
   HOLAT
═══════════════════════════════════════ */
let books  = [];
let filter = 'all';
let search = '';
let lastBookCount = -1;

const listEl        = document.getElementById('list');
const statusMsg     = document.getElementById('statusMsg');
const progressFill  = document.getElementById('progressFill');
const progressLabel = document.getElementById('progressLabel');

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ── Storage ── */
async function loadBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    books = raw !== null ? JSON.parse(raw) : [];
  } catch { books = []; }
  lastBookCount = books.length;
  statusMsg.textContent = '';
  render();
}

async function saveBooks() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(books)); } catch {}
  statusMsg.textContent = '';
}

/* ── Progress bar ── */
function updateProgress() {
  const total = books.length;
  const bor   = books.filter(b => b.status === 'bor').length;
  const pct   = total > 0 ? Math.round((bor / total) * 100) : 0;
  progressFill.style.width = pct + '%';
  progressFill.classList.toggle('full', pct === 100 && total > 0);
  progressLabel.textContent = total > 0 ? `${bor} / ${total} mavjud` : '';
}

/* ── Stat raqam animatsiyasi ── */
function animateCount(elId, target) {
  const el = document.getElementById(elId);
  if (!el) return;
  const from = parseInt(el.textContent) || 0;
  if (from === target) return;
  const dur = 420;
  const t0  = performance.now();
  (function step(now) {
    const p   = Math.min((now - t0) / dur, 1);
    const val = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
    el.textContent = val;
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

/* ── Milestones ── */
const MILESTONES = {
  1:   '🎊  Birinchi kitob — salom, kutubxona!',
  5:   '📚  5 ta kitob — zo\'r ketayapti!',
  10:  '🔥  10 kitob — haqiqiy kitobxon!',
  25:  '⭐  25 kitob — qoyil qoldi!',
  50:  '🏆  50 kitob — ustoz!',
  100: '👑  100 kitob — afsonaviy!',
};

function checkMilestone(newCount) {
  if (lastBookCount !== -1 && newCount > lastBookCount && MILESTONES[newCount]) {
    setTimeout(() => showToast(MILESTONES[newCount], 'toast-milestone'), 650);
  }
  lastBookCount = newCount;
}

/* ── Render ── */
function render() {
  const total    = books.length;
  const borCount = books.filter(b => b.status === 'bor').length;
  const yoqCount = books.filter(b => b.status === 'yoq').length;

  animateCount('statAll', total);
  animateCount('statBor', borCount);
  animateCount('statYoq', yoqCount);
  updateProgress();

  let shown = books.filter(b => filter === 'all' || b.status === filter);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    shown = shown.filter(b =>
      b.title.toLowerCase().includes(q) || (b.author || '').toLowerCase().includes(q)
    );
  }

  if (shown.length === 0) {
    const isEmpty = total === 0;
    const kbdHint = !isEmpty
      ? `<div class="kbd-hint"><kbd>/</kbd> tugmasi bilan qidiring</div>`
      : '';
    listEl.innerHTML = `
      <div class="empty">
        <span class="empty-icon">${isEmpty ? '📖' : '🔎'}</span>
        <div class="empty-title">${isEmpty ? "Kutubxona hali bo'sh" : "Hech narsa topilmadi"}</div>
        <div class="empty-sub">${isEmpty
          ? "Yuqoridagi forma orqali birinchi kitobingizni qo'shing."
          : "Boshqa kalit so'z bilan urinib ko'ring."}</div>
        ${kbdHint}
      </div>`;
    return;
  }

  const CHK = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
  const CRS = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  listEl.innerHTML = shown.map((b, i) => `
    <div class="book ${b.status}" data-id="${b.id}" style="animation-delay:${Math.min(i*.035,.4)}s">
      <div class="book-spine">${i + 1}</div>
      <div class="book-body">
        <div class="title">${escapeHtml(b.title)}</div>
        ${b.author ? `<div class="author">— ${escapeHtml(b.author)}</div>` : ''}
      </div>
      <button class="stamp" data-action="toggle" data-id="${b.id}" title="Statusni o'zgartirish">
        ${b.status === 'bor' ? CHK + ' MAVJUD' : CRS + ' KERAK'}
      </button>
      <button class="del" data-action="del" data-id="${b.id}" title="O'chirish">×</button>
    </div>
  `).join('');
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/* ═══════════════════════════════════════
   EVENTLAR
═══════════════════════════════════════ */
document.getElementById('addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form   = e.target;
  const title  = form.title.value.trim();
  const author = form.author.value.trim();
  const status = form.status.value;
  if (!title) return;
  books.unshift({ id: uid(), title, author, status });
  form.reset();
  render();
  await saveBooks();
  showToast(`✓  "${title}" qo'shildi`, 'toast-add');
  checkMilestone(books.length);
});

document.getElementById('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-f]');
  if (!btn) return;
  filter = btn.dataset.f;
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b === btn));
  render();
});

document.getElementById('searchBox').addEventListener('input', (e) => {
  search = e.target.value;
  render();
});

listEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.dataset.id;

  if (btn.dataset.action === 'toggle') {
    const b = books.find(x => x.id === id);
    if (b) {
      b.status = b.status === 'bor' ? 'yoq' : 'bor';
      showToast(b.status === 'bor' ? '✓  Mavjud deb belgilandi' : '○  Kerak deb belgilandi');
    }
    render();
    await saveBooks();

  } else if (btn.dataset.action === 'del') {
    const b = books.find(x => x.id === id);
    const name = b ? b.title : '';
    books = books.filter(x => x.id !== id);
    render();
    await saveBooks();
    if (name) showToast(`✕  "${name}" o'chirildi`, 'toast-del');
  }
});

/* "/" — qidiruvni ochadi */
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
    e.preventDefault();
    document.getElementById('searchBox').focus();
  }
  if (e.key === 'Escape') document.getElementById('searchBox').blur();
});

/* ═══════════════════════════════════════
   ISHGA TUSHIRISH
═══════════════════════════════════════ */
initTheme();
loadBooks();
