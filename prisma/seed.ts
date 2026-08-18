import { PrismaClient, Tamanho } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const senhaAdmin = await bcrypt.hash("admin123", 10);
  const senhaAluno = await bcrypt.hash("aluno123", 10);

  await prisma.user.upsert({
    where: { email: "admin@smartlocker.com" },
    update: {},
    create: {
      nome: "Administração SmartLocker",
      email: "admin@smartlocker.com",
      passwordHash: senhaAdmin,
      role: "ADMIN",
    },
  });

  const alunos = [
    { nome: "Ana Souza", email: "ana@smartlocker.com", matricula: "2026001" },
    { nome: "Bruno Lima", email: "bruno@smartlocker.com", matricula: "2026002" },
    { nome: "Carla Dias", email: "carla@smartlocker.com", matricula: "2026003" },
  ];

  for (const aluno of alunos) {
    await prisma.user.upsert({
      where: { email: aluno.email },
      update: {},
      create: {
        ...aluno,
        passwordHash: senhaAluno,
        role: "ALUNO",
      },
    });
  }

  const blocos: { bloco: string; tamanho: Tamanho; quantidade: number }[] = [
    { bloco: "Bloco A", tamanho: "P", quantidade: 5 },
    { bloco: "Bloco A", tamanho: "M", quantidade: 5 },
    { bloco: "Bloco B", tamanho: "G", quantidade: 4 },
    { bloco: "Vestiário Feminino", tamanho: "M", quantidade: 6 },
  ];

  for (const grupo of blocos) {
    for (let i = 1; i <= grupo.quantidade; i++) {
      await prisma.armario.upsert({
        where: { numero_bloco: { numero: i, bloco: grupo.bloco } },
        update: {},
        create: {
          numero: i,
          bloco: grupo.bloco,
          tamanho: grupo.tamanho,
        },
      });
    }
  }

  console.log("Seed concluído.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
