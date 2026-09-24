import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('\n=== FOLDERS ===');
  const folders = await prisma.folder.findMany({
    include: { _count: { select: { documents: true, children: true } } }
  });
  console.log(JSON.stringify(folders, null, 2));

  console.log('\n=== DOCUMENTS ===');
  const docs = await prisma.document.findMany({
    select: { id: true, title: true, documentType: true, status: true, folderId: true }
  });
  console.log(JSON.stringify(docs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
