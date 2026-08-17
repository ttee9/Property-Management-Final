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

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
