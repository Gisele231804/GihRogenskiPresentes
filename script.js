/* ===================================================
   GIH ROGENSKI PRESENTES — script.js
   Sistema completo de controle de estoque
   =================================================== */

// ─── ESTADO DA APLICAÇÃO ──────────────────────────────
// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDCcGyb72FwycLCiqroKxm2kz-mkUFqDew",
  authDomain: "gihrogenskipresentes.firebaseapp.com",
  databaseURL: "https://gihrogenskipresentes-default-rtdb.firebaseio.com",
  projectId: "gihrogenskipresentes",
  storageBucket: "gihrogenskipresentes.firebasestorage.app",
  messagingSenderId: "915467625762",
  appId: "1:915467625762:web:c4b7ac22cd24178b24317b",
  measurementId: "G-YMQTYE5G6Q"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Função para Salvar no Firebase (substitua sua saveToStorage por esta)
function saveToStorage() {
  db.ref('gih_data').set(DATA);
}

// Função para Carregar do Firebase (substitua sua loadFromStorage por esta)
function loadFromStorage() {
  db.ref('gih_data').on('value', (snapshot) => {
    const firebaseData = snapshot.val();
    if (firebaseData) {
      DATA = firebaseData;
    } else {
      DATA = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveToStorage();
    }
    renderAll();
  });
}
// ─── DADOS INICIAIS (seed) ────────────────────────────
const INITIAL_DATA = {
  branches: [
    { id: 'matriz', name: 'Matriz', role: 'admin' },
    { id: 'filial1', name: 'Filial 1', role: 'branch' },
    { id: 'filial2', name: 'Filial 2', role: 'branch' },
    { id: 'filial3', name: 'Filial 3', role: 'branch' },
    { id: 'filial4', name: 'Filial 4', role: 'branch' },
  ],
  brands: [
    { id: 'nat', name: 'Natura', color: '#006b3f' },
    { id: 'bot', name: 'Boticário', color: '#7b2d8b' },
  ],
  users: [
    { id: 'admin', pass: 'admin123', name: 'Matriz (Admin)', role: 'admin', branchId: 'matriz' },
    { id: 'filial1', pass: 'filial123', name: 'Filial 1', role: 'branch', branchId: 'filial1' },
    { id: 'filial2', pass: 'filial123', name: 'Filial 2', role: 'branch', branchId: 'filial2' },
    { id: 'filial3', pass: 'filial123', name: 'Filial 3', role: 'branch', branchId: 'filial3' },
    { id: 'filial4', pass: 'filial123', name: 'Filial 4', role: 'branch', branchId: 'filial4' },
  ],
  products: [],
  movements: [],
};

// ─── PERSISTÊNCIA ─────────────────────────────────────
function loadData() {
  const raw = localStorage.getItem('gih_data');
  if (!raw) {
    localStorage.setItem('gih_data', JSON.stringify(INITIAL_DATA));
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
  const stored = JSON.parse(raw);
  // Merge users from INITIAL_DATA em caso de dados antigos sem novos campos
  if (!stored.users) stored.users = INITIAL_DATA.users;
  return stored;
}

function saveData(data) {
  localStorage.setItem('gih_data', JSON.stringify(data));
}

function getData() {
  return loadData();
}

// ─── LOGIN ────────────────────────────────────────────
function doLogin() {
  const userId = document.getElementById('login-user').value.trim();
  const pass   = document.getElementById('login-pass').value.trim();
  const data   = getData();
  const user   = data.users.find(u => u.id === userId && u.pass === pass);
  if (!user) {
    document.getElementById('login-error').classList.remove('hidden');
    return;
  }
  currentUser = user;
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  initApp();
}

function doLogout() {
  currentUser = null;
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}

// Enter key on login
document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});
document.getElementById('login-user').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

// ─── INICIALIZAÇÃO DO APP ─────────────────────────────
function initApp() {
  const isAdmin = currentUser.role === 'admin';

  // Atualiza interface do usuário
  document.getElementById('user-display-name').textContent = currentUser.name;
  document.getElementById('user-role-badge').textContent = isAdmin ? 'Administrador' : 'Filial';
  document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

  // Esconde elementos admin para filiais
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  document.querySelectorAll('.admin-only-filter').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  document.querySelectorAll('.admin-only-form').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });

  navigateTo('dashboard');
  buildNotifications();
}

// ─── NAVEGAÇÃO ────────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  document.getElementById('topbar-title').textContent = {
    dashboard: 'Dashboard',
    products: 'Produtos',
    movements: 'Movimentações',
    transfer: 'Transferências',
    brands: 'Marcas',
    branches: 'Filiais',
  }[page] || page;

  // Fecha notificações
  document.getElementById('notifications-panel').classList.add('hidden');

  // Fecha sidebar em mobile
  document.getElementById('sidebar').classList.remove('open');

  // Renderiza a página
  if (page === 'dashboard')  renderDashboard();
  if (page === 'products')   renderProducts();
  if (page === 'movements')  renderMovements();
  if (page === 'transfer')   renderTransfer();
  if (page === 'brands')     renderBrands();
  if (page === 'branches')   renderBranches();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ─── NOTIFICAÇÕES ─────────────────────────────────────
function buildNotifications() {
  const data = getData();
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
  const alerts = [];

  // Filtra produtos do usuário
  const userProducts = currentUser.role === 'admin'
    ? data.products
    : data.products.filter(p => p.branchId === currentUser.branchId);

  userProducts.forEach(p => {
    if (p.stockQty <= 5 && p.stockQty > 0) {
      alerts.push({ type: 'warning', msg: `⚠️ Estoque baixo: ${p.name} (${p.stockQty} unid.)` });
    }
    if (p.stockQty === 0) {
      alerts.push({ type: 'danger', msg: `🚨 Sem estoque: ${p.name}` });
    }
    if (p.expiry) {
      const exp = new Date(p.expiry);
      if (exp < now) {
        alerts.push({ type: 'danger', msg: `❌ Vencido: ${p.name}` });
      } else if (exp <= soon) {
        alerts.push({ type: 'warning', msg: `📅 Vencendo em breve: ${p.name} (${formatDate(p.expiry)})` });
      }
    }
  });

  const badge = document.getElementById('notif-badge');
  badge.textContent = alerts.length;
  badge.style.display = alerts.length > 0 ? 'flex' : 'none';

  const list = document.getElementById('notifications-list');
  if (alerts.length === 0) {
    list.innerHTML = '<div class="alert-empty">Nenhum alerta no momento ✓</div>';
    return;
  }
  list.innerHTML = alerts.map(a =>
    `<div class="notif-item ${a.type}">${a.msg}</div>`
  ).join('');
}

function toggleNotifications() {
  const panel = document.getElementById('notifications-panel');
  panel.classList.toggle('hidden');
}

// ─── DASHBOARD ────────────────────────────────────────
function renderDashboard() {
  const data = getData();
  const isAdmin = currentUser.role === 'admin';

  const userProducts = isAdmin
    ? data.products
    : data.products.filter(p => p.branchId === currentUser.branchId);

  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Stats
  const totalItems = userProducts.reduce((s, p) => s + p.stockQty, 0);
  const totalValue = userProducts.reduce((s, p) => s + (p.cost * p.stockQty), 0);
  const lowStock   = userProducts.filter(p => p.stockQty <= 5);
  const expSoon    = userProducts.filter(p => p.expiry && new Date(p.expiry) <= soon);

  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon">📦</div>
      <div class="stat-value">${userProducts.length}</div>
      <div class="stat-label">Produtos Cadastrados</div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon">🗃️</div>
      <div class="stat-value">${totalItems}</div>
      <div class="stat-label">Itens em Estoque</div>
    </div>
    <div class="stat-card">
      <div class="stat-icon">💰</div>
      <div class="stat-value">${formatCurrency(totalValue)}</div>
      <div class="stat-label">Valor Total (Custo)</div>
    </div>
    <div class="stat-card red">
      <div class="stat-icon">⚠️</div>
      <div class="stat-value">${lowStock.length}</div>
      <div class="stat-label">Estoque Baixo</div>
    </div>
  `;

  // Low Stock list
  const lowStockEl = document.getElementById('low-stock-list');
  if (lowStock.length === 0) {
    lowStockEl.innerHTML = '<div class="alert-empty">✅ Nenhum produto com estoque crítico!</div>';
  } else {
    lowStockEl.innerHTML = lowStock.map(p => {
      const branch = data.branches.find(b => b.id === p.branchId);
      return `<div class="alert-item ${p.stockQty === 0 ? 'danger' : 'warning'}">
        <span>${p.stockQty === 0 ? '🚨' : '⚠️'}</span>
        <div class="alert-item-info">
          <div class="alert-item-name">${p.name}</div>
          <div class="alert-item-detail">${branch?.name || ''} · ${p.stockQty} unid. restantes</div>
        </div>
      </div>`;
    }).join('');
  }

  // Expiry list
  const expiryEl = document.getElementById('expiry-list');
  const expiryItems = userProducts.filter(p => p.expiry).sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
  const criticalExpiry = expiryItems.filter(p => new Date(p.expiry) <= soon);
  if (criticalExpiry.length === 0) {
    expiryEl.innerHTML = '<div class="alert-empty">✅ Nenhum produto vencendo em breve!</div>';
  } else {
    expiryEl.innerHTML = criticalExpiry.map(p => {
      const exp = new Date(p.expiry);
      const expired = exp < now;
      return `<div class="alert-item ${expired ? 'danger' : 'warning'}">
        <span>${expired ? '❌' : '📅'}</span>
        <div class="alert-item-info">
          <div class="alert-item-name">${p.name}</div>
          <div class="alert-item-detail">${expired ? 'VENCIDO em' : 'Vence em'} ${formatDate(p.expiry)}</div>
        </div>
      </div>`;
    }).join('');
  }

  // Branch overview
  const overviewEl = document.getElementById('branch-stock-overview');
  const branches = isAdmin ? data.branches : data.branches.filter(b => b.id === currentUser.branchId);
  overviewEl.innerHTML = branches.map(b => {
    const bProducts = data.products.filter(p => p.branchId === b.id);
    const bQty = bProducts.reduce((s, p) => s + p.stockQty, 0);
    const bVal = bProducts.reduce((s, p) => s + (p.cost * p.stockQty), 0);
    return `<div class="branch-overview-item">
      <div class="branch-overview-name">${b.name}</div>
      <div class="branch-overview-count">${bQty}</div>
      <div class="branch-overview-label">itens em estoque</div>
      <div class="branch-overview-value">${formatCurrency(bVal)}</div>
    </div>`;
  }).join('');

  buildNotifications();
}

// ─── PRODUTOS ─────────────────────────────────────────
function renderProducts() {
  const data = getData();
  populateBrandFilter(data);
  populateBranchFilter(data);
  filterProducts();
}

function populateBrandFilter(data) {
  const sel = document.getElementById('filter-brand');
  const val = sel.value;
  sel.innerHTML = '<option value="">Todas as marcas</option>' +
    data.brands.map(b => `<option value="${b.id}" ${b.id === val ? 'selected' : ''}>${b.name}</option>`).join('');
}

function populateBranchFilter(data) {
  const sel = document.getElementById('filter-branch');
  if (!sel) return;
  const val = sel.value;
  sel.innerHTML = '<option value="">Todas as filiais</option>' +
    data.branches.map(b => `<option value="${b.id}" ${b.id === val ? 'selected' : ''}>${b.name}</option>`).join('');
}

function filterProducts() {
  const data = getData();
  const nameQ   = document.getElementById('filter-name').value.toLowerCase();
  const brandQ  = document.getElementById('filter-brand').value;
  const branchQ = document.getElementById('filter-branch')?.value || '';

  let products = currentUser.role === 'admin'
    ? data.products
    : data.products.filter(p => p.branchId === currentUser.branchId);

  if (nameQ)   products = products.filter(p => p.name.toLowerCase().includes(nameQ) || p.sku.toLowerCase().includes(nameQ));
  if (brandQ)  products = products.filter(p => p.brandId === brandQ);
  if (branchQ) products = products.filter(p => p.branchId === branchQ);

  renderProductsTable(products, data);
}

function renderProductsTable(products, data) {
  const tbody = document.getElementById('products-tbody');
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const isAdmin = currentUser.role === 'admin';

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <p>Nenhum produto encontrado.</p>
      </div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(p => {
    const brand  = data.brands.find(b => b.id === p.brandId);
    const branch = data.branches.find(b => b.id === p.branchId);
    const expired = p.expiry && new Date(p.expiry) < now;
    const expSoon = p.expiry && new Date(p.expiry) <= soon && !expired;
    const rowClass = expired || p.stockQty === 0 ? 'row-danger' : (expSoon || p.stockQty <= 5 ? 'row-warning' : '');

    // Stock badge
    let stockClass = 'ok', stockIcon = '✅';
    if (p.stockQty === 0) { stockClass = 'empty'; stockIcon = '🚫'; }
    else if (p.stockQty <= 5) { stockClass = 'low'; stockIcon = '⚠️'; }

    // Expiry badge
    let expiryHTML = '<span class="expiry-badge none">—</span>';
    if (p.expiry) {
      if (expired) expiryHTML = `<span class="expiry-badge expired">❌ ${formatDate(p.expiry)}</span>`;
      else if (expSoon) expiryHTML = `<span class="expiry-badge soon">⏰ ${formatDate(p.expiry)}</span>`;
      else expiryHTML = `<span class="expiry-badge ok">${formatDate(p.expiry)}</span>`;
    }

    const thumbHTML = p.image
      ? `<img src="${p.image}" class="product-thumb" alt="${p.name}"/>`
      : `<div class="product-thumb-placeholder">🎁</div>`;

    const canEdit = isAdmin || p.branchId === currentUser.branchId;

    return `<tr class="${rowClass}">
      <td>${thumbHTML}</td>
      <td>
        <div class="product-name">${p.name}</div>
        <div class="product-sku">${p.sku}</div>
      </td>
      <td>
        ${brand ? `<span class="brand-chip" style="background:${brand.color}22;color:${brand.color};border-color:${brand.color}44">${brand.name}</span>` : '—'}
      </td>
      <td>${branch?.name || '—'}</td>
      <td><span class="stock-badge ${stockClass}">${stockIcon} ${p.stockQty}</span></td>
      <td>${expiryHTML}</td>
      <td>${formatCurrency(p.cost)}</td>
      <td>${formatCurrency(p.price)}</td>
      <td>
        <div class="action-btns">
          ${canEdit ? `
            <button class="btn-icon mov-in" title="Entrada" onclick="openMovementModal('entrada','${p.id}')">⬆️</button>
            <button class="btn-icon mov-out" title="Saída" onclick="openMovementModal('saida','${p.id}')">⬇️</button>
            <button class="btn-icon edit" title="Editar" onclick="openProductModal('${p.id}')">✏️</button>
            <button class="btn-icon delete" title="Excluir" onclick="confirmDelete('${p.id}')">🗑️</button>
          ` : '<span style="font-size:0.75rem;color:var(--warm-gray-2)">Sem acesso</span>'}
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── MODAL DE PRODUTO ─────────────────────────────────
function openProductModal(productId = null) {
  const data = getData();

  // Popula selects
  const brandSel = document.getElementById('p-brand');
  brandSel.innerHTML = data.brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');

  const branchSel = document.getElementById('p-branch');
  if (currentUser.role === 'admin') {
    branchSel.innerHTML = data.branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  } else {
    branchSel.innerHTML = `<option value="${currentUser.branchId}">${currentUser.name}</option>`;
  }

  if (productId) {
    const p = data.products.find(x => x.id === productId);
    if (!p) return;
    document.getElementById('product-modal-title').textContent = 'Editar Produto';
    document.getElementById('product-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-sku').value = p.sku;
    document.getElementById('p-brand').value = p.brandId;
    document.getElementById('p-branch').value = p.branchId;
    document.getElementById('p-cost').value = p.cost;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-qty-acquired').value = p.qtyAcquired;
    document.getElementById('p-expiry').value = p.expiry || '';
    if (p.image) {
      document.getElementById('image-preview').src = p.image;
      document.getElementById('image-preview').classList.remove('hidden');
      document.getElementById('image-placeholder').classList.add('hidden');
    } else {
      document.getElementById('image-preview').classList.add('hidden');
      document.getElementById('image-placeholder').classList.remove('hidden');
    }
  } else {
    document.getElementById('product-modal-title').textContent = 'Novo Produto';
    document.getElementById('product-id').value = '';
    document.getElementById('p-name').value = '';
    document.getElementById('p-sku').value = '';
    document.getElementById('p-cost').value = '';
    document.getElementById('p-price').value = '';
    document.getElementById('p-qty-acquired').value = '';
    document.getElementById('p-expiry').value = '';
    document.getElementById('image-preview').classList.add('hidden');
    document.getElementById('image-placeholder').classList.remove('hidden');
    document.getElementById('p-image').value = '';
    if (currentUser.role !== 'admin') {
      document.getElementById('p-branch').value = currentUser.branchId;
    }
  }

  openModal('product-modal');
}

function previewImage(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('image-preview');
    preview.src = e.target.result;
    preview.classList.remove('hidden');
    document.getElementById('image-placeholder').classList.add('hidden');
  };
  reader.readAsDataURL(file);
}

function saveProduct() {
  const data = getData();
  const id   = document.getElementById('product-id').value;
  const name = document.getElementById('p-name').value.trim();
  const sku  = document.getElementById('p-sku').value.trim();
  const brandId  = document.getElementById('p-brand').value;
  const branchId = currentUser.role === 'admin'
    ? document.getElementById('p-branch').value
    : currentUser.branchId;
  const cost  = parseFloat(document.getElementById('p-cost').value) || 0;
  const price = parseFloat(document.getElementById('p-price').value) || 0;
  const qtyAcquired = parseInt(document.getElementById('p-qty-acquired').value) || 0;
  const expiry = document.getElementById('p-expiry').value;
  const imagePreview = document.getElementById('image-preview');
  const image = imagePreview.classList.contains('hidden') ? '' : imagePreview.src;

  if (!name || !sku || !brandId || !branchId) {
    showToast('Preencha todos os campos obrigatórios!', 'danger');
    return;
  }

  if (id) {
    // Edição
    const idx = data.products.findIndex(p => p.id === id);
    if (idx === -1) return;
    const prev = data.products[idx];
    const qtyDiff = qtyAcquired - prev.qtyAcquired;
    data.products[idx] = {
      ...prev, name, sku, brandId, branchId, cost, price,
      qtyAcquired,
      stockQty: Math.max(0, prev.stockQty + qtyDiff),
      expiry, image: image || prev.image,
    };
    if (qtyDiff !== 0) {
      addMovement(data, id, branchId, qtyDiff > 0 ? 'entrada' : 'saida', Math.abs(qtyDiff), 'Ajuste no cadastro');
    }
    showToast('Produto atualizado com sucesso!', 'success');
  } else {
    // Novo produto
    const newProduct = {
      id: genId(),
      name, sku, brandId, branchId, cost, price,
      qtyAcquired, stockQty: qtyAcquired,
      expiry, image,
    };
    data.products.push(newProduct);
    if (qtyAcquired > 0) {
      addMovement(data, newProduct.id, branchId, 'entrada', qtyAcquired, 'Cadastro inicial');
    }
    showToast('Produto cadastrado com sucesso!', 'success');
  }

  saveData(data);
  closeModal('product-modal');
  renderProducts();
  buildNotifications();
}

function confirmDelete(productId) {
  const data = getData();
  const p = data.products.find(x => x.id === productId);
  document.getElementById('confirm-message').textContent =
    `Deseja realmente excluir "${p?.name}"? Esta ação não pode ser desfeita.`;
  confirmCallback = () => {
    const d = getData();
    d.products = d.products.filter(x => x.id !== productId);
    saveData(d);
    closeModal('confirm-modal');
    renderProducts();
    buildNotifications();
    showToast('Produto excluído.', 'warning');
  };
  document.getElementById('confirm-btn').onclick = confirmCallback;
  openModal('confirm-modal');
}

// ─── MOVIMENTAÇÕES ────────────────────────────────────
function openMovementModal(type, productId = null) {
  const data = getData();
  document.getElementById('mov-type').value = type;
  document.getElementById('movement-modal-title').textContent =
    type === 'entrada' ? '⬆️ Registrar Entrada' : '⬇️ Registrar Saída';
  document.getElementById('mov-btn').textContent =
    type === 'entrada' ? 'Confirmar Entrada' : 'Confirmar Saída';
  document.getElementById('mov-btn').className =
    type === 'entrada' ? 'btn-success' : 'btn-danger';
  document.getElementById('mov-qty').value = '';
  document.getElementById('mov-obs').value = '';

  // Popula produtos
  const userProducts = currentUser.role === 'admin'
    ? data.products
    : data.products.filter(p => p.branchId === currentUser.branchId);

  const sel = document.getElementById('mov-product');
  sel.innerHTML = '<option value="">Selecione o produto</option>' +
    userProducts.map(p => {
      const branch = data.branches.find(b => b.id === p.branchId);
      return `<option value="${p.id}" ${p.id === productId ? 'selected' : ''}>${p.name} (${branch?.name || ''}) — ${p.stockQty} un.</option>`;
    }).join('');

  sel.onchange = () => updateMovAvailable(data, type);
  if (productId) updateMovAvailable(data, type, productId);

  openModal('movement-modal');
}

function updateMovAvailable(data, type, forceId = null) {
  const id = forceId || document.getElementById('mov-product').value;
  const p = data.products.find(x => x.id === id);
  const hint = document.getElementById('mov-available');
  if (p && type === 'saida') {
    hint.textContent = `Disponível: ${p.stockQty} unidades`;
  } else {
    hint.textContent = '';
  }
}

function saveMovement() {
  const data = getData();
  const type = document.getElementById('mov-type').value;
  const productId = document.getElementById('mov-product').value;
  const qty = parseInt(document.getElementById('mov-qty').value) || 0;
  const obs = document.getElementById('mov-obs').value.trim();

  if (!productId) { showToast('Selecione um produto!', 'danger'); return; }
  if (qty <= 0)   { showToast('Quantidade deve ser maior que zero!', 'danger'); return; }

  const idx = data.products.findIndex(p => p.id === productId);
  if (idx === -1) return;

  if (type === 'saida' && data.products[idx].stockQty < qty) {
    showToast(`Estoque insuficiente! Disponível: ${data.products[idx].stockQty}`, 'danger');
    return;
  }

  if (type === 'entrada') {
    data.products[idx].stockQty += qty;
    data.products[idx].qtyAcquired += qty;
  } else {
    data.products[idx].stockQty -= qty;
  }

  const branchId = data.products[idx].branchId;
  addMovement(data, productId, branchId, type, qty, obs);
  saveData(data);
  closeModal('movement-modal');
  renderProducts();
  renderMovements();
  buildNotifications();
  showToast(type === 'entrada' ? `Entrada de ${qty} unidades registrada!` : `Saída de ${qty} unidades registrada!`, 'success');
}

function addMovement(data, productId, branchId, type, qty, obs = '') {
  data.movements.unshift({
    id: genId(),
    productId, branchId, type, qty, obs,
    date: new Date().toISOString(),
  });
}

function renderMovements() {
  const data = getData();
  const now = new Date();
  
  // Filtros
  const typeQ   = document.getElementById('filter-mov-type')?.value || '';
  const branchQ = document.getElementById('filter-mov-branch')?.value || '';
  const dateQ   = document.getElementById('filter-mov-date')?.value || '';

  // Popula selects
  const movBranchSel = document.getElementById('filter-mov-branch');
  if (movBranchSel && currentUser.role === 'admin') {
    const val = movBranchSel.value;
    movBranchSel.innerHTML = '<option value="">Todas as filiais</option>' +
      data.branches.map(b => `<option value="${b.id}" ${b.id === val ? 'selected' : ''}>${b.name}</option>`).join('');
  }

  let movements = currentUser.role === 'admin'
    ? data.movements
    : data.movements.filter(m => m.branchId === currentUser.branchId);

  if (typeQ)   movements = movements.filter(m => m.type === typeQ);
  if (branchQ) movements = movements.filter(m => m.branchId === branchQ);
  if (dateQ)   movements = movements.filter(m => m.date.startsWith(dateQ));

  const tbody = document.getElementById('movements-tbody');
  if (movements.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">🔄</div><p>Nenhuma movimentação encontrada.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = movements.slice(0, 200).map(m => {
    const product = data.products.find(p => p.id === m.productId);
    const branch  = data.branches.find(b => b.id === m.branchId);
    return `<tr>
      <td style="font-size:0.8rem;color:var(--warm-gray)">${formatDateTime(m.date)}</td>
      <td><span class="mov-type-badge ${m.type}">${m.type}</span></td>
      <td>${product?.name || '<em>Produto removido</em>'}</td>
      <td>${branch?.name || '—'}</td>
      <td style="font-weight:700;color:${m.type === 'entrada' ? 'var(--success)' : m.type === 'saida' ? 'var(--danger)' : 'var(--info)'}">${m.type === 'entrada' ? '+' : '-'}${m.qty}</td>
      <td style="font-size:0.82rem;color:var(--warm-gray)">${m.obs || '—'}</td>
    </tr>`;
  }).join('');
}

function filterMovements() { renderMovements(); }

// ─── TRANSFERÊNCIAS ───────────────────────────────────
function renderTransfer() {
  const data = getData();
  const fromSel = document.getElementById('transfer-from');
  const toSel   = document.getElementById('transfer-to');

  const branchOptions = data.branches.filter(b => b.id !== 'matriz' || data.branches.length <= 1)
    .map(b => `<option value="${b.id}">${b.name}</option>`).join('');

  fromSel.innerHTML = '<option value="">Selecione a origem</option>' + branchOptions;
  toSel.innerHTML   = '<option value="">Selecione o destino</option>' + branchOptions;
  document.getElementById('transfer-product').innerHTML = '<option value="">Selecione o produto</option>';
  document.getElementById('transfer-available').textContent = '';
}

function loadTransferProducts() {
  const data = getData();
  const fromId = document.getElementById('transfer-from').value;
  const sel = document.getElementById('transfer-product');
  if (!fromId) { sel.innerHTML = '<option value="">Selecione o produto</option>'; return; }

  const products = data.products.filter(p => p.branchId === fromId && p.stockQty > 0);
  sel.innerHTML = '<option value="">Selecione o produto</option>' +
    products.map(p => `<option value="${p.id}">${p.name} (${p.stockQty} un.)</option>`).join('');

  sel.onchange = () => {
    const p = data.products.find(x => x.id === sel.value);
    document.getElementById('transfer-available').textContent =
      p ? `Disponível: ${p.stockQty} unidades` : '';
  };
}

function doTransfer() {
  const data  = getData();
  const fromId = document.getElementById('transfer-from').value;
  const toId   = document.getElementById('transfer-to').value;
  const productId = document.getElementById('transfer-product').value;
  const qty    = parseInt(document.getElementById('transfer-qty').value) || 0;
  const obs    = document.getElementById('transfer-obs').value.trim();

  if (!fromId || !toId || !productId) { showToast('Preencha todos os campos!', 'danger'); return; }
  if (fromId === toId) { showToast('Origem e destino não podem ser iguais!', 'danger'); return; }
  if (qty <= 0) { showToast('Quantidade deve ser maior que zero!', 'danger'); return; }

  const fromIdx = data.products.findIndex(p => p.id === productId && p.branchId === fromId);
  if (fromIdx === -1) { showToast('Produto não encontrado na filial de origem!', 'danger'); return; }

  if (data.products[fromIdx].stockQty < qty) {
    showToast(`Estoque insuficiente! Disponível: ${data.products[fromIdx].stockQty}`, 'danger');
    return;
  }

  // Deduz da origem
  data.products[fromIdx].stockQty -= qty;

  // Verifica se já existe produto de mesmo SKU no destino
  const toIdx = data.products.findIndex(p => p.sku === data.products[fromIdx].sku && p.branchId === toId);
  if (toIdx !== -1) {
    data.products[toIdx].stockQty += qty;
  } else {
    // Cria cópia do produto no destino
    const original = data.products[fromIdx];
    data.products.push({
      ...original,
      id: genId(),
      branchId: toId,
      stockQty: qty,
      qtyAcquired: qty,
    });
  }

  const fromBranch = data.branches.find(b => b.id === fromId);
  const toBranch   = data.branches.find(b => b.id === toId);
  const obsText = obs || `Transferência de ${fromBranch?.name} → ${toBranch?.name}`;

  addMovement(data, productId, fromId, 'transferencia', qty, `Saída: ${obsText}`);
  addMovement(data, productId, toId,   'transferencia', qty, `Entrada: ${obsText}`);

  saveData(data);
  renderTransfer();
  buildNotifications();
  showToast(`Transferência de ${qty} unidades realizada com sucesso!`, 'success');
}

// ─── MARCAS ───────────────────────────────────────────
function renderBrands() {
  const data = getData();
  const grid = document.getElementById('brands-grid');
  grid.innerHTML = data.brands.map(b => {
    const count = data.products.filter(p => p.brandId === b.id).length;
    return `<div class="brand-card">
      <div class="brand-card-color" style="background:${b.color}">${b.name.charAt(0)}</div>
      <div class="brand-card-name">${b.name}</div>
      <div class="brand-card-count">${count} produto(s)</div>
      <div class="brand-card-actions">
        <button class="btn-icon delete" onclick="deleteBrand('${b.id}')">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function openBrandModal() { openModal('brand-modal'); document.getElementById('brand-name').value = ''; }

function saveBrand() {
  const name = document.getElementById('brand-name').value.trim();
  const color = document.getElementById('brand-color').value;
  if (!name) { showToast('Informe o nome da marca!', 'danger'); return; }
  const data = getData();
  if (data.brands.some(b => b.name.toLowerCase() === name.toLowerCase())) {
    showToast('Marca já cadastrada!', 'danger'); return;
  }
  data.brands.push({ id: genId(), name, color });
  saveData(data);
  closeModal('brand-modal');
  renderBrands();
  showToast('Marca cadastrada com sucesso!', 'success');
}

function deleteBrand(brandId) {
  const data = getData();
  if (data.products.some(p => p.brandId === brandId)) {
    showToast('Não é possível excluir: existem produtos com esta marca!', 'danger');
    return;
  }
  data.brands = data.brands.filter(b => b.id !== brandId);
  saveData(data);
  renderBrands();
  showToast('Marca excluída.', 'warning');
}

// ─── FILIAIS ──────────────────────────────────────────
function renderBranches() {
  const data = getData();
  const grid = document.getElementById('branches-grid');
  grid.innerHTML = data.branches.map(b => {
    const bProducts = data.products.filter(p => p.branchId === b.id);
    const qty = bProducts.reduce((s, p) => s + p.stockQty, 0);
    const val = bProducts.reduce((s, p) => s + (p.cost * p.stockQty), 0);
    return `<div class="branch-card ${b.role === 'admin' ? 'matriz' : 'filial'}">
      <div class="branch-card-header">
      <div class="branch-card-name">${b.name}</div>
      <div style="display:flex;gap:0.4rem;align-items:center">
        <span class="branch-role-badge ${b.role === 'admin' ? 'admin' : 'branch'}">${b.role === 'admin' ? 'Matriz' : 'Filial'}</span>
        <button class="btn-icon edit" onclick="renameBranch('${b.id}','${b.name}')" title="Renomear">✏️</button>
      </div>
    </div>
      <div class="branch-stats">
        <div class="branch-stat">
          <div class="branch-stat-value">${bProducts.length}</div>
          <div class="branch-stat-label">Produtos</div>
        </div>
        <div class="branch-stat">
          <div class="branch-stat-value">${qty}</div>
          <div class="branch-stat-label">Itens</div>
        </div>
        <div class="branch-stat" style="grid-column:span 2">
          <div class="branch-stat-value" style="font-size:1.1rem">${formatCurrency(val)}</div>
          <div class="branch-stat-label">Valor em Estoque</div>
        </div>
      </div>
    </div>`;
  }).join('');
}
function renameBranch(branchId, currentName) {
  const newName = prompt('Novo nome para a filial:', currentName);
  if (!newName || newName.trim() === currentName) return;
  const data = getData();
  const idx = data.branches.findIndex(b => b.id === branchId);
  if (idx === -1) return;
  data.branches[idx].name = newName.trim();
  saveData(data);
  renderBranches();
  showToast('Filial renomeada com sucesso!', 'success');
}

// ─── MODALS ───────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  document.body.style.overflow = '';
}

// Fechar modal clicando fora
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// ─── TOASTS ───────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', danger: '❌', warning: '⚠️', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ─── UTILITÁRIOS ─────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Fechar painel de notificações ao clicar fora
document.addEventListener('click', e => {
  const panel = document.getElementById('notifications-panel');
  const bell  = document.querySelector('.notification-bell');
  if (!panel.contains(e.target) && !bell.contains(e.target)) {
    panel.classList.add('hidden');
  }
});
