const API_BASE = 'https://hostel-aggregator.onrender.com/api';
const emojis   = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];

let map            = null;
let markerCluster  = null;
let allHostels     = [];
let allMarkers     = [];

// ── INIT MAP ──
function initMap() {
  // Center on Aurangabad
  map = L.map('map').setView([19.8762, 75.3433], 13);

  // OpenStreetMap tiles (FREE - no API key needed)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);
  // ── MARKER CLUSTER GROUP ──
  markerCluster = L.markerClusterGroup({
    // Cluster radius in pixels
    maxClusterRadius: 80,

    // Custom cluster icon
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let size  = 'small';
      let dim   = 36;

      if (count >= 10) { size = 'large';  dim = 52; }
      else if (count >= 5) { size = 'medium'; dim = 44; }

      return L.divIcon({
        html: `
          <div style="
            background: #1a1a2e;
            color: #fff;
            border-radius: 50%;
            width: ${dim}px;
            height: ${dim}px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: ${count >= 10 ? '1rem' : '0.9rem'};
            border: 3px solid #e94560;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${count}</div>`,
        className: '',
        iconSize: [dim, dim]
      });
    },

    // Zoom in on cluster click
    zoomToBoundsOnClick: true,
    showCoverageOnHover: true,
    spiderfyOnMaxZoom:   true,
  });

  // Listen for cluster click events
  markerCluster.on('clusterclick', function(e) {
    const count = e.layer.getChildCount();
    showClusterStats(`${count} hostels in this area`);
  });

  map.addLayer(markerCluster);
}

// ── FETCH HOSTELS FROM API ──
async function fetchHostels() {
  try {
    const response = await fetch(`${API_BASE}/hostels/`);
    allHostels = await response.json();

    document.getElementById('mapSubtitle').textContent =
      `${allHostels.length} hostels found`;

    plotHostels(allHostels);
    showClusterStats(`${allHostels.length} total hostels loaded`);

  } catch (error) {
    document.getElementById('mapSubtitle').textContent =
      '❌ Failed to load hostels. Make sure backend is running.';
  }
}

// ── PLOT HOSTELS ON MAP ──
function plotHostels(hostels) {
  // Clear existing markers
  markerCluster.clearLayers();
  allMarkers = [];

  if (hostels.length === 0) {
    document.getElementById('mapSubtitle').textContent = 'No hostels found';
    return;
  }

  hostels.forEach((hostel, i) => {
    const lat   = parseFloat(hostel.latitude);
    const lng   = parseFloat(hostel.longitude);
    const emoji = emojis[i % emojis.length];
    const rent  = `₹${Number(hostel.rent_amount).toLocaleString()}`;

    // Custom marker icon
    const icon = L.divIcon({
      html: `
        <div class="custom-marker">
          <div class="custom-marker-inner">${rent.replace('₹','₹')}</div>
        </div>`,
      className: '',
      iconSize:   [36, 36],
      iconAnchor: [18, 36],
      popupAnchor:[0, -36]
    });

    const marker = L.marker([lat, lng], { icon });

    // Popup content
    const popupContent = `
      <div class="popup-content">
        <div class="popup-emoji">${emoji}</div>
        <div class="popup-title">${hostel.title}</div>
        <div class="popup-location">${hostel.address}</div>
        <div class="popup-price">${rent}/month</div>
        <a href="detail.html?id=${hostel.id}" class="popup-btn">
          View Details →
        </a>
      </div>`;

    marker.bindPopup(popupContent, {
      maxWidth: 240,
      className: 'custom-popup'
    });

    // Click marker → show sidebar
    marker.on('click', () => showSidebar(hostel, emoji));

    // Store reference
    marker.hostelData = hostel;
    allMarkers.push(marker);

    // Add to cluster group
    markerCluster.addLayer(marker);
  });

  // Fit map to all markers
  if (allMarkers.length > 0) {
    map.fitBounds(markerCluster.getBounds(), { padding: [40, 40] });
  }
}

// ── FILTER MAP HOSTELS ──
function filterMapHostels() {
  const query      = document.getElementById('mapSearch').value.toLowerCase();
  const maxPrice   = document.getElementById('priceFilter').value;

  let filtered = allHostels;

  if (query) {
    filtered = filtered.filter(h =>
      h.title.toLowerCase().includes(query) ||
      h.address.toLowerCase().includes(query)
    );
  }

  if (maxPrice !== 'all') {
    filtered = filtered.filter(h =>
      Number(h.rent_amount) <= Number(maxPrice)
    );
  }

  plotHostels(filtered);
  document.getElementById('mapSubtitle').textContent =
    `${filtered.length} hostels found`;
  showClusterStats(`Showing ${filtered.length} of ${allHostels.length} hostels`);
}

// ── SHOW SIDEBAR ──
function showSidebar(hostel, emoji) {
  const rent = `₹${Number(hostel.rent_amount).toLocaleString()}`;
  const mapUrl = `https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`;

  document.getElementById('sidebarEmoji').textContent    = emoji;
  document.getElementById('sidebarTitle').textContent    = hostel.title;
  document.getElementById('sidebarLocation').textContent = hostel.address;
  document.getElementById('sidebarPrice').textContent    = `${rent}/month`;
  document.getElementById('sidebarDesc').textContent     =
    hostel.description || 'No description available.';

  document.getElementById('sidebarDetailBtn').href = `detail.html?id=${hostel.id}`;
  document.getElementById('sidebarMapsBtn').href   = mapUrl;

  document.getElementById('mapSidebar').style.display = 'block';
}

// ── CLOSE SIDEBAR ──
function closeSidebar() {
  document.getElementById('mapSidebar').style.display = 'none';
}

// ── SHOW CLUSTER STATS ──
function showClusterStats(message) {
  const stats = document.getElementById('clusterStats');
  document.getElementById('clusterInfo').textContent = message;
  stats.style.display = 'block';
  setTimeout(() => { stats.style.display = 'none'; }, 3000);
}

// ── RESET MAP ──
function resetMap() {
  document.getElementById('mapSearch').value   = '';
  document.getElementById('priceFilter').value = 'all';
  plotHostels(allHostels);
  map.setView([19.8762, 75.3433], 13);
  closeSidebar();
  document.getElementById('mapSubtitle').textContent =
    `${allHostels.length} hostels found`;
}

// ── ADD MAP LINK TO NAVBAR ──
function addMapLink() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    const mapLink = document.createElement('a');
    mapLink.href = 'map.html';
    mapLink.textContent = '🗺️ Map View';
    navLinks.insertBefore(mapLink, navLinks.firstChild);
  }
}

// ── INIT ──
initMap();
fetchHostels();
