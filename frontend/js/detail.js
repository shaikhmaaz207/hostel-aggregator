const API_BASE = 'https://hostel-aggregator.onrender.com/api';
const emojis   = ['🏢', '🏠', '🏨', '🏡', '🏘', '🏰'];

// ── STATE ──
let currentHostelId  = null;
let selectedRating   = 0;
let reviewsLocalList = [];

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
    hostel.description || 'No description provided.';

  document.getElementById('specRent').textContent    = `${rent} per month`;
  document.getElementById('specAddress').textContent = hostel.address;
  document.getElementById('specCoords').textContent  =
    `${hostel.latitude}, ${hostel.longitude}`;
  document.getElementById('specDate').textContent    = formatDate(hostel.created_at);

  const mapUrl = `https://www.google.com/maps?q=${hostel.latitude},${hostel.longitude}`;
  document.getElementById('mapLink').href    = mapUrl;
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

  initStarInput();

  document.getElementById('reviewComment').addEventListener('input', function() {
    document.getElementById('charCount').textContent = this.value.length;
  });
}

// ────────────────────────────────────────
// FETCH REVIEWS
// ────────────────────────────────────────
async function fetchReviews(hostelId) {
  try {
    const token    = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE}/hostels/${hostelId}/reviews/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data    = await response.json();
    const reviews = data.reviews || data;
    reviewsLocalList = reviews;

    document.getElementById('reviewsLoading').style.display = 'none';
    renderReviews(reviews);
    renderAverageRating(reviews);

  } catch (error) {
    document.getElementById('reviewsLoading').textContent = 'Could not load reviews.';
  }
}

// ────────────────────────────────────────
// RENDER AVERAGE RATING
// ────────────────────────────────────────
function renderAverageRating(reviews) {
  const numEl   = document.getElementById('avgRatingNumber');
  const starsEl = document.getElementById('avgStarsDisplay');
  const countEl = document.getElementById('avgRatingCount');

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
// RENDER FRACTIONAL STARS
// ────────────────────────────────────────
function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) {
      html += `<span class="star full">★</span>`;
    } else if (rating >= i - 0.5) {
      html += `<span class="star half">★</span>`;
    } else {
      html += `<span class="star empty">★</span>`;
    }
  }
  return html;
}

// ────────────────────────────────────────
// RENDER REVIEWS
// ────────────────────────────────────────
function renderReviews(reviews) {
  const container = document.getElementById('reviewsList');
  const noReviews = document.getElementById('noReviews');
  const countEl   = document.getElementById('reviewListCount');
  const token     = localStorage.getItem('access_token');
  const role      = localStorage.getItem('role');
  const isOwner   = token && role === 'Owner';

  container.innerHTML = '';

  if (reviews.length === 0) {
    noReviews.style.display = 'block';
    countEl.textContent     = '';
    return;
  }

  noReviews.style.display = 'none';
  countEl.textContent     = `(${reviews.length})`;

  reviews.forEach(review => {
    const existingReply = review.owner_reply || review.reply || null;

    // Reply toggle button — only for owners with no reply yet
    const replyToggleBtn = (isOwner && !existingReply)
      ? `<button class="btn-reply-toggle" id="reply-toggle-${review.id}"
           onclick="toggleReplyForm(${review.id})">✏️ Reply</button>`
      : '';

    // Reply section
    let replyHTML = '';
    if (existingReply) {
      replyHTML = `
        <div class="owner-reply">
          <div class="owner-reply-tag">🏠 Owner Response</div>
          <div class="owner-reply-text">${escapeHTML(existingReply)}</div>
        </div>`;
    } else if (isOwner) {
      replyHTML = `
        <div class="reply-form" id="reply-form-${review.id}" style="display:none;">
          <textarea
            id="reply-input-${review.id}"
            class="reply-textarea"
            placeholder="Write a response to this review..."
            maxlength="400"
            rows="2"
          ></textarea>
          <div class="reply-form-actions">
            <span class="reply-char-count">
              <span id="reply-char-${review.id}">0</span>/400
            </span>
            <div class="reply-btns">
              <button class="btn-reply-cancel"
                onclick="cancelReply(${review.id})">Cancel</button>
              <button class="btn-reply-submit"
                id="reply-btn-${review.id}"
                onclick="submitReply(${review.id})">Post Response</button>
            </div>
          </div>
          <div class="reply-error" id="reply-error-${review.id}"
            style="display:none;"></div>
        </div>`;
    }

    const item = document.createElement('div');
    item.className = 'review-item';
    item.innerHTML = `
      <div class="review-header">
        <div class="review-avatar">
          ${getInitials(review.student_name || 'Student')}
        </div>
        <div class="review-meta">
          <div class="review-author">
            ${review.student_name || 'Anonymous Student'}
          </div>
          <div class="review-date">${formatDate(review.created_at)}</div>
        </div>
        <div class="review-header-right">
          <div class="review-stars">${renderStars(review.rating)}</div>
          ${replyToggleBtn}
        </div>
      </div>
      <div class="review-comment">
        ${escapeHTML(review.comment || '')}
      </div>
      ${replyHTML}
    `;

    container.appendChild(item);

    // Attach char counter for reply textarea
    if (isOwner && !existingReply) {
      const textarea = document.getElementById(`reply-input-${review.id}`);
      const charEl   = document.getElementById(`reply-char-${review.id}`);
      if (textarea && charEl) {
        textarea.addEventListener('input', () => {
          charEl.textContent = textarea.value.length;
        });
      }
    }
  });
}

// ────────────────────────────────────────
// STAR INPUT
// ────────────────────────────────────────
function initStarInput() {
  const stars  = document.querySelectorAll('.star-btn');
  const label  = document.getElementById('starInputLabel');
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      highlightStars(parseInt(star.dataset.value));
      label.textContent = labels[parseInt(star.dataset.value)];
    });

    star.addEventListener('mouseleave', () => {
      highlightStars(selectedRating);
      label.textContent = selectedRating > 0 ? labels[selectedRating] : 'Click to rate';
    });

    star.addEventListener('click', () => {
      selectedRating        = parseInt(star.dataset.value);
      highlightStars(selectedRating);
      label.textContent     = labels[selectedRating];
      label.style.color     = '#e94560';
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
  const comment   = document.getElementById('reviewComment').value.trim();
  const errorEl   = document.getElementById('reviewError');
  const successEl = document.getElementById('reviewSuccess');
  const btn       = document.getElementById('submitReviewBtn');

  errorEl.style.display   = 'none';
  successEl.style.display = 'none';

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

  const token    = localStorage.getItem('access_token');
  const userName = localStorage.getItem('user_name') || 'Student';

  btn.disabled    = true;
  btn.textContent = 'Submitting...';

  try {
    const response = await fetch(`${API_BASE}/hostels/${currentHostelId}/reviews/`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ rating: selectedRating, comment: comment })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const newReview = await response.json();

    const localReview = {
      ...newReview,
      student_name: userName,
      created_at:   new Date().toISOString(),
      rating:       selectedRating,
      comment:      comment
    };

    reviewsLocalList.unshift(localReview);
    renderReviews(reviewsLocalList);
    renderAverageRating(reviewsLocalList);

    successEl.textContent   = '✅ Your review has been submitted!';
    successEl.style.display = 'block';

    selectedRating = 0;
    highlightStars(0);
    document.getElementById('reviewComment').value        = '';
    document.getElementById('charCount').textContent      = '0';
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
// TOGGLE REPLY FORM
// ────────────────────────────────────────
function toggleReplyForm(reviewId) {
  const form   = document.getElementById(`reply-form-${reviewId}`);
  const toggle = document.getElementById(`reply-toggle-${reviewId}`);

  if (!form) return;

  const isVisible = form.style.display === 'block';

  if (isVisible) {
    form.style.display = 'none';
    if (toggle) toggle.textContent = '✏️ Reply';
  } else {
    form.style.display = 'block';
    if (toggle) toggle.textContent = '✕ Cancel';
    const input = document.getElementById(`reply-input-${reviewId}`);
    if (input) input.focus();
  }
}

function cancelReply(reviewId) {
  const form   = document.getElementById(`reply-form-${reviewId}`);
  const toggle = document.getElementById(`reply-toggle-${reviewId}`);
  const input  = document.getElementById(`reply-input-${reviewId}`);
  const charEl = document.getElementById(`reply-char-${reviewId}`);

  if (form)   form.style.display = 'none';
  if (toggle) toggle.textContent = '✏️ Reply';
  if (input)  input.value        = '';
  if (charEl) charEl.textContent = '0';
}

// ────────────────────────────────────────
// SUBMIT OWNER REPLY
// ────────────────────────────────────────
async function submitReply(reviewId) {
  const input     = document.getElementById(`reply-input-${reviewId}`);
  const btn       = document.getElementById(`reply-btn-${reviewId}`);
  const errorEl   = document.getElementById(`reply-error-${reviewId}`);
  const replyText = input.value.trim();

  errorEl.style.display = 'none';

  if (replyText.length < 5) {
    errorEl.textContent   = 'Reply must be at least 5 characters.';
    errorEl.style.display = 'block';
    return;
  }

  const token = localStorage.getItem('access_token');

  btn.disabled    = true;
  btn.textContent = 'Posting...';

  try {
    const response = await fetch(
      `${API_BASE}/hostels/${currentHostelId}/reviews/${reviewId}/reply/`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reply: replyText })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const reviewIndex = reviewsLocalList.findIndex(r => r.id === reviewId);
    if (reviewIndex !== -1) {
      reviewsLocalList[reviewIndex].owner_reply = replyText;
    }

    const form   = document.getElementById(`reply-form-${reviewId}`);
    const toggle = document.getElementById(`reply-toggle-${reviewId}`);

    const replyDiv       = document.createElement('div');
    replyDiv.className   = 'owner-reply';
    replyDiv.style.animation = 'fadeUp 0.3s ease';
    replyDiv.innerHTML   = `
      <div class="owner-reply-tag">🏠 Owner Response</div>
      <div class="owner-reply-text">${escapeHTML(replyText)}</div>
    `;

    if (form)   form.replaceWith(replyDiv);
    if (toggle) toggle.remove();

  } catch (error) {
    errorEl.textContent   = 'Failed to post reply. Please try again.';
    errorEl.style.display = 'block';
    btn.disabled    = false;
    btn.textContent = 'Post Response';
  }
}

// ────────────────────────────────────────
// BOOKING MODAL
// ────────────────────────────────────────
function scheduleVisit() {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('role');

  if (!token) {
    alert('Please login to book a hostel.');
    window.location.href = 'login.html';
    return;
  }

  if (role === 'Owner') {
    alert('Owners cannot book hostels.');
    return;
  }

  const title = document.getElementById('detailTitle').textContent;
  const price = document.getElementById('contactPrice').textContent;

  document.getElementById('modalHostelName').textContent  = title;
  document.getElementById('modalHostelPrice').textContent = price;

  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bookingDate').min   = today;
  document.getElementById('bookingDate').value = '';

  document.getElementById('modalError').style.display   = 'none';
  document.getElementById('modalSuccess').style.display = 'none';
  document.getElementById('bookingModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('bookingModal').style.display = 'none';
}

async function submitBooking() {
  const date    = document.getElementById('bookingDate').value;
  const errorEl = document.getElementById('modalError');
  const successEl = document.getElementById('modalSuccess');
  const btn     = document.getElementById('confirmBtn');

  errorEl.style.display   = 'none';
  successEl.style.display = 'none';

  if (!date) {
    errorEl.textContent   = 'Please select a move-in date.';
    errorEl.style.display = 'block';
    return;
  }

  const token = localStorage.getItem('access_token');

  btn.disabled    = true;
  btn.textContent = 'Submitting...';

  try {
    const response = await fetch(`${API_BASE}/bookings/create/`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        hostel:       currentHostelId,
        booking_date: date
      })
    });

    if (response.ok) {
      successEl.textContent   = '✅ Booking request submitted!';
      successEl.style.display = 'block';
      setTimeout(() => {
        closeModal();
        window.location.href = 'my-bookings.html';
      }, 2000);
    } else {
      const data = await response.json();
      errorEl.textContent   = data.error || 'Booking failed.';
      errorEl.style.display = 'block';
      btn.disabled    = false;
      btn.textContent = 'Confirm Request';
    }

  } catch (error) {
    errorEl.textContent   = 'Failed to submit booking.';
    errorEl.style.display = 'block';
    btn.disabled    = false;
    btn.textContent = 'Confirm Request';
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