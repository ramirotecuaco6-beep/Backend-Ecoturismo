// checkImports.js
import fs from "fs";
import path from "path";
import readline from "readline";

const serverPath = "./server.js";
const modelsPath = "./models";
const routesPath = "./routes";

function getFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith(".js"));
}

function extractImports(filePath) {
  const imports = [];
  const file = fs.readFileSync(filePath, "utf8");
  const regex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;

  let match;
  while ((match = regex.exec(file)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function normalize(p) {
  return path.normalize(p).replace(/\\/g, "/");
}

console.log("\n=== CHECKING IMPORTS IN server.js ===\n");

// Obtener imports
const imports = extractImports(serverPath);

// Listar archivos reales
const modelFiles = getFiles(modelsPath);
const routeFiles = getFiles(routesPath);

let errors = [];

imports.forEach((imp) => {
  if (!imp.startsWith("./models") && !imp.startsWith("./routes")) return;

  const realDir = imp.includes("models") ? modelsPath : routesPath;
  const fileName = imp.split("/").pop();
  const realFiles = imp.includes("models") ? modelFiles : routeFiles;

  if (!realFiles.includes(fileName)) {
    errors.push({
      import: imp,
      expected: realFiles,
    });
  }
});

if (errors.length === 0) {
  console.log("🔥 No hay errores. Todos los imports coinciden con los archivos reales.");
} else {
  console.log("❌ Se encontraron problemas:\n");
  errors.forEach((err, i) => {
    console.log(`⚠️  Error #${i + 1}`);
    console.log(`   Import encontrado: ${err.import}`);
    console.log(`   Archivos válidos en esa carpeta:`);
    err.expected.forEach(f => console.log(`     - ${f}`));
    console.log("");
  });
}

console.log("=== ANALISIS COMPLETADO ===\n");
