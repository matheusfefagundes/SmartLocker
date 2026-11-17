"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { mesclarClasses } from "@/utils/mesclarClasses";

const LINKS = [
  { href: "/dashboard", label: "Ocupação", exact: true },
  { href: "/dashboard/armarios", label: "Armários" },
  { href: "/dashboard/manutencao", label: "Manutenção (OS)" },
  { href: "/dashboard/inspecoes", label: "Inspeções" },
  { href: "/dashboard/usuarios", label: "Usuários" },
  { href: "/dashboard/auditoria", label: "Auditoria" },
  { href: "/dashboard/historico", label: "Histórico" },
];

export function AdminNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <BrandMark suffix="· admin" />
        <nav className="flex flex-wrap items-center gap-0.5 sm:gap-1">
          {LINKS.map((link) => {
            const ativo = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={mesclarClasses(
                  "rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-2.5 sm:text-sm",
                  ativo && "bg-primary/10 text-primary hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle />

          <UserMenu nomePadrao="Administrador" rotuloPerfil="Configurações de Perfil" />
        </nav>
      </div>
    </header>
  );
}
