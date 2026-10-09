// Prueba de punta a punta del constructor (ejecutar con el servidor en BASE_URL).
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = process.env.OUT_DIR ?? ".";
const exe = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium";

const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on("pageerror", (e) => errores.push(e.message));
page.on("console", (m) => m.type() === "error" && errores.push(m.text()));

await page.goto(`${BASE}/editor`);
await page.getByRole("button", { name: "Datos de la empresa" }).click();
await page.getByLabel("Razón social (según patente)").fill("Comercializadora Prueba, S.A.");
await page.getByLabel("Nombre comercial").fill("La Tienda Central");
await page.getByRole("button", { name: "Redacción" }).click();

const editor = page.locator(".hoja .ProseMirror");
await editor.click();
await page.keyboard.type("Artículo 1. Este reglamento aplica a todo el personal de la empresa.");
await page.getByRole("button", { name: "Negrita (Ctrl+B)" }).click();
await page.keyboard.type(" Texto en negrita.");
await page.getByRole("button", { name: "Insertar cláusula estándar IGT en este capítulo" }).click();
await page.getByRole("button", { name: "Insertar tabla" }).click();
await page.screenshot({ path: path.join(OUT, "editor.png") });

await page.getByRole("button", { name: /Capítulo VII:/ }).click();
await page.getByRole("button", { name: "Insertar cláusula estándar IGT en este capítulo" }).click();

await page.getByRole("button", { name: "Auditoría IGT" }).click();
const pct = await page.locator("text=/\\d+%/").first().innerText();
await page.screenshot({ path: path.join(OUT, "auditoria.png") });

const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Descargar Word/ }).click()]);
const destino = path.join(OUT, await dl.suggestedFilename());
await dl.saveAs(destino);


// Memorial: se completa con los datos de la empresa y descarga.
await page.getByRole("button", { name: "Memorial", exact: true }).click();
const razonMem = await page.getByLabel("Razón social", { exact: true }).inputValue();
if (razonMem !== "Comercializadora Prueba, S.A.") throw new Error("memorial no heredó la razón social: " + razonMem);
await page.getByLabel("Nombre del representante legal").fill("Ana López");
const [dm] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Descargar memorial/ }).click()]);
await dm.saveAs(path.join(OUT, await dm.suggestedFilename()));

// Publicidad: 9 oct 2026 + 15 días = 24 oct 2026.
await page.getByRole("button", { name: "Publicidad y vigencia" }).click();
await page.getByLabel("Fecha en que se dio a conocer al personal").fill("2026-10-09");
await page.getByLabel("Medio de publicidad").selectOption("fijacion");
const vig = await page.getByRole("status").innerText();
if (!vig.includes("24/10/2026")) throw new Error("vigencia incorrecta: " + vig);
await page.screenshot({ path: path.join(OUT, "publicidad.png") });

// El borrador debe sobrevivir a una recarga.
await page.reload();
await page.getByRole("button", { name: "Datos de la empresa" }).click();
const razon = await page.getByLabel("Razón social (según patente)").inputValue();
await browser.close();

console.log(JSON.stringify({ porcentaje: pct, archivo: destino, bytes: fs.statSync(destino).size, razonTrasRecarga: razon, errores }, null, 2));
if (razon !== "Comercializadora Prueba, S.A." || errores.length) process.exit(1);
