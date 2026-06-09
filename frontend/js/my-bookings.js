const API_BASE = 'https://hostel-aggregator-r1f5.onrender.com/api';

// ── ROUTE PROTECTION ──
function checkAuth() {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('role');
  const name  = localStorage.getItem('user_name');

  if (!token) {
    document.getElementById('notLoggedIn').style.display = 'block';
    return false;
  }

  if (role === 'Owner') {
    document.getElementById('wrongRole').style.display = 'block';
    return false;
  }

  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('studentName').textContent = `👤 ${name || 'Student'}`;
  return true;
}

// ── FETCH BOOKINGS ──
async function fetchBookings() {
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${API_BASE}/bookings/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const bookings = await response.json();

    document.getElementById('loadingState').style.display = 'none';

    if (bookings.length === 0) {
      document.getElementById('noBookings').style.display = 'block';
      return;
    }

    updateStats(bookings);
    renderBookings(bookings);

  } catch (error) {
    document.getElementById('loadingState').textContent =
      '❌ Failed to load bookings. Make sure backend is running.';
  }
}

// ── UPDATE STATS ──
function updateStats(bookings) {
  const pending  = bookings.filter(b => b.status === 'Pending').length;
  const approved = bookings.filter(b => b.status === 'Approved').length;
  const rejected = bookings.filter(b => b.status === 'Rejected').length;

  document.getElementById('totalBookings').textContent = bookings.length;
  document.getElementById('pendingCount').textContent  = pending;
  document.getElementById('approvedCount').textContent = approved;
  document.getElementById('rejectedCount').textContent = rejected;

  document.getElementById('bookingsSubtitle').textContent =
    `You have ${bookings.length} booking request${bookings.length > 1 ? 's' : ''}`;
}

// ── RENDER BOOKINGS ──
function renderBookings(bookings) {
  const list = document.getElementById('bookingsList');
  list.innerHTML = '';

  // Sort newest first
  bookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  bookings.forEach(booking => {
    const statusClass = booking.status.toLowerCase();
    const badgeClass  = `badge-${statusClass}`;

    const date = new Date(booking.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    list.innerHTML += `
      <div class="booking-card ${statusClass}">
        <div class="booking-card-left">
          <h3>🏠 Hostel #${booking.hostel}</h3>
          <div class="booking-meta">
            <span>📅 Move-in: ${booking.booking_date}</span>
            <span>🕐 Requested: ${date}</span>
            <span>🆔 Booking ID: #${booking.id}</span>
          </div>
        </div>
        <div class="booking-card-right">
          <span class="status-badge ${badgeClass}">
            ${getStatusEmoji(booking.status)} ${booking.status}
          </span>
        </div>
      </div>
    `;
  });
}

// ── STATUS EMOJI ──
function getStatusEmoji(status) {
  const map = {
    'Pending':   '⏳',
    'Approved':  '✅',
    'Rejected':  '❌',
    'Cancelled': '🚫'
  };
  return map[status] || '📋';
}

// ── LOGOUT ──
function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('role');
  localStorage.removeItem('user_name');
  window.location.href = 'index.html';
}

// ── INIT ──
const allowed = checkAuth();
if (allowed) fetchBookings();
