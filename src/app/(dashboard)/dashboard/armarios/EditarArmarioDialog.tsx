"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateArmario } from "@/hooks/useArmarioMutations";
import { ApiClientError } from "@/lib/apiClient";
import { createArmarioSchema, type CreateArmarioInput } from "@/schemas/armario";
import type { Armario } from "@/types/armario";

interface EditarArmarioDialogProps {
  armario: Armario | null;
  onOpenChange: (open: boolean) => void;
}

export function EditarArmarioDialog({ armario, onOpenChange }: EditarArmarioDialogProps) {
  const updateArmarioMutation = useUpdateArmario();

  const form = useForm<CreateArmarioInput>({
    resolver: zodResolver(createArmarioSchema),
    defaultValues: { numero: undefined, bloco: "", tamanho: "P" },
  });

  useEffect(() => {
    if (armario) {
      form.reset({
        numero: armario.numero,
        bloco: armario.bloco,
        tamanho: armario.tamanho,
      });
    }
  }, [armario, form]);

  function onSubmit(values: CreateArmarioInput) {
    if (!armario) return;
    updateArmarioMutation.mutate(
      { armarioId: armario.id, dadosAtualizacao: values },
      {
        onSuccess: () => {
          toast.success("Armário atualizado");
          onOpenChange(false);
        },
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

  return (
    <Dialog open={Boolean(armario)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar armário</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bloco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bloco</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Bloco A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tamanho"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tamanho</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="P">P</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={updateArmarioMutation.isPending}>
                {updateArmarioMutation.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
