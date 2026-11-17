"use client";

import { LogOut, UserCircle2 } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { limparDadosLocaisSmartLocker } from "@/utils/pinLocal";

interface UserMenuProps {
  nomePadrao: string;
  rotuloPerfil: string;
}

function obterIniciais(nome: string) {
  return nome
    .split(" ")
    .map((parte) => parte[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ nomePadrao, rotuloPerfil }: UserMenuProps) {
  const { user } = useAuth();
  const nome = user?.name ?? nomePadrao;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-1 rounded-full">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-semibold">
              {obterIniciais(nome)}
            </AvatarFallback>
          </Avatar>
          <span className="sr-only">Menu da conta</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{nome}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email ?? ""}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/perfil" className="flex items-center gap-2">
            <UserCircle2 className="size-4" aria-hidden="true" />
            {rotuloPerfil}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-2 text-destructive focus:text-destructive"
          onClick={() => {
            limparDadosLocaisSmartLocker();
            signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
