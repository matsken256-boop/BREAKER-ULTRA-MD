let currentSessionPhone = null;
let currentSessionToken = null;
let pairingPollInterval = null;
let pairingPollTimeout = null;
let pairingStatusInterval = null;
let pairingStatusTimeout = null;

const elements = {
  authNav: document.getElementById('authNav'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  loginAlert: document.getElementById('loginAlert'),
  registerAlert: document.getElementById('registerAlert'),
  pairCodeBox: document.getElementById('pairCodeBox'),
  loginPhone: document.getElementById('loginPhone'),
  accessCode: document.getElementById('accessCode'),
  accessCodeGroup: document.getElementById('accessCodeGroup'),
  verifyCodeBtn: document.getElementById('verifyCodeBtn'),
  pairPhone: document.getElementById('pairPhone'),
  masterPassword: document.getElementById('masterPassword'),
  settingsDashboard: document.getElementById('settingsDashboard'),
  sessionOwnerName: document.getElementById('sessionOwnerName'),
  sessionInfo: document.getElementById('sessionInfo'),
  settingsContainer: document.getElementById('settingsContainer'),
  settingsTab: document.getElementById('settingsTab')
};

function showAlert(alertDiv, message, type) {
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.classList.remove('hidden');
  if (type === 'success') {
    setTimeout(() => {
      alertDiv.classList.add('hidden');
    }, 3000);
  }
}

function showLoading(container, message = 'Loading') {
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
}

function formatValue(value) {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function initAuthNavigation() {
  const loginTab = document.getElementById('loginTabBtn');
  const registerTab = document.getElementById('registerTabBtn');
  if (loginTab) loginTab.addEventListener('click', () => switchAuth('login'));
  if (registerTab) registerTab.addEventListener('click', () => switchAuth('register'));
  if (elements.loginForm) elements.loginForm.addEventListener('submit', handleLogin);
  if (elements.registerForm) elements.registerForm.addEventListener('submit', handlePair);
}

function switchAuth(type) {
  if (type === 'login') {
    elements.loginForm.classList.remove('hidden');
    elements.registerForm.classList.add('hidden');
  } else {
    elements.registerForm.classList.remove('hidden');
    elements.loginForm.classList.add('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const phone = elements.loginPhone.value.trim();
  const code = elements.accessCode.value.trim();
  if (!phone || !code) return showAlert(elements.loginAlert, 'Phone & Code required', 'error');
  showLoading(elements.sessionInfo, 'Verifying...');
  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code })
    });
    const data = await res.json();
    if (data.success) {
      currentSessionPhone = phone;
      currentSessionToken = data.token;
      localStorage.setItem('sessionPhone', phone);
      localStorage.setItem('sessionToken', data.token);
      loginSuccess();
    } else {
      showAlert(elements.loginAlert, data.message || 'Failed', 'error');
    }
  } catch (err) {
    showAlert(elements.loginAlert, 'Network error', 'error');
  }
}

async function handlePair(e) {
  e.preventDefault();
  const phone = elements.pairPhone.value.trim();
  const password = elements.masterPassword.value.trim();
  if (!phone || !password) return showAlert(elements.registerAlert, 'Phone & Password required', 'error');
  showLoading(elements.pairCodeBox, 'Requesting code...');
  try {
    const res = await fetch('/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, masterPassword: password })
    });
    const data = await res.json();
    if (data.success) {
      elements.pairCodeBox.innerHTML = `<div class="code">${data.code}</div><p>Code expires in 5 min</p>`;
      startPairingPoll(phone);
    } else {
      showAlert(elements.registerAlert, data.message, 'error');
    }
  } catch (err) {
    showAlert(elements.registerAlert, 'Network error', 'error');
  }
}

function startPairingPoll(phone) {
  clearInterval(pairingPollInterval);
  pairingPollInterval = setInterval(async () => {
    const res = await fetch(`/api/pair-status?phone=${phone}`);
    const data = await res.json();
    if (data.paired) {
      clearInterval(pairingPollInterval);
      showAlert(elements.registerAlert, 'Paired! Login now', 'success');
      switchAuth('login');
    }
  }, 3000);
  pairingPollTimeout = setTimeout(() => clearInterval(pairingPollInterval), 300000);
}

function loginSuccess() {
  elements.authNav.classList.add('hidden');
  elements.settingsDashboard.classList.remove('hidden');
  if (elements.sessionOwnerName) elements.sessionOwnerName.textContent = currentSessionPhone;
  loadSettings();
}

async function loadSettings() {
  showLoading(elements.settingsContainer, 'Loading sessions...');
  try {
    const res = await fetch(`/api/sessions?token=${currentSessionToken}`);
    const data = await res.json();
    elements.settingsContainer.innerHTML = data.sessions.map(s => `
      <div class="session-card">
        <span>${s.phone}</span>
        <span class="${s.connected ? 'online' : 'offline'}">${s.connected ? 'ONLINE' : 'OFFLINE'}</span>
      </div>
    `).join('') || '<p>No sessions</p>';
  } catch (e) {
    elements.settingsContainer.innerHTML = '<p>Failed to load</p>';
  }
}

function logout() {
  localStorage.removeItem('sessionPhone');
  localStorage.removeItem('sessionToken');
  currentSessionPhone = null;
  currentSessionToken = null;
  location.reload();
}

function initApp() {
  initAuthNavigation();
  const token = localStorage.getItem('sessionToken');
  const phone = localStorage.getItem('sessionPhone');
  if (token && phone) {
    currentSessionToken = token;
    currentSessionPhone = phone;
    loginSuccess();
  }
}

document.addEventListener('DOMContentLoaded', initApp);