/* ============================================
   PackSmart — app.js (Supabase 多设备同步版)
   ============================================ */

const SUPABASE_URL = 'https://phftmjlbhqhwqyatlljo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZnRtamxiaHFod3F5YXRsbGpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxMDY0MjQsImV4cCI6MjA5NTY4MjQyNH0.ybxDueANoMrcD8jX2cD808W5OVxaRlj4fk8gLXDfOAM';

const CATEGORY_EMOJI = {
  '证件': '📋', '衣物': '👕', '洗漱': '🧴', '电子': '🔌', '药品': '💊', '其他': '📦'
};

// ── State ──
let items = [];
let checklistState = {}; // { item_id: true/false }
let activeFilter = 'all';
let activeCategory = 'all';
let searchQuery = '';
let editingId = null;

// ── Supabase helpers ──
async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    },
    ...options
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ── Load all data ──
async function loadAll() {
  showLoading(true);
  try {
    const [fetchedItems, fetchedChecklist] = await Promise.all([
      sbFetch('items?order=created_at.asc'),
      sbFetch('checklist_state?select=item_id,checked')
    ]);
    items = fetchedItems;
    checklistState = {};
    fetchedChecklist.forEach(r => { checklistState[r.item_id] = r.checked; });
  } catch (e) {
    showToast('加载数据失败：' + e.message);
  } finally {
    showLoading(false);
  }
  renderItems();
  renderChecklist();
  updateStats();
}

function showLoading(on) {
  const grid = document.getElementById('itemsGrid');
  if (on) grid.innerHTML = '<div class="empty-state">⏳<p>加载中…</p></div>';
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
    const matchSearch   = item.name.includes(searchQuery) || (item.note || '').includes(searchQuery);
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

async function toggleCheck(id) {
  const newVal = !checklistState[id];
  checklistState[id] = newVal;
  renderChecklist();
  updateStats();
  try {
    // upsert
    await sbFetch('checklist_state', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ item_id: id, checked: newVal })
    });
  } catch (e) {
    showToast('同步失败：' + e.message);
  }
}

// ── Toggle Purchase ──
async function togglePurchase(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  const newVal = !item.purchased;
  item.purchased = newVal;
  renderItems();
  updateStats();
  try {
    await sbFetch(`items?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ purchased: newVal })
    });
    showToast(newVal ? `「${item.name}」标记为已购买` : `「${item.name}」标记为未购买`);
  } catch (e) {
    item.purchased = !newVal; // rollback
    renderItems();
    showToast('更新失败：' + e.message);
  }
}

// ── Delete ──
async function deleteItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`确定删除「${item.name}」？`)) return;
  items = items.filter(i => i.id !== id);
  delete checklistState[id];
  renderItems();
  renderChecklist();
  updateStats();
  try {
    await sbFetch(`items?id=eq.${id}`, { method: 'DELETE' });
    showToast(`「${item.name}」已删除`);
  } catch (e) {
    showToast('删除失败：' + e.message);
    await loadAll(); // reload
  }
}

// ── Modal ──
function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent   = '添加物品';
  document.getElementById('itemName').value           = '';
  document.getElementById('itemCategory').value       = '其他';
  document.getElementById('itemQty').value            = '1';
  document.getElementById('itemNote').value           = '';
  document.getElementById('statusPending').checked    = true;
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('itemName').focus();
}

function openEditModal(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = '编辑物品';
  document.getElementById('itemName').value         = item.name;
  document.getElementById('itemCategory').value     = item.category;
  document.getElementById('itemQty').value          = item.qty;
  document.getElementById('itemNote').value         = item.note || '';
  if (item.purchased) document.getElementById('statusPurchased').checked = true;
  else document.getElementById('statusPending').checked = true;
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('itemName').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  editingId = null;
}

async function saveModal() {
  const name = document.getElementById('itemName').value.trim();
  if (!name) { showToast('请填写物品名称'); return; }
  const category  = document.getElementById('itemCategory').value;
  const qty       = parseInt(document.getElementById('itemQty').value) || 1;
  const note      = document.getElementById('itemNote').value.trim();
  const purchased = document.getElementById('statusPurchased').checked;

  closeModal();

  try {
    if (editingId) {
      const updated = await sbFetch(`items?id=eq.${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, category, qty, note, purchased })
      });
      const idx = items.findIndex(i => i.id === editingId);
      if (idx !== -1 && updated[0]) items[idx] = updated[0];
      showToast(`「${name}」已更新`);
    } else {
      const created = await sbFetch('items', {
        method: 'POST',
        body: JSON.stringify({ name, category, qty, note, purchased, packed: false })
      });
      if (created[0]) items.push(created[0]);
      showToast(`「${name}」已添加`);
    }
  } catch (e) {
    showToast('保存失败：' + e.message);
  }

  renderItems();
  renderChecklist();
  updateStats();
}

// ── Reset Checklist ──
async function resetChecklist() {
  if (!confirm('确定重置所有打包核对状态？')) return;
  checklistState = {};
  renderChecklist();
  updateStats();
  try {
    await sbFetch('checklist_state', { method: 'DELETE', headers: { 'Prefer': '' } });
    showToast('清单已重置');
  } catch (e) {
    showToast('重置失败：' + e.message);
  }
}

// ── Export ──
function exportChecklist() {
  const lines = ['PackSmart 打包清单', '='.repeat(30), ''];
  const groups = {};
  items.forEach(i => { if (!groups[i.category]) groups[i.category] = []; groups[i.category].push(i); });
  Object.entries(groups).forEach(([cat, catItems]) => {
    lines.push(`【${cat}】`);
    catItems.forEach(item => {
      const ch     = checklistState[item.id] ? '[✓]' : '[ ]';
      const status = item.purchased ? '已购' : '待购';
      lines.push(`  ${ch} ${item.name} × ${item.qty}  (${status})${item.note ? ' — ' + item.note : ''}`);
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

// ── AI ──
async function generateAIPlan() {
  const btn = document.getElementById('generateAIBtn');
  const resultArea = document.getElementById('aiResult');
  btn.disabled = true;
  btn.innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;vertical-align:middle;margin-right:8px;"></span> 生成中…';
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
  } catch (e) {
    resultArea.innerHTML = `<div class="ai-placeholder"><div class="ai-placeholder-icon">⚠️</div><p>生成失败，请稍后再试。<br><small style="color:#9B9591">（${e.message}）</small></p></div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="ai-icon">✨</span> 重新生成';
  }
}

function markdownToHTML(md) {
  let html = md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm, (_, t) => `<div class="ai-section"><div class="ai-section-title">${t}</div><div class="ai-section-body">`)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, '</div></div><br>')
    .replace(/\n/g, ' ');
  const openCount  = (html.match(/<div class="ai-section">/g) || []).length;
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
  window._toastTimer = setTimeout(() => t.classList.add('hidden'), 2400);
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
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.getElementById('addItemBtn').addEventListener('click', openAddModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  document.getElementById('modalSave').addEventListener('click', saveModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById('itemName').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveModal();
  });
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
  document.getElementById('resetChecklist').addEventListener('click', resetChecklist);
  document.getElementById('exportBtn').addEventListener('click', exportChecklist);
  document.getElementById('generateAIBtn').addEventListener('click', generateAIPlan);

  // 每30秒自动刷新数据，保持多设备同步
  loadAll();
  setInterval(loadAll, 30000);
}

document.addEventListener('DOMContentLoaded', init);
