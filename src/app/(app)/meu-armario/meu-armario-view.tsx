"use client";

import { Loader2, LockKeyholeOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCheckOut } from "@/hooks/use-checkout";
import { useMeuUso } from "@/hooks/use-meu-uso";
import { ApiClientError } from "@/lib/api-client";
import { formatDateTime } from "@/utils/date";

export function MeuArmarioView() {
  const { data: uso, isLoading } = useMeuUso();
  const checkOutMutation = useCheckOut();
  const [dialogAberto, setDialogAberto] = useState(false);

  function handleCheckOut() {
    checkOutMutation.mutate(undefined, {
      onSuccess: () => {
        setDialogAberto(false);
        toast.success("Check-out realizado. Até o próximo treino!");
      },
      onError: (error) => {
        const mensagem =
          error instanceof ApiClientError
            ? error.message
            : "Não foi possível fazer o check-out";
        toast.error(mensagem);
      },
    });
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!uso) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
        <LockKeyholeOpen
          className="size-10 text-muted-foreground"
          aria-hidden="true"
        />
        <div>
          <p className="font-medium">Você não está com nenhum armário</p>
          <p className="text-sm text-muted-foreground">
            Escolha um armário livre para começar.
          </p>
        </div>
        <Button asChild size="touch">
          <Link href="/armarios">Ver armários disponíveis</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meu armário</h1>
        <p className="text-sm text-muted-foreground">
          Não esqueça de fazer o check-out ao sair da academia.
        </p>
      </div>

      <Card className="max-w-sm">
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <div>
            <p className="text-sm font-semibold">
              Armário {uso.armario.numero}
            </p>
            <p className="text-xs text-muted-foreground">
              {uso.armario.bloco} · Tam. {uso.armario.tamanho}
            </p>
          </div>
          <StatusBadge status={uso.armario.status} />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Check-in em {formatDateTime(uso.checkIn)}
          </p>
        </CardContent>
        <CardFooter>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button className="w-full" size="touch" variant="destructive">
                Fazer check-out
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar check-out</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Isso vai liberar o armário {uso.armario.numero} ({uso.armario.bloco}
                ) para outro aluno. Confirma que já pegou seus pertences?
              </p>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogAberto(false)}
                  disabled={checkOutMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCheckOut}
                  disabled={checkOutMutation.isPending}
                >
                  {checkOutMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    "Confirmar check-out"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
