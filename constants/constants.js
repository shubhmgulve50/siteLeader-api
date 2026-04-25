export const ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  BUILDER: 'BUILDER',
  SUPERVISOR: 'SUPERVISOR',
  ENGINEER: 'ENGINEER',
  WORKER: 'WORKER',
};

export const VERIFICATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DENIED: 'DENIED',
  SUSPENDED: 'SUSPENDED',
};

export const MODULES = {
  SITES: 'sites',
  LABOUR: 'labour',
  MATERIALS: 'materials',
  EQUIPMENT: 'equipment',
  FINANCE: 'finance',
  INVOICES: 'invoices',
  QUOTATIONS: 'quotations',
  RA_BILLS: 'ra_bills',
  VENDORS: 'vendors',
  MILESTONES: 'milestones',
  SAFETY: 'safety',
  DOCUMENTS: 'documents',
  LABOUR_ADVANCE: 'labour_advance',
  AUDIT_LOGS: 'audit_logs',
};

// These modules are accessible to all approved+verified builders without explicit permission grant
export const CORE_MODULES = ['sites', 'labour'];
