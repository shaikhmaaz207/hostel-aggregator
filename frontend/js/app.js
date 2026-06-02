// ── API CONFIG ──
const API_BASE = 'http://127.0.0.1:8000/api';

let allHostels = [];
let currentFilter = 'all';

// ── FETCH FROM REAL BACKEND ──
async function fetchHostels() {
  const grid = document.getElementById('hostelGrid');
  grid.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">Loading hostels...</p>';

  try {
    const response = await fetch(`${API_BASE}/hostels/`);
    const data = await response.json();

    // Enrich data with emoji (until images are added)
    const emojis = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];
    allHostels = data.map((h, i) => ({
      ...h,
      emoji: emojis[i % emojis.length]
    }));

    renderHostels(allHostels);

  } catch (error) {
    grid.innerHTML = '<p style="text-align:center;padding:40px;color:#e94560;">Failed to load hostels. Make sure the backend server is running.</p>';
  }
}

// ── RENDER CARDS ──
function renderHostels(data) {
  const grid = document.getElementById('hostelGrid');
  const noResults = document.getElementById('noResults');
  const count = document.getElementById('count');

  grid.innerHTML = '';

  if (data.length === 0) {
    noResults.style.display = 'block';
    count.textContent = '';
    return;
  }

  noResults.style.display = 'none';
  count.textContent = `(${data.length} found)`;

  data.forEach(hostel => {
    grid.innerHTML += `
      <div class="hostel-card">
        <div class="card-image">${hostel.emoji}</div>
        <div class="card-body">
          <div class="card-title">${hostel.title}</div>
          <div class="card-location">${hostel.address}</div>
          <div class="card-tags">
            <span class="tag tag-boys">Hostel</span>
            <span class="tag tag-wifi">WiFi</span>
          </div>
          <div class="card-footer">
            <div class="card-price">
              ₹${Number(hostel.rent_amount).toLocaleString()}
              <span>/month</span>
            </div>
            <button class="btn-view" onclick="viewHostel(${hostel.id})">
              View Details
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

// ── SEARCH ──
function filterHostels() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  let filtered = allHostels;

  if (currentFilter === 'budget') {
    filtered = filtered.filter(h => Number(h.rent_amount) < 5000);
  }

  if (query) {
    filtered = filtered.filter(h =>
      h.title.toLowerCase().includes(query) ||
      h.address.toLowerCase().includes(query)
    );
  }

  renderHostels(filtered);
}

// ── FILTER BUTTONS ──
function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('searchInput').value = '';
  filterHostels();
}

// ── GO TO DETAIL PAGE ──
function viewHostel(id) {
  window.location.href = `detail.html?id=${id}`;
}

// ── INIT ──
fetchHostels();
