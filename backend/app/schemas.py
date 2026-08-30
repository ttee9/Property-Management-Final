from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# ---------- Auth ----------

class TenantOtpRequest(BaseModel):
    phone: str = Field(..., min_length=7, max_length=20)


class TenantOtpVerify(BaseModel):
    phone: str = Field(..., min_length=7, max_length=20)
    code: str = Field(..., min_length=6, max_length=6)


class ManagerLoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


# ---------- Tenant ----------

class TenantProfile(BaseModel):
    id: str
    name: str
    phone: str
    unit_number: str
    property_name: str

    class Config:
        from_attributes = True


class MaintenanceRequestCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    description: str = Field(..., min_length=3, max_length=2000)
    category: str = Field(default="other")
    priority: str = Field(default="normal")


class MaintenanceRequestUpdate(BaseModel):
    status: str


class MaintenanceRequestOut(BaseModel):
    id: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime
    tenant_id: str
    tenant_name: Optional[str] = None
    unit_number: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentOut(BaseModel):
    id: str
    amount_cents: int
    due_date: datetime
    paid_date: Optional[datetime] = None
    status: str
    tenant_id: str
    tenant_name: Optional[str] = None
    unit_number: Optional[str] = None

    class Config:
        from_attributes = True


class PaymentUpdate(BaseModel):
    status: str


class TenantSummaryOut(BaseModel):
    id: str
    name: str
    phone: str
    unit_number: str
    property_name: str
    current_status: str  # paid | unpaid | late
    open_requests: int

    class Config:
        from_attributes = True


class TenantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    phone: str = Field(..., min_length=7, max_length=20)
    unit_id: str


class UnitOut(BaseModel):
    id: str
    unit_number: str
    property_name: str

    class Config:
        from_attributes = True
