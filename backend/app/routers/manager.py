from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..deps import get_current_manager

router = APIRouter(prefix="/manager", tags=["manager"])

VALID_REQUEST_STATUSES = {"open", "in_progress", "completed", "cancelled"}
VALID_PAYMENT_STATUSES = {"unpaid", "paid", "late"}


def _managed_tenant_ids(db: Session, manager: models.Manager) -> list[str]:
    return [
        t.id
        for t in db.query(models.Tenant)
        .join(models.Unit)
        .join(models.Property)
        .filter(models.Property.manager_id == manager.id)
        .all()
    ]


@router.get("/tenants", response_model=list[schemas.TenantSummaryOut])
def list_tenants(
    manager: models.Manager = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    tenants = (
        db.query(models.Tenant)
        .join(models.Unit)
        .join(models.Property)
        .filter(models.Property.manager_id == manager.id)
        .options(joinedload(models.Tenant.unit).joinedload(models.Unit.property))
        .all()
    )

    out = []
    for tenant in tenants:
        latest_payment = (
            db.query(models.Payment)
            .filter(models.Payment.tenant_id == tenant.id)
            .order_by(models.Payment.due_date.desc())
            .first()
        )
        current_status = latest_payment.status if latest_payment else "unpaid"
        open_requests = (
            db.query(models.MaintenanceRequest)
            .filter(
                models.MaintenanceRequest.tenant_id == tenant.id,
                models.MaintenanceRequest.status.in_(["open", "in_progress"]),
            )
            .count()
        )
        out.append(
            schemas.TenantSummaryOut(
                id=tenant.id,
                name=tenant.name,
                phone=tenant.phone,
                unit_number=tenant.unit.unit_number,
                property_name=tenant.unit.property.name,
                current_status=current_status,
                open_requests=open_requests,
            )
        )
    return out


@router.get("/maintenance-requests", response_model=list[schemas.MaintenanceRequestOut])
def list_all_requests(
    manager: models.Manager = Depends(get_current_manager),
    db: Session = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
):
    tenant_ids = _managed_tenant_ids(db, manager)
    query = (
        db.query(models.MaintenanceRequest)
        .options(joinedload(models.MaintenanceRequest.tenant).joinedload(models.Tenant.unit))
        .filter(models.MaintenanceRequest.tenant_id.in_(tenant_ids))
    )
    if status_filter:
        query = query.filter(models.MaintenanceRequest.status == status_filter)

    requests = query.order_by(models.MaintenanceRequest.created_at.desc()).all()
    return [
        schemas.MaintenanceRequestOut(
            id=r.id,
            title=r.title,
            description=r.description,
            category=r.category,
            priority=r.priority,
            status=r.status,
            created_at=r.created_at,
            updated_at=r.updated_at,
            tenant_id=r.tenant_id,
            tenant_name=r.tenant.name,
            unit_number=r.tenant.unit.unit_number,
        )
        for r in requests
    ]


@router.patch("/maintenance-requests/{request_id}", response_model=schemas.MaintenanceRequestOut)
def update_request_status(
    request_id: str,
    payload: schemas.MaintenanceRequestUpdate,
    manager: models.Manager = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    if payload.status not in VALID_REQUEST_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    tenant_ids = _managed_tenant_ids(db, manager)
    request = (
        db.query(models.MaintenanceRequest)
        .filter(models.MaintenanceRequest.id == request_id, models.MaintenanceRequest.tenant_id.in_(tenant_ids))
        .first()
    )
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found")

    request.status = payload.status
    db.commit()
    db.refresh(request)
    return schemas.MaintenanceRequestOut(
        id=request.id,
        title=request.title,
        description=request.description,
        category=request.category,
        priority=request.priority,
        status=request.status,
        created_at=request.created_at,
        updated_at=request.updated_at,
        tenant_id=request.tenant_id,
        tenant_name=request.tenant.name,
        unit_number=request.tenant.unit.unit_number,
    )


@router.get("/payments", response_model=list[schemas.PaymentOut])
def list_all_payments(
    manager: models.Manager = Depends(get_current_manager),
    db: Session = Depends(get_db),
    status_filter: str | None = Query(default=None, alias="status"),
):
    tenant_ids = _managed_tenant_ids(db, manager)
    query = (
        db.query(models.Payment)
        .options(joinedload(models.Payment.tenant).joinedload(models.Tenant.unit))
        .filter(models.Payment.tenant_id.in_(tenant_ids))
    )
    if status_filter:
        query = query.filter(models.Payment.status == status_filter)

    payments = query.order_by(models.Payment.due_date.desc()).all()
    return [
        schemas.PaymentOut(
            id=p.id,
            amount_cents=p.amount_cents,
            due_date=p.due_date,
            paid_date=p.paid_date,
            status=p.status,
            tenant_id=p.tenant_id,
            tenant_name=p.tenant.name,
            unit_number=p.tenant.unit.unit_number,
        )
        for p in payments
    ]


@router.patch("/payments/{payment_id}", response_model=schemas.PaymentOut)
def update_payment_status(
    payment_id: str,
    payload: schemas.PaymentUpdate,
    manager: models.Manager = Depends(get_current_manager),
    db: Session = Depends(get_db),
):
    if payload.status not in VALID_PAYMENT_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    tenant_ids = _managed_tenant_ids(db, manager)
    payment = (
        db.query(models.Payment)
        .filter(models.Payment.id == payment_id, models.Payment.tenant_id.in_(tenant_ids))
        .first()
    )
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    payment.status = payload.status
    payment.paid_date = datetime.utcnow() if payload.status == "paid" else None
    db.commit()
    db.refresh(payment)
    return schemas.PaymentOut(
        id=payment.id,
        amount_cents=payment.amount_cents,
        due_date=payment.due_date,
        paid_date=payment.paid_date,
        status=payment.status,
        tenant_id=payment.tenant_id,
        tenant_name=payment.tenant.name,
        unit_number=payment.tenant.unit.unit_number,
    )
