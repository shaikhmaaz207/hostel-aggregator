const API_BASE = 'http://127.0.0.1:8000/api';
const emojis = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];

// ── GET ID FROM URL ──
function getHostelId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// ── FORMAT DATE ──
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ── FETCH HOSTEL DETAIL ──
async function fetchHostelDetail() {
  const id = getHostelId();

  if (!id) {
    showError();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/hostels/`);
    const data = await response.json();

    const hostel = data.find(h => h.id == id);

    if (!hostel) {
      showError();
      return;
    }

    populatePage(hostel);

  } catch (error) {
    showError();
  }
}

// ── POPULATE PAGE ──
function populatePage(hostel) {
  const emoji = emojis[(hostel.id - 1) % emojis.length];
  const rent = `₹${Number(hostel.rent_amount).toLocaleString()}`;

  // Hero
  document.getElementById('detailEmoji').textContent = emoji;

  // Title block
  document.getElementById('detailTitle').textContent = hostel.title;
  document.getElementById('detailPrice').textContent = `${rent}/mo`;
  document.getElementById('detailLocation').textContent = hostel.address;

  // Description
  document.getElementById('detailDescription').textContent =
    hostel.description || 'No description provided by the owner.';

  // Specs
  document.getElementById('specRent').textContent = `${rent} per month`;
  document.getElementById('specAddress').textContent = hostel.address;
  document.getElementById('specCoords').textContent =
    `${hostel.latitude}, ${hostel.longitude}`;
  document.getElementById('specDate').textContent =
    formatDate(hostel.created_at);

  // Map link
  const mapUrl = `https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`;
  document.getElementById('mapLink').href = mapUrl;

  // Contact card
  document.getElementById('contactPrice').textContent = `${rent}/month`;

  // Page title
  document.title = `${hostel.title} — HostelFinder`;

  // Show content
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('detailContent').style.display = 'block';
}

// ── ERROR STATE ──
function showError() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
}

// ── BUTTONS ──
function scheduleVisit() {
  alert('Visit scheduling coming soon in HA-7!');
}

function contactOwner() {
  alert('Owner contact details coming soon!');
}

function openChat() {
  const id = getHostelId();
  const title = document.getElementById('detailTitle').textContent;
  window.location.href = `chat.html?hostel_id=${id}&hostel_name=${encodeURIComponent(title)}`;
}

// ── INIT ──
fetchHostelDetail();
