# hostels/validators.py

VALID_ROOM_TYPES = ['single', 'double', 'triple', 'quadruple']
VALID_SORT_VALUES = ['price_asc', 'price_desc']


def validate_search_params(query_params):
    """
    Validates all incoming GET /api/hostels/ query parameters.
    Returns a dict: { 'errors': [...] } if invalid, or { 'cleaned': {...} } if valid.
    
    Rules:
    ------
    max_price   → must be a positive number (no letters, no negatives, no zero)
    room_type   → must be one of: single, double, triple, quadruple
    location    → must be a plain string, max 100 characters
    sort        → must be one of: price_asc, price_desc
    """
    errors = []
    cleaned = {}

    # ── VALIDATE max_price ──
    max_price = query_params.get('max_price')
    if max_price is not None:
        try:
            max_price_val = float(max_price)

            # Reject negative values
            if max_price_val < 0:
                errors.append("max_price cannot be negative.")

            # Reject zero
            elif max_price_val == 0:
                errors.append("max_price must be greater than zero.")

            else:
                cleaned['max_price'] = max_price_val

        except ValueError:
            # Letters or symbols passed instead of a number
            errors.append(
                f"max_price must be a valid number. Got: '{max_price}'"
            )

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

        # Reject empty string
        if len(location_clean) == 0:
            errors.append("location cannot be an empty string.")

        # Reject suspiciously long strings (basic sanitation)
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

    # ── RETURN RESULT ──
    if errors:
        return {'errors': errors}

    return {'cleaned': cleaned}
