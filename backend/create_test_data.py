#!/usr/bin/env python
"""
Script to create additional test managers and tenants.
Usage: python create_test_data.py
"""

from datetime import datetime, timedelta
from app.models import Manager, Property, Unit, Tenant, Payment
from app.database import SessionLocal
from app.security import hash_password


def create_test_data():
    db = SessionLocal()
    
    try:
        # Create a new test manager
        test_manager = Manager(
            name="Sarah Johnson",
            email="sarah@testproperty.com",
            password_hash=hash_password("testpass123"),
            created_at=datetime.utcnow(),
        )
        db.add(test_manager)
        db.flush()
        print(f"✓ Created test manager: sarah@testproperty.com / testpass123")
        
        # Create a property for the test manager
        test_property = Property(
            name="Downtown Apartments",
            address="123 Main Street, Springfield, IL 62701",
            manager_id=test_manager.id,
        )
        db.add(test_property)
        db.flush()
        print(f"✓ Created test property: {test_property.name}")
        
        # Create units in the property
        unit_201 = Unit(
            property_id=test_property.id,
            unit_number="201",
        )
        unit_202 = Unit(
            property_id=test_property.id,
            unit_number="202",
        )
        db.add(unit_201)
        db.add(unit_202)
        db.flush()
        print(f"✓ Created test units: 201, 202")
        
        # Create test tenants
        tenant_1 = Tenant(
            name="Alex Rodriguez",
            phone="+14155550201",
            unit_id=unit_201.id,
            created_at=datetime.utcnow(),
        )
        tenant_2 = Tenant(
            name="Emma Wilson",
            phone="+14155550202",
            unit_id=unit_202.id,
            created_at=datetime.utcnow(),
        )
        db.add(tenant_1)
        db.add(tenant_2)
        db.flush()
        print(f"✓ Created test tenants:")
        print(f"  - Alex Rodriguez: +14155550201")
        print(f"  - Emma Wilson: +14155550202")
        
        # Create sample payments for both tenants
        today = datetime.utcnow()
        
        # Tenant 1 payments
        payment_1_current = Payment(
            tenant_id=tenant_1.id,
            amount_cents=150000,  # $1500
            due_date=today + timedelta(days=5),
            status="unpaid",
        )
        payment_1_past = Payment(
            tenant_id=tenant_1.id,
            amount_cents=150000,
            due_date=today - timedelta(days=10),
            paid_date=today - timedelta(days=5),
            status="paid",
        )
        db.add(payment_1_current)
        db.add(payment_1_past)
        
        # Tenant 2 payments
        payment_2_late = Payment(
            tenant_id=tenant_2.id,
            amount_cents=150000,
            due_date=today - timedelta(days=5),
            status="late",
        )
        payment_2_current = Payment(
            tenant_id=tenant_2.id,
            amount_cents=150000,
            due_date=today + timedelta(days=20),
            status="unpaid",
        )
        db.add(payment_2_late)
        db.add(payment_2_current)
        db.flush()
        print(f"✓ Created sample payments for both tenants")
        
        # Commit all changes
        db.commit()
        print("\n✅ Test data created successfully!")
        print("\nYou can now login with:")
        print("  Manager Email: sarah@testproperty.com")
        print("  Manager Password: testpass123")
        print("\nTenant Phones (use for OTP login):")
        print("  - +14155550201 (Alex Rodriguez)")
        print("  - +14155550202 (Emma Wilson)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating test data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_test_data()
