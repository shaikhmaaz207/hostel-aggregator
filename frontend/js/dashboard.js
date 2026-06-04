const API_BASE = 'http://127.0.0.1:8000/api';
const emojis = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];

// ── ROUTE PROTECTOR ──
// Checks token and role before showing dashboard
function checkAuth() {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('user_name');

  // Not logged in
  if (!token) {
    document.getElementById('notLoggedIn').style.display = 'block';
    return false;
  }

  // Logged in but Student role
  if (role !== 'Owner') {
    document.getElementById('accessDenied').style.display = 'block';
    return false;
  }

  // Owner — show dashboard
  document.getElementById('dashboardContent').style.display = 'block';
  document.getElementById('ownerName').textContent = `👤 ${name || 'Owner'}`;
  return true;
}

// ── FETCH OWNER'S HOSTELS ──
async function fetchOwnerHostels() {
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${API_BASE}/hostels/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const allHostels = await response.json();

    // Hide loading
    document.getElementById('loadingState').style.display = 'none';

    if (allHostels.length === 0) {
      document.getElementById('noHostels').style.display = 'block';
      return;
    }

    // Update stats
    const totalRevenue = allHostels.reduce((sum, h) => sum + Number(h.rent_amount), 0);
    document.getElementById('totalListings').textContent = allHostels.length;
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toLocaleString()}`;
    document.getElementById('dashboardSubtitle').textContent =
      `You have ${allHostels.length} active listing${allHostels.length > 1 ? 's' : ''}`;

    renderOwnerHostels(allHostels);

  } catch (error) {
    document.getElementById('loadingState').textContent =
      '❌ Failed to load properties. Make sure backend is running.';
  }
}

// ── RENDER OWNER HOSTEL CARDS ──
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
            <button class="btn-view" onclick="viewHostel(${hostel.id})">
              View
            </button>
          </div>
          <div class="owner-card-actions">
            <button class="btn-edit" onclick="editHostel(${hostel.id})">
              ✏️ Edit
            </button>
            <button class="btn-delete" onclick="deleteHostel(${hostel.id})">
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

// ── VIEW HOSTEL ──
function viewHostel(id) {
  window.location.href = `detail.html?id=${id}`;
}

// ── EDIT HOSTEL (placeholder) ──
function editHostel(id) {
  alert(`Edit hostel ID ${id} — coming in next sprint!`);
}

// ── DELETE HOSTEL (placeholder) ──
function deleteHostel(id) {
  if (confirm(`Are you sure you want to delete hostel ID ${id}?`)) {
    alert(`Delete functionality coming in next sprint!`);
  }
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
if (allowed) {
  fetchOwnerHostels();
}
