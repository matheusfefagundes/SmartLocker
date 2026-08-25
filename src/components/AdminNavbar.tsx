"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { mesclarClasses } from "@/utils/mesclarClasses";

const LINKS = [
  { href: "/dashboard", label: "Ocupação", exact: true },
  { href: "/dashboard/armarios", label: "Armários" },
  { href: "/dashboard/historico", label: "Histórico" },
];

export function AdminNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <BrandMark suffix="· admin" />
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const ativo = link.exact
              ? pathname === link.href
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={mesclarClasses(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  ativo && "bg-primary/10 text-primary hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="ml-1 gap-1.5 text-muted-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sair
          </Button>
        </nav>
      </div>
    </header>
  );
}
