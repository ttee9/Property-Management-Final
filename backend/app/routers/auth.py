import logging
import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import (
    create_access_token,
    generate_otp,
    hash_otp,
    hash_password,
    normalize_phone,
    otp_expiry,
    verify_password,
)
from ..sms import send_otp_sms

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
OTP_RESEND_COOLDOWN_SECONDS = 30


@router.post("/tenant/request-otp")
def request_otp(payload: schemas.TenantOtpRequest, db: Session = Depends(get_db)):
    phone = normalize_phone(payload.phone)

    tenant = db.query(models.Tenant).filter(models.Tenant.phone == phone).first()
    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No tenant account found for this phone number. Contact your property manager.",
        )

    recent = (
        db.query(models.OtpCode)
        .filter(models.OtpCode.phone == phone)
        .order_by(models.OtpCode.created_at.desc())
        .first()
    )
    if recent and recent.created_at > datetime.utcnow() - timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Please wait before requesting another code.",
        )

    code = generate_otp()
    otp = models.OtpCode(
        phone=phone,
        code_hash=hash_otp(code),
        expires_at=otp_expiry(),
    )
    db.add(otp)
    db.commit()

    try:
        send_otp_sms(phone, code)
    except Exception:
        logger.exception("Failed to send OTP SMS to %s", phone)
        db.delete(otp)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Couldn't send the login code. Please try again in a moment.",
        )

    response = {"message": "A login code was sent to your phone."}
    if ENVIRONMENT != "production":
        # Convenience for local development/testing where no SMS provider is configured.
        response["debug_code"] = code
    return response


@router.post("/tenant/verify-otp", response_model=schemas.TokenResponse)
def verify_otp(payload: schemas.TenantOtpVerify, db: Session = Depends(get_db)):
    phone = normalize_phone(payload.phone)

    tenant = db.query(models.Tenant).filter(models.Tenant.phone == phone).first()
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tenant not found")

    otp = (
        db.query(models.OtpCode)
        .filter(models.OtpCode.phone == phone, models.OtpCode.consumed == 0)
        .order_by(models.OtpCode.created_at.desc())
        .first()
    )
    if otp is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Request a new code first")
    if otp.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Code expired, request a new one")
    if otp.attempts >= 5:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts, request a new code")

    if otp.code_hash != hash_otp(payload.code):
        otp.attempts += 1
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect code")

    otp.consumed = 1
    db.commit()

    token = create_access_token(subject=tenant.id, role="tenant")
    return schemas.TokenResponse(access_token=token, role="tenant")


@router.post("/manager/login", response_model=schemas.TokenResponse)
def manager_login(payload: schemas.ManagerLoginRequest, db: Session = Depends(get_db)):
    manager = db.query(models.Manager).filter(models.Manager.email == payload.email.lower()).first()
    if manager is None or not verify_password(payload.password, manager.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(subject=manager.id, role="manager")
    return schemas.TokenResponse(access_token=token, role="manager")


@router.post("/manager/signup", response_model=schemas.TokenResponse, status_code=status.HTTP_201_CREATED)
def manager_signup(payload: schemas.ManagerSignupRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    existing = db.query(models.Manager).filter(models.Manager.email == email).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists"
        )

    manager = models.Manager(name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    db.add(manager)
    db.commit()
    db.refresh(manager)

    token = create_access_token(subject=manager.id, role="manager")
    return schemas.TokenResponse(access_token=token, role="manager")
