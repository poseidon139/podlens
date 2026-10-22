import re
import html
import logging
from urllib.parse import urlparse
import ipaddress

logger = logging.getLogger("podlens.sanitizer")

# Known prompt injection signatures and adversarial instruction overrides
PROMPT_INJECTION_PATTERNS = [
    r"(?i)\bignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|directives|rules)\b",
    r"(?i)\bdisregard\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions|prompts|directives|rules)\b",
    r"(?i)\byou\s+are\s+now\s+(?:an?\s+)?(?:unfiltered|jailbroken|dan|developer\s+mode)\b",
    r"(?i)\bsystem\s*:\s*(?:override|reset|switch|disable)\b",
    r"(?i)\b(?:do\s+not\s+follow|bypass)\s+(?:safety|content|system)\s+(?:guidelines|rules|filters)\b",
    r"(?i)\bprint\s+(?:the\s+)?(?:system\s+prompt|initial\s+instructions|hidden\s+prompt)\b",
    r"(?i)\boutput\s+the\s+entire\s+system\s+prompt\b",
]

# Prohibited private IP networks to prevent SSRF
PRIVATE_IP_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local & Cloud Metadata endpoint
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

def detect_prompt_injection(text: str) -> bool:
    """Checks if input text contains known prompt injection or delimiter bypass attempts."""
    if not text:
        return False
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, text):
            return True
    return False

def sanitize_text(text: str, max_length: int = 1500) -> str:
    """
    Sanitizes user and podcast text inputs:
    - Normalizes unicode and removes invisible zero-width characters.
    - Strips malicious HTML/script tags.
    - Neutralizes delimiter escaping (quotes/backticks/brackets).
    - Defangs identified prompt injection phrasing.
    - Truncates to maximum safe input length.
    """
    if not text:
        return ""

    # 1. Remove zero-width and invisible control characters
    text = re.sub(r"[\u200B-\u200D\uFEFF\u0000-\u0008\u000B\u000C\u000E-\u001F]", "", text)

    # 2. Defang prompt injection attempts if detected
    for pattern in PROMPT_INJECTION_PATTERNS:
        text = re.sub(pattern, "[BLOCKED_INSTRUCTION_OVERRIDE]", text)

    # 3. Strip HTML tags to avoid XSS
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)

    # 4. Neutralize multi-backtick / multi-quote prompt escapes
    text = re.sub(r"`{3,}", "```", text)
    text = re.sub(r'"{3,}', '""', text)

    # 5. Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    # 6. Enforce safe length limit
    if len(text) > max_length:
        text = text[:max_length].rstrip() + "..."

    return text

def validate_media_url(url: str) -> bool:
    """
    Validates media/video URLs and guards against SSRF, cloud metadata exfiltration,
    and protocol smuggling.
    """
    if not url:
        return False

    url = url.strip()
    try:
        parsed = urlparse(url)
    except Exception:
        return False

    # Must be http or https
    if parsed.scheme.lower() not in ("http", "https"):
        logger.warning(f"Rejected media URL with invalid scheme: {parsed.scheme}")
        return False

    hostname = (parsed.hostname or "").lower()
    if not hostname:
        return False

    # Block localhost and metadata keywords directly
    if hostname in ("localhost", "metadata.google.internal", "metadata"):
        logger.warning(f"Rejected SSRF target hostname: {hostname}")
        return False

    # Check for direct IP address targets
    try:
        ip = ipaddress.ip_address(hostname)
        for net in PRIVATE_IP_NETWORKS:
            if ip in net:
                logger.warning(f"Rejected private network IP media target: {ip}")
                return False
    except ValueError:
        # Hostname is a domain name, not a raw IP
        pass

    return True
