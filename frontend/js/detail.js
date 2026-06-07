const API_BASE = 'http://127.0.0.1:8000/api';
const emojis   = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];

// ── STATE ──
let currentHostelId  = null;
let selectedRating   = 0;
let reviewsLocalList = [];   // local state array for instant UI update

// ────────────────────────────────────────
// GET ID FROM URL
// ────────────────────────────────────────
function getHostelId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

// ────────────────────────────────────────
// FORMAT DATE
// ────────────────────────────────────────
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

// ────────────────────────────────────────
// FETCH HOSTEL DETAIL
// ────────────────────────────────────────
async function fetchHostelDetail() {
  const id = getHostelId();
  if (!id) { showError(); return; }

  currentHostelId = id;

  try {
    const response = await fetch(`${API_BASE}/hostels/`);
    const data     = await response.json();
    const hostel   = data.find(h => h.id == id);

    if (!hostel) { showError(); return; }

    populatePage(hostel);
    fetchReviews(id);

  } catch (error) {
    showError();
  }
}

// ────────────────────────────────────────
// POPULATE PAGE
// ────────────────────────────────────────
function populatePage(hostel) {
  const emoji = emojis[(hostel.id - 1) % emojis.length];
  const rent  = `₹${Number(hostel.rent_amount).toLocaleString()}`;

  document.getElementById('detailEmoji').textContent    = emoji;
  document.getElementById('detailTitle').textContent    = hostel.title;
  document.getElementById('detailPrice').textContent    = `${rent}/mo`;
  document.getElementById('detailLocation').textContent = hostel.address;
  document.getElementById('detailDescription').textContent =
    hostel.description || 'No description provided by the owner.';

  document.getElementById('specRent').textContent    = `${rent} per month`;
  document.getElementById('specAddress').textContent = hostel.address;
  document.getElementById('specCoords').textContent  =
    `${hostel.latitude}, ${hostel.longitude}`;
  document.getElementById('specDate').textContent    = formatDate(hostel.created_at);

  const mapUrl = `https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`;
  document.getElementById('mapLink').href = mapUrl;

  document.getElementById('contactPrice').textContent = `${rent}/month`;
  document.title = `${hostel.title} — HostelFinder`;

  document.getElementById('loadingState').style.display  = 'none';
  document.getElementById('detailContent').style.display = 'block';

  // Show/hide review form based on login
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('role');
  if (!token || role === 'Owner') {
    document.getElementById('reviewLoginMsg').style.display = 'block';
    document.getElementById('reviewForm').style.display     = 'none';
  }

  // Init star input
  initStarInput();

  // Char counter
  document.getElementById('reviewComment').addEventListener('input', function() {
    document.getElementById('charCount').textContent = this.value.length;
  });
}

// ────────────────────────────────────────
// FETCH REVIEWS FROM API
// ────────────────────────────────────────
async function fetchReviews(hostelId) {
  try {
    const response = await fetch(`${API_BASE}/reviews/?hostel=${hostelId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reviews = await response.json();
    reviewsLocalList = reviews;

    document.getElementById('reviewsLoading').style.display = 'none';
    renderReviews(reviews);
    renderAverageRating(reviews);

  } catch (error) {
    document.getElementById('reviewsLoading').textContent =
      'Could not load reviews.';
  }
}

// ────────────────────────────────────────
// RENDER AVERAGE RATING
// ────────────────────────────────────────
function renderAverageRating(reviews) {
  const numEl    = document.getElementById('avgRatingNumber');
  const starsEl  = document.getElementById('avgStarsDisplay');
  const countEl  = document.getElementById('avgRatingCount');

  if (reviews.length === 0) {
    numEl.textContent   = '—';
    starsEl.innerHTML   = renderStars(0);
    countEl.textContent = 'No reviews yet';
    return;
  }

  const total = reviews.reduce((sum, r) => sum + Number(r.rating), 0);
  const avg   = total / reviews.length;

  numEl.textContent   = avg.toFixed(1);
  starsEl.innerHTML   = renderStars(avg);
  countEl.textContent = `${reviews.length} review${reviews.length !== 1 ? 's' : ''}`;
}

// ────────────────────────────────────────
// RENDER FRACTIONAL STARS (display only)
// ────────────────────────────────────────
function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      // Full star
      html += `<span class="star full">★</span>`;
    } else if (rating >= i - 0.5) {
      // Half star using CSS clip
      html += `<span class="star half">★</span>`;
    } else {
      // Empty star
      html += `<span class="star empty">★</span>`;
    }
  }
  return html;
}

// ────────────────────────────────────────
// RENDER REVIEW LIST
// ────────────────────────────────────────
function renderReviews(reviews) {
  const container = document.getElementById('reviewsList');
  const noReviews = document.getElementById('noReviews');
  const countEl   = document.getElementById('reviewListCount');

  container.innerHTML = '';

  if (reviews.length === 0) {
    noReviews.style.display = 'block';
    countEl.textContent     = '';
    return;
  }

  noReviews.style.display = 'none';
  countEl.textContent     = `(${reviews.length})`;

  reviews.forEach(review => {
    const item = document.createElement('div');
    item.className = 'review-item';
    item.innerHTML = `
      <div class="review-header">
        <div class="review-avatar">
          ${getInitials(review.student_name || review.user || 'Student')}
        </div>
        <div class="review-meta">
          <div class="review-author">
            ${review.student_name || review.user || 'Anonymous Student'}
          </div>
          <div class="review-date">${formatDate(review.created_at)}</div>
        </div>
        <div class="review-stars">
          ${renderStars(review.rating)}
        </div>
      </div>
      <div class="review-comment">${escapeHTML(review.comment || review.review_text || '')}</div>
    `;
    container.appendChild(item);
  });
}

// ────────────────────────────────────────
// STAR INPUT — INTERACTIVE
// ────────────────────────────────────────
function initStarInput() {
  const stars = document.querySelectorAll('.star-btn');
  const label = document.getElementById('starInputLabel');

  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  stars.forEach(star => {
    // Hover effect
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.value);
      highlightStars(val);
      label.textContent = labels[val];
    });

    // Mouse leave — restore selected state
    star.addEventListener('mouseleave', () => {
      highlightStars(selectedRating);
      label.textContent = selectedRating > 0
        ? labels[selectedRating]
        : 'Click to rate';
    });

    // Click — set rating
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.value);
      highlightStars(selectedRating);
      label.textContent = labels[selectedRating];
      label.style.color = '#e94560';
    });
  });
}

function highlightStars(value) {
  document.querySelectorAll('.star-btn').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.value) <= value);
  });
}

// ────────────────────────────────────────
// SUBMIT REVIEW
// ────────────────────────────────────────
async function submitReview() {
  const comment = document.getElementById('reviewComment').value.trim();
  const errorEl = document.getElementById('reviewError');
  const successEl = document.getElementById('reviewSuccess');
  const btn     = document.getElementById('submitReviewBtn');

  // Hide previous messages
  errorEl.style.display   = 'none';
  successEl.style.display = 'none';

  // Validate
  if (selectedRating === 0) {
    errorEl.textContent   = 'Please select a star rating.';
    errorEl.style.display = 'block';
    return;
  }
  if (comment.length < 10) {
    errorEl.textContent   = 'Review must be at least 10 characters.';
    errorEl.style.display = 'block';
    return;
  }

  const token = localStorage.getItem('access_token');
  const userName = localStorage.getItem('user_name') || 'Student';

  btn.disabled     = true;
  btn.textContent  = 'Submitting...';

  try {
    const response = await fetch(`${API_BASE}/reviews/`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        hostel:      currentHostelId,
        rating:      selectedRating,
        comment:     comment,
        review_text: comment
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const newReview = await response.json();

    // ── INSTANT UI UPDATE (DoD requirement) ──
    // Add to local state array
    const localReview = {
      ...newReview,
      student_name: userName,
      created_at:   new Date().toISOString(),
      rating:       selectedRating,
      comment:      comment
    };
    reviewsLocalList.unshift(localReview);

    // Re-render reviews and average instantly
    renderReviews(reviewsLocalList);
    renderAverageRating(reviewsLocalList);

    // Show success
    successEl.textContent   = '✅ Your review has been submitted!';
    successEl.style.display = 'block';

    // Reset form
    selectedRating = 0;
    highlightStars(0);
    document.getElementById('reviewComment').value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('starInputLabel').textContent = 'Click to rate';
    document.getElementById('starInputLabel').style.color = '';

  } catch (error) {
    errorEl.textContent   = 'Failed to submit review. Please try again.';
    errorEl.style.display = 'block';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Submit Review';
  }
}

// ────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showError() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display   = 'block';
}

// ── BUTTONS ──
function scheduleVisit() {
  alert('Visit scheduling coming soon!');
}

function contactOwner() {
  alert('Owner contact details coming soon!');
}

function openChat() {
  const id    = getHostelId();
  const title = document.getElementById('detailTitle').textContent;
  window.location.href =
    `chat.html?hostel_id=${id}&hostel_name=${encodeURIComponent(title)}`;
}

// ── INIT ──
fetchHostelDetail();
