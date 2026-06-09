const API_BASE = 'https://hostel-aggregator-r1f5.onrender.com/api';

let selectedRole = 'Student';

// ── ROLE SELECTOR ──
function selectRole(role) {
    selectedRole = role;
    document.getElementById('selectedRole').value = role;

    document.getElementById('roleStudent').classList.toggle('active', role === 'Student');
    document.getElementById('roleOwner').classList.toggle('active', role === 'Owner');
}

// ── REGISTER ──
async function register() {
    const name     = document.getElementById('regName').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm  = document.getElementById('regConfirm').value;
    const errorEl  = document.getElementById('regError');
    const successEl = document.getElementById('regSuccess');
    const btn      = document.getElementById('regBtn');

    // Hide previous messages
    errorEl.style.display   = 'none';
    successEl.style.display = 'none';

    // Validate
    if (!name) {
        errorEl.textContent   = 'Please enter your full name.';
        errorEl.style.display = 'block';
        return;
    }
    if (!email) {
        errorEl.textContent   = 'Please enter your email.';
        errorEl.style.display = 'block';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent   = 'Password must be at least 6 characters.';
        errorEl.style.display = 'block';
        return;
    }
    if (password !== confirm) {
        errorEl.textContent   = 'Passwords do not match.';
        errorEl.style.display = 'block';
        return;
    }

    btn.disabled    = true;
    btn.textContent = 'Creating account...';

    try {
        const response = await fetch(`${API_BASE}/auth/register/`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name:     name,
                email:    email,
                password: password,
                role:     selectedRole
            })
        });

        const data = await response.json();

        if (response.ok) {
            successEl.textContent   = '✅ Account created successfully! Redirecting to login...';
            successEl.style.display = 'block';

            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            errorEl.textContent   = data.email?.[0] || data.error || 'Registration failed. Please try again.';
            errorEl.style.display = 'block';
            btn.disabled    = false;
            btn.textContent = 'Create Account';
        }

    } catch (error) {
        errorEl.textContent   = '❌ Cannot connect to server. Make sure backend is running.';
        errorEl.style.display = 'block';
        btn.disabled    = false;
        btn.textContent = 'Create Account';
    }
}

// ── ENTER KEY ──
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') register();
});
