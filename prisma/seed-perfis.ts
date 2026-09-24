/**
 * Seed: Perfis de Acesso Padrão
 * Cria os 3 perfis padrão do sistema: Administrador, Operador e Visualizador.
 * Seguro para re-executar.
 */
import 'dotenv/config';
import { prisma } from "../src/lib/prisma";

async function main() {
  const perfis = [
    {
      codigo: "SYSTEM_ADMINISTRATOR",
      nome: "Administrador",
      descricao: "Administrador central do sistema. A identidade técnica é definida pelo código estável do perfil.",
      permissoes: JSON.stringify({ acesso: "operacional", modules: {} }),
      ativo: true,
    },
    {
      codigo: "OPERADOR",
      nome: "Operador",
      descricao: "Acesso operacional aos módulos contratados. Pode visualizar e editar registros conforme as permissões definidas.",
      permissoes: JSON.stringify({ acesso: "operacional", modules: {} }),
      ativo: true,
    },
    {
      codigo: "VISUALIZADOR",
      nome: "Visualizador",
      descricao: "Acesso somente leitura. Pode consultar informações, mas não pode realizar alterações no sistema.",
      permissoes: JSON.stringify({ acesso: "operacional", modules: {} }),
      ativo: true,
    },
  ];

  for (const perfil of perfis) {
    await prisma.configuracaoPerfil.upsert({
      where: { codigo: perfil.codigo },
      create: perfil,
      update: {
        nome: perfil.nome,
        descricao: perfil.descricao,
        permissoes: perfil.permissoes,
        ativo: perfil.ativo,
      },
    });
    console.log(`✅ Perfil "${perfil.nome}" criado/atualizado.`);
  }

  console.log("\n🎉 Perfis de acesso padrão configurados com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
