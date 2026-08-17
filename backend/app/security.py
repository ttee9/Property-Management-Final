import hashlib
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days

OTP_TTL_MINUTES = int(os.getenv("OTP_TTL_MINUTES", "5"))
OTP_MAX_ATTEMPTS = 5

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def normalize_phone(phone: str) -> str:
    """Keep a leading + and digits only, e.g. '(415) 555-0100' -> '+14155550100' if country
    code already present, otherwise just strips formatting: '415-555-0100' -> '4155550100'."""
    cleaned = re.sub(r"[^\d+]", "", phone or "")
    if cleaned.startswith("+"):
        return "+" + re.sub(r"\D", "", cleaned[1:])
    return cleaned


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def otp_expiry() -> datetime:
    return datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)


def create_access_token(subject: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
