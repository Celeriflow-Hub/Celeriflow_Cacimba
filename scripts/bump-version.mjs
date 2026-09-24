import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFilePath = path.join(__dirname, "../src/lib/version.ts");
const packageJsonPath = path.join(__dirname, "../package.json");

function getGitCommitCount() {
  try {
    const countStr = execSync("git rev-list --count HEAD", { encoding: "utf8" }).trim();
    const count = parseInt(countStr, 10);
    if (!isNaN(count) && count > 0) {
      return count;
    }
  } catch {
    // Git fallback
  }
  return null;
}

try {
  let buildNum = 235;
  const commitCount = getGitCommitCount();

  if (commitCount !== null) {
    // Diretamente a quantidade de commits (ex: 235 commits = v1.235)
    buildNum = commitCount;
  } else if (fs.existsSync(versionFilePath)) {
    const content = fs.readFileSync(versionFilePath, "utf8");
    const match = content.match(/APP_VERSION\s*=\s*["']v?1\.(\d+)["']/);
    if (match && match[1]) {
      buildNum = parseInt(match[1], 10) + 1;
    }
  }

  const version = `v1.${buildNum}`;

  // Grava a versão atualizada em src/lib/version.ts
  const newVersionContent = `export const APP_VERSION = "${version}";\n`;
  fs.writeFileSync(versionFilePath, newVersionContent, "utf8");

  // Sincroniza com package.json
  if (fs.existsSync(packageJsonPath)) {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    pkg.version = `1.${buildNum}.0`;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
  }

  console.log(`🚀 Versão atualizada automaticamente: ${version} (Commits Git: ${commitCount ?? "N/A"})`);
} catch (error) {
  console.error("❌ Falha ao atualizar versão:", error);
}
