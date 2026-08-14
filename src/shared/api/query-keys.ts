export const queryKeys = {
  all: ["tenantly"] as const,
  organizations: (userId: string) =>
    ["tenantly", "organizations", userId] as const,
  properties: (userId: string, organizationId: string) =>
    ["tenantly", "properties", userId, organizationId] as const,
  property: (userId: string, organizationId: string, propertyId: string) =>
    ["tenantly", "property", userId, organizationId, propertyId] as const,
  rooms: (userId: string, organizationId: string, propertyId: string) =>
    ["tenantly", "rooms", userId, organizationId, propertyId] as const,
  beds: (userId: string, organizationId: string, roomId: string) =>
    ["tenantly", "beds", userId, organizationId, roomId] as const,
  residents: (userId: string, organizationId: string) =>
    ["tenantly", "residents", userId, organizationId] as const,
  payments: (userId: string, organizationId: string) =>
    ["tenantly", "payments", userId, organizationId] as const,
  payment: (userId: string, organizationId: string, paymentId: string) =>
    ["tenantly", "payment", userId, organizationId, paymentId] as const,
  invoices: (userId: string, organizationId: string) =>
    ["tenantly", "invoices", userId, organizationId] as const,
  invoice: (userId: string, organizationId: string, invoiceId: string) =>
    ["tenantly", "invoice", userId, organizationId, invoiceId] as const,
  complaints: (userId: string, organizationId: string) =>
    ["tenantly", "complaints", userId, organizationId] as const,
  notices: (userId: string, organizationId: string) =>
    ["tenantly", "notices", userId, organizationId] as const,
  documents: (userId: string, organizationId: string) =>
    ["tenantly", "documents", userId, organizationId] as const,
  notifications: (userId: string) =>
    ["tenantly", "notifications", userId] as const,
  tenantDashboard: (userId: string, organizationId: string) =>
    ["tenantly", "tenant-dashboard", userId, organizationId] as const,
  ownerDashboard: (userId: string, organizationId: string) =>
    ["tenantly", "owner-dashboard", userId, organizationId] as const,
  tenantMore: (userId: string, organizationId: string) =>
    ["tenantly", "tenant-more", userId, organizationId] as const,
};
