import { CheckCircle2, User, Wrench } from "lucide-react";

import { mesclarClasses } from "@/utils/mesclarClasses";
import type { StatusArmario } from "@/types/armario";

const STATUS_CONFIG: Record<
  StatusArmario,
  { label: string; icon: typeof CheckCircle2; className: string; pulse?: boolean }
> = {
  LIVRE: {
    label: "Livre",
    icon: CheckCircle2,
    className: "bg-status-livre/10 text-status-livre",
    pulse: true,
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
  const { label, icon: Icon, className, pulse } = STATUS_CONFIG[status];

  return (
    <span
      className={mesclarClasses(
        "inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-xs font-medium",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={mesclarClasses("led-dot size-1.5", pulse && "led-dot-pulse")}
      />
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
