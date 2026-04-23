/* ===================================================
   GIH ROGENSKI PRESENTES — script.js (FIX FIREBASE)
   Mantém tudo igual, apenas corrige sincronização
   =================================================== */

// ─── FIREBASE ───────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyDCcGyb72FwycLCiqroKxm2kz-mkUFqDew",
  authDomain: "gihrogenskipresentes.firebaseapp.com",
  databaseURL: "https://gihrogenskipresentes-default-rtdb.firebaseio.com",
  projectId: "gihrogenskipresentes",
  storageBucket: "gihrogenskipresentes.firebasestorage.app",
  messagingSenderId: "915467625762",
  appId: "1:915467625762:web:c4b7ac22cd24178b24317b",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ─── ESTADO GLOBAL ──────────────────────────────────
let DATA = null;
let currentUser = null;

// ─── LISTENER EM TEMPO REAL (AQUI ESTÁ A MÁGICA) ───
function startRealtime() {
  db.ref('gih_data').on('value', (snapshot) => {
    if (snapshot.exists()) {
      DATA = snapshot.val();
    } else {
      DATA = JSON.parse(JSON.stringify(INITIAL_DATA));
      saveToFirebase();
    }

    // Re-render automático
    if (currentUser) {
      renderAll();
    }
  });
}

function saveToFirebase() {
  return db.ref('gih_data').set(DATA);
}

// ─── DADOS INICIAIS ─────────────────────────────────
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

// ─── FUNÇÕES COMPATÍVEIS (NÃO QUEBRAR SEU CÓDIGO) ───
function getData() {
  return DATA;
}

function saveData(data) {
  DATA = data;
  saveToFirebase();
}

// ─── LOGIN ──────────────────────────────────────────
function doLogin() {
  const userId = document.getElementById('login-user').value.trim();
  const pass   = document.getElementById('login-pass').value.trim();

  const user = DATA.users.find(u => u.id === userId && u.pass === pass);

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

// ─── INIT ───────────────────────────────────────────
function initApp() {
  navigateTo('dashboard');
}

// ─── PRODUTOS (SÓ ALTEREI O SAVE) ───────────────────
function saveProduct() {
  const data = getData();

  const id = document.getElementById('product-id').value;

  const product = {
    id: id || Date.now().toString(),
    name: document.getElementById('p-name').value,
    sku: document.getElementById('p-sku').value,
    brandId: document.getElementById('p-brand').value,
    branchId: document.getElementById('p-branch').value,
    cost: parseFloat(document.getElementById('p-cost').value) || 0,
    price: parseFloat(document.getElementById('p-price').value) || 0,
    qtyAcquired: parseInt(document.getElementById('p-qty-acquired').value) || 0,
    stockQty: parseInt(document.getElementById('p-qty-acquired').value) || 0,
    expiry: document.getElementById('p-expiry').value,
    image: document.getElementById('image-preview')?.src || ''
  };

  if (id) {
    const index = data.products.findIndex(p => p.id === id);
    data.products[index] = product;
  } else {
    data.products.push(product);
  }

  saveData(data); // AGORA VAI PARA O FIREBASE
}

// ─── RENDER ─────────────────────────────────────────
function renderAll() {
  renderProducts();
}

function renderProducts() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;

  tbody.innerHTML = DATA.products.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${p.stockQty}</td>
      <td>${p.price}</td>
    </tr>
  `).join('');
}

// ─── NAVEGAÇÃO ──────────────────────────────────────
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');

  if (page === 'products') renderProducts();
}

// ─── START ──────────────────────────────────────────
startRealtime();
