import { Loader2 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Armario } from "@/types/armario";

interface ArmarioCardProps {
  armario: Armario;
  podeFazerCheckIn: boolean;
  isCheckingIn: boolean;
  onCheckIn: (armarioId: string) => void;
}

export function ArmarioCard({
  armario,
  podeFazerCheckIn,
  isCheckingIn,
  onCheckIn,
}: ArmarioCardProps) {
  const disponivel = armario.status === "LIVRE";
  const statusColorClass =
    armario.status === "LIVRE"
      ? "text-status-livre"
      : armario.status === "OCUPADO"
        ? "text-status-ocupado"
        : "text-status-manutencao";

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all",
        disponivel && "hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "led-dot absolute right-3 top-3 size-2",
          statusColorClass,
          disponivel && "led-dot-pulse"
        )}
      />
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 p-4 pb-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Armário</p>
          <p className="font-mono text-3xl font-bold tracking-tight tabular-nums">
            {armario.numero}
          </p>
        </div>
        <span className="rounded-full border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {armario.tamanho}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        <p className="text-xs text-muted-foreground">{armario.bloco}</p>
        <StatusBadge status={armario.status} />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          size="touch"
          disabled={!disponivel || !podeFazerCheckIn || isCheckingIn}
          onClick={() => onCheckIn(armario.id)}
        >
          {isCheckingIn ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : disponivel ? (
            "Pegar armário"
          ) : (
            "Indisponível"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
