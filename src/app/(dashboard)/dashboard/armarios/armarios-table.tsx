"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { NovoArmarioDialog } from "./novo-armario-dialog";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useArmarios } from "@/hooks/use-armarios";
import {
  useDeleteArmario,
  useUpdateArmarioStatus,
} from "@/hooks/use-armario-mutations";
import { ApiClientError } from "@/lib/api-client";
import type { Armario, StatusArmario } from "@/types/armario";

export function ArmariosTable() {
  const { data: armarios, isLoading } = useArmarios();
  const updateStatusMutation = useUpdateArmarioStatus();
  const deleteArmarioMutation = useDeleteArmario();
  const [armarioParaExcluir, setArmarioParaExcluir] = useState<Armario | null>(
    null
  );

  function handleUpdateStatus(id: string, status: StatusArmario) {
    updateStatusMutation.mutate(
      { id, input: { status } },
      {
        onError: (error) => {
          const mensagem =
            error instanceof ApiClientError
              ? error.message
              : "Não foi possível atualizar o armário";
          toast.error(mensagem);
        },
      }
    );
  }

  function handleDelete() {
    if (!armarioParaExcluir) return;
    deleteArmarioMutation.mutate(armarioParaExcluir.id, {
      onSuccess: () => {
        toast.success("Armário excluído");
        setArmarioParaExcluir(null);
      },
      onError: (error) => {
        const mensagem =
          error instanceof ApiClientError
            ? error.message
            : "Não foi possível excluir o armário";
        toast.error(mensagem);
        setArmarioParaExcluir(null);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Armários</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre armários e gerencie status de manutenção.
          </p>
        </div>
        <NovoArmarioDialog />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Bloco</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(armarios ?? []).map((armario) => (
                <TableRow key={armario.id}>
                  <TableCell className="font-medium">
                    {armario.numero}
                  </TableCell>
                  <TableCell>{armario.bloco}</TableCell>
                  <TableCell>{armario.tamanho}</TableCell>
                  <TableCell>
                    <StatusBadge status={armario.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" aria-hidden="true" />
                          <span className="sr-only">Ações</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {armario.status !== "LIVRE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(armario.id, "LIVRE")
                            }
                          >
                            Marcar como livre
                          </DropdownMenuItem>
                        )}
                        {armario.status !== "MANUTENCAO" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUpdateStatus(armario.id, "MANUTENCAO")
                            }
                          >
                            Enviar para manutenção
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setArmarioParaExcluir(armario)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={Boolean(armarioParaExcluir)}
        onOpenChange={(open) => !open && setArmarioParaExcluir(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir armário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o armário{" "}
            {armarioParaExcluir?.numero} ({armarioParaExcluir?.bloco})? Essa
            ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setArmarioParaExcluir(null)}
              disabled={deleteArmarioMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteArmarioMutation.isPending}
            >
              {deleteArmarioMutation.isPending ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
