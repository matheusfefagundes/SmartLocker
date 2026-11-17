import { execSync } from "node:child_process";

const executar = (comando) => execSync(comando, { stdio: "inherit" });

if (process.env.VERCEL_ENV === "production") {
  executar("prisma migrate deploy");
} else {
  console.log(
    `[vercel-build] VERCEL_ENV=${process.env.VERCEL_ENV ?? "indefinido"}: migrações não são aplicadas fora de produção.`
  );
}

executar("next build");
