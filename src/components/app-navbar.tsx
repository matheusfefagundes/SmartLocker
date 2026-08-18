"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/armarios", label: "Armários" },
  { href: "/meu-armario", label: "Meu armário" },
];

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <span className="text-sm font-semibold tracking-tight">
          SmartLocker
        </span>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith(link.href) && "bg-muted text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 gap-1.5 text-muted-foreground"
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
