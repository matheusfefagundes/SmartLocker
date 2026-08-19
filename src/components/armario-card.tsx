import { Loader2 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <div>
          <p className="text-sm font-semibold">Armário {armario.numero}</p>
          <p className="text-xs text-muted-foreground">{armario.bloco}</p>
        </div>
        <span className="rounded-md border px-2 py-1 text-xs font-medium text-muted-foreground">
          Tam. {armario.tamanho}
        </span>
      </CardHeader>
      <CardContent>
        <StatusBadge status={armario.status} />
      </CardContent>
      <CardFooter>
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
