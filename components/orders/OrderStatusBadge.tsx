import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, {
  variant: "success" | "blue" | "warning" | "destructive" | "secondary" | "outline";
  label: string;
}> = {
  waiting_for_acceptance: { variant: "warning", label: "Waiting" },
  accepted: { variant: "blue", label: "Accepted" },
  preparing: { variant: "blue", label: "Printing" },
  ready: { variant: "success", label: "Ready! 🎉" },
  picked_up: { variant: "secondary", label: "Picked Up" },
  rejected: { variant: "destructive", label: "Rejected" },
  cancelled: { variant: "outline", label: "Cancelled" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { variant: "outline" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
