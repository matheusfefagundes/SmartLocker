import { CheckCircle2, User, Wrench } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatusArmario } from "@/types/armario";

const STATUS_CONFIG: Record<
  StatusArmario,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  LIVRE: {
    label: "Livre",
    icon: CheckCircle2,
    className: "bg-status-livre/10 text-status-livre",
  },
  OCUPADO: {
    label: "Ocupado",
    icon: User,
    className: "bg-status-ocupado/10 text-status-ocupado",
  },
  MANUTENCAO: {
    label: "Manutenção",
    icon: Wrench,
    className: "bg-status-manutencao/10 text-status-manutencao",
  },
};

export function StatusBadge({ status }: { status: StatusArmario }) {
  const { label, icon: Icon, className } = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
