const BIRTH_YEAR = 1991; // ← 生まれ年を変更してください

// ════════════════════════════════════════════════
// デフォルトデータ（初回のみ使用。以降はlocalStorageが優先）
// ════════════════════════════════════════════════
const DEFAULT_DATA = [
  { year: 1996, month: 4,  category: 'school', text: '○○小学校 入学' },
  { year: 2002, month: 4,  category: 'school', text: '○○中学校 入学' },
  { year: 2005, month: 4,  category: 'school', text: '○○高校 入学' },
  { year: 2008, month: 4,  category: 'school', text: '○○大学 入学' },
  { year: 2008, month: 4,  category: 'home',   text: '一人暮らし開始（○○市）' },
  { year: 2010, month: 8,  category: 'event',  text: '短期留学（○○）' },
  { year: 2011, month: 4,  category: 'work',   text: '株式会社○○ 入社' },
  { year: 2011, month: 4,  category: 'school', text: '大学 卒業' },
  { year: 2013, month: 7,  category: 'work',   text: '株式会社△△ 転職' },
  { year: 2013, month: 9,  category: 'home',   text: '○○区に引越し' },
  { year: 2016, month: 6,  category: 'event',  text: '○○ 旅行' },
  { year: 2016, month: 11, category: 'event',  text: '○○イベント参加' },
  { year: 2018, month: 4,  category: 'work',   text: '管理職に昇格' },
  { year: 2020, month: 4,  category: 'event',  text: 'リモートワーク開始' },
  { year: 2020, month: 10, category: 'home',   text: '現在の家に引越し' },
  { year: 2022, month: 4,  category: 'work',   text: '株式会社□□ 転職' },
  { year: 2022, month: 7,  category: 'event',  text: '○○を始める' },
];

// ════════════════════════════════════════════════
// Firebase 初期化
// ════════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyCfvqQWLB8NJqmaH0k2G0wPcbJJjz2Vu4A",
  authDomain: "kaimemo-58bad.firebaseapp.com",
  projectId: "kaimemo-58bad",
  storageBucket: "kaimemo-58bad.firebasestorage.app",
  messagingSenderId: "308069117698",
  appId: "1:308069117698:web:c61a57853abb7e8ffb1c1b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const docRef = db.collection('nenpy').doc('data');

// ════════════════════════════════════════════════
// データ管理（Firestore）
// ════════════════════════════════════════════════
function saveData(data) {
  docRef.set({ items: data, periods: PERIODS });
}

let DATA = [];

function nextId() {
  return DATA.length === 0 ? 0 : Math.max(...DATA.map(d => d.id ?? 0)) + 1;
}

// ════════════════════════════════════════════════
// ヘルパー
// ════════════════════════════════════════════════
function fiscalYear(item) {
  return item.month >= 4 ? item.year : item.year - 1;
}

function monthIndex(month) {
  return month >= 4 ? month - 4 : month + 8;
}

// 年度・月インデックス → 実際の year/month
function indexToYearMonth(fy, idx) {
  if (idx <= 8) return { year: fy,     month: idx + 4 };      // 4〜12月
  else          return { year: fy + 1, month: idx - 8 };      // 1〜3月
}

function ageAt(year) {
  return year - BIRTH_YEAR;
}

const CATEGORY_LABELS = { school: '学校', work: '仕事', home: '住まい', event: '出来事' };

// ════════════════════════════════════════════════
// モーダル
// ════════════════════════════════════════════════
function openModal(fy, monthIdx) {
  const { year, month } = indexToYearMonth(fy, monthIdx);
  const items = DATA.filter(d => d.year === year && d.month === month);

  const modal    = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const itemList = document.getElementById('modal-items');
  const form     = document.getElementById('modal-form');

  modalTitle.textContent = `${year}年 ${month}月`;
  form.dataset.year  = year;
  form.dataset.month = month;
  document.getElementById('form-text').value     = '';
  document.getElementById('form-category').value = 'event';

  renderModalItems(items, itemList);
  modal.classList.add('open');
  document.getElementById('modal-overlay').style.display = 'block';
}

function renderModalItems(items, container) {
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<p class="no-items">まだ項目がありません</p>';
    return;
  }
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'modal-item-row';

    const badge = document.createElement('span');
    badge.className = `badge ${item.category}`;
    badge.textContent = item.text;
    badge.dataset.id = item.id;

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.title = '編集';
    editBtn.textContent = '✏️';
    editBtn.onclick = () => startEdit(item, row);

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn del';
    delBtn.title = '削除';
    delBtn.textContent = '🗑';
    delBtn.onclick = () => deleteItem(item.id);

    row.append(badge, editBtn, delBtn);
    container.appendChild(row);
  });
}

function startEdit(item, row) {
  row.innerHTML = '';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = item.text;
  input.className = 'edit-input';

  const select = document.createElement('select');
  select.className = 'edit-select';
  Object.entries(CATEGORY_LABELS).forEach(([val, label]) => {
    const opt = document.createElement('option');
    opt.value = val;
    opt.textContent = label;
    if (val === item.category) opt.selected = true;
    select.appendChild(opt);
  });

  const saveBtn = document.createElement('button');
  saveBtn.className = 'icon-btn';
  saveBtn.textContent = '💾';
  saveBtn.onclick = () => {
    const txt = input.value.trim();
    if (!txt) return;
    item.text     = txt;
    item.category = select.value;
    saveData(DATA);
    buildTable();
    refreshModalItems(item.year, item.month);
  };

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'icon-btn';
  cancelBtn.textContent = '✕';
  cancelBtn.onclick = () => refreshModalItems(item.year, item.month);

  row.append(input, select, saveBtn, cancelBtn);
}

function deleteItem(id) {
  const item = DATA.find(d => d.id === id);
  if (!item) return;
  const { year, month } = item;
  DATA = DATA.filter(d => d.id !== id);
  saveData(DATA);
  buildTable();
  refreshModalItems(year, month);
}

function openModalEditItem(item) {
  const fy  = fiscalYear(item);
  const idx = monthIndex(item.month);
  openModal(fy, idx);
  // モーダルが開いた直後に対象アイテムを編集モードにする
  const rows = document.querySelectorAll('.modal-item-row');
  rows.forEach(row => {
    const badge = row.querySelector('.badge');
    if (badge && parseInt(badge.dataset.id) === item.id) {
      startEdit(item, row);
    }
  });
}

function refreshModalItems(year, month) {
  const items = DATA.filter(d => d.year === year && d.month === month);
  renderModalItems(items, document.getElementById('modal-items'));
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('modal-overlay').style.display = 'none';
}

// ════════════════════════════════════════════════
// フォーム送信（追加）
// ════════════════════════════════════════════════
document.getElementById('modal-form').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const text = document.getElementById('form-text').value.trim();
  if (!text) return;
  const newItem = {
    id:       nextId(),
    year:     parseInt(form.dataset.year),
    month:    parseInt(form.dataset.month),
    category: document.getElementById('form-category').value,
    text,
  };
  DATA.push(newItem);
  saveData(DATA);
  buildTable();
  refreshModalItems(newItem.year, newItem.month);
  document.getElementById('form-text').value = '';
});

// ════════════════════════════════════════════════
// 会社期間データ管理
// ════════════════════════════════════════════════
const PERIOD_PALETTE = ['#4ade80','#60b4ff','#fb923c','#c084fc','#f472b6','#facc15','#34d399','#f87171'];

function savePeriods() {
  docRef.set({ items: DATA, periods: PERIODS });
}

let PERIODS = [];
let selectedPeriodColor = PERIOD_PALETTE[0];

function toLinear(year, month) {
  return year * 12 + month;
}

function getCellPeriod(fy, monthIdx) {
  const { year, month } = indexToYearMonth(fy, monthIdx);
  const lin = toLinear(year, month);
  return PERIODS.find(p => {
    const start = toLinear(p.startYear, p.startMonth);
    const end   = p.endYear ? toLinear(p.endYear, p.endMonth) : toLinear(2100, 12);
    return lin >= start && lin <= end;
  }) || null;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ════════════════════════════════════════════════
// 期間モーダル
// ════════════════════════════════════════════════
function openPeriodModal() {
  renderPeriodList();
  document.getElementById('period-modal').classList.add('open');
  document.getElementById('period-modal-overlay').style.display = 'block';
}

function closePeriodModal() {
  document.getElementById('period-modal').classList.remove('open');
  document.getElementById('period-modal-overlay').style.display = 'none';
}

function renderPeriodList() {
  const container = document.getElementById('period-list');
  container.innerHTML = '';
  if (PERIODS.length === 0) {
    container.innerHTML = '<p class="no-items">まだ期間がありません</p>';
    return;
  }
  PERIODS.forEach(p => {
    const row = document.createElement('div');
    row.className = 'modal-item-row';

    const dot = document.createElement('span');
    dot.className = 'period-dot';
    dot.style.background = p.color;

    const label = document.createElement('span');
    label.className = 'period-text';
    const endStr = p.endYear
      ? `${p.endYear}/${String(p.endMonth).padStart(2, '0')}`
      : '現在';
    label.textContent = `${p.label}　${p.startYear}/${String(p.startMonth).padStart(2, '0')} 〜 ${endStr}`;

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn del';
    delBtn.title = '削除';
    delBtn.textContent = '🗑';
    delBtn.onclick = () => {
      PERIODS = PERIODS.filter(x => x.id !== p.id);
      savePeriods();
      buildTable();
      renderPeriodList();
    };

    row.append(dot, label, delBtn);
    container.appendChild(row);
  });
}

function initMonthSelect(id) {
  const sel = document.getElementById(id);
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m + '月';
    sel.appendChild(opt);
  }
}

function initPeriodColorPicker() {
  const container = document.getElementById('period-colors');
  PERIOD_PALETTE.forEach(color => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-swatch' + (color === selectedPeriodColor ? ' active' : '');
    btn.style.background = color;
    btn.onclick = () => {
      selectedPeriodColor = color;
      container.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
    container.appendChild(btn);
  });
}

// ════════════════════════════════════════════════
// テーブル描画
// ════════════════════════════════════════════════
function buildTable() {
  const minY = 1991;
  const maxY = 2030;

  const map = {};
  for (let y = minY; y <= maxY; y++) map[y] = Array.from({length: 12}, () => []);
  DATA.forEach(item => {
    const fy  = fiscalYear(item);
    const idx = monthIndex(item.month);
    if (map[fy]) map[fy][idx].push(item);
  });

  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';

  for (let y = minY; y <= maxY; y++) {
    const tr = document.createElement('tr');

    const yrTd = document.createElement('td');
    yrTd.className = 'col-year';
    yrTd.textContent = y;

    const ageTd = document.createElement('td');
    ageTd.className = 'col-age';
    ageTd.textContent = `${ageAt(y)}歳`;

    tr.appendChild(yrTd);

    map[y].forEach((items, idx) => {
      const td = document.createElement('td');
      td.title = 'クリックして編集';
      td.dataset.fy  = y;
      td.dataset.idx = idx;

      // 会社期間の色付け
      const period = getCellPeriod(y, idx);
      if (period) {
        const { year, month } = indexToYearMonth(y, idx);
        const isStart = toLinear(year, month) === toLinear(period.startYear, period.startMonth);
        td.style.setProperty('--pb', hexToRgba(period.color, 0.1));
        td.style.setProperty('--pl', hexToRgba(period.color, 0.55));
        td.classList.add('in-period');
        if (isStart) td.classList.add('period-start');
        const endStr = period.endYear
          ? `${period.endYear}/${String(period.endMonth).padStart(2, '0')}`
          : '現在';
        td.title = `${period.label}（${period.startYear}/${String(period.startMonth).padStart(2, '0')} 〜 ${endStr}）　クリックして編集`;
      }

      // ドロップターゲット
      td.addEventListener('dragover', e => {
        e.preventDefault();
        td.classList.add('drag-over');
      });
      td.addEventListener('dragleave', () => td.classList.remove('drag-over'));
      td.addEventListener('drop', e => {
        e.preventDefault();
        td.classList.remove('drag-over');
        const id = parseInt(e.dataTransfer.getData('text/plain'));
        const { year, month } = indexToYearMonth(parseInt(td.dataset.fy), parseInt(td.dataset.idx));
        const item = DATA.find(d => d.id === id);
        if (!item || (item.year === year && item.month === month)) return;
        item.year  = year;
        item.month = month;
        saveData(DATA);
        buildTable();
      });

      // クリックでモーダル（ドラッグ後の誤クリック防止）
      let dragged = false;
      td.addEventListener('mousedown', () => { dragged = false; });
      td.addEventListener('mousemove', () => { dragged = true; });
      td.addEventListener('click', () => { if (!dragged) openModal(y, idx); });

      items.forEach(item => {
        const span = document.createElement('span');
        span.className = `badge ${item.category}`;
        span.textContent = item.text;
        span.draggable = true;
        span.addEventListener('dragstart', e => {
          e.dataTransfer.setData('text/plain', item.id);
          e.dataTransfer.effectAllowed = 'move';
          span.classList.add('dragging');
        });
        span.addEventListener('dragend', () => span.classList.remove('dragging'));
        // バッジクリック → そのアイテムを編集モードで開く
        span.addEventListener('click', e => {
          e.stopPropagation();
          openModalEditItem(item);
        });
        td.appendChild(span);
      });

      tr.appendChild(td);
      if (idx === 7) tr.appendChild(ageTd); // 11月の直後（誕生月）に年齢列を挿入
    });

    tbody.appendChild(tr);
  }

  buildMobileView();
}

// モーダル外クリックで閉じる
document.getElementById('modal-overlay').onclick = closeModal;
document.getElementById('modal-close').onclick   = closeModal;

// 期間モーダル
document.getElementById('btn-period').addEventListener('click', openPeriodModal);
document.getElementById('period-modal-close').addEventListener('click', closePeriodModal);
document.getElementById('period-modal-overlay').addEventListener('click', closePeriodModal);

document.getElementById('pf-ey').addEventListener('input', function () {
  document.getElementById('pf-em').disabled = !this.value.trim();
});

document.getElementById('period-form').addEventListener('submit', e => {
  e.preventDefault();
  const label  = document.getElementById('pf-label').value.trim();
  const sy     = parseInt(document.getElementById('pf-sy').value);
  const sm     = parseInt(document.getElementById('pf-sm').value);
  const eyVal  = document.getElementById('pf-ey').value.trim();
  const ey     = eyVal ? parseInt(eyVal) : null;
  const em     = ey    ? parseInt(document.getElementById('pf-em').value) : null;
  if (!label || !sy || !sm) return;
  PERIODS.push({ id: Date.now().toString(), label, startYear: sy, startMonth: sm, endYear: ey, endMonth: em, color: selectedPeriodColor });
  savePeriods();
  buildTable();
  renderPeriodList();
  document.getElementById('pf-label').value = '';
  document.getElementById('pf-sy').value    = '';
  document.getElementById('pf-ey').value    = '';
});

initMonthSelect('pf-sm');
initMonthSelect('pf-em');
document.getElementById('pf-em').disabled = true;
initPeriodColorPicker();

// ── localStorageからの一回限りの移行 ──────────────────────────────
const MIGRATED_KEY = 'nenpy_migrated';
if (!localStorage.getItem(MIGRATED_KEY)) {
  const savedItems   = localStorage.getItem('nenpy_data');
  const savedPeriods = localStorage.getItem('nenpy_periods');
  if (savedItems) {
    const migrateItems   = JSON.parse(savedItems);
    const migratePeriods = savedPeriods ? JSON.parse(savedPeriods) : [];
    docRef.set({ items: migrateItems, periods: migratePeriods });
  }
  localStorage.setItem(MIGRATED_KEY, '1');
}

// ── Firestore リアルタイム同期 ──────────────────────────────────────
document.getElementById('tbody').innerHTML =
  '<tr><td colspan="14" style="text-align:center;padding:40px;color:#4a5568">読み込み中…</td></tr>';

docRef.onSnapshot(snap => {
  if (snap.exists) {
    DATA    = snap.data().items   || [];
    PERIODS = snap.data().periods || [];
  } else {
    DATA    = DEFAULT_DATA.map((d, i) => ({ ...d, id: i }));
    PERIODS = [];
    docRef.set({ items: DATA, periods: PERIODS });
  }
  buildTable();
});

// ════════════════════════════════════════════════
// モバイル縦ビュー
// ════════════════════════════════════════════════
function buildMobileView() {
  const minY = 1991;
  const maxY = 2030;
  const MONTH_ORDER = [4,5,6,7,8,9,10,11,12,1,2,3];
  const container = document.getElementById('mobile-view');
  container.innerHTML = '';

  for (let y = minY; y <= maxY; y++) {
    const yearEvents = DATA.filter(d => fiscalYear(d) === y);
    const isEmpty = yearEvents.length === 0;

    const block = document.createElement('div');
    block.className = 'mv-year-block' + (isEmpty ? ' empty' : '');

    // 年ヘッダー
    const header = document.createElement('div');
    header.className = 'mv-year-header';

    const yearSpan = document.createElement('span');
    yearSpan.textContent = `${y}年`;

    const ageSpan = document.createElement('span');
    ageSpan.className = 'mv-age-label';
    ageSpan.textContent = `${ageAt(y)}歳`;

    const addBtn = document.createElement('button');
    addBtn.className = 'mv-add-btn';
    addBtn.title = '追加';
    addBtn.textContent = '+';
    addBtn.onclick = e => { e.stopPropagation(); toggleMvPicker(y); };

    header.append(yearSpan, ageSpan, addBtn);
    block.appendChild(header);

    // 月ピッカー
    const picker = document.createElement('div');
    picker.className = 'mv-month-picker';
    picker.id = `mv-picker-${y}`;
    MONTH_ORDER.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'mv-month-btn';
      btn.textContent = m + '月';
      btn.onclick = () => { openModal(y, monthIndex(m)); closeMvPicker(); };
      picker.appendChild(btn);
    });
    block.appendChild(picker);

    // イベント一覧
    if (!isEmpty) {
      const period = getCellPeriod(y, 0);
      const eventsDiv = document.createElement('div');
      eventsDiv.className = 'mv-events';
      if (period) eventsDiv.style.borderLeftColor = hexToRgba(period.color, 0.6);

      MONTH_ORDER.forEach(m => {
        const monthEvents = yearEvents.filter(d => d.month === m);
        if (!monthEvents.length) return;

        const row = document.createElement('div');
        row.className = 'mv-month-row';
        row.onclick = () => openModal(y, monthIndex(m));

        const monthLabel = document.createElement('span');
        monthLabel.className = 'mv-month-label';
        monthLabel.textContent = m + '月';

        const badgesDiv = document.createElement('div');
        badgesDiv.className = 'mv-badges';
        monthEvents.forEach(item => {
          const badge = document.createElement('span');
          badge.className = `badge ${item.category}`;
          badge.textContent = item.text;
          badge.onclick = e => { e.stopPropagation(); openModalEditItem(item); };
          badgesDiv.appendChild(badge);
        });

        row.append(monthLabel, badgesDiv);
        eventsDiv.appendChild(row);
      });

      block.appendChild(eventsDiv);
    }

    container.appendChild(block);
  }
}

function toggleMvPicker(y) {
  const picker = document.getElementById(`mv-picker-${y}`);
  if (!picker) return;
  const isOpen = picker.classList.contains('open');
  closeMvPicker();
  if (!isOpen) picker.classList.add('open');
}

function closeMvPicker() {
  document.querySelectorAll('.mv-month-picker.open')
    .forEach(p => p.classList.remove('open'));
}

// ── スクロールヒント ──────────────────────────────────────────────
(function () {
  const wrap = document.querySelector('.table-wrap');
  const hint = document.querySelector('.scroll-hint-wrap');

  function checkScroll() {
    const atEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 4;
    hint.classList.toggle('scrolled-end', atEnd);
  }
  wrap.addEventListener('scroll', checkScroll, { passive: true });
  checkScroll();
})();
