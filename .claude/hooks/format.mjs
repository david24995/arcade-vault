// Hook PostToolUse: formatea con Prettier y aplica ESLint --fix al archivo
// recién creado o modificado (React/TS/JS y Markdown).
import { spawnSync } from "node:child_process";
import { extname } from "node:path";

// Leer el JSON del evento desde stdin
let raw = "";
for await (const chunk of process.stdin) raw += chunk;

let filePath;
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path;
} catch {
  process.exit(0);
}
if (!filePath) process.exit(0);

const ruta = filePath.replace(/\\/g, "/");
const ext = extname(ruta).toLowerCase();
const CODIGO = [".tsx", ".jsx", ".ts", ".js", ".mjs"];
const soportado = [...CODIGO, ".md"];

// Ignorar extensiones no soportadas y carpetas excluidas
if (!soportado.includes(ext)) process.exit(0);
if (/\/(references|\.next|node_modules)\//.test(ruta)) process.exit(0);

const ejecutar = (args) =>
  spawnSync("npx", args, {
    encoding: "utf8",
    shell: true,
    cwd: process.env.CLAUDE_PROJECT_DIR || process.cwd(),
  });

// 1. Prettier
const prettier = ejecutar(["prettier", "--write", `"${filePath}"`]);
if (prettier.status !== 0) {
  process.stderr.write(prettier.stdout + prettier.stderr);
  process.exit(2);
}

// 2. ESLint --fix (solo código)
if (CODIGO.includes(ext)) {
  const eslint = ejecutar(["eslint", "--fix", `"${filePath}"`]);
  if (eslint.status !== 0) {
    process.stderr.write(eslint.stdout + eslint.stderr);
    process.exit(2);
  }
}

process.exit(0);
