import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const SYSTEM_ADMIN_PROFILE_CODE = "SYSTEM_ADMINISTRATOR";

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} nao configurada.`);
  return value;
}

async function main() {
  const email = requiredEnvironment("SYSTEM_ADMIN_EMAIL").toLowerCase();
  const name = process.env.SYSTEM_ADMIN_NAME?.trim() || email;

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: requiredEnvironment("FIREBASE_PROJECT_ID"),
        clientEmail: requiredEnvironment("FIREBASE_CLIENT_EMAIL"),
        privateKey: requiredEnvironment("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
      }),
    });
  }
  const firebaseUser = await getAuth().getUserByEmail(email);

  neonConfig.webSocketConstructor = ws;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: requiredEnvironment("DATABASE_URL") }),
  });

  try {
    const profile = await prisma.configuracaoPerfil.upsert({
      where: { codigo: SYSTEM_ADMIN_PROFILE_CODE },
      create: {
        id: "system-administrator",
        codigo: SYSTEM_ADMIN_PROFILE_CODE,
        nome: "Administrador",
        descricao: "Acesso administrativo inicial do sistema.",
        permissoes: JSON.stringify({ acesso: "total" }),
        ativo: true,
      },
      update: {
        codigo: SYSTEM_ADMIN_PROFILE_CODE,
        nome: "Administrador",
        descricao: "Acesso administrativo inicial do sistema.",
        permissoes: JSON.stringify({ acesso: "total" }),
        ativo: true,
      },
    });

    await prisma.usuario.upsert({
      where: { email },
      create: {
        nome: name,
        email,
        senha: "firebase",
        firebaseUid: firebaseUser.uid,
        ativo: true,
        perfilId: profile.id,
      },
      update: {
        nome: name,
        firebaseUid: firebaseUser.uid,
        ativo: true,
        perfilId: profile.id,
      },
    });

    console.log(`Administrador ${email} configurado.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
