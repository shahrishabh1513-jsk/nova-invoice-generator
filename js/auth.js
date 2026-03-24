// User management
let currentUser = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.includes('index.html') || 
                      window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/');
  
  if (isLoginPage) {
    initLoginPage();
  } else {
    checkAuth();
  }
});

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

// Handle Login
function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  const users = JSON.parse(localStorage.getItem('nova_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    currentUser = user;
    localStorage.setItem('nova_current_user', JSON.stringify(user));
    showToast('Login successful! Redirecting...', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  } else {
    showToast('Invalid email or password', 'error');
  }
}

// Handle Signup
function handleSignup(event) {
  event.preventDefault();
  
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;
  
  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }
  
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }
  
  const users = JSON.parse(localStorage.getItem('nova_users') || '[]');
  
  if (users.find(u => u.email === email)) {
    showToast('Email already registered', 'error');
    return;
  }
  
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  localStorage.setItem('nova_users', JSON.stringify(users));
  
  showToast('Account created successfully! Please login.', 'success');
  
  document.querySelector('[data-tab="login"]').click();
  
  document.getElementById('signupName').value = '';
  document.getElementById('signupEmail').value = '';
  document.getElementById('signupPassword').value = '';
  document.getElementById('signupConfirmPassword').value = '';
}

// Check authentication on dashboard
function checkAuth() {
  const currentUser = JSON.parse(localStorage.getItem('nova_current_user'));
  
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  
  const userNameSpan = document.getElementById('userName');
  if (userNameSpan) {
    userNameSpan.textContent = currentUser.name;
  }
  
  const userInitial = document.getElementById('userInitial');
  if (userInitial) {
    userInitial.textContent = currentUser.name.charAt(0).toUpperCase();
  }
  
  if (typeof window.loadUserInvoices === 'function') {
    window.loadUserInvoices(currentUser.id);
  }
}

// Logout function
function logout() {
  localStorage.removeItem('nova_current_user');
  showToast('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// Export for global use
window.showToast = showToast;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.logout = logout;