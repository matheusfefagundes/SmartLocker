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
  { href: "/armarios", label: "Armários" },
  { href: "/meu-armario", label: "Meu armário" },
];

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <BrandMark />
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={mesclarClasses(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith(link.href) &&
                  "bg-primary/10 text-primary hover:text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
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
