// ============================================================
// auth.js - Login & Register page logic
// ============================================================

const API_BASE = 'https://todo-master-virid.vercel.app/api';

//  Tab Switcher ─
function showTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
  }
  hideMessage();
}

//  Show / Hide message 
function showMessage(text, isError = false) {
  const box = document.getElementById('messageBox');
  box.textContent = text;
  box.className = 'message-box ' + (isError ? 'error' : 'success');
  box.style.display = 'block';
}

function hideMessage() {
  const box = document.getElementById('messageBox');
  box.style.display = 'none';
}

//  Register user in MySQL after Firebase auth  
async function registerUserInDB(uid, email) {
  try {
    await fetch(`${API_BASE}/register-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firebase_uid: uid, email })
    });
  } catch (err) {
    console.error('Failed to register user in DB:', err);
  }
}

//  Email & Password Registration   
async function registerWithEmail() {
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!email || !password) {
    return showMessage('Please fill in all fields.', true);
  }
  if (password.length < 6) {
    return showMessage('Password must be at least 6 characters.', true);
  }

  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    await registerUserInDB(result.user.uid, result.user.email);
    showMessage('Account created! Redirecting...');
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
  } catch (err) {
    // Map Firebase error codes to user-friendly messages
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered. Try logging in.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    };
    showMessage(errorMessages[err.code] || err.message, true);
  }
}

//  Email & Password Login    ─
async function loginWithEmail() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    return showMessage('Please enter your email and password.', true);
  }

  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    await registerUserInDB(result.user.uid, result.user.email);
    showMessage('Login successful! Redirecting...');
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
  } catch (err) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Try again later.',
    };
    showMessage(errorMessages[err.code] || err.message, true);
  }
}

//  Google Sign-In 
async function loginWithGoogle() {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    await registerUserInDB(result.user.uid, result.user.email);
    showMessage('Login successful! Redirecting...');
    setTimeout(() => window.location.href = 'dashboard.html', 1000);
  } catch (err) {
    if (err.code === 'auth/popup-closed-by-user') return;
    showMessage(err.message, true);
  }
}

//  Auto-redirect if already logged in  ─
auth.onAuthStateChanged((user) => {
  if (user) {
    window.location.href = 'dashboard.html';
  }
});
