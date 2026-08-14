export type DashboardMetric = {
  id: "occupancy" | "outstanding" | "approvals" | "complaints";
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

export type AttentionItem = {
  id: string;
  kind: "payment" | "complaint";
  title: string;
  detail: string;
  countLabel: string;
};

export type ActivityItem = {
  id: string;
  personName: string;
  description: string;
  amountPaise?: number;
  status: "paid" | "review" | "rejected" | "refunded";
  occurredAtLabel: string;
};

export type OwnerDashboard = {
  organizationName: string;
  ownerFirstName: string;
  propertyCount: number;
  collectedPaise: number;
  expectedPaise: number;
  outstandingPaise: number;
  collectionPercent: number;
  metrics: DashboardMetric[];
  attention: AttentionItem[];
  activity: ActivityItem[];
};
