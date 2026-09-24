import assert from "node:assert/strict";
import test from "node:test";
import { PROCESS_LIST_PAGE_SIZE, parseProcessListFilters, processListHref, resolveProcessListPage } from "../process-listing-policy";

test("process list filters are normalized before querying the server", () => {
  assert.deepEqual(parseProcessListFilters({ q: ["  PROC-2026-000001  "], status: " Recebido ", page: "3" }), {
    q: "PROC-2026-000001",
    status: "Recebido",
    page: 3,
  });
  assert.deepEqual(parseProcessListFilters({ q: "x".repeat(140), page: "0" }), {
    q: "x".repeat(120),
    status: "",
    page: 1,
  });
});

test("process list page stays within the actual total", () => {
  assert.equal(PROCESS_LIST_PAGE_SIZE, 20);
  assert.equal(resolveProcessListPage(4, 43), 3);
  assert.equal(resolveProcessListPage(0, 0), 1);
  assert.equal(resolveProcessListPage(2, 21), 2);
});

test("process list links preserve server-side filters and page", () => {
  assert.equal(
    processListHref({ q: "Proc 1", status: "Aguardando Recebimento" }, 2),
    "/protocolos/processos?q=Proc+1&status=Aguardando+Recebimento&page=2",
  );
  assert.equal(processListHref({ q: "", status: "" }), "/protocolos/processos");
});

