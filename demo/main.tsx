import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import "./estilos.css";
import Raiz from "./Raiz";

createRoot(document.getElementById("raiz")!).render(<StrictMode><Raiz /></StrictMode>);
