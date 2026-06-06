# hostels/geocoding.py
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import time

# Initialize geocoder with app name
geolocator = Nominatim(user_agent="hostel_aggregator_app")

def geocode_address(address: str) -> dict:
    """
    Convert a plain text address into latitude/longitude coordinates.
    Uses OpenStreetMap Nominatim — free, no API key needed.

    Returns:
        { 'lat': float, 'lng': float, 'formatted_address': str }
        or
        { 'error': str }
    """
    try:
        # Add India to improve accuracy for local addresses
        full_address = f"{address}, India"

        location = geolocator.geocode(
            full_address,
            timeout=10,
            language='en'
        )

        if location is None:
            return {
                'error': f"Could not find coordinates for: '{address}'"
            }

        return {
            'lat':               round(location.latitude,  6),
            'lng':               round(location.longitude, 6),
            'formatted_address': location.address
        }

    except GeocoderTimedOut:
        return {'error': 'Geocoding service timed out. Please try again.'}
    except GeocoderServiceError as e:
        return {'error': f'Geocoding service error: {str(e)}'}
    except Exception as e:
        return {'error': f'Unexpected error: {str(e)}'}


def batch_geocode(addresses: list) -> list:
    """
    Geocode multiple addresses with a delay to respect rate limits.
    Nominatim allows 1 request per second.
    """
    results = []
    for address in addresses:
        result = geocode_address(address)
        results.append({
            'address': address,
            'result':  result
        })
        time.sleep(1)  # Respect Nominatim rate limit
    return results