from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_tenant

router = APIRouter(prefix="/tenant", tags=["tenant"])


@router.get("/me", response_model=schemas.TenantProfile)
def get_me(tenant: models.Tenant = Depends(get_current_tenant)):
    return schemas.TenantProfile(
        id=tenant.id,
        name=tenant.name,
        phone=tenant.phone,
        unit_number=tenant.unit.unit_number,
        property_name=tenant.unit.property.name,
    )


@router.get("/maintenance-requests", response_model=list[schemas.MaintenanceRequestOut])
def list_my_requests(
    tenant: models.Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    requests = (
        db.query(models.MaintenanceRequest)
        .filter(models.MaintenanceRequest.tenant_id == tenant.id)
        .order_by(models.MaintenanceRequest.created_at.desc())
        .all()
    )
    return [_to_request_out(r) for r in requests]


@router.post(
    "/maintenance-requests",
    response_model=schemas.MaintenanceRequestOut,
    status_code=status.HTTP_201_CREATED,
)
def create_request(
    payload: schemas.MaintenanceRequestCreate,
    tenant: models.Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    valid_categories = {"plumbing", "electrical", "appliance", "hvac", "pest", "structural", "other"}
    valid_priorities = {"low", "normal", "high", "urgent"}
    category = payload.category if payload.category in valid_categories else "other"
    priority = payload.priority if payload.priority in valid_priorities else "normal"

    request = models.MaintenanceRequest(
        tenant_id=tenant.id,
        title=payload.title,
        description=payload.description,
        category=category,
        priority=priority,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return _to_request_out(request)


@router.get("/payments", response_model=list[schemas.PaymentOut])
def list_my_payments(
    tenant: models.Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    payments = (
        db.query(models.Payment)
        .filter(models.Payment.tenant_id == tenant.id)
        .order_by(models.Payment.due_date.desc())
        .all()
    )
    return [
        schemas.PaymentOut(
            id=p.id,
            amount_cents=p.amount_cents,
            due_date=p.due_date,
            paid_date=p.paid_date,
            status=p.status,
            tenant_id=p.tenant_id,
        )
        for p in payments
    ]


def _to_request_out(r: models.MaintenanceRequest) -> schemas.MaintenanceRequestOut:
    return schemas.MaintenanceRequestOut(
        id=r.id,
        title=r.title,
        description=r.description,
        category=r.category,
        priority=r.priority,
        status=r.status,
        created_at=r.created_at,
        updated_at=r.updated_at,
        tenant_id=r.tenant_id,
    )
