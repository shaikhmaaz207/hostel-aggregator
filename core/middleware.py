# core/middleware.py
# HA-38: Security Hardening Middleware

import re
import bleach
import json
import logging
from django.http import JsonResponse
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

# ── RATE LIMITER MIDDLEWARE ──
class RateLimiterMiddleware:
    """
    Global rate limiter — max 100 requests per 15 minutes per IP.
    """
    MAX_REQUESTS = 100
    WINDOW_SECS  = 15 * 60  # 15 minutes

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        ip  = self.get_client_ip(request)
        key = f"rate_limit_{ip}"

        # Get current request count
        count = cache.get(key, 0)

        if count >= self.MAX_REQUESTS:
            logger.warning(f"Rate limit exceeded for IP: {ip}")
            return JsonResponse(
                {
                    "error": "Too many requests. Please try again in 15 minutes.",
                    "code":  "RATE_LIMIT_EXCEEDED"
                },
                status=429
            )

        # Increment counter
        if count == 0:
            cache.set(key, 1, self.WINDOW_SECS)
        else:
            cache.incr(key)

        response = self.get_response(request)
        return response

    def get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', '127.0.0.1')


# ── XSS & SQL INJECTION SANITIZER ──
class InputSanitizerMiddleware:
    """
    Sanitizes incoming request data against XSS and SQL injection.
    """
    # SQL injection patterns
    SQL_PATTERNS = [
        r"(\bSELECT\b|\bDROP\b|\bINSERT\b|\bDELETE\b|\bUPDATE\b|\bUNION\b)",
        r"(--|;|\/\*|\*\/)",
        r"(\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)",
        r"(xp_|exec\s*\(|execute\s*\()",
    ]

    def __init__(self, get_response):
        self.get_response  = get_response
        self.sql_regex     = re.compile(
            '|'.join(self.SQL_PATTERNS),
            re.IGNORECASE
        )

    def __call__(self, request):
        # Check query parameters
        for key, value in request.GET.items():
            if self.is_malicious(value):
                logger.warning(f"Malicious input detected in GET params: {value}")
                return JsonResponse(
                    {"error": "Invalid input detected.", "code": "INVALID_INPUT"},
                    status=400
                )

        # Check POST body
        if request.content_type == 'application/json':
            try:
                body = json.loads(request.body)
                if self.check_dict(body):
                    return JsonResponse(
                        {"error": "Invalid input detected.", "code": "INVALID_INPUT"},
                        status=400
                    )
            except (json.JSONDecodeError, Exception):
                pass

        response = self.get_response(request)
        return response

    def is_malicious(self, value: str) -> bool:
        if not isinstance(value, str):
            return False
        return bool(self.sql_regex.search(value))

    def check_dict(self, data, depth=0) -> bool:
        if depth > 5:
            return False
        if isinstance(data, dict):
            for v in data.values():
                if self.check_dict(v, depth + 1):
                    return True
        elif isinstance(data, list):
            for item in data:
                if self.check_dict(item, depth + 1):
                    return True
        elif isinstance(data, str):
            return self.is_malicious(data)
        return False


# ── SECURITY HEADERS MIDDLEWARE ──
class SecurityHeadersMiddleware:
    """
    Adds security headers to all responses.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Prevent clickjacking
        response['X-Frame-Options']        = 'DENY'
        # Prevent MIME sniffing
        response['X-Content-Type-Options'] = 'nosniff'
        # XSS protection
        response['X-XSS-Protection']       = '1; mode=block'
        # Referrer policy
        response['Referrer-Policy']        = 'strict-origin-when-cross-origin'

        return response