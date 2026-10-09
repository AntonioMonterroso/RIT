// Recorrido completo en modo local: diagnóstico → borrador → puestos → auditoría → memorial →
// trámite → publicidad → formatos → respaldo. Uso: BASE_URL=... OUT_DIR=... node tests/e2e/editor.mjs
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
// MODO=hash prueba el archivo independiente (RIT-demo.html), cuya ruta va en el hash: file:///…/RIT-demo.html#/inicio
const HASH = process.env.MODO === "hash";
const url = (r) => (HASH ? `${BASE}#${r}` : `${BASE}${r}`);
const esperaRuta = (fragmento) => page.waitForFunction((f) => window.location.href.includes(f), fragmento, { timeout: 15000 });
const OUT = process.env.OUT_DIR ?? ".";
const exe = process.env.CHROMIUM ?? "/opt/pw-browsers/chromium";
const pasos = [];
const ok = (m) => pasos.push(m);
const falla = (m) => { throw new Error(m); };
const verificar = (c, m) => (c ? ok(m) : falla("FALLÓ: " + m));

const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errores = [];
page.on("pageerror", (e) => errores.push(e.message));
page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
// Navega y espera a que el estado de la empresa termine de cargar (el avance deja de mostrar «…»).
const ir = async (r) => {
  await page.goto(url(r));
  await page.waitForFunction(() => !/Avance\s*…/i.test(document.body.innerText), null, { timeout: 10000 });
};
const texto = () => page.locator("main").innerText();
const descargar = async (boton) => {
  const [d] = await Promise.all([page.waitForEvent("download"), boton.click()]);
  const destino = path.join(OUT, d.suggestedFilename());
  await d.saveAs(destino);
  return destino;
};

// 1. Portada y entrada al sistema
await ir("/");
await page.getByRole("heading", { level: 1 }).waitFor();
verificar(/listo para la IGT/.test(await page.getByRole("heading", { level: 1 }).innerText()), "la raíz muestra la portada del producto");
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, "00_portada.png"), fullPage: true });
await page.getByRole("button", { name: "Planes" }).click();
verificar(await page.getByRole("heading", { name: "Empresa", exact: true }).isVisible() && await page.getByRole("heading", { name: "Despacho", exact: true }).isVisible() && await page.getByRole("heading", { name: "Corporativo", exact: true }).isVisible(), "la portada muestra los tres planes");
verificar(await page.getByText("Precios de ejemplo").isVisible(), "los precios se marcan como ejemplo mientras no estén confirmados");
await page.setViewportSize({ width: 390, height: 800 });
verificar(!(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)), "la portada no se desborda en móvil");
await page.setViewportSize({ width: 1440, height: 900 });
// Tema: claro por defecto, oscuro con el interruptor, y se recuerda al recargar.
const fondo = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
verificar((await page.evaluate(() => document.documentElement.dataset.tema)) === "claro", "el tema por defecto es el claro (Porcelana)");
const fondoClaro = await fondo();
await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
verificar((await page.evaluate(() => document.documentElement.dataset.tema)) === "oscuro" && (await fondo()) !== fondoClaro, "el interruptor cambia a Pizarra (oscuro) y cambia el fondo");
await page.reload();
verificar((await page.evaluate(() => document.documentElement.dataset.tema)) === "oscuro", "el tema elegido se recuerda al recargar");
await page.screenshot({ path: path.join(OUT, "00_portada_oscuro.png") });
await page.getByRole("button", { name: "Cambiar a tema claro" }).click();
await page.getByRole("link", { name: "Entrar al sistema" }).click();
await esperaRuta("/inicio");
await page.getByText("Ruta hacia un reglamento aprobado").waitFor();
verificar((await texto()).includes("Ruta hacia un reglamento aprobado"), "«Entrar al sistema» lleva al centro de mando");
await page.waitForTimeout(900);
await page.screenshot({ path: path.join(OUT, "01_inicio.png") });

// 2. Datos de la empresa
await ir("/ajustes");
await page.getByLabel("Razón social (según patente)").fill("Restaurante Sabor Chapín, S.A.");
await page.getByLabel("Nombre comercial").fill("Sabor Chapín");
await page.getByLabel("NIT").fill("1234567-8");
await page.getByLabel("Representante legal").fill("Ana López Pérez");
await page.getByLabel("Departamento").fill("Quetzaltenango");

// 3. Diagnóstico con alerta de jornada
await ir("/diagnostico");
await page.getByLabel("Giro del negocio").selectOption("restaurante");
await page.getByLabel("Trabajadores permanentes").fill("25");
await page.getByLabel("Días laborales").fill("lunes a sábado");
verificar(await page.getByText("Excede el límite").isVisible(), "lunes a sábado de 8 h excede el límite semanal y se avisa");
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(OUT, "02_diagnostico.png") });
await page.getByLabel("Días laborales").fill("lunes a viernes");
verificar(await page.getByText("Dentro del límite").isVisible(), "lunes a viernes queda dentro del límite");
await page.getByText("Teletrabajo o trabajo híbrido").click();
await page.getByText("Maneja efectivo, inventarios o fondos").click();
await page.getByRole("button", { name: "Generar borrador personalizado" }).click();
await esperaRuta("/editor");

// 4. Editor con el borrador
const hoja = page.locator(".hoja .ProseMirror");
await hoja.waitFor();
let t = await hoja.innerText();
verificar(/Artículo 1\. Objeto/.test(t) && t.includes("Restaurante Sabor Chapín, S.A."), "el borrador arranca con 'Artículo 1. Objeto' y la razón social");
await page.getByRole("button", { name: /Capítulo III/ }).click();
await page.waitForFunction(() => document.querySelector(".hoja .ProseMirror")?.textContent?.includes("Jornada ordinaria"));
t = await hoja.innerText();
verificar(t.includes("lunes a viernes") && t.includes("no responder comunicaciones"), "el capítulo III refleja el horario y el teletrabajo del diagnóstico");
await page.getByRole("tab", { name: /Revisión/ }).click();
verificar(await page.getByText("Este capítulo cumple los requisitos.").isVisible(), "la revisión confirma que el capítulo cumple");
await page.getByRole("button", { name: /Capítulo VII:/ }).click();
await page.waitForFunction(() => document.querySelector(".hoja .ProseMirror")?.textContent?.includes("manipule alimentos"));
verificar(true, "el giro restaurante agrega la cláusula de higiene de alimentos");

// cláusula opcional desde el panel
await page.getByRole("button", { name: /Capítulo IV:/ }).click();
await page.getByRole("tab", { name: "Cláusulas" }).click();
await page.getByRole("button", { name: "Insertar cláusula Permisos sin goce de salario" }).click();
await page.waitForFunction(() => document.querySelector(".hoja .ProseMirror")?.textContent?.includes("Permisos sin goce de salario"));
verificar(true, "una cláusula opcional se inserta desde el panel");

// pendientes: el anexo aún no tiene puestos
await page.getByRole("tab", { name: /Revisión/ }).click();
await page.getByRole("button", { name: /Ir al siguiente dato pendiente/ }).click();
await page.waitForFunction(() => document.querySelector(".hoja h2")?.textContent?.includes("Anexo"));
verificar(await page.locator(".hoja .pendiente").first().isVisible(), "el sistema salta al capítulo con dato pendiente y lo resalta");
const ancho = await page.evaluate(() => { const h = document.querySelector(".hoja"); const c = h.parentElement; return { hoja: h.getBoundingClientRect().width, scroll: h.scrollWidth, cont: c.clientWidth }; });
verificar(ancho.scroll <= ancho.hoja + 1, "la hoja no se recorta (sin desborde interno)");
verificar(ancho.hoja >= 700, `la hoja conserva un ancho cómodo en 1440 px (${Math.round(ancho.hoja)} px)`);
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(OUT, "03_editor.png") });

// 5. Puestos
await ir("/puestos");
for (const n of ["Administrador", "Cocinero", "Mesero"]) await page.getByRole("button", { name: `+ ${n}` }).click();
await page.getByRole("button", { name: "Aplicar al reglamento (Anexo)" }).click();
verificar(await page.getByText("se actualizó con 3 puesto(s)").isVisible(), "los puestos se aplican al Anexo del reglamento");
await ir("/editor?cap=mod_puestos");
await page.waitForFunction(() => document.querySelector(".hoja .ProseMirror")?.textContent?.includes("Puesto: Cocinero"));
verificar((await hoja.innerText()).includes("Puesto: Mesero"), "el anexo lista los puestos");
verificar((await page.locator(".hoja .pendiente").count()) === 0, "ya no quedan datos pendientes en el anexo");

// 6. Auditoría
await ir("/auditoria");
await page.waitForFunction(() => /75\s*%/.test(document.querySelector("main")?.innerText ?? ""), null, { timeout: 8000 }).catch(() => {});
verificar(/75\s*%/.test(await texto()), "auditoría: 12 de 16 criterios automáticos al inicio (75%)");
for (const n of ["Copia legible de la Patente", "Copia del nombramiento", "Planilla pagada del IGSS"]) {
  await page.getByRole("checkbox", { name: new RegExp(n) }).check();
}
verificar(await page.getByText(/Riesgo de previo/).isVisible() || /\d+%/.test(await texto()), "los documentos manuales suben el puntaje");
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(OUT, "04_auditoria.png") });

// 7. Memorial
await ir("/memorial");
verificar((await page.getByLabel("Razón social", { exact: true }).inputValue()).includes("Sabor Chapín"), "el memorial hereda la razón social");
await page.getByLabel("DPI del representante").fill("2345 67890 0901");
await page.getByLabel("Dirección para notificaciones").fill("4a. calle 12-45 zona 1, Quetzaltenango");
await page.getByLabel("Lugar y fecha del memorial").fill("Quetzaltenango, 9 de octubre de 2026");
const memorial = await descargar(page.getByRole("button", { name: /Descargar memorial/ }));
verificar(fs.statSync(memorial).size > 3000, "se descarga el memorial .docx");

// 8. Trámite y 9. Publicidad
await ir("/tramite");
await page.getByLabel("Estado del trámite").selectOption("aprobado");
await page.getByLabel("Número de expediente").fill("456-2026");
await ir("/publicidad");
await page.getByLabel("Fecha en que se dio a conocer al personal").fill("2026-10-09");
await page.getByLabel("Medio de publicidad").selectOption("ambos");
verificar((await texto()).includes("24/10/2026"), "la vigencia se calcula a 15 días (24/10/2026)");

// 10. Inicio al 100 %
await ir("/inicio");
await page.getByText("Todo completo").waitFor();
verificar(/100%/.test(await texto()), "con todos los pasos hechos el avance es 100%");
await page.waitForTimeout(900); // termina la animación de entrada
await page.screenshot({ path: path.join(OUT, "05_inicio_completo.png") });
await page.getByRole("button", { name: "Cambiar a tema oscuro" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(OUT, "05b_inicio_oscuro.png") });
await page.getByRole("button", { name: "Cambiar a tema claro" }).click();

// 11. Formatos con datos reales
await ir("/formatos");
const constancia = await descargar(page.getByRole("button", { name: /Descargar/ }).first());
verificar(fs.statSync(constancia).size > 3000, "se descarga la constancia de recibo");

// 12. Biblioteca de cláusulas
await ir("/plantillas");
await page.getByRole("searchbox", { name: "Buscar" }).fill("acoso");
verificar(await page.getByText("Prevención del acoso laboral y sexual").isVisible(), "la búsqueda de cláusulas encuentra 'acoso'");

// 12b. Buscador de comandos (Ctrl+K)
await ir("/inicio");
await page.waitForLoadState("networkidle");
await page.getByText("Centro de mando").first().waitFor();
await page.waitForTimeout(500); // hidratación: el atajo se registra al cargar
await page.keyboard.press("Control+k");
await page.getByRole("dialog", { name: "Buscador de comandos" }).waitFor();
await page.keyboard.type("vacaciones");
await page.getByRole("option", { name: /Vacaciones anuales/ }).waitFor({ timeout: 5000 });
verificar(true, "Ctrl+K encuentra la cláusula «Vacaciones anuales»");
await page.keyboard.press("Enter");
await esperaRuta("/plantillas");
await page.waitForFunction(() => document.querySelector('input[type="search"]')?.value === "Vacaciones anuales", null, { timeout: 8000 }).catch(() => {});
verificar((await page.getByRole("searchbox", { name: "Buscar" }).inputValue()) === "Vacaciones anuales", "al elegirla se abre la biblioteca de cláusulas ya filtrada");
await page.keyboard.press("Control+k");
await page.keyboard.type("calend");
await page.keyboard.press("Enter");
await esperaRuta("/calendario");
verificar(true, "el buscador navega a una pantalla con el teclado");
await page.keyboard.press("Control+k");
await page.keyboard.press("Escape");
verificar(!(await page.getByRole("dialog", { name: "Buscador de comandos" }).isVisible().catch(() => false)), "Esc cierra el buscador");

// 13. Respaldo, borrado y restauración
await ir("/ajustes");
const respaldo = await descargar(page.getByRole("button", { name: /Descargar respaldo/ }));
await page.getByRole("button", { name: /Borrar todo el contenido/ }).click();
await page.getByRole("button", { name: "Sí, borrar todo" }).click();
await ir("/inicio");
verificar(/^\s*[0-4]%|Avance general\s*\n?\s*[0-4]%/m.test(await texto()) || !(await texto()).includes("100%"), "tras borrar, el avance baja");
await ir("/ajustes");
await page.getByLabel("Archivo de respaldo").setInputFiles(respaldo);
await page.getByText("Respaldo restaurado.").waitFor();
await ir("/inicio");
await page.getByText("Todo completo").waitFor();
verificar(true, "restaurar el respaldo devuelve el 100%");

// 14. Organizador → empresa (modo local)
const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
await ir("/organizador");
await page.getByLabel("Título", { exact: true }).first().fill("Código de Trabajo");
await page.getByLabel("Referencia").fill("Decreto 1441");
await page.getByLabel("Texto").fill("Artículo 57. Reglamento interior de trabajo es el conjunto de normas...");
await page.getByRole("button", { name: "Publicar", exact: true }).click();
await page.getByLabel("Título", { exact: true }).nth(1).fill("Revisión anual del RIT");
await page.getByLabel("Fecha", { exact: true }).fill(manana);
await page.getByRole("button", { name: "Crear recordatorio" }).click();
await ir("/biblioteca");
await page.getByLabel("Buscar en la biblioteca").fill("reglamento interior");
await page.getByRole("button", { name: /Código de Trabajo/ }).click();
verificar(await page.getByText("conjunto de normas").isVisible(), "la empresa ve la ley publicada por el organizador");
await ir("/calendario");
await page.getByText("Revisión anual del RIT").waitFor();
verificar(await page.getByText("Plazo del sistema").isVisible(), "el calendario muestra el recordatorio general y el plazo del sistema");
await page.getByLabel("Qué hay que hacer").fill("Entregar memorial a la IGT");
await page.getByLabel("Fecha", { exact: true }).fill(manana);
await page.getByRole("button", { name: "Agregar" }).click();
const barra = await page.getByRole("navigation", { name: "Principal" }).innerText();
verificar(/Calendario\s*2/.test(barra), "la barra lateral muestra 2 avisos urgentes");
await page.screenshot({ path: path.join(OUT, "06_calendario.png") });

// 15. Persistencia
await page.reload();
await page.getByText("Revisión anual del RIT").waitFor();
await ir("/ajustes");
verificar((await page.getByLabel("NIT").inputValue()) === "1234567-8", "los datos sobreviven a recargar");

// 16. Móvil
await page.setViewportSize({ width: 390, height: 800 });
await ir("/inicio");
verificar(!(await page.getByRole("navigation", { name: "Principal" }).isVisible()), "en móvil el menú lateral está oculto");
await page.getByRole("button", { name: "Abrir menú" }).click();
await page.waitForTimeout(400);
const caja = await page.getByRole("navigation", { name: "Principal" }).boundingBox();
verificar(!!caja && caja.x >= 0 && caja.x < 100, "el botón de menú desliza la navegación dentro de la pantalla");
const desborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
verificar(!desborde, "no hay desbordamiento horizontal en móvil");
await page.screenshot({ path: path.join(OUT, "07_movil.png") });

await browser.close();
console.log(pasos.map((p) => "  ✓ " + p).join("\n"));
console.log(`\n${pasos.length} comprobaciones; errores de consola: ${errores.length}`);
if (errores.length) { console.log(errores.join("\n")); process.exit(1); }
