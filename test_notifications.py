import websocket
import json
import threading
import time
import requests

API = 'http://127.0.0.1:8000/api'

# ── LOGIN ──
def login(email, password):
    r = requests.post(f'{API}/auth/login/',
        json={'email': email, 'password': password})
    return r.json()

owner   = login('owner@test.com', 'pass123')
student = login('student@test.com', 'pass123')

owner_token   = owner['access']
student_token = student['access']

print(f"Owner token:   {owner_token[:30]}...")
print(f"Student token: {student_token[:30]}...")

# ── OWNER LISTENS FOR NOTIFICATIONS ──
def owner_listener():
    ws = websocket.WebSocket()
    ws.connect("ws://127.0.0.1:8000/ws/chat/1/")
    print("\n[Owner] Connected — waiting for booking notification...")
    msg = ws.recv()
    print(f"[Owner] Got notification: {msg}")
    ws.close()

# ── STUDENT LISTENS FOR NOTIFICATIONS ──
def student_listener():
    ws = websocket.WebSocket()
    ws.connect("ws://127.0.0.1:8000/ws/chat/2/")
    print("[Student] Connected — waiting for status notification...")
    msg = ws.recv()
    print(f"[Student] Got notification: {msg}")
    ws.close()

# ── STUDENT CREATES BOOKING ──
def student_creates_booking():
    time.sleep(2)
    print("\n[Student] Creating booking...")
    r = requests.post(f'{API}/bookings/create/',
        headers={'Authorization': f'Bearer {student_token}'},
        json={
            'hostel': 1,
            'booking_date': '2026-07-01'
        })
    print(f"[Student] Booking response: {r.json()}")
    return r.json().get('id')

# ── OWNER APPROVES BOOKING ──
def owner_approves_booking(booking_id):
    time.sleep(4)
    print(f"\n[Owner] Approving booking {booking_id}...")
    r = requests.patch(
        f'{API}/bookings/{booking_id}/status/',
        headers={'Authorization': f'Bearer {owner_token}'},
        json={'status': 'Approved'}
    )
    print(f"[Owner] Approval response: {r.json()}")

# ── RUN TEST ──
t_owner   = threading.Thread(target=owner_listener)
t_student = threading.Thread(target=student_listener)
t_booking = threading.Thread(target=student_creates_booking)

t_owner.start()
t_student.start()

time.sleep(1)
booking_id = student_creates_booking()

time.sleep(2)
owner_approves_booking(booking_id)

t_owner.join(timeout=10)
t_student.join(timeout=10)

print("\n✅ Notification test complete!")
