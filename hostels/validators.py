# hostels/validators.py
import math

VALID_ROOM_TYPES  = ['single', 'double', 'triple', 'quadruple']
VALID_SORT_VALUES = ['price_asc', 'price_desc']

def validate_search_params(query_params):
    errors  = []
    cleaned = {}

    # ── VALIDATE max_price ──
    max_price = query_params.get('max_price')
    if max_price is not None:
        try:
            max_price_val = float(max_price)
            if max_price_val < 0:
                errors.append("max_price cannot be negative.")
            elif max_price_val == 0:
                errors.append("max_price must be greater than zero.")
            else:
                cleaned['max_price'] = max_price_val
        except ValueError:
            errors.append(f"max_price must be a valid number. Got: '{max_price}'")

    # ── VALIDATE room_type ──
    room_type = query_params.get('room_type')
    if room_type is not None:
        room_type_clean = room_type.strip().lower()
        if room_type_clean not in VALID_ROOM_TYPES:
            errors.append(
                f"room_type must be one of: {', '.join(VALID_ROOM_TYPES)}. "
                f"Got: '{room_type}'"
            )
        else:
            cleaned['room_type'] = room_type_clean

    # ── VALIDATE location ──
    location = query_params.get('location')
    if location is not None:
        location_clean = location.strip()
        if len(location_clean) == 0:
            errors.append("location cannot be an empty string.")
        elif len(location_clean) > 100:
            errors.append("location must be 100 characters or fewer.")
        else:
            cleaned['location'] = location_clean

    # ── VALIDATE sort ──
    sort = query_params.get('sort')
    if sort is not None:
        sort_clean = sort.strip().lower()
        if sort_clean not in VALID_SORT_VALUES:
            errors.append(
                f"sort must be one of: {', '.join(VALID_SORT_VALUES)}. "
                f"Got: '{sort}'"
            )
        else:
            cleaned['sort'] = sort_clean

    # ── VALIDATE lat, lng, radius ──
    lat    = query_params.get('lat')
    lng    = query_params.get('lng')
    radius = query_params.get('radius')

    if any([lat, lng, radius]):
        # All three must be provided together
        if not all([lat, lng, radius]):
            errors.append("lat, lng, and radius must all be provided together.")
        else:
            try:
                lat_val    = float(lat)
                lng_val    = float(lng)
                radius_val = float(radius)

                if not (-90 <= lat_val <= 90):
                    errors.append("lat must be between -90 and 90.")
                if not (-180 <= lng_val <= 180):
                    errors.append("lng must be between -180 and 180.")
                if radius_val <= 0:
                    errors.append("radius must be greater than 0.")
                elif radius_val > 50:
                    errors.append("radius cannot exceed 50 km.")
                else:
                    cleaned['lat']    = lat_val
                    cleaned['lng']    = lng_val
                    cleaned['radius'] = radius_val
            except ValueError:
                errors.append("lat, lng, and radius must all be valid numbers.")

    if errors:
        return {'errors': errors}
    return {'cleaned': cleaned}


def haversine_distance(lat1, lng1, lat2, lng2):
    """
    Calculate distance between two GPS coordinates in kilometers.
    Uses the Haversine formula.
    """
    R = 6371  # Earth radius in km

    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    dlat   = math.radians(lat2 - lat1)
    dlng   = math.radians(lng2 - lng1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(lat1_r) * math.cos(lat2_r) *
         math.sin(dlng / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c