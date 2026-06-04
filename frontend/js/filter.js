// ── Local Component State ──
const filterState = {
  location:   '',
  priceMin:   2000,
  priceMax:   10000,
  roomType:   'Any',
  gender:     '',
  mess:       '',
  amenities:  [],
  curfew:     ''
};

// ── Render state to screen ──
function renderState() {
  document.getElementById('state-output').textContent =
    JSON.stringify(filterState, null, 2);
}

// ── Generic field updater ──
function updateState(key, value) {
  filterState[key] = value;
  renderState();
}

// ── Price Min slider ──
function updatePriceMin(value) {
  const val = parseInt(value);
  if (val >= filterState.priceMax) return;
  filterState.priceMin = val;
  document.getElementById('price-min-display').textContent =
    '₹' + val.toLocaleString('en-IN');
  renderState();
}

// ── Price Max slider ──
function updatePriceMax(value) {
  const val = parseInt(value);
  if (val <= filterState.priceMin) return;
  filterState.priceMax = val;
  document.getElementById('price-max-display').textContent =
    '₹' + val.toLocaleString('en-IN');
  renderState();
}

// ── Room type chip toggle ──
function toggleChip(el, key, value) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterState[key] = value;
  renderState();
}

// ── Amenity checkbox toggle ──
function toggleAmenity(el) {
  if (el.checked) {
    filterState.amenities.push(el.value);
  } else {
    filterState.amenities = filterState.amenities.filter(a => a !== el.value);
  }
  renderState();
}

// ── Apply filters ──
function applyFilters() {
  console.log('Applying filters:', filterState);
  alert('Filters applied!\n\nCheck console for state object.\nThis will connect to Search API in HA-14.');
}

// ── Reset all filters ──
function resetFilters() {
  filterState.location   = '';
  filterState.priceMin   = 2000;
  filterState.priceMax   = 10000;
  filterState.roomType   = 'Any';
  filterState.gender     = '';
  filterState.mess       = '';
  filterState.amenities  = [];
  filterState.curfew     = '';

  // Reset UI
  document.getElementById('location').value = '';
  document.getElementById('gender').value   = '';
  document.getElementById('mess').value     = '';
  document.getElementById('curfew').value   = '';
  document.getElementById('price-min').value = 2000;
  document.getElementById('price-max').value = 10000;
  document.getElementById('price-min-display').textContent = '₹2,000';
  document.getElementById('price-max-display').textContent = '₹10,000';

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip').classList.add('active');

  document.querySelectorAll('.check-item input').forEach(c => c.checked = false);

  renderState();
}

// ── Init ──
renderState();
// ── Local Component State ──
const filterState = {
  location:   '',
  priceMin:   2000,
  priceMax:   10000,
  roomType:   'Any',
  gender:     '',
  mess:       '',
  amenities:  [],
  curfew:     ''
};

// ── Render state to screen ──
function renderState() {
  document.getElementById('state-output').textContent =
    JSON.stringify(filterState, null, 2);
}

// ── Generic field updater ──
function updateState(key, value) {
  filterState[key] = value;
  renderState();
}

// ── Price Min slider ──
function updatePriceMin(value) {
  const val = parseInt(value);
  if (val >= filterState.priceMax) return;
  filterState.priceMin = val;
  document.getElementById('price-min-display').textContent =
    '₹' + val.toLocaleString('en-IN');
  renderState();
}

// ── Price Max slider ──
function updatePriceMax(value) {
  const val = parseInt(value);
  if (val <= filterState.priceMin) return;
  filterState.priceMax = val;
  document.getElementById('price-max-display').textContent =
    '₹' + val.toLocaleString('en-IN');
  renderState();
}

// ── Room type chip toggle ──
function toggleChip(el, key, value) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  filterState[key] = value;
  renderState();
}

// ── Amenity checkbox toggle ──
function toggleAmenity(el) {
  if (el.checked) {
    filterState.amenities.push(el.value);
  } else {
    filterState.amenities = filterState.amenities.filter(a => a !== el.value);
  }
  renderState();
}

// ── Apply filters ──
function applyFilters() {
  console.log('Applying filters:', filterState);
  alert('Filters applied!\n\nCheck console for state object.\nThis will connect to Search API in HA-14.');
}

// ── Reset all filters ──
function resetFilters() {
  filterState.location   = '';
  filterState.priceMin   = 2000;
  filterState.priceMax   = 10000;
  filterState.roomType   = 'Any';
  filterState.gender     = '';
  filterState.mess       = '';
  filterState.amenities  = [];
  filterState.curfew     = '';

  // Reset UI
  document.getElementById('location').value = '';
  document.getElementById('gender').value   = '';
  document.getElementById('mess').value     = '';
  document.getElementById('curfew').value   = '';
  document.getElementById('price-min').value = 2000;
  document.getElementById('price-max').value = 10000;
  document.getElementById('price-min-display').textContent = '₹2,000';
  document.getElementById('price-max-display').textContent = '₹10,000';

  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('.chip').classList.add('active');

  document.querySelectorAll('.check-item input').forEach(c => c.checked = false);

  renderState();
}

// ── Init ──
renderState();
