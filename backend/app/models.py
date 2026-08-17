import uuid
from datetime import datetime

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def gen_id() -> str:
    return uuid.uuid4().hex


class Manager(Base):
    __tablename__ = "managers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    properties: Mapped[list["Property"]] = relationship(back_populates="manager")


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str] = mapped_column(String, nullable=False)
    manager_id: Mapped[str] = mapped_column(String, ForeignKey("managers.id"), nullable=False)

    manager: Mapped["Manager"] = relationship(back_populates="properties")
    units: Mapped[list["Unit"]] = relationship(back_populates="property", cascade="all, delete-orphan")


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    property_id: Mapped[str] = mapped_column(String, ForeignKey("properties.id"), nullable=False)
    unit_number: Mapped[str] = mapped_column(String, nullable=False)

    property: Mapped["Property"] = relationship(back_populates="units")
    tenants: Mapped[list["Tenant"]] = relationship(back_populates="unit")


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    unit_id: Mapped[str] = mapped_column(String, ForeignKey("units.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    unit: Mapped["Unit"] = relationship(back_populates="tenants")
    maintenance_requests: Mapped[list["MaintenanceRequest"]] = relationship(
        back_populates="tenant", cascade="all, delete-orphan"
    )
    payments: Mapped[list["Payment"]] = relationship(back_populates="tenant", cascade="all, delete-orphan")


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    phone: Mapped[str] = mapped_column(String, nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    consumed: Mapped[bool] = mapped_column(Integer, default=0)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    tenant_id: Mapped[str] = mapped_column(String, ForeignKey("tenants.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False, default="other")
    priority: Mapped[str] = mapped_column(String, nullable=False, default="normal")
    status: Mapped[str] = mapped_column(String, nullable=False, default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant: Mapped["Tenant"] = relationship(back_populates="maintenance_requests")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    tenant_id: Mapped[str] = mapped_column(String, ForeignKey("tenants.id"), nullable=False)
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    paid_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="unpaid")  # unpaid | paid | late

    tenant: Mapped["Tenant"] = relationship(back_populates="payments")
