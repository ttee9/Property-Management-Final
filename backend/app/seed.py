"""Seed the database with a demo manager, property, units, tenants,
maintenance requests, and rent payments so the app can be explored end to end.

Run with:  python -m app.seed
"""
from datetime import datetime, timedelta

from .database import init_db, session_scope
from .models import MaintenanceRequest, Manager, Payment, Property, Tenant, Unit
from .security import hash_password

DEMO_MANAGER_EMAIL = "manager@demo.com"
DEMO_MANAGER_PASSWORD = "manager123"
DEMO_TENANT_PHONE = "+15555550100"


def seed() -> None:
    init_db()

    with session_scope() as db:
        if db.query(Manager).filter(Manager.email == DEMO_MANAGER_EMAIL).first():
            print("Demo data already present, skipping seed.")
            return

        manager = Manager(
            name="Alex Rivera",
            email=DEMO_MANAGER_EMAIL,
            password_hash=hash_password(DEMO_MANAGER_PASSWORD),
        )
        db.add(manager)
        db.flush()

        prop = Property(name="Maple Grove Apartments", address="123 Maple St, Springfield", manager_id=manager.id)
        db.add(prop)
        db.flush()

        units_data = ["101", "102", "103", "201"]
        units = []
        for number in units_data:
            unit = Unit(property_id=prop.id, unit_number=number)
            db.add(unit)
            units.append(unit)
        db.flush()

        tenants_data = [
            ("Jordan Lee", "+14155550101", units[0], "paid"),
            ("Sam Patel", "+14155550102", units[1], "unpaid"),
            ("Casey Kim", "+14155550103", units[2], "late"),
            ("Morgan Diaz", "+14155550104", units[3], "paid"),
        ]

        now = datetime.utcnow()
        for name, phone, unit, payment_status in tenants_data:
            tenant = Tenant(name=name, phone=phone, unit_id=unit.id)
            db.add(tenant)
            db.flush()

            due_date = now.replace(day=1)
            paid_date = due_date + timedelta(days=2) if payment_status == "paid" else None
            payment = Payment(
                tenant_id=tenant.id,
                amount_cents=185000,
                due_date=due_date,
                paid_date=paid_date,
                status=payment_status,
            )
            db.add(payment)

        jordan = db.query(Tenant).filter(Tenant.phone == "+14155550101").first()
        db.add(
            MaintenanceRequest(
                tenant_id=jordan.id,
                title="Leaking kitchen faucet",
                description="The faucet drips constantly and the cabinet underneath is getting wet.",
                category="plumbing",
                priority="high",
                status="open",
            )
        )

        # Public demo tenant so site visitors can try the tenant dashboard (see
        # DEMO_TENANT_PHONE special-case in routers/auth.py for the fixed login code).
        demo_unit = Unit(property_id=prop.id, unit_number="DEMO")
        db.add(demo_unit)
        db.flush()

        demo_tenant = Tenant(name="Demo Tenant", phone=DEMO_TENANT_PHONE, unit_id=demo_unit.id)
        db.add(demo_tenant)
        db.flush()

        this_month_due = now.replace(day=1)
        last_month_due = this_month_due - timedelta(days=1)
        last_month_due = last_month_due.replace(day=1)
        db.add(
            Payment(
                tenant_id=demo_tenant.id,
                amount_cents=185000,
                due_date=last_month_due,
                paid_date=last_month_due + timedelta(days=2),
                status="paid",
            )
        )
        db.add(
            Payment(
                tenant_id=demo_tenant.id,
                amount_cents=185000,
                due_date=this_month_due,
                paid_date=None,
                status="unpaid",
            )
        )
        db.add(
            MaintenanceRequest(
                tenant_id=demo_tenant.id,
                title="Squeaky bedroom door",
                description="The bedroom door hinge squeaks loudly when opened.",
                category="other",
                priority="low",
                status="open",
            )
        )

        print("Seed complete.")
        print(f"Manager login -> email: {DEMO_MANAGER_EMAIL}  password: {DEMO_MANAGER_PASSWORD}")
        print("Tenant login phones (any tenant, OTP is printed to this console in dev mode):")
        for name, phone, _, _ in tenants_data:
            print(f"  {name}: {phone}")


if __name__ == "__main__":
    seed()
