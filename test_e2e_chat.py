import websocket
import json
import threading
import time

print("=" * 50)
print("TEST 6: Real-time Chat E2E Test")
print("=" * 50)

# User IDs from live server
STUDENT_ID = 4
OWNER_ID   = 5

WS_BASE = 'wss://hostel-aggregator.onrender.com/ws/chat'

def student_chat():
    ws = websocket.WebSocket()
    ws.connect(f"{WS_BASE}/{STUDENT_ID}/")
    print(f"[Student] Connected to live WebSocket")

    time.sleep(2)

    message = {
        "event": "send_message",
        "sender_id": STUDENT_ID,
        "receiver_id": OWNER_ID,
        "message_text": "Hi! I am interested in your E2E Test Hostel. Is it available?"
    }
    ws.send(json.dumps(message))
    print(f"[Student] Sent message to Owner")

    response = ws.recv()
    print(f"[Student] Got confirmation: {response}")
    ws.close()

def owner_chat():
    ws = websocket.WebSocket()
    ws.connect(f"{WS_BASE}/{OWNER_ID}/")
    print(f"[Owner] Connected to live WebSocket")

    response = ws.recv()
    print(f"[Owner] Received message: {response}")
    ws.close()

t_owner   = threading.Thread(target=owner_chat)
t_student = threading.Thread(target=student_chat)

t_owner.start()
t_student.start()

t_owner.join(timeout=15)
t_student.join(timeout=15)

print("\n✅ E2E Chat test complete!")

