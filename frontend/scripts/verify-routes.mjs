import { access, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const routes = ["", "analysis", "audit", "orbit", "experiments", "reports"];
const missing = [];

for (const route of routes) {
  const page = resolve(frontendRoot, "app", route, "page.tsx");
  try {
    await access(page);
  } catch {
    missing.push(route ? `/${route}` : "/");
  }
}

if (missing.length) {
  console.error(`Missing Next.js route files: ${missing.join(", ")}`);
  console.error("Update the master branch before starting the frontend.");
  process.exit(1);
}

if (process.argv.includes("--clean")) {
  await rm(resolve(frontendRoot, ".next"), { recursive: true, force: true });
  console.log("Removed the cached .next build.");
}

console.log(`Verified ${routes.length} App Router destinations.`);
