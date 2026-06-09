// ── CONFIG ──
const WS_BASE = 'wss://hostel-aggregator-r1f5.onrender.com/ws/chat';

// ── STATE ──
const params     = new URLSearchParams(window.location.search);
const hostelId   = params.get('hostel_id') || '1';
const hostelName = params.get('hostel_name') || 'Hostel';
const studentName = localStorage.getItem('user_name') || 'Student';

let socket       = null;
let messageList  = [];   // local state array storing all messages

// ────────────────────────────────────────
// INIT
// ────────────────────────────────────────
function init() {
  // Set hostel name in header
  document.getElementById('chatHostelName').textContent = hostelName;
  document.title = `Chat — ${hostelName}`;

  // Connect WebSocket
  connectWebSocket();

  // Focus input
  document.getElementById('messageInput').focus();
}

// ────────────────────────────────────────
// WEBSOCKET CONNECTION
// ────────────────────────────────────────
function connectWebSocket() {
  const token = localStorage.getItem('access_token');
  const wsUrl = `${WS_BASE}/${hostelId}/`;

  setStatus('connecting');

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      setStatus('connected');
      console.log('WebSocket connected →', wsUrl);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Incoming message from owner
      if (data.message && data.sender !== studentName) {
        appendMessage({
          text:      data.message,
          sender:    data.sender || 'Owner',
          type:      'incoming',
          timestamp: new Date()
        });
      }
    };

    socket.onclose = () => {
      setStatus('disconnected');
      console.log('WebSocket disconnected');
      // Auto-reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000);
    };

    socket.onerror = (err) => {
      setStatus('disconnected');
      console.error('WebSocket error:', err);
    };

  } catch (err) {
    setStatus('disconnected');
    console.error('WebSocket failed to connect:', err);
  }
}

// ────────────────────────────────────────
// SEND MESSAGE
// ────────────────────────────────────────
function sendMessage() {
  const input = document.getElementById('messageInput');
  const text  = input.value.trim();

  // Validate
  if (!text) return;

  // 1. Append to local state array
  const msg = {
    text:      text,
    sender:    studentName,
    type:      'outgoing',
    timestamp: new Date()
  };
  messageList.push(msg);

  // 2. Render bubble immediately
  appendMessage(msg);

  // 3. Send over WebSocket if connected
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      message: text,
      sender:  studentName,
      hostel:  hostelId
    }));
  } else {
    // Fallback: show sent anyway (offline mode)
    console.warn('WebSocket not connected — message stored locally only');
  }

  // 4. Clear input field
  input.value = '';
  input.focus();
}

// ────────────────────────────────────────
// APPEND MESSAGE BUBBLE TO UI
// ────────────────────────────────────────
function appendMessage(msg) {
  const container = document.getElementById('chatMessages');

  const bubble = document.createElement('div');
  bubble.classList.add('message-row', msg.type);

  const time = formatTime(msg.timestamp);

  bubble.innerHTML = `
    <div class="bubble">
      <div class="bubble-text">${escapeHTML(msg.text)}</div>
      <div class="bubble-meta">${time}</div>
    </div>
  `;

  container.appendChild(bubble);

  // Smooth scroll to latest message
  container.scrollTo({
    top:      container.scrollHeight,
    behavior: 'smooth'
  });
}

// ────────────────────────────────────────
// HANDLE ENTER KEY
// ────────────────────────────────────────
function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// ────────────────────────────────────────
// STATUS INDICATOR
// ────────────────────────────────────────
function setStatus(state) {
  const dot  = document.querySelector('.status-dot');
  const text = document.getElementById('statusText');

  if (state === 'connected') {
    dot.className  = 'status-dot online';
    text.textContent = 'Owner Online';
  } else if (state === 'connecting') {
    dot.className  = 'status-dot connecting';
    text.textContent = 'Connecting...';
  } else {
    dot.className  = 'status-dot offline';
    text.textContent = 'Disconnected — retrying...';
  }
}

// ────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────
function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit'
  });
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function goBack() {
  const id = hostelId;
  window.location.href = `detail.html?id=${id}`;
}

// ── INIT ──
init();
