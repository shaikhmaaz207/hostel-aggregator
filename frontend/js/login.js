const API_BASE = 'https://hostel-aggregator-r1f5.onrender.com/api';

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');

  // Reset messages
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';

  if (!email || !password) {
    errorMsg.textContent = 'Please enter both email and password.';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Save token and role to localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('role', data.role);
      localStorage.setItem('user_name', email.split('@')[0]);

      successMsg.textContent = `Login successful! Redirecting...`;
      successMsg.style.display = 'block';

      // Redirect based on role
      setTimeout(() => {
        if (data.role === 'Owner') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 1000);

    } else {
      errorMsg.textContent = data.error || 'Invalid email or password.';
      errorMsg.style.display = 'block';
    }

  } catch (error) {
    errorMsg.textContent = 'Cannot connect to server. Make sure backend is running.';
    errorMsg.style.display = 'block';
  }
}

// Allow Enter key to submit
document.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') login();
});
