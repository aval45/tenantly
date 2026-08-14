import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/shared/api/supabase";
import { formatCompactMoney } from "@/shared/utils/money";
import type { OwnerDashboard } from "./types";

type Aggregate = {
  propertyCount: number;
  occupiedBeds: number;
  capacity: number;
  expectedPaise: number;
  collectedPaise: number;
  outstandingPaise: number;
  pendingApprovals: number;
  openComplaints: number;
};
export const dashboardKeys = {
  owner: (organizationId: string) =>
    ["organizations", organizationId, "dashboard"] as const,
};

async function getOwnerDashboard(
  organizationId: string,
  ownerName: string,
): Promise<OwnerDashboard | null> {
  const client = getSupabaseClient();
  const [{ data: aggregate, error }, organization, payments, complaints] =
    await Promise.all([
      client.rpc("owner_dashboard", {
        requested_organization_id: organizationId,
      }),
      client
        .from("organizations")
        .select("name")
        .eq("id", organizationId)
        .single(),
      client
        .from("payments")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(5),
      client
        .from("complaints")
        .select("*")
        .eq("organization_id", organizationId)
        .in("status", ["open", "assigned", "in_progress", "reopened"])
        .order("created_at", { ascending: false })
        .limit(3),
    ]);
  if (error) throw error;
  if (organization.error) throw organization.error;
  if (payments.error) throw payments.error;
  if (complaints.error) throw complaints.error;
  const values = aggregate as unknown as Aggregate;
  if (!values || values.propertyCount === 0) return null;
  const percent =
    values.expectedPaise > 0
      ? Math.min(
          100,
          Math.round((values.collectedPaise / values.expectedPaise) * 100),
        )
      : 0;
  return {
    organizationName: organization.data.name,
    ownerFirstName: ownerName.split(" ")[0] ?? ownerName,
    propertyCount: values.propertyCount,
    collectedPaise: values.collectedPaise,
    expectedPaise: values.expectedPaise,
    outstandingPaise: values.outstandingPaise,
    collectionPercent: percent,
    metrics: [
      {
        id: "occupancy",
        label: "Occupancy",
        value: values.capacity
          ? `${Math.round((values.occupiedBeds / values.capacity) * 100)}%`
          : "0%",
        detail: `${values.occupiedBeds} of ${values.capacity} beds`,
        tone: "success",
      },
      {
        id: "outstanding",
        label: "Outstanding",
        value: formatCompactMoney(values.outstandingPaise),
        detail: "Across open invoices",
        tone: "warning",
      },
      {
        id: "approvals",
        label: "Pending approvals",
        value: String(values.pendingApprovals),
        detail: "Payment proofs",
        tone: "warning",
      },
      {
        id: "complaints",
        label: "Open complaints",
        value: String(values.openComplaints),
        detail: "Require attention",
        tone: "danger",
      },
    ],
    attention: [
      ...(values.pendingApprovals
        ? [
            {
              id: "approval-queue",
              kind: "payment" as const,
              title: "Payment proofs to review",
              detail: "Submitted by residents",
              countLabel: String(values.pendingApprovals),
            },
          ]
        : []),
      ...complaints.data.map((item) => ({
        id: item.id,
        kind: "complaint" as const,
        title: item.title,
        detail: `${item.category} · ${item.priority} priority`,
        countLabel: item.priority,
      })),
    ],
    activity: payments.data.map((item) => ({
      id: item.id,
      personName: "Resident payment",
      description: item.method.replace("_", " "),
      amountPaise: item.amount_paise,
      status:
        item.status === "submitted" ? ("review" as const) : ("paid" as const),
      occurredAtLabel: new Date(item.created_at).toLocaleDateString("en-IN"),
    })),
  };
}

export function useOwnerDashboard(
  organizationId: string,
  _legacyScenario?: unknown,
  ownerName = "Owner",
) {
  return useQuery({
    queryKey: dashboardKeys.owner(organizationId),
    queryFn: () => getOwnerDashboard(organizationId, ownerName),
    enabled: organizationId !== "unknown",
    staleTime: 30_000,
  });
}
