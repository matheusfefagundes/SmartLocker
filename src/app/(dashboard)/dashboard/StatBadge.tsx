import { mesclarClasses } from "@/utils/mesclarClasses";

const TONE_CLASSNAME = {
  livre: "text-status-livre",
  ocupado: "text-status-ocupado",
  manutencao: "text-status-manutencao",
} as const;

interface StatBadgeProps {
  value: number;
  tone: keyof typeof TONE_CLASSNAME;
}

export function StatBadge({ value, tone }: StatBadgeProps) {
  return (
    <span className={mesclarClasses("font-mono text-sm font-medium tabular-nums", TONE_CLASSNAME[tone])}>
      {value}
    </span>
  );
}
