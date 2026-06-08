// ── CONFIG ──
const API_BASE = 'https://hostel-aggregator.onrender.com/api';
const WS_BASE  = 'wss://hostel-aggregator.onrender.com/ws/chat';

// ── STATE ──
const ownerName  = localStorage.getItem('user_name') || 'Owner';
const token      = localStorage.getItem('access_token');

let allContacts       = [];   // full contact list from API
let activeContactId   = null; // currently open conversation
let activeSocket      = null; // active WebSocket connection
let messageStore      = {};   // { contactId: [msg, msg, ...] }
let unreadCounts      = {};   // { contactId: number }

// ────────────────────────────────────────
// INIT
// ────────────────────────────────────────
function init() {
  // Auth check
  const role = localStorage.getItem('role');
  if (!token || role !== 'Owner') {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('ownerName').textContent = `👤 ${ownerName}`;
  fetchConversations();
}

// ────────────────────────────────────────
// FETCH CONVERSATION LIST FROM API
// ────────────────────────────────────────
async function fetchConversations() {
  try {
    const response = await fetch(`${API_BASE}/chat/conversations/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    allContacts = data;

    document.getElementById('contactsLoading').style.display = 'none';
    document.getElementById('inboxCount').textContent =
      `${data.length} chat${data.length !== 1 ? 's' : ''}`;

    renderContactList(allContacts);

  } catch (error) {
    // Fallback: show mock contacts for UI testing
    console.warn('API not available — loading mock data');
    loadMockContacts();
  }
}

// ────────────────────────────────────────
// MOCK DATA (for UI testing without backend)
// ────────────────────────────────────────
function loadMockContacts() {
  allContacts = [
    { id: 1, student_name: 'Rahul Sharma',   hostel_title: 'Green Valley PG',  last_message: 'Is WiFi included?',        last_time: new Date(), unread: 2 },
    { id: 2, student_name: 'Priya Patel',    hostel_title: 'Sunrise Hostel',   last_message: 'What is the curfew time?', last_time: new Date(), unread: 0 },
    { id: 3, student_name: 'Amit Deshmukh',  hostel_title: 'Green Valley PG',  last_message: 'Can I visit tomorrow?',    last_time: new Date(), unread: 1 },
    { id: 4, student_name: 'Sneha Kulkarni', hostel_title: 'City Boys Hostel', last_message: 'Is the room available?',   last_time: new Date(), unread: 0 },
  ];

  document.getElementById('contactsLoading').style.display = 'none';
  document.getElementById('inboxCount').textContent =
    `${allContacts.length} chats`;

  // Set unread counts from mock data
  allContacts.forEach(c => { unreadCounts[c.id] = c.unread || 0; });

  renderContactList(allContacts);
}

// ────────────────────────────────────────
// RENDER CONTACT LIST
// ────────────────────────────────────────
function renderContactList(contacts) {
  const list = document.getElementById('contactList');

  // Remove old contact items (keep loading div)
  list.querySelectorAll('.contact-item').forEach(el => el.remove());

  if (contacts.length === 0) {
    list.innerHTML += `
      <div class="no-contacts">
        <p>No conversations yet.</p>
      </div>`;
    return;
  }

  contacts.forEach(contact => {
    const unread  = unreadCounts[contact.id] || 0;
    const isActive = contact.id === activeContactId;
    const time    = formatTime(contact.last_time || new Date());

    const item = document.createElement('div');
    item.className = `contact-item${isActive ? ' active' : ''}`;
    item.id        = `contact-${contact.id}`;
    item.onclick   = () => openConversation(contact);

    item.innerHTML = `
      <div class="contact-avatar">
        ${getInitials(contact.student_name)}
      </div>
      <div class="contact-info">
        <div class="contact-top">
          <span class="contact-name">${contact.student_name}</span>
          <span class="contact-time">${time}</span>
        </div>
        <div class="contact-bottom">
          <span class="contact-preview">
            ${contact.last_message || 'No messages yet'}
          </span>
          ${unread > 0
            ? `<span class="unread-badge" id="badge-${contact.id}">${unread}</span>`
            : `<span class="unread-badge hidden" id="badge-${contact.id}">0</span>`
          }
        </div>
        <div class="contact-hostel">🏠 ${contact.hostel_title}</div>
      </div>
    `;

    list.appendChild(item);
  });
}

// ────────────────────────────────────────
// OPEN CONVERSATION
// ────────────────────────────────────────
function openConversation(contact) {
  // Update active contact
  activeContactId = contact.id;

  // Update sidebar active state
  document.querySelectorAll('.contact-item').forEach(el =>
    el.classList.remove('active')
  );
  document.getElementById(`contact-${contact.id}`)?.classList.add('active');

  // Clear unread badge
  unreadCounts[contact.id] = 0;
  const badge = document.getElementById(`badge-${contact.id}`);
  if (badge) badge.classList.add('hidden');

  // Show active chat pane
  document.getElementById('noConversation').style.display  = 'none';
  document.getElementById('activeChat').style.display      = 'flex';

  // Update chat header
  document.getElementById('activeChatName').textContent   = contact.student_name;
  document.getElementById('activeChatHostel').textContent = `🏠 ${contact.hostel_title}`;
  document.getElementById('activeChatAvatar').textContent =
    getInitials(contact.student_name);

  // Render stored messages for this contact
  renderMessages(contact.id);

  // Connect WebSocket for this conversation
  connectWebSocket(contact.id);

  // Focus input
  document.getElementById('messageInput').focus();
}

// ────────────────────────────────────────
// WEBSOCKET CONNECTION
// ────────────────────────────────────────
function connectWebSocket(conversationId) {
  // Close previous socket
  if (activeSocket) {
    activeSocket.onclose = null;
    activeSocket.close();
    activeSocket = null;
  }

  setStatus('connecting');

  const wsUrl = `${WS_BASE}/${conversationId}/`;

  try {
    activeSocket = new WebSocket(wsUrl);

    activeSocket.onopen = () => {
      setStatus('connected');
      console.log('Owner WebSocket connected →', wsUrl);
    };

    activeSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.message) {
        const isFromStudent = data.sender !== ownerName;
        const msg = {
          text:      data.message,
          sender:    data.sender || 'Student',
          type:      isFromStudent ? 'incoming' : 'outgoing',
          timestamp: new Date()
        };

        // Store message
        if (!messageStore[activeContactId]) messageStore[activeContactId] = [];
        messageStore[activeContactId].push(msg);

        // If this conversation is active, render immediately
        if (data.conversation_id == activeContactId || isFromStudent) {
          appendMessage(msg);
        } else {
          // Message for a different conversation — show unread badge
          const senderId = data.conversation_id;
          unreadCounts[senderId] = (unreadCounts[senderId] || 0) + 1;
          updateUnreadBadge(senderId);
        }

        // Update contact preview in sidebar
        updateContactPreview(activeContactId, data.message);
      }
    };

    activeSocket.onclose = () => {
      setStatus('disconnected');
      setTimeout(() => {
        if (activeContactId === conversationId) {
          connectWebSocket(conversationId);
        }
      }, 3000);
    };

    activeSocket.onerror = () => setStatus('disconnected');

  } catch (err) {
    setStatus('disconnected');
    console.error('WebSocket error:', err);
  }
}

// ────────────────────────────────────────
// SEND MESSAGE
// ────────────────────────────────────────
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text  = input.value.trim();

  if (!text || !activeContactId) return;

  const msg = {
    text:      text,
    sender:    ownerName,
    type:      'outgoing',
    timestamp: new Date()
  };

  // Store in message store
  if (!messageStore[activeContactId]) messageStore[activeContactId] = [];
  messageStore[activeContactId].push(msg);

  // Render bubble
  appendMessage(msg);

  // Send over WebSocket
  if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
    activeSocket.send(JSON.stringify({
      message:         text,
      sender:          ownerName,
      conversation_id: activeContactId
    }));
  } else {
    console.warn('WebSocket not connected — stored locally only');
  }

  // Update sidebar preview
  updateContactPreview(activeContactId, text);

  // Clear input
  input.value = '';
  input.focus();
}

// ────────────────────────────────────────
// RENDER ALL MESSAGES FOR A CONVERSATION
// ────────────────────────────────────────
function renderMessages(contactId) {
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';

  // System message
  const sys = document.createElement('div');
  sys.className   = 'system-message';
  sys.textContent = 'Conversation started via HostelFinder';
  container.appendChild(sys);

  const messages = messageStore[contactId] || [];
  messages.forEach(msg => appendMessage(msg));
}

// ────────────────────────────────────────
// APPEND MESSAGE BUBBLE
// ────────────────────────────────────────
function appendMessage(msg) {
  const container = document.getElementById('chatMessages');

  const bubble = document.createElement('div');
  bubble.classList.add('message-row', msg.type);

  bubble.innerHTML = `
    <div class="bubble">
      <div class="bubble-text">${escapeHTML(msg.text)}</div>
      <div class="bubble-meta">${formatTime(msg.timestamp)}</div>
    </div>
  `;

  container.appendChild(bubble);
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
}

// ────────────────────────────────────────
// FILTER CONTACTS (SEARCH)
// ────────────────────────────────────────
function filterContacts(query) {
  const filtered = allContacts.filter(c =>
    c.student_name.toLowerCase().includes(query.toLowerCase()) ||
    c.hostel_title.toLowerCase().includes(query.toLowerCase())
  );
  renderContactList(filtered);
}

// ────────────────────────────────────────
// UPDATE UNREAD BADGE
// ────────────────────────────────────────
function updateUnreadBadge(contactId) {
  const badge = document.getElementById(`badge-${contactId}`);
  if (!badge) return;
  const count = unreadCounts[contactId] || 0;
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}

// ────────────────────────────────────────
// UPDATE CONTACT PREVIEW IN SIDEBAR
// ────────────────────────────────────────
function updateContactPreview(contactId, lastMessage) {
  const item = document.getElementById(`contact-${contactId}`);
  if (!item) return;
  const preview = item.querySelector('.contact-preview');
  if (preview) preview.textContent = lastMessage;
}

// ────────────────────────────────────────
// STATUS INDICATOR
// ────────────────────────────────────────
function setStatus(state) {
  const dot  = document.getElementById('activeStatusDot');
  const text = document.getElementById('activeStatusText');
  if (!dot || !text) return;

  if (state === 'connected') {
    dot.className    = 'status-dot online';
    text.textContent = 'Connected';
  } else if (state === 'connecting') {
    dot.className    = 'status-dot connecting';
    text.textContent = 'Connecting...';
  } else {
    dot.className    = 'status-dot offline';
    text.textContent = 'Disconnected — retrying...';
  }
}

// ────────────────────────────────────────
// ENTER KEY HANDLER
// ────────────────────────────────────────
function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// ────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── INIT ──
init();
