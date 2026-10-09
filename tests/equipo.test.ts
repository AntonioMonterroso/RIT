import { describe, expect, it } from "vitest";
import { puede, ROLES } from "@/lib/equipo";

describe("matriz de permisos", () => {
  it("el administrador puede todo", () => {
    for (const a of ["ver", "editar", "aprobar", "administrar"] as const) expect(puede("empresa_admin", a)).toBe(true);
  });
  it("quien redacta no aprueba, y quien aprueba no redacta", () => {
    expect(puede("editor", "editar")).toBe(true);
    expect(puede("editor", "aprobar")).toBe(false);
    expect(puede("revisor", "aprobar")).toBe(true);
    expect(puede("revisor", "editar")).toBe(false);
  });
  it("el lector solo ve", () => {
    expect(puede("lector", "ver")).toBe(true);
    for (const a of ["editar", "aprobar", "administrar"] as const) expect(puede("lector", a)).toBe(false);
  });
  it("solo el administrador administra", () => {
    expect(ROLES.filter((r) => r.puede.includes("administrar")).map((r) => r.id)).toEqual(["empresa_admin"]);
  });
});
