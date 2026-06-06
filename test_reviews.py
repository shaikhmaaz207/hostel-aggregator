import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core.exceptions import ValidationError
from reviews.models import Review
from users.models import User
from hostels.models import Hostel

# Get existing user and hostel
student = User.objects.get(id=2)
hostel  = Hostel.objects.get(id=1)

print("=" * 50)
print("TEST 1: Rating = 6 (should FAIL)")
print("=" * 50)
try:
    review = Review(student=student, hostel=hostel, rating=6, comment="Too high rating")
    review.full_clean()
    review.save()
    print("❌ ERROR: Should have failed but didn't!")
except ValidationError as e:
    print(f"✅ Correctly rejected: {e.messages}")

print()
print("=" * 50)
print("TEST 2: Rating = -1 (should FAIL)")
print("=" * 50)
try:
    review = Review(student=student, hostel=hostel, rating=-1, comment="Negative rating")
    review.full_clean()
    review.save()
    print("❌ ERROR: Should have failed but didn't!")
except ValidationError as e:
    print(f"✅ Correctly rejected: {e.messages}")

print()
print("=" * 50)
print("TEST 3: Valid rating = 5 (should PASS)")
print("=" * 50)
try:
    review = Review(student=student, hostel=hostel, rating=5, comment="Excellent hostel!")
    review.full_clean()
    review.save()
    print(f"✅ Review saved successfully! ID: {review.id}")
except Exception as e:
    print(f"❌ Failed: {e}")

print()
print("=" * 50)
print("TEST 4: Duplicate review (should FAIL)")
print("=" * 50)
try:
    review2 = Review(student=student, hostel=hostel, rating=4, comment="Trying again")
    review2.full_clean()
    review2.save()
    print("❌ ERROR: Should have failed but didn't!")
except Exception as e:
    print(f"✅ Correctly rejected duplicate: {e}")

print()
print("✅ All tests complete!")
