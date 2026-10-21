/**
 * Guards the Material Symbols subset font.
 *
 * The app loads Material Symbols Outlined as a *subset* — only the ligature
 * names in `MATERIAL_SYMBOL_ICON_NAMES` are served. A ligature outside that
 * list has no glyph in the font, so the browser cannot form the ligature and
 * renders the raw name as visible text ("expand_more") instead of an icon.
 * The failure is silent: no error, no warning, just the wrong thing on screen.
 *
 * This script walks the source, collects every `material-symbols-outlined`
 * ligature actually referenced, and fails if any of them is missing from the
 * subset list.
 *
 * Run it with `npm run check:icons`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CLIENT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC_DIR = join(CLIENT_ROOT, "src");
const WHITELIST_FILE = join(SRC_DIR, "lib", "material-symbols.ts");

/** Every icon name the subset font is allowed to serve. */
function readWhitelist() {
  const source = readFileSync(WHITELIST_FILE, "utf8");
  const block = source.match(/MATERIAL_SYMBOL_ICON_NAMES = \[([\s\S]*?)\]/);
  if (!block) {
    throw new Error(`Could not find MATERIAL_SYMBOL_ICON_NAMES in ${WHITELIST_FILE}`);
  }
  return new Set([...block[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1]));
}

/** Every `.ts`/`.tsx` file under `dir`. */
function listSourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * The ligature names referenced by a single `material-symbols-outlined` element.
 *
 * Handles the three shapes the codebase uses: a literal (`verified_user`), a
 * conditional (`{sorted === "asc" ? "arrow_upward" : "arrow_downward"}`) and a
 * passthrough of a prop (`{panel.icon}`).
 *
 * Comparison operands are stripped first — `state === "complete"` compares a
 * status, it does not name a glyph.
 */
function extractLigatures(inner) {
  const withoutComparisons = inner.replace(/[=!]==?\s*["'][a-z_]+["']/g, " ");
  const names = new Set();

  // Quoted names: the literal branch of a conditional.
  for (const match of withoutComparisons.matchAll(/["']([a-z_]{3,})["']/g)) {
    names.add(match[1]);
  }

  // Bare text: the static child of the icon element.
  const bare = withoutComparisons.replace(/["'][a-z_]{3,}["']/g, " ").trim();
  if (/^[a-z_]+$/.test(bare)) names.add(bare);

  return names;
}

/** Ligature names referenced anywhere in the file, keyed by line number. */
function findLigatures(source) {
  const found = new Map();

  const record = (name, line) => {
    if (!found.has(name)) found.set(name, []);
    found.get(name).push(line);
  };

  let index = -1;
  while ((index = source.indexOf("material-symbols-outlined", index + 1)) !== -1) {
    // Walk to the end of the opening tag, skipping quoted attribute values.
    const tagStart = source.lastIndexOf("<", index);
    let cursor = tagStart === -1 ? index : tagStart;
    let quote = null;
    for (; cursor < source.length; cursor++) {
      const char = source[cursor];
      if (quote) {
        if (char === quote) quote = null;
        continue;
      }
      if (char === '"' || char === "'") {
        quote = char;
        continue;
      }
      if (char === ">") break;
    }

    const close = source.indexOf("</span>", cursor);
    const inner = source.slice(cursor + 1, close === -1 ? cursor + 1 : close);
    const line = source.slice(0, index).split("\n").length;

    for (const name of extractLigatures(inner)) record(name, line);
  }

  // Icons passed in as a prop value, e.g. `{ icon: "schedule" }`.
  for (const match of source.matchAll(/\bicon:\s*["']([a-z_]{3,})["']/g)) {
    const line = source.slice(0, match.index).split("\n").length;
    record(match[1], line);
  }

  return found;
}

const whitelist = readWhitelist();
const used = new Map();

for (const file of listSourceFiles(SRC_DIR)) {
  for (const [name, lines] of findLigatures(readFileSync(file, "utf8"))) {
    if (!used.has(name)) used.set(name, []);
    used.get(name).push(`${relative(CLIENT_ROOT, file).split(sep).join("/")}:${lines[0]}`);
  }
}

const missing = [...used.keys()].filter((name) => !whitelist.has(name)).sort();

if (missing.length > 0) {
  console.error(
    `\n${missing.length} Material Symbols ligature(s) are used but missing from the subset font.\n` +
      `They will render as plain text instead of an icon.\n`,
  );
  for (const name of missing) {
    console.error(`  ${name}  ->  ${used.get(name).join(", ")}`);
  }
  console.error(
    `\nAdd them to MATERIAL_SYMBOL_ICON_NAMES in src/lib/material-symbols.ts,\n` +
      `then confirm the name exists in Material Symbols Outlined.\n`,
  );
  process.exit(1);
}

console.log(
  `Material Symbols OK — ${used.size} ligature(s) in use, all present in the subset font.`,
);
