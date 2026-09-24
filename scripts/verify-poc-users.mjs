import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const defaultEmails = [
  "marina.azevedo@aurora-das-veredas.poc.test",
  "ricardo.mendonca@aurora-das-veredas.poc.test",
  "helena.duarte@aurora-das-veredas.poc.test",
];

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} nao configurada.`);
  return value;
}

function testEmails() {
  const configured = process.env.POC_TEST_EMAILS?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return configured?.length ? [...new Set(configured)] : defaultEmails;
}

function firebaseStatus(error) {
  if (error?.code === "auth/user-not-found") return { exists: false, disabled: false, verified: false, uid: "" };
  throw error;
}

async function main() {
  neonConfig.webSocketConstructor = ws;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: requiredEnvironment("DATABASE_URL") }),
  });

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: requiredEnvironment("FIREBASE_PROJECT_ID"),
        clientEmail: requiredEnvironment("FIREBASE_CLIENT_EMAIL"),
        privateKey: requiredEnvironment("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
      }),
    });
  }

  const emails = testEmails();
  try {
    const databaseUsers = await prisma.usuario.findMany({
      where: { email: { in: emails } },
      include: {
        perfil: { select: { nome: true, ativo: true, permissoes: true } },
        unidadesGestoras: { include: { budgetUnit: { select: { code: true } } } },
      },
    });
    const databaseByEmail = new Map(databaseUsers.map((user) => [user.email.toLowerCase(), user]));
    const auth = getAuth();
    const rows = [];

    for (const email of emails) {
      const databaseUser = databaseByEmail.get(email);
      const firebaseUser = await auth.getUserByEmail(email)
        .then((user) => ({ exists: true, disabled: user.disabled, verified: user.emailVerified, uid: user.uid }))
        .catch(firebaseStatus);
      const units = databaseUser?.unidadesGestoras.map((link) => link.budgetUnit.code).join(", ") ?? "";
      const allowedModules = (() => {
        try {
          return JSON.parse(databaseUser?.perfil.permissoes ?? "{}").modulosPermitidos;
        } catch {
          return undefined;
        }
      })();
      const isCitizen = databaseUser?.perfil.nome === "Cidadão";
      const citizenPermissionsReady = Array.isArray(allowedModules)
        && allowedModules.length === 2
        && allowedModules.includes("OUVIDORIA")
        && allowedModules.includes("TRANSPARENCIA");
      const databaseReady = Boolean(
        databaseUser?.ativo
        && databaseUser.perfil.ativo
        && (isCitizen ? !units && citizenPermissionsReady : units),
      );
      const firebaseReady = firebaseUser.exists && !firebaseUser.disabled && firebaseUser.verified;

      rows.push({
        email,
        firebase: firebaseReady ? "OK" : firebaseUser.exists ? "PENDENTE" : "AUSENTE",
        database: databaseReady ? "OK" : databaseUser ? "PENDENTE" : "AUSENTE",
        perfil: databaseUser?.perfil.nome ?? "",
        ugs: units,
      });
    }

    console.table(rows);
    const pending = rows.filter((row) => row.firebase !== "OK" || row.database !== "OK");
    if (pending.length) {
      console.error(`${pending.length} usuario(s) de teste pendente(s). Configure-os no Firebase e no cadastro municipal antes da POC.`);
      process.exitCode = 1;
    } else {
      console.log(`Todos os ${rows.length} usuarios de teste estao prontos para autenticacao.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
