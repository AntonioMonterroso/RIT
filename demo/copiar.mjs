import fs from "node:fs";
import path from "node:path";
const raiz = path.resolve(import.meta.dirname, "..");
const origen = ["dist-demo/demo/index.html", "dist-demo/index.html"].map((p) => path.join(raiz, p)).find((p) => fs.existsSync(p));
if (!origen) throw new Error("No se encontró el HTML generado en dist-demo/");
fs.copyFileSync(origen, path.join(raiz, "RIT-demo.html"));
console.log(`RIT-demo.html: ${(fs.statSync(path.join(raiz, "RIT-demo.html")).size / 1024 / 1024).toFixed(2)} MB`);
