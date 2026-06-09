// ── CONFIG ──
const API_BASE = 'https://hostel-aggregator-r1f5.onrender.com/api';
const emojis   = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];

// ── STATE ──
let map           = null;
let markerCluster = null;
let allHostels    = [];
let allMarkers    = [];
let activeCardId  = null;
let debounceTimer = null;

// ────────────────────────────────────────
// INIT MAP
// ────────────────────────────────────────
function initMap() {
  // Center on Aurangabad
  map = L.map('splitMap').setView([19.8762, 75.3433], 13);

  // OpenStreetMap tiles (free)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  // Marker cluster group
  markerCluster = L.markerClusterGroup({
    maxClusterRadius: 60,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      const dim   = count >= 10 ? 48 : count >= 5 ? 40 : 34;
      return L.divIcon({
        html: `<div style="
          background:#1a1a2e;color:#fff;border-radius:50%;
          width:${dim}px;height:${dim}px;
          display:flex;align-items:center;justify-content:center;
          font-weight:800;font-size:0.85rem;
          border:3px solid #e94560;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);">${count}</div>`,
        className: '',
        iconSize: [dim, dim]
      });
    },
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom:   true,
  });

  map.addLayer(markerCluster);

  // ── MAP EVENT LISTENERS ──
  // Show "Search this area" button when map is dragged or zoomed
  map.on('moveend', onMapMoved);
  map.on('zoomend', onMapMoved);
}

// ────────────────────────────────────────
// MAP MOVED / ZOOMED HANDLER
// ────────────────────────────────────────
function onMapMoved() {
  document.getElementById('refreshAreaBtn').style.display = 'block';
}

// ────────────────────────────────────────
// REFRESH HOSTELS FROM CURRENT MAP BOUNDS
// ────────────────────────────────────────
function refreshFromMapBounds() {
  const bounds = map.getBounds();
  const sw     = bounds.getSouthWest();
  const ne     = bounds.getNorthEast();

  // Filter allHostels to only those within current map bounds
  const inBounds = allHostels.filter(h => {
    const lat = parseFloat(h.latitude);
    const lng = parseFloat(h.longitude);
    return lat >= sw.lat && lat <= ne.lat &&
           lng >= sw.lng && lng <= ne.lng;
  });

  // Update card list with in-bounds hostels
  renderCards(inBounds);

  // Update subtitle
  document.getElementById('splitSubtitle').textContent =
    `${inBounds.length} hostels in this area`;

  // Hide the button
  document.getElementById('refreshAreaBtn').style.display = 'none';
}

// ────────────────────────────────────────
// FETCH HOSTELS FROM API
// ────────────────────────────────────────
async function fetchHostels() {
  showSkeleton();

  try {
    const url      = buildURL();
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    allHostels = await response.json();

    hideSkeleton();
    renderCards(allHostels);
    plotMarkers(allHostels);

    document.getElementById('splitSubtitle').textContent =
      `${allHostels.length} hostels found`;

  } catch (error) {
    hideSkeleton();
    document.getElementById('splitCards').innerHTML =
      '<p style="padding:20px;color:#e94560;">Failed to load. Make sure backend is running.</p>';
  }
}

// ────────────────────────────────────────
// BUILD API URL WITH FILTERS
// ────────────────────────────────────────
function buildURL() {
  const params   = new URLSearchParams();
  const query    = document.getElementById('splitSearch').value.trim();
  const maxPrice = document.getElementById('splitPrice').value;

  if (query)             params.append('search',    query);
  if (maxPrice !== 'all') params.append('max_price', maxPrice);

  return `${API_BASE}/hostels/?${params.toString()}`;
}

// ────────────────────────────────────────
// RENDER HOSTEL CARDS (LEFT PANEL)
// ────────────────────────────────────────
function renderCards(hostels) {
  const container = document.getElementById('splitCards');
  const noResults = document.getElementById('splitNoResults');
  const count     = document.getElementById('splitCount');

  container.innerHTML = '';

  if (hostels.length === 0) {
    noResults.style.display = 'block';
    count.textContent = '0 hostels';
    return;
  }

  noResults.style.display = 'none';
  count.textContent = `${hostels.length} hostel${hostels.length !== 1 ? 's' : ''}`;

  hostels.forEach((hostel, i) => {
    const emoji = emojis[i % emojis.length];
    const rent  = `₹${Number(hostel.rent_amount).toLocaleString()}`;

    const card = document.createElement('div');
    card.className = 'split-card';
    card.id        = `split-card-${hostel.id}`;
    card.onclick   = () => focusHostel(hostel.id);

    card.innerHTML = `
      <div class="split-card-emoji">${emoji}</div>
      <div class="split-card-body">
        <div class="split-card-title">${hostel.title}</div>
        <div class="split-card-location">📍 ${hostel.address}</div>
        <div class="split-card-footer">
          <span class="split-card-price">${rent}/mo</span>
          <a href="detail.html?id=${hostel.id}" class="split-card-btn">
            View →
          </a>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ────────────────────────────────────────
// PLOT MARKERS ON MAP (RIGHT PANEL)
// ────────────────────────────────────────
function plotMarkers(hostels) {
  markerCluster.clearLayers();
  allMarkers = [];

  hostels.forEach((hostel, i) => {
    const lat   = parseFloat(hostel.latitude);
    const lng   = parseFloat(hostel.longitude);
    const emoji = emojis[i % emojis.length];
    const rent  = `₹${Number(hostel.rent_amount).toLocaleString()}`;

    if (isNaN(lat) || isNaN(lng)) return;

    // Custom price tag marker
    const icon = L.divIcon({
      html: `<div class="split-marker" id="marker-${hostel.id}">
               <div class="split-marker-inner">${rent}</div>
             </div>`,
      className: '',
      iconSize:   [70, 30],
      iconAnchor: [35, 30],
      popupAnchor:[0, -32]
    });

    const marker = L.marker([lat, lng], { icon });

    // Popup
    marker.bindPopup(`
      <div class="popup-content">
        <div class="popup-emoji">${emoji}</div>
        <div class="popup-title">${hostel.title}</div>
        <div class="popup-location">${hostel.address}</div>
        <div class="popup-price">${rent}/month</div>
        <a href="detail.html?id=${hostel.id}" class="popup-btn">
          View Details →
        </a>
      </div>`, { maxWidth: 240, className: 'custom-popup' }
    );

    // Click pin → highlight card + open popup
    marker.on('click', () => {
      highlightCard(hostel.id);
      marker.openPopup();
    });

    marker.hostelId = hostel.id;
    allMarkers.push(marker);
    markerCluster.addLayer(marker);
  });

  // Fit map to markers
  if (allMarkers.length > 0) {
    try {
      map.fitBounds(markerCluster.getBounds(), { padding: [30, 30] });
    } catch(e) {}
  }
}

// ────────────────────────────────────────
// FOCUS HOSTEL — card click → pan map to marker
// ────────────────────────────────────────
function focusHostel(hostelId) {
  // Highlight card
  highlightCard(hostelId);

  // Find matching hostel
  const hostel = allHostels.find(h => h.id === hostelId);
  if (!hostel) return;

  const lat = parseFloat(hostel.latitude);
  const lng = parseFloat(hostel.longitude);
  if (isNaN(lat) || isNaN(lng)) return;

  // Pan map to marker smoothly
  map.panTo([lat, lng], { animate: true, duration: 0.5 });

  // Find and open the marker popup
  const marker = allMarkers.find(m => m.hostelId === hostelId);
  if (marker) {
    markerCluster.zoomToShowLayer(marker, () => {
      marker.openPopup();
    });
  }
}

// ────────────────────────────────────────
// HIGHLIGHT CARD — pin click → highlight card
// ────────────────────────────────────────
function highlightCard(hostelId) {
  // Remove highlight from previous card
  if (activeCardId) {
    const prev = document.getElementById(`split-card-${activeCardId}`);
    if (prev) prev.classList.remove('highlighted');
  }

  // Add highlight to new card
  activeCardId = hostelId;
  const card = document.getElementById(`split-card-${hostelId}`);
  if (card) {
    card.classList.add('highlighted');
    // Smooth scroll card into view in the list panel
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Highlight the marker
  highlightMarker(hostelId);
}

// ────────────────────────────────────────
// HIGHLIGHT MARKER
// ────────────────────────────────────────
function highlightMarker(hostelId) {
  // Reset all markers
  document.querySelectorAll('.split-marker').forEach(el => {
    el.classList.remove('split-marker-active');
  });

  // Highlight active marker
  const markerEl = document.getElementById(`marker-${hostelId}`);
  if (markerEl) markerEl.classList.add('split-marker-active');
}

// ────────────────────────────────────────
// SEARCH & FILTER HANDLERS
// ────────────────────────────────────────
function onSplitSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchHostels(), 500);
}

function onSplitFilter() {
  fetchHostels();
}

function resetSplitView() {
  document.getElementById('splitSearch').value = '';
  document.getElementById('splitPrice').value  = 'all';
  map.setView([19.8762, 75.3433], 13);
  document.getElementById('refreshAreaBtn').style.display = 'none';
  fetchHostels();
}

// ────────────────────────────────────────
// SKELETON LOADERS
// ────────────────────────────────────────
function showSkeleton() {
  document.getElementById('splitSkeleton').style.display = 'block';
  document.getElementById('splitCards').innerHTML        = '';
  document.getElementById('splitLoading').style.display = 'flex';
  document.getElementById('splitNoResults').style.display = 'none';
}

function hideSkeleton() {
  document.getElementById('splitSkeleton').style.display = 'none';
  document.getElementById('splitLoading').style.display  = 'none';
}

// ── INIT ──
initMap();
fetchHostels();
