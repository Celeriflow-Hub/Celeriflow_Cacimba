import "./helpers/fleet-test-environment";
import test from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { AccessError } from "../src/lib/platform/tenant-context";
import { fleetPageIssue } from "../src/lib/frotas/page-errors";

for (const partialSchema of [false, true]) {
  test(`Abertura de Frotas · ${partialSchema ? "coluna pendente" : "tabela pendente"}`, async () => {
    const memory = await PGlite.create();
    if (partialSchema) await memory.exec('CREATE TABLE "FleetUnit" ("id" TEXT PRIMARY KEY);');
    const socket = new PGLiteSocketServer({ db: memory, port: 0, host: "127.0.0.1", maxConnections: 1 });
    await socket.start();
    const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: `postgresql://postgres:postgres@${socket.getServerConn()}/postgres?sslmode=disable`, max: 1 }) });
    try {
      const query = partialSchema ? db.fleetUnit.findMany({ select: { id: true, operationalStatus: true } }) : db.fleetUnit.count();
      await assert.rejects(query, error => {
        assert.ok(error instanceof Prisma.PrismaClientKnownRequestError);
        assert.equal(error.code, partialSchema ? "P2022" : "P2021");
        const issue = fleetPageIssue(error);
        assert.equal(issue?.kind, "database");
        assert.doesNotMatch(JSON.stringify(issue), /postgresql|SELECT|FleetUnit|operationalStatus/);
        return true;
      });
    } finally {
      await db.$disconnect();
      await socket.stop();
      await memory.close();
    }
  });
}

test("Abertura de Frotas · sessão e setor sem ocultar erros inesperados", () => {
  assert.equal(fleetPageIssue(new AccessError("Sessão inválida.", 401))?.kind, "session");
  const sectorMessage = "Vincule o usuário a um setor para acessar os registros de Frotas.";
  assert.equal(fleetPageIssue(new AccessError(sectorMessage, 403))?.message, sectorMessage);
  assert.equal(fleetPageIssue(new AccessError("Módulo inativo.", 423))?.kind, "access");
  assert.equal(fleetPageIssue(new Error("Falha inesperada com dados internos")), null);
  assert.equal(fleetPageIssue(new Prisma.PrismaClientKnownRequestError("Connection closed", { code: "P1017", clientVersion: "fixture" })), null);
});
