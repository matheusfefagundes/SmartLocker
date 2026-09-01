"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { useUsos } from "@/hooks/useUsos";
import { formatarDataHora } from "@/utils/date";

const FILTRO_TODOS = "todos";
const FILTRO_ATIVOS = "ativos";
const FILTRO_FINALIZADOS = "finalizados";
const TAMANHO_PAGINA = 10;

export function HistoricoTable() {
  const [filtro, setFiltro] = useState(FILTRO_TODOS);
  const [pagina, setPagina] = useState(1);

  function handleFiltroChange(novoFiltro: string) {
    setFiltro(novoFiltro);
    setPagina(1);
  }

  const ativo =
    filtro === FILTRO_ATIVOS ? true : filtro === FILTRO_FINALIZADOS ? false : undefined;
  const { data: resultado, isLoading } = useUsos({
    ativo,
    pagina,
    tamanhoPagina: TAMANHO_PAGINA,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Histórico de uso</h1>
        <p className="text-sm text-muted-foreground">
          Check-ins e check-outs registrados por aluno e armário.
        </p>
      </div>

      <Select value={filtro} onValueChange={handleFiltroChange}>
        <SelectTrigger className="w-full sm:w-44">
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
      ) : resultado && resultado.dados.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border">
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
                {resultado.dados.map((uso) => (
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
                    <TableCell>{formatarDataHora(uso.checkIn)}</TableCell>
                    <TableCell>
                      {uso.checkOut ? (
                        formatarDataHora(uso.checkOut)
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

          {resultado.totalPaginas > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-sm text-muted-foreground tabular-nums">
                {resultado.total} registro{resultado.total === 1 ? "" : "s"} ·
                página {resultado.pagina} de {resultado.totalPaginas}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina >= resultado.totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Próxima
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhum registro encontrado.
        </p>
      )}
    </div>
  );
}
