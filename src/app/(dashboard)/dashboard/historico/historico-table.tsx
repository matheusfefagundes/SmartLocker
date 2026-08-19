"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUsos } from "@/hooks/use-usos";
import { formatDateTime } from "@/utils/date";

const FILTRO_TODOS = "todos";
const FILTRO_ATIVOS = "ativos";
const FILTRO_FINALIZADOS = "finalizados";

export function HistoricoTable() {
  const [filtro, setFiltro] = useState(FILTRO_TODOS);

  const ativo =
    filtro === FILTRO_ATIVOS ? true : filtro === FILTRO_FINALIZADOS ? false : undefined;
  const { data: usos, isLoading } = useUsos({ ativo });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico de uso</h1>
        <p className="text-sm text-muted-foreground">
          Check-ins e check-outs registrados por aluno e armário.
        </p>
      </div>

      <Select value={filtro} onValueChange={setFiltro}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTRO_TODOS}>Todos</SelectItem>
          <SelectItem value={FILTRO_ATIVOS}>Em uso</SelectItem>
          <SelectItem value={FILTRO_FINALIZADOS}>Finalizados</SelectItem>
        </SelectContent>
      </Select>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : usos && usos.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Armário</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usos.map((uso) => (
                <TableRow key={uso.id}>
                  <TableCell>
                    <p className="font-medium">{uso.user.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {uso.user.matricula}
                    </p>
                  </TableCell>
                  <TableCell>
                    {uso.armario.numero} · {uso.armario.bloco}
                  </TableCell>
                  <TableCell>{formatDateTime(uso.checkIn)}</TableCell>
                  <TableCell>
                    {uso.checkOut ? (
                      formatDateTime(uso.checkOut)
                    ) : (
                      <span className="font-medium text-status-ocupado">
                        Em uso
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum registro encontrado.
        </p>
      )}
    </div>
  );
}
