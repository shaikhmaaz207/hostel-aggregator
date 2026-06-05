import websocket
import json
import threading
import time

# ── CLIENT 1 (User ID 1 - Owner) ──
def client1():
    ws1 = websocket.WebSocket()
    ws1.connect("ws://127.0.0.1:8000/ws/chat/1/")
    print("[Client 1] Connected as User 1")

    # Wait for client 2 to connect
    time.sleep(2)

    # Send message to User 2
    message = {
        "event": "send_message",
        "sender_id": 1,
        "receiver_id": 2,
        "message_text": "Hello! I am the hostel owner."
    }
    ws1.send(json.dumps(message))
    print("[Client 1] Sent message to User 2")

    # Wait for confirmation
    response = ws1.recv()
    print(f"[Client 1] Got response: {response}")
    ws1.close()

# ── CLIENT 2 (User ID 2 - Student) ──
def client2():
    ws2 = websocket.WebSocket()
    ws2.connect("ws://127.0.0.1:8000/ws/chat/2/")
    print("[Client 2] Connected as User 2")

    # Wait for message from client 1
    response = ws2.recv()
    print(f"[Client 2] Received message: {response}")
    ws2.close()

# ── RUN BOTH CLIENTS ──
t1 = threading.Thread(target=client1)
t2 = threading.Thread(target=client2)

t2.start()
t1.start()

t1.join()
t2.join()

print("\n✅ WebSocket test complete!")

