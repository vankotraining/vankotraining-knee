import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const errors = [];

function requirePath(relativePath, type = "file") {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`Chybí ${type}: ${relativePath}`);
    return;
  }
  if (type === "directory" && !statSync(absolutePath).isDirectory()) {
    errors.push(`Očekáván adresář: ${relativePath}`);
  }
}

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) return "";
  return readFileSync(absolutePath, "utf8");
}

function requireSections(relativePath, sections) {
  const content = read(relativePath);
  for (const section of sections) {
    const heading = `## ${section}`;
    if (!content.includes(heading)) {
      errors.push(`${relativePath}: chybí sekce "${heading}"`);
    }
  }
}

function sectionBody(content, section) {
  const lines = content.split("\n");
  const headingIndex = lines.findIndex((line) => line.trim() === `## ${section}`);
  if (headingIndex === -1) return "";

  const body = [];
  for (const line of lines.slice(headingIndex + 1)) {
    if (line.startsWith("## ")) break;
    body.push(line);
  }
  return body.join("\n");
}

for (const path of [
  "project-control/README.md",
  "project-control/PROJECT_SPEC.md",
  "project-control/PROJECT_STATE.md",
  "project-control/PRODUCTION_STATUS.md",
]) {
  requirePath(path);
}
requirePath("project-control/decisions", "directory");

requireSections("project-control/PROJECT_STATE.md", [
  "Datum poslední kontroly",
  "Aktuální `main` commit",
  "Aktivní větev a PR",
  "Produkční runtime commit",
  "Stav databázových migrací",
  "Aktuální fáze",
  "Implementováno v `main`",
  "Rozpracováno mimo `main`",
  "Nasazeno",
  "Produkčně ověřeno",
  "Známé problémy",
  "Další krok",
]);

requireSections("project-control/PRODUCTION_STATUS.md", [
  "Produkční URL",
  "Vercel project ID",
  "Deployment ID",
  "Nasazený commit",
  "Čas a výsledek deploymentu",
  "Databázové migrace použité produkční aplikací",
  "Provedené smoke testy",
  "Poslední výslovné uživatelské produkční ověření",
  "Známé produkční problémy",
]);

const state = read("project-control/PROJECT_STATE.md");
const nextStepBody = sectionBody(state, "Další krok");
const nextStepItems = nextStepBody
  .split("\n")
  .filter((line) => /^\s*[-*+]\s+\S/.test(line));

if (nextStepItems.length !== 1) {
  errors.push(
    `project-control/PROJECT_STATE.md: sekce "Další krok" musí obsahovat právě jednu odrážku; nalezeno ${nextStepItems.length}`,
  );
}

if (errors.length > 0) {
  console.error("Project control check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Project control check passed.");
