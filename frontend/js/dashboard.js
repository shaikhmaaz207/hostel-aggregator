const API_BASE = 'https://hostel-aggregator-r1f5.onrender.com/api';
const emojis   = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];

// ────────────────────────────────────────
// ROUTE PROTECTOR
// ────────────────────────────────────────
function checkAuth() {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('role');
  const name  = localStorage.getItem('user_name');

  if (!token) {
    document.getElementById('notLoggedIn').style.display = 'block';
    return false;
  }
  if (role !== 'Owner') {
    document.getElementById('accessDenied').style.display = 'block';
    return false;
  }

  document.getElementById('dashboardContent').style.display = 'block';
  document.getElementById('ownerName').textContent = `👤 ${name || 'Owner'}`;
  return true;
}

// ────────────────────────────────────────
// TAB SWITCHER
// ────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('panel-listings').style.display =
    tab === 'listings' ? 'block' : 'none';
  document.getElementById('panel-requests').style.display =
    tab === 'requests' ? 'block' : 'none';

  document.getElementById('tab-listings').classList.toggle('active', tab === 'listings');
  document.getElementById('tab-requests').classList.toggle('active', tab === 'requests');

  if (tab === 'requests') fetchBookingRequests();
}

// ────────────────────────────────────────
// FETCH OWNER'S HOSTELS
// ────────────────────────────────────────
async function fetchOwnerHostels() {
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${API_BASE}/hostels/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const allHostels = await response.json();

    document.getElementById('loadingState').style.display = 'none';

    if (allHostels.length === 0) {
      document.getElementById('noHostels').style.display = 'block';
      return;
    }

    const totalRevenue = allHostels.reduce((sum, h) => sum + Number(h.rent_amount), 0);
    document.getElementById('totalListings').textContent  = allHostels.length;
    document.getElementById('totalRevenue').textContent   = `₹${totalRevenue.toLocaleString()}`;
    document.getElementById('dashboardSubtitle').textContent =
      `You have ${allHostels.length} active listing${allHostels.length > 1 ? 's' : ''}`;

    renderOwnerHostels(allHostels);

  } catch (error) {
    document.getElementById('loadingState').textContent =
      '❌ Failed to load properties. Make sure backend is running.';
  }
}

// ────────────────────────────────────────
// FETCH BOOKING REQUESTS
// ────────────────────────────────────────
async function fetchBookingRequests() {
  const token = localStorage.getItem('access_token');

  document.getElementById('requestsLoading').style.display = 'block';
  document.getElementById('requestsTable').innerHTML       = '';
  document.getElementById('noRequests').style.display      = 'none';

  try {
    const response = await fetch(`${API_BASE}/bookings/requests/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const requests = await response.json();

    document.getElementById('requestsLoading').style.display = 'none';

    // ✅ Fixed: use 'Pending' not 'pending'
    const pending = requests.filter(r => r.status === 'Pending').length;
    document.getElementById('totalRequests').textContent = pending;

    if (pending > 0) {
      document.getElementById('requestsBadge').style.display = 'inline-block';
      document.getElementById('requestsBadge').textContent   = pending;
    }

    if (requests.length === 0) {
      document.getElementById('noRequests').style.display = 'block';
      return;
    }

    renderRequestsTable(requests);

  } catch (error) {
    document.getElementById('requestsLoading').textContent =
      '❌ Failed to load requests. Make sure backend is running.';
  }
}

// ────────────────────────────────────────
// RENDER REQUESTS TABLE
// ────────────────────────────────────────
function renderRequestsTable(requests) {
  const container = document.getElementById('requestsTable');

  let html = `
    <div class="requests-table">
      <div class="requests-table-header">
        <span>Student</span>
        <span>Hostel</span>
        <span>Request Date</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
  `;

  requests.forEach(req => {
    const date = new Date(req.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });

    // ✅ Fixed: use 'Pending', 'Approved', 'Rejected'
    const isPending  = req.status === 'Pending';
    const isAccepted = req.status === 'Approved';
    const isDeclined = req.status === 'Rejected';

    const statusBadge = isAccepted
      ? '<span class="status-badge accepted">✅ Approved</span>'
      : isDeclined
      ? '<span class="status-badge declined">❌ Rejected</span>'
      : '<span class="status-badge pending">⏳ Pending</span>';

    // ✅ Fixed: use 'Approved' and 'Rejected'
    const actionBtns = isPending ? `
      <button class="btn-accept" onclick="updateRequestStatus(${req.id}, 'Approved')">
        Accept Request
      </button>
      <button class="btn-decline" onclick="updateRequestStatus(${req.id}, 'Rejected')">
        Decline Request
      </button>
    ` : `<span class="action-done">—</span>`;

    html += `
      <div class="request-row" id="request-row-${req.id}">
        <span class="req-student">👤 ${req.student_name || 'Student'}</span>
        <span class="req-hostel">🏠 ${req.hostel_title || 'Hostel'}</span>
        <span class="req-date">📅 ${date}</span>
        <span class="req-status">${statusBadge}</span>
        <span class="req-actions">${actionBtns}</span>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ────────────────────────────────────────
// ACCEPT / DECLINE REQUEST
// ────────────────────────────────────────
async function updateRequestStatus(requestId, newStatus) {
  const token = localStorage.getItem('access_token');

  const row  = document.getElementById(`request-row-${requestId}`);
  const btns = row.querySelectorAll('button');
  btns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });

  try {
    // ✅ Fixed: correct URL without 'requests/'
    const response = await fetch(`${API_BASE}/bookings/${requestId}/status/`, {
      method:  'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    await fetchBookingRequests();

  } catch (error) {
    btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
    alert(`Failed to update request. Please try again.\nError: ${error.message}`);
  }
}

// ────────────────────────────────────────
// RENDER OWNER HOSTEL CARDS
// ────────────────────────────────────────
function renderOwnerHostels(hostels) {
  const grid = document.getElementById('ownerHostelGrid');
  grid.innerHTML = '';

  hostels.forEach((hostel, i) => {
    const emoji = emojis[i % emojis.length];
    grid.innerHTML += `
      <div class="hostel-card">
        <div class="card-image">${emoji}</div>
        <div class="card-body">
          <div class="card-title">${hostel.title}</div>
          <div class="card-location">${hostel.address}</div>
          <div class="card-tags">
            <span class="tag tag-boys">Active</span>
            <span class="tag tag-wifi">WiFi</span>
          </div>
          <div class="card-footer">
            <div class="card-price">
              ₹${Number(hostel.rent_amount).toLocaleString()}
              <span>/month</span>
            </div>
            <button class="btn-view" onclick="viewHostel(${hostel.id})">View</button>
          </div>
          <div class="owner-card-actions">
            <button class="btn-edit" onclick="editHostel(${hostel.id})">✏️ Edit</button>
            <button class="btn-upload" onclick="uploadImages(${hostel.id})">🖼️ Images</button>
            <button class="btn-delete" onclick="deleteHostel(${hostel.id})">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
  });
}

// ────────────────────────────────────────
// HELPER FUNCTIONS
// ────────────────────────────────────────
function viewHostel(id)   { window.location.href = `detail.html?id=${id}`; }
function editHostel(id)   { alert(`Edit hostel ID ${id} — coming soon!`); }
function uploadImages(id) { window.location.href = `upload.html?hostel_id=${id}`; }
function deleteHostel(id) {
  if (confirm(`Are you sure you want to delete hostel ID ${id}?`)) {
    alert('Delete functionality coming in next sprint!');
  }
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('role');
  localStorage.removeItem('user_name');
  window.location.href = 'index.html';
}

// ────────────────────────────────────────
// INIT
// ────────────────────────────────────────
const allowed = checkAuth();
if (allowed) {
  fetchOwnerHostels();
  fetchBookingRequests();
}
