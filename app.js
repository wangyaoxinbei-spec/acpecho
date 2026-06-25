/* ============================================
   PackSmart — app.js
   ============================================ */

// ── Default sample data ──
const DEFAULT_ITEMS = [
  { id: 1, name: '护照', category: '证件', qty: 1, note: '有效期确认', purchased: true, packed: false },
  { id: 2, name: '签证',   category: '证件', qty: 1, note: '',          purchased: true,  packed: false },
  { id: 3, name: 'T恤',    category: '衣物', qty: 5, note: '速干款',    purchased: true,  packed: false },
  { id: 4, name: '牛仔裤', category: '衣物', qty: 2, note: '',          purchased: true,  packed: false },
  { id: 5, name: '充电宝', category: '电子', qty: 1, note: '20000mAh',  purchased: true,  packed: false },
  { id: 6, name: '转换插头', category: '电子', qty: 1, note: '万能型',  purchased: false, packed: false },
  { id: 7, name: '洗发水', category: '洗漱', qty: 1, note: '旅行装',    purchased: false, packed: false },
  { id: 8, name: '防晒霜', category: '洗漱', qty: 1, note: 'SPF50+',    purchased: true,  packed: false },
  { id: 9, name: '感冒药', category: '药品', qty: 1, note: '',          purchased: false, packed: false },
];

const CATEGORY_EMOJI = {
  '证件': '📋', '衣物': '👕', '洗漱': '🧴', '电子': '🔌', '药品': '💊', '其他': '📦'
};

// ── State ──
let items = JSON.parse(localStorage.getItem('packItems') || 'null') || DEFAULT_ITEMS;
let checklistState = JSON.parse(localStorage.getItem('checklistState') || '{}');
let editingId = null;
let activeFilter = 'all';
let activeCategory = 'all';
let searchQuery = '';

// ── Persistence ──
function save() {
  localStorage.setItem('packItems', JSON.stringify(items));
  localStorage.setItem('checklistState', JSON.stringify(checklistState));
}

// ── Stats ──
function updateStats() {
  document.getElementById('stat-total').textContent     = items.length;
  document.getElementById('stat-purchased').textContent = items.filter(i => i.purchased).length;
  document.getElementById('stat-pending').textContent   = items.filter(i => !i.purchased).length;
  document.getElementById('stat-packed').textContent    = Object.values(checklistState).filter(Boolean).length;
}

// ── Items Tab ──
function filteredItems() {
  return items.filter(item => {
    const matchFilter   = activeFilter === 'all' || (activeFilter === 'purchased' ? item.purchased : !item.purchased);
    const matchCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchSearch   = item.name.includes(searchQuery) || item.note.includes(searchQuery);
    return matchFilter && matchCategory && matchSearch;
  });
}

function renderItems() {
  const grid = document.getElementById('itemsGrid');
  const list = filteredItems();

  if (list.length === 0) {
    grid.innerHTML = `<div class="empty-state">📭<p>没有符合条件的物品</p></div>`;
    return;
  }

  // Group by category
  const groups = {};
  list.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  grid.innerHTML = Object.entries(groups).map(([cat, catItems]) => `
    <div class="category-group">
      <div class="category-title">${CATEGORY_EMOJI[cat] || '📦'} ${cat}</div>
      <div class="items-row">
        ${catItems.map(item => `
          <div class="item-card ${item.purchased ? 'purchased' : 'pending'}" data-id="${item.id}">
            <div class="item-card-top">
              <span class="item-name">${item.name}</span>
              <span class="item-qty">× ${item.qty}</span>
            </div>
            <div class="item-note">${item.note || ''}</div>
            <div class="item-card-bottom">
              <span class="purchase-badge ${item.purchased ? 'purchased' : 'pending'}">
                ${item.purchased ? '✓ 已购买' : '○ 待购买'}
              </span>
              <div class="item-actions">
                <button class="icon-btn toggle-purchase" title="切换购买状态" onclick="togglePurchase(${item.id})">
                  ${item.purchased ? '↩' : '✓'}
                </button>
                <button class="icon-btn" title="编辑" onclick="openEditModal(${item.id})">✏️</button>
                <button class="icon-btn" title="删除" onclick="deleteItem(${item.id})">🗑</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

// ── Checklist Tab ──
function renderChecklist() {
  const groups = {};
  items.forEach(item => {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  });

  const total   = items.length;
  const checked = items.filter(i => checklistState[i.id]).length;
  const pct     = total ? Math.round((checked / total) * 100) : 0;

  document.getElementById('checklistProgress').textContent = `${checked} / ${total} 已核对`;
  document.getElementById('checklistPercent').textContent  = `${pct}%`;
  document.getElementById('progressFill').style.width      = `${pct}%`;

  const container = document.getElementById('checklistGroups');
  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state">📭<p>先在「物品管理」标签页添加物品吧</p></div>`;
    return;
  }

  container.innerHTML = Object.entries(groups).map(([cat, catItems]) => `
    <div class="checklist-group">
      <div class="checklist-group-title">${CATEGORY_EMOJI[cat] || '📦'} ${cat}</div>
      ${catItems.map(item => `
        <div class="checklist-item ${checklistState[item.id] ? 'checked' : ''}"
             onclick="toggleCheck(${item.id})">
          <div class="checklist-box">${checklistState[item.id] ? '✓' : ''}</div>
          <span class="checklist-name">${item.name}</span>
          <span class="checklist-qty">× ${item.qty}</span>
          ${item.note ? `<span class="checklist-note">${item.note}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');
}

function toggleCheck(id) {
  checklistState[id] = !checklistState[id];
  save();
  renderChecklist();
  updateStats();
}

// ── Toggle Purchase ──
function togglePurchase(id) {
  const item = items.find(i => i.id === id);
  if (item) {
    item.purchased = !item.purchased;
    save();
    renderItems();
    updateStats();
    showToast(item.purchased ? `「${item.name}」标记为已购买` : `「${item.name}」标记为未购买`);
  }
}

// ── Delete ──
function deleteItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`确定删除「${item.name}」？`)) return;
  items = items.filter(i => i.id !== id);
  delete checklistState[id];
  save();
  renderItems();
  renderChecklist();
  updateStats();
  showToast(`「${item.name}」已删除`);
}

// ── Modal ──
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = '添加物品';
  document.getElementById('itemName').value     = '';
  document.getElementById('itemCategory').value = '其他';
  document.getElementById('itemQty').value      = '1';
  document.getElementById('itemNote').value     = '';
  document.getElementById('statusPending').checked = true;
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('itemName').focus();
}

function openEditModal(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = '编辑物品';
  document.getElementById('itemName').value     = item.name;
  document.getElementById('itemCategory').value = item.category;
  document.getElementById('itemQty').value      = item.qty;
  document.getElementById('itemNote').value     = item.note;
  if (item.purchased) document.getElementById('statusPurchased').checked = true;
  else document.getElementById('statusPending').checked = true;
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('itemName').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
}

function saveModal() {
  const name  = document.getElementById('itemName').value.trim();
  if (!name) { showToast('请填写物品名称'); return; }
  const category  = document.getElementById('itemCategory').value;
  const qty       = parseInt(document.getElementById('itemQty').value) || 1;
  const note      = document.getElementById('itemNote').value.trim();
  const purchased = document.getElementById('statusPurchased').checked;

  if (editingId) {
    const item = items.find(i => i.id === editingId);
    Object.assign(item, { name, category, qty, note, purchased });
    showToast(`「${name}」已更新`);
  } else {
    const newId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    items.push({ id: newId, name, category, qty, note, purchased, packed: false });
    showToast(`「${name}」已添加`);
  }
  save();
  renderItems();
  renderChecklist();
  updateStats();
  closeModal();
}

// ── Reset Checklist ──
function resetChecklist() {
  if (!confirm('确定重置所有打包核对状态？')) return;
  checklistState = {};
  save();
  renderChecklist();
  updateStats();
  showToast('清单已重置');
}

// ── Export ──
function exportChecklist() {
  const lines = ['PackSmart 打包清单', '='.repeat(30), ''];
  const groups = {};
  items.forEach(i => { if (!groups[i.category]) groups[i.category] = []; groups[i.category].push(i); });
  Object.entries(groups).forEach(([cat, catItems]) => {
    lines.push(`【${cat}】`);
    catItems.forEach(item => {
      const checked = checklistState[item.id] ? '[✓]' : '[ ]';
      const status  = item.purchased ? '已购' : '待购';
      lines.push(`  ${checked} ${item.name} × ${item.qty}  (${status})${item.note ? ' — ' + item.note : ''}`);
    });
    lines.push('');
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'pack-checklist.txt'; a.click();
  URL.revokeObjectURL(url);
  showToast('清单已导出');
}

// ── AI Section ──
async function generateAIPlan() {
  const btn = document.getElementById('generateAIBtn');
  const resultArea = document.getElementById('aiResult');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="display:inline-block;width:18px;height:18px;border-width:2px;vertical-align:middle;margin-right:8px;"></span> 生成中…';

  resultArea.innerHTML = `<div class="ai-loading"><div class="spinner"></div><p>AI 正在分析你的行李清单…</p></div>`;

  const purchased = items.filter(i => i.purchased).map(i => `${i.name}（${i.category}×${i.qty}）`);
  const pending   = items.filter(i => !i.purchased).map(i => `${i.name}（${i.category}×${i.qty}）`);

  const prompt = `你是一位专业的旅行收纳专家。请根据以下行李清单，给出结构清晰的最佳打包整理方案。

已购买物品（${purchased.length}件）：
${purchased.length ? purchased.join('、') : '（暂无）'}

待购买物品（${pending.length}件）：
${pending.length ? pending.join('、') : '（暂无）'}

请从以下几个维度给出建议，每个维度用简洁的标题+内容呈现：
1. 📦 打包优先顺序（先放什么、后放什么，为什么）
2. 🗂 空间利用技巧（针对这份清单的具体建议）
3. ✅ 紧急提醒（有哪些容易被忽视的重要物品）
4. 🛒 购买建议（针对未购买物品，哪些最优先）
5. 💡 一个针对本次行程的个性化小技巧

请使用 Markdown 格式，用 ### 作为各节标题，内容言简意赅，实用为主。`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    const text = data.content.map(b => b.text || '').join('');
    resultArea.innerHTML = `<div class="ai-content">${markdownToHTML(text)}</div>`;
  } catch (err) {
    console.error(err);
    resultArea.innerHTML = `<div class="ai-placeholder"><div class="ai-placeholder-icon">⚠️</div><p>生成失败，请稍后再试。<br><small style="color:#9B9591">（${err.message}）</small></p></div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="ai-icon">✨</span> 重新生成';
  }
}

// ── Simple Markdown → HTML ──
function markdownToHTML(md) {
  let html = md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    // headers
    .replace(/^### (.+)$/gm, (_, t) => `<div class="ai-section"><div class="ai-section-title">${t}</div><div class="ai-section-body">`)
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // bullets
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    // paragraphs — newlines that aren't already tags
    .replace(/\n{2,}/g, '</div></div><br>')
    .replace(/\n/g, ' ');

  // close unclosed section divs
  const openCount = (html.match(/<div class="ai-section">/g) || []).length;
  const closeCount = (html.match(/<\/div><\/div>/g) || []).length;
  for (let i = 0; i < openCount - closeCount; i++) html += '</div></div>';

  return html;
}

// ── Toast ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 2200);
}

// ── Tabs ──
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(`tab-${tabName}`).classList.add('active');
  document.querySelector(`.nav-btn[data-tab="${tabName}"]`).classList.add('active');
  if (tabName === 'checklist') renderChecklist();
}

// ── Init ──
function init() {
  // Tab buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Add item
  document.getElementById('addItemBtn').addEventListener('click', openAddModal);

  // Modal controls
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalSave').addEventListener('click', saveModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('itemName').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveModal();
  });

  // Filters
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderItems();
    });
  });

  document.getElementById('categoryFilter').addEventListener('change', e => {
    activeCategory = e.target.value;
    renderItems();
  });

  document.getElementById('searchInput').addEventListener('input', e => {
    searchQuery = e.target.value.trim();
    renderItems();
  });

  // Checklist
  document.getElementById('resetChecklist').addEventListener('click', resetChecklist);
  document.getElementById('exportBtn').addEventListener('click', exportChecklist);

  // AI
  document.getElementById('generateAIBtn').addEventListener('click', generateAIPlan);

  renderItems();
  updateStats();
}

document.addEventListener('DOMContentLoaded', init);
