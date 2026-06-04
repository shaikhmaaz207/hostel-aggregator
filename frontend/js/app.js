// ── API CONFIG ──
const API_BASE = 'http://127.0.0.1:8000/api';

// ── LOCAL FILTER STATE ──
const filterState = {
  search:   '',
  priceMin: 1000,
  priceMax: 20000,
  roomType: '',
  gender:   '',
  mess:     '',
  amenities: []
};

// ── DEBOUNCE TIMER ──
let debounceTimer = null;

// ────────────────────────────────────────
// BUILD URL WITH FILTER PARAMS
// ────────────────────────────────────────
function buildSearchURL() {
  const params = new URLSearchParams();

  if (filterState.search)
    params.append('search', filterState.search);

  if (filterState.priceMin)
    params.append('min_price', filterState.priceMin);

  if (filterState.priceMax)
    params.append('max_price', filterState.priceMax);

  if (filterState.roomType)
    params.append('room_type', filterState.roomType);

  if (filterState.gender)
    params.append('gender', filterState.gender);

  if (filterState.mess)
    params.append('mess', filterState.mess);

  filterState.amenities.forEach(a => params.append('amenities', a));

  const url = `${API_BASE}/hostels/?${params.toString()}`;
  console.log('API Call →', url);
  return url;
}

// ────────────────────────────────────────
// FETCH FROM BACKEND WITH FILTERS
// ────────────────────────────────────────
async function fetchHostels() {
  showSkeleton();

  try {
    const url = buildSearchURL();
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    hideSkeleton();
    renderHostels(data);

  } catch (error) {
    hideSkeleton();
    document.getElementById('hostelGrid').innerHTML =
      '<p style="text-align:center;padding:40px;color:#e94560;">Failed to load hostels. Make sure the backend server is running.</p>';
  }
}

// ────────────────────────────────────────
// RENDER HOSTEL CARDS
// ────────────────────────────────────────
const emojis = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];

function renderHostels(data) {
  const grid      = document.getElementById('hostelGrid');
  const noResults = document.getElementById('noResults');
  const count     = document.getElementById('count');

  grid.innerHTML = '';

  if (data.length === 0) {
    noResults.style.display = 'block';
    count.textContent = '';
    return;
  }

  noResults.style.display = 'none';
  count.textContent = `(${data.length} found)`;

  data.forEach((hostel, i) => {
    const emoji = emojis[i % emojis.length];
    grid.innerHTML += `
      <div class="hostel-card">
        <div class="card-image">${emoji}</div>
        <div class="card-body">
          <div class="card-title">${hostel.title}</div>
          <div class="card-location">📍 ${hostel.address}</div>
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

// ────────────────────────────────────────
// SKELETON LOADER SHOW / HIDE
// ────────────────────────────────────────
function showSkeleton() {
  document.getElementById('hostelGrid').innerHTML = '';
  document.getElementById('skeletonGrid').style.display = 'grid';
  document.getElementById('loadingIndicator').style.display = 'flex';
  document.getElementById('noResults').style.display = 'none';
  document.getElementById('count').textContent = '';
}

function hideSkeleton() {
  document.getElementById('skeletonGrid').style.display = 'none';
  document.getElementById('loadingIndicator').style.display = 'none';
}

// ────────────────────────────────────────
// FILTER CONTROL HANDLERS
// ────────────────────────────────────────

// Search input with debounce (waits 500ms after user stops typing)
function debounceSearch() {
  filterState.search = document.getElementById('searchInput').value;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchHostels(), 500);
}

// Immediate search trigger
function triggerSearch() {
  filterState.search = document.getElementById('searchInput').value;
  fetchHostels();
}

// Price sliders
function onPriceMin(value) {
  const val = parseInt(value);
  if (val >= filterState.priceMax) return;
  filterState.priceMin = val;
  document.getElementById('price-min-display').textContent =
    '₹' + val.toLocaleString('en-IN');
  debounceFilter();
}

function onPriceMax(value) {
  const val = parseInt(value);
  if (val <= filterState.priceMin) return;
  filterState.priceMax = val;
  document.getElementById('price-max-display').textContent =
    '₹' + val.toLocaleString('en-IN');
  debounceFilter();
}

// Room type chips
function setRoomType(el, value) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterState.roomType = value;
  fetchHostels();
}

// Dropdowns and checkboxes
function onFilterChange() {
  filterState.gender = document.getElementById('gender-filter').value;
  filterState.mess   = document.getElementById('mess-filter').value;

  filterState.amenities = [];
  document.querySelectorAll('.check-list input:checked').forEach(cb => {
    filterState.amenities.push(cb.value);
  });

  fetchHostels();
}

// Debounce for sliders (avoids API spam)
function debounceFilter() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchHostels(), 600);
}

// Reset all filters
function resetAllFilters() {
  filterState.search   = '';
  filterState.priceMin = 1000;
  filterState.priceMax = 20000;
  filterState.roomType = '';
  filterState.gender   = '';
  filterState.mess     = '';
  filterState.amenities = [];

  document.getElementById('searchInput').value   = '';
  document.getElementById('gender-filter').value = '';
  document.getElementById('mess-filter').value   = '';
  document.getElementById('price-min').value     = 1000;
  document.getElementById('price-max').value     = 20000;
  document.getElementById('price-min-display').textContent = '₹1,000';
  document.getElementById('price-max-display').textContent = '₹20,000';

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip').classList.add('active');
  document.querySelectorAll('.check-list input').forEach(c => c.checked = false);

  fetchHostels();
}

// Navigate to detail page
function viewHostel(id) {
  window.location.href = `detail.html?id=${id}`;
}

// ── INIT ──
fetchHostels();

