const API_BASE = 'https://hostel-aggregator.onrender.com/api';

// ────────────────────────────────────────
// ROUTE PROTECTOR
// ────────────────────────────────────────
function checkAuth() {
  const token = localStorage.getItem('access_token');
  const role  = localStorage.getItem('role');
  const name  = localStorage.getItem('user_name');

  if (!token) {
    document.getElementById('notLoggedIn').style.display = 'block';
    return false;
  }
  if (role !== 'Admin') {
    document.getElementById('accessDenied').style.display = 'block';
    return false;
  }

  document.getElementById('adminContent').style.display = 'block';
  document.getElementById('adminName').textContent = `🛡️ ${name || 'Admin'}`;
  return true;
}

// ────────────────────────────────────────
// TAB SWITCHER
// ────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('panel-owners').style.display =
    tab === 'owners' ? 'block' : 'none';
  document.getElementById('panel-students').style.display =
    tab === 'students' ? 'block' : 'none';

  document.getElementById('tab-owners').classList.toggle('active', tab === 'owners');
  document.getElementById('tab-students').classList.toggle('active', tab === 'students');

  if (tab === 'students') fetchStudents();
}

// ────────────────────────────────────────
// FETCH ALL USERS
// ────────────────────────────────────────
async function fetchOwners() {
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${API_BASE}/auth/users/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const users  = await response.json();
    const owners = users.filter(u => u.role === 'Owner');

    document.getElementById('ownersLoading').style.display = 'none';

    // Update stats
    const verified   = owners.filter(o => o.is_verified).length;
    const unverified = owners.length - verified;
    const students   = users.filter(u => u.role === 'Student').length;

    document.getElementById('totalOwners').textContent   = owners.length;
    document.getElementById('verifiedOwners').textContent = verified;
    document.getElementById('pendingOwners').textContent  = unverified;
    document.getElementById('totalStudents').textContent  = students;
    document.getElementById('adminSubtitle').textContent  =
      `${unverified} owner${unverified !== 1 ? 's' : ''} pending verification`;

    if (owners.length === 0) {
      document.getElementById('noOwners').style.display = 'block';
      return;
    }

    renderOwnersTable(owners);

  } catch (error) {
    document.getElementById('ownersLoading').textContent =
      '❌ Failed to load owners. Make sure backend is running.';
  }
}

async function fetchStudents() {
  const token = localStorage.getItem('access_token');

  document.getElementById('studentsLoading').style.display = 'block';
  document.getElementById('studentsTable').innerHTML       = '';

  try {
    const response = await fetch(`${API_BASE}/auth/users/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const users    = await response.json();
    const students = users.filter(u => u.role === 'Student');

    document.getElementById('studentsLoading').style.display = 'none';

    if (students.length === 0) {
      document.getElementById('noStudents').style.display = 'block';
      return;
    }

    renderStudentsTable(students);

  } catch (error) {
    document.getElementById('studentsLoading').textContent =
      '❌ Failed to load students.';
  }
}

// ────────────────────────────────────────
// RENDER OWNERS TABLE
// ────────────────────────────────────────
function renderOwnersTable(owners) {
  const container = document.getElementById('ownersTable');

  let html = `
    <div class="admin-table">
      <div class="admin-table-header">
        <span>ID</span>
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
  `;

  owners.forEach(owner => {
    const badge = owner.is_verified
      ? '<span class="badge-verified">✅ Verified</span>'
      : '<span class="badge-unverified">⏳ Pending</span>';

    const actions = owner.is_verified
      ? `<button class="btn-unverify" onclick="updateVerification(${owner.id}, false)">
           Unverify
         </button>`
      : `<button class="btn-verify" onclick="updateVerification(${owner.id}, true)">
           ✅ Verify Owner
         </button>`;

    html += `
      <div class="admin-row" id="owner-row-${owner.id}">
        <span>#${owner.id}</span>
        <span>${owner.name}</span>
        <span>${owner.email}</span>
        <span>${owner.role}</span>
        <span>${badge}</span>
        <span>${actions}</span>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ────────────────────────────────────────
// RENDER STUDENTS TABLE
// ────────────────────────────────────────
function renderStudentsTable(students) {
  const container = document.getElementById('studentsTable');

  let html = `
    <div class="admin-table">
      <div class="students-table-header">
        <span>ID</span>
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
        <span>Verified</span>
      </div>
  `;

  students.forEach(student => {
    const badge = student.is_verified
      ? '<span class="badge-verified">✅ Yes</span>'
      : '<span class="badge-unverified">❌ No</span>';

    html += `
      <div class="student-row">
        <span>#${student.id}</span>
        <span>${student.name}</span>
        <span>${student.email}</span>
        <span>${student.role}</span>
        <span>${badge}</span>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ────────────────────────────────────────
// VERIFY / UNVERIFY OWNER
// ────────────────────────────────────────
async function updateVerification(userId, isVerified) {
  const token = localStorage.getItem('access_token');

  const row  = document.getElementById(`owner-row-${userId}`);
  const btns = row.querySelectorAll('button');
  btns.forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });

  try {
    const response = await fetch(`${API_BASE}/auth/${userId}/verify/`, {
      method:  'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type':  'application/json'
      },
      body: JSON.stringify({ is_verified: isVerified })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    // Refresh owners table
    await fetchOwners();

  } catch (error) {
    btns.forEach(b => { b.disabled = false; b.style.opacity = '1'; });
    alert(`Failed to update verification. Error: ${error.message}`);
  }
}

// ────────────────────────────────────────
// LOGOUT
// ────────────────────────────────────────
function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('role');
  localStorage.removeItem('user_name');
  window.location.href = 'index.html';
}

// ────────────────────────────────────────
// INIT
// ────────────────────────────────────────
const allowed = checkAuth();
if (allowed) {
  fetchOwners();
}
