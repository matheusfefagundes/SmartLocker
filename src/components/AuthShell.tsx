import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  switchLink: React.ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  children,
  switchLink,
}: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 shrink-0 flex-col justify-between overflow-hidden bg-brand-navy p-10 text-brand-navy-foreground lg:flex xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-16 size-72 rounded-full bg-status-livre/20 blur-3xl"
        />

        <BrandMark className="relative z-10 text-brand-navy-foreground" />

        <div className="relative z-10 flex max-w-sm flex-col gap-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
              Ninguém guarda a chave para sempre.
            </h2>
            <p className="mt-4 text-brand-navy-foreground/70">
              Check-in e check-out em segundos: assim que você sai do treino, o
              armário já fica livre para o próximo aluno.
            </p>
          </div>
        </div>

        <div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-brand-navy-foreground/80">
          <span aria-hidden="true" className="led-dot led-dot-pulse size-1.5 text-status-livre" />
          Reserve seu ármario com segurança e praticidade
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-3 sm:p-6">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-4 sm:py-8">
          <div className="w-full max-w-sm">
            <div className="mb-4 sm:mb-6">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {children}

            <p className="mt-4 text-center text-sm text-muted-foreground sm:mt-6">{switchLink}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
