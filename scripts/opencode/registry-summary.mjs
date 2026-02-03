import fs from "fs";
import path from "path";

const registryPath = path.resolve("docs/ops/opencode-awesome-registry.json");
const args = process.argv.slice(2);
const hasFlag = (name) => args.includes(name);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] : null;
};

const printUsage = () => {
  console.log("Usage: node scripts/opencode/registry-summary.mjs [--counts] [--type <type>] [--query <text>] [--limit <n>] [--json]");
  console.log("Types: agents, plugins, themes, projects, resources, forks");
  console.log("Examples:");
  console.log("  node scripts/opencode/registry-summary.mjs --counts");
  console.log("  node scripts/opencode/registry-summary.mjs --type plugins --query env --limit 20");
};

if (hasFlag("--help")) {
  printUsage();
  process.exit(0);
}

if (!fs.existsSync(registryPath)) {
  console.error(`Registry not found: ${registryPath}`);
  process.exit(1);
}

const typeRaw = getArg("--type");
const queryRaw = getArg("--query");
const limitRaw = getArg("--limit");
const json = hasFlag("--json");
const countsOnly = hasFlag("--counts") || (!typeRaw && !queryRaw);

const validTypes = new Set(["agents", "plugins", "themes", "projects", "resources", "forks"]);
let type = typeRaw ? typeRaw.toLowerCase() : null;
if (type && !type.endsWith("s")) {
  type = `${type}s`;
}
if (type && !validTypes.has(type)) {
  console.error(`Unknown type: ${typeRaw}`);
  printUsage();
  process.exit(1);
}

let items = JSON.parse(fs.readFileSync(registryPath, "utf8"));

if (type) {
  items = items.filter((item) => item.type === type);
}

if (queryRaw) {
  const q = queryRaw.toLowerCase();
  items = items.filter((item) => {
    const fields = [item.displayName, item.repoUrl, item.tagline, item.description];
    return fields.some((value) => String(value || "").toLowerCase().includes(q));
  });
}

items.sort((a, b) => String(a.displayName).localeCompare(String(b.displayName)));

if (countsOnly) {
  const counts = items.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});
  const types = Object.keys(counts).sort();
  console.log(`Total: ${items.length}`);
  types.forEach((t) => console.log(`${t}: ${counts[t]}`));
}

const shouldList = Boolean(type || queryRaw || json);
if (!shouldList) {
  process.exit(0);
}

let limit = Number.parseInt(limitRaw || "", 10);
if (!Number.isFinite(limit) || limit <= 0) {
  limit = 50;
}

const slice = items.slice(0, limit);
if (json) {
  console.log(JSON.stringify(slice, null, 2));
  process.exit(0);
}

const output = slice.map((item) => `- ${item.displayName} (${item.type}) - ${item.tagline} | ${item.repoUrl}`);
console.log(output.join("\n"));
if (items.length > limit) {
  console.log(`... ${items.length - limit} more (use --limit to change).`);
}
