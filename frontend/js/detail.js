const API_BASE = 'http://127.0.0.1:8000/api';
const emojis = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];
let currentHostel = null;

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
  if (!id) { showError(); return; }

  try {
    const response = await fetch(`${API_BASE}/hostels/`);
    const data = await response.json();
    const hostel = data.find(h => h.id == id);
    if (!hostel) { showError(); return; }
    currentHostel = hostel;
    populatePage(hostel);
  } catch (error) {
    showError();
  }
}

// ── POPULATE PAGE ──
function populatePage(hostel) {
  const emoji = emojis[(hostel.id - 1) % emojis.length];
  const rent = `₹${Number(hostel.rent_amount).toLocaleString()}`;

  document.getElementById('detailEmoji').textContent = emoji;
  document.getElementById('detailTitle').textContent = hostel.title;
  document.getElementById('detailPrice').textContent = `${rent}/mo`;
  document.getElementById('detailLocation').textContent = hostel.address;
  document.getElementById('detailDescription').textContent =
    hostel.description || 'No description provided by the owner.';
  document.getElementById('specRent').textContent = `${rent} per month`;
  document.getElementById('specAddress').textContent = hostel.address;
  document.getElementById('specCoords').textContent =
    `${hostel.latitude}, ${hostel.longitude}`;
  document.getElementById('specDate').textContent = formatDate(hostel.created_at);

  const mapUrl = `https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`;
  document.getElementById('mapLink').href = mapUrl;
  document.getElementById('contactPrice').textContent = `${rent}/month`;
  document.title = `${hostel.title} — HostelFinder`;

  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('detailContent').style.display = 'block';
}

// ── SHOW ERROR ──
function showError() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
}

// ── OPEN BOOKING MODAL ──
function scheduleVisit() {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('role');

  if (!token) {
    alert('Please login to book a hostel!');
    window.location.href = 'login.html';
    return;
  }

  if (role === 'Owner') {
    alert('Owners cannot book hostels. Please login as a Student.');
    return;
  }

  // Set modal content
  document.getElementById('modalHostelName').textContent = currentHostel.title;
  document.getElementById('modalPrice').textContent =
    `₹${Number(currentHostel.rent_amount).toLocaleString()}/month`;

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bookingDate').min = today;
  document.getElementById('bookingDate').value = today;

  // Reset messages
  document.getElementById('modalError').style.display = 'none';
  document.getElementById('modalSuccess').style.display = 'none';

  // Show modal
  document.getElementById('bookingModal').style.display = 'flex';
}

// ── CLOSE MODAL ──
function closeModal() {
  document.getElementById('bookingModal').style.display = 'none';
}

// ── SUBMIT BOOKING ──
async function submitBooking() {
  const token       = localStorage.getItem('access_token');
  const bookingDate = document.getElementById('bookingDate').value;
  const errorDiv    = document.getElementById('modalError');
  const successDiv  = document.getElementById('modalSuccess');
  const confirmBtn  = document.querySelector('.btn-confirm-booking');

  errorDiv.style.display   = 'none';
  successDiv.style.display = 'none';

  if (!bookingDate) {
    errorDiv.textContent     = 'Please select a move-in date.';
    errorDiv.style.display   = 'block';
    return;
  }

  confirmBtn.textContent = 'Submitting...';
  confirmBtn.disabled    = true;

  try {
    const response = await fetch(`${API_BASE}/bookings/create/`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        hostel:       currentHostel.id,
        booking_date: bookingDate
      })
    });

    const data = await response.json();

    if (response.ok) {
      successDiv.textContent   = '✅ Booking request submitted! Redirecting to My Bookings...';
      successDiv.style.display = 'block';
      setTimeout(() => {
        window.location.href = 'my-bookings.html';
      }, 2000);
    } else {
      errorDiv.textContent   = data.error || 'Failed to submit booking.';
      errorDiv.style.display = 'block';
      confirmBtn.textContent = 'Confirm Request';
      confirmBtn.disabled    = false;
    }

  } catch (error) {
    errorDiv.textContent   = 'Cannot connect to server. Make sure backend is running.';
    errorDiv.style.display = 'block';
    confirmBtn.textContent = 'Confirm Request';
    confirmBtn.disabled    = false;
  }
}

// ── CONTACT OWNER (placeholder) ──
function contactOwner() {
  alert('Owner contact details coming soon!');
}

// ── CLOSE MODAL ON OVERLAY CLICK ──
document.getElementById('bookingModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── INIT ──
fetchHostelDetail();
