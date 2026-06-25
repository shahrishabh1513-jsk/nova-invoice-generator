// =============================================
//   RT INVOICE — Auth Module
//   Design & Developed by Rishbah Shah
// =============================================

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  const isLogin = window.location.pathname.includes('index.html') ||
                  window.location.pathname === '/' ||
                  window.location.pathname.endsWith('/');
  if (isLogin) {
    initLoginPage();
    seedDemoAccount();
  } else {
    checkAuth();
  }
});

// ---- Seed demo account ----
function seedDemoAccount() {
  const users = JSON.parse(localStorage.getItem('rt_users') || '[]');
  if (!users.find(u => u.email === 'demo@rtinvoice.com')) {
    users.push({
      id: 'demo',
      name: 'Demo User',
      email: 'demo@rtinvoice.com',
      password: 'password123',
      createdAt: new Date().toISOString()
    });
    localStorage.setItem('rt_users', JSON.stringify(users));
  }
}

// ---- Login Page Init ----
function initLoginPage() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
      } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
      }
    });
  });
}

// ---- Handle Login ----
function handleLogin(event) {
  event.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const users = JSON.parse(localStorage.getItem('rt_users') || '[]');
  const user  = users.find(u => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem('rt_current_user', JSON.stringify(user));
    showToast('Welcome back, ' + user.name.split(' ')[0] + '! 👋', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
  } else {
    showToast('Invalid email or password', 'error');
    document.getElementById('loginPassword').value = '';
  }
}

// ---- Handle Signup ----
function handleSignup(event) {
  event.preventDefault();
  const name            = document.getElementById('signupName').value.trim();
  const email           = document.getElementById('signupEmail').value.trim();
  const password        = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error'); return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error'); return;
  }

  const users = JSON.parse(localStorage.getItem('rt_users') || '[]');
  if (users.find(u => u.email === email)) {
    showToast('Email already registered', 'error'); return;
  }

  const newUser = {
    id: Date.now().toString(),
    name, email, password,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  localStorage.setItem('rt_users', JSON.stringify(users));

  showToast('Account created! Please sign in.', 'success');

  // Switch to login tab
  document.querySelector('[data-tab="login"]').click();
  document.getElementById('loginEmail').value = email;
  ['signupName','signupEmail','signupPassword','signupConfirmPassword']
    .forEach(id => { document.getElementById(id).value = ''; });
}

// ---- Check Auth (dashboard) ----
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('rt_current_user'));
  if (!user) { window.location.href = 'index.html'; return; }

  currentUser = user;
  const nameEl    = document.getElementById('userName');
  const initialEl = document.getElementById('userInitial');
  if (nameEl)    nameEl.textContent    = user.name;
  if (initialEl) initialEl.textContent = user.name.charAt(0).toUpperCase();

  if (typeof window.loadUserInvoices === 'function') {
    window.loadUserInvoices(user.id);
  }
}

// ---- Logout ----
function logout() {
  localStorage.removeItem('rt_current_user');
  showToast('Signed out successfully', 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 600);
}

// ---- Toast ----
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className   = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

// ---- Exports ----
window.showToast    = showToast;
window.handleLogin  = handleLogin;
window.handleSignup = handleSignup;
window.logout       = logout;