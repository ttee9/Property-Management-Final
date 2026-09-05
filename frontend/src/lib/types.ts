export interface TenantProfile {
  id: string;
  name: string;
  phone: string;
  unit_number: string;
  property_name: string;
}

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  tenant_name?: string | null;
  unit_number?: string | null;
}

export interface Payment {
  id: string;
  amount_cents: number;
  due_date: string;
  paid_date?: string | null;
  status: string;
  tenant_id: string;
  tenant_name?: string | null;
  unit_number?: string | null;
}

export interface TenantSummary {
  id: string;
  name: string;
  phone: string;
  unit_number: string;
  property_name: string;
  current_status: string;
  open_requests: number;
}

export interface Unit {
  id: string;
  unit_number: string;
  property_name: string;
}

export interface UnitBrief {
  id: string;
  unit_number: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  units: UnitBrief[];
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function getLatestPaymentByTenant(payments: Payment[]): Map<string, Payment> {
  const latest = new Map<string, Payment>();

  for (const payment of [...payments].sort(
    (a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  )) {
    if (!latest.has(payment.tenant_id)) {
      latest.set(payment.tenant_id, payment);
    }
  }

  return latest;
}

export function getPaymentsByTenant(payments: Payment[]): Map<string, Payment[]> {
  const byTenant = new Map<string, Payment[]>();

  for (const payment of payments) {
    const list = byTenant.get(payment.tenant_id);
    if (list) {
      list.push(payment);
    } else {
      byTenant.set(payment.tenant_id, [payment]);
    }
  }

  for (const list of byTenant.values()) {
    list.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
  }

  return byTenant;
}

export function formatMonth(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
