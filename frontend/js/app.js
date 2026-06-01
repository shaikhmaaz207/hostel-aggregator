// ── MOCK DATA (replace with API call later) ──
const mockHostels = [
  {
    id: 1,
    title: "Boys Hostel Near MIT College",
    address: "Aurangabad, MH",
    rent_amount: 4500,
    type: "Student",
    tags: ["WiFi", "Mess"],
    emoji: "🏢"
  },
  {
    id: 2,
    title: "Girls PG Near MGM College",
    address: "Cidco, Aurangabad",
    rent_amount: 5000,
    type: "Girl",
    tags: ["WiFi", "AC"],
    emoji: "🏠"
  },
  {
    id: 3,
    title: "Sunrise Boys Hostel",
    address: "Garkheda, Aurangabad",
    rent_amount: 3800,
    type: "Student",
    tags: ["Mess", "CCTV"],
    emoji: "🏨"
  },
  {
    id: 4,
    title: "Green Valley Girls PG",
    address: "Osmanpura, Aurangabad",
    rent_amount: 6000,
    type: "Girl",
    tags: ["WiFi", "Mess", "AC"],
    emoji: "🏡"
  },
  {
    id: 5,
    title: "Budget Stay Near BAMU",
    address: "University Road, Aurangabad",
    rent_amount: 3000,
    type: "Student",
    tags: ["WiFi"],
    emoji: "🏘"
  },
  {
    id: 6,
    title: "Royal PG for Girls",
    address: "Cantonment, Aurangabad",
    rent_amount: 7000,
    type: "Girl",
    tags: ["WiFi", "Mess", "Gym"],
    emoji: "🏰"
  }
];

let currentFilter = 'all';

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
    const tagsHTML = hostel.tags.map(tag => {
      let cls = 'tag-wifi';
      if (tag === 'Mess') cls = 'tag-mess';
      return `<span class="tag ${cls}">${tag}</span>`;
    }).join('');

    const typeTag = hostel.type === 'Girl'
      ? `<span class="tag tag-girls">Girls</span>`
      : `<span class="tag tag-boys">Boys</span>`;

    grid.innerHTML += `
      <div class="hostel-card">
        <div class="card-image">${hostel.emoji}</div>
        <div class="card-body">
          <div class="card-title">${hostel.title}</div>
          <div class="card-location">${hostel.address}</div>
          <div class="card-tags">
            ${typeTag}
            ${tagsHTML}
          </div>
          <div class="card-footer">
            <div class="card-price">
              ₹${hostel.rent_amount.toLocaleString()}
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
  let filtered = mockHostels;

  if (currentFilter === 'budget') {
    filtered = filtered.filter(h => h.rent_amount < 5000);
  } else if (currentFilter !== 'all') {
    filtered = filtered.filter(h => h.type === currentFilter);
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

// ── VIEW DETAILS (placeholder) ──
function viewHostel(id) {
  alert(`Hostel detail page for ID ${id} — coming soon!`);
}

// ── INIT ──
renderHostels(mockHostels);
