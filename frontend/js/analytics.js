const API_BASE = 'https://hostel-aggregator-r1f5.onrender.com/api';

// ────────────────────────────────────────
// INIT — check admin role before showing anything
// ────────────────────────────────────────
function init() {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('role');

  if (!token || role !== 'Admin') {
    document.getElementById('accessDenied').style.display = 'flex';
    return;
  }

  document.getElementById('dashboard').style.display = 'block';
  loadAnalytics();
}

// ────────────────────────────────────────
// FETCH ANALYTICS FROM API
// ────────────────────────────────────────
async function loadAnalytics() {
  const token = localStorage.getItem('access_token');

  // Reset state
  document.getElementById('analyticsLoading').style.display  = 'flex';
  document.getElementById('analyticsError').style.display    = 'none';
  document.getElementById('analyticsContent').style.display  = 'none';

  try {
    const response = await fetch(`${API_BASE}/admin/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 403) {
      document.getElementById('dashboard').style.display     = 'none';
      document.getElementById('accessDenied').style.display  = 'flex';
      return;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    document.getElementById('analyticsLoading').style.display = 'none';
    document.getElementById('analyticsContent').style.display = 'block';

    populateDashboard(data);

  } catch (error) {
    document.getElementById('analyticsLoading').style.display = 'none';
    document.getElementById('analyticsError').style.display   = 'block';
  }
}

// ────────────────────────────────────────
// POPULATE ALL PANELS
// ────────────────────────────────────────
function populateDashboard(data) {

  // Generated at
  document.getElementById('generatedAt').textContent =
    `Last updated: ${data.generated_at}`;

  // ── HEALTH ──
  const health = data.health || {};
  document.getElementById('healthText').textContent =
    health.status === 'healthy' ? 'All systems operational' : '⚠️ System issue detected';
  document.getElementById('healthDb').textContent =
    health.database === 'connected' ? 'Database connected' : '⚠️ Database issue';

  // ── USERS ──
  const u = data.users || {};
  setVal('totalUsers',     u.total_users);
  setVal('totalStudents',  u.total_students);
  setVal('totalOwners',    u.total_owners);
  setVal('verifiedOwners', u.verified_owners);

  // ── PLATFORM ──
  setVal('totalHostels',  (data.hostels  || {}).total_hostels);
  setVal('totalReviews',  (data.reviews  || {}).total_reviews);
  setVal('totalMessages', (data.messages || {}).total_messages);

  // ── BOOKINGS ──
  const b = data.bookings || {};
  setVal('totalBookings',    b.total_bookings);
  setVal('pendingBookings',  b.pending_bookings);
  setVal('approvedBookings', b.approved_bookings);
  setVal('rejectedBookings', b.rejected_bookings);

  // Booking breakdown bar
  renderBreakdownBar(
    b.approved_bookings || 0,
    b.pending_bookings  || 0,
    b.rejected_bookings || 0
  );

  // ── THIS WEEK ──
  const r = data.recent_activity || {};
  setVal('newStudents', r.new_students_this_week);
  setVal('newBookings', r.new_bookings_this_week);
  setVal('newReviews',  r.new_reviews_this_week);
}

// ────────────────────────────────────────
// BOOKING BREAKDOWN BAR
// ────────────────────────────────────────
function renderBreakdownBar(approved, pending, rejected) {
  const total = approved + pending + rejected;

  if (total === 0) {
    document.getElementById('barApproved').style.width = '100%';
    document.getElementById('barPending').style.width  = '0%';
    document.getElementById('barRejected').style.width = '0%';
    return;
  }

  document.getElementById('barApproved').style.width =
    ((approved / total) * 100).toFixed(1) + '%';
  document.getElementById('barPending').style.width =
    ((pending  / total) * 100).toFixed(1) + '%';
  document.getElementById('barRejected').style.width =
    ((rejected / total) * 100).toFixed(1) + '%';
}

// ────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────
function setVal(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = (value !== undefined && value !== null)
    ? Number(value).toLocaleString()
    : '0';
}

function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// ── INIT ──
init();