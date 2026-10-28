# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

En este proyecto, responder y escribir solo en español: respuestas en el chat, comentarios, mensajes de commit y documentación. Los identificadores de código, comandos y mensajes de error se mantienen tal cual.

## Proyecto

Arcade Vault: plataforma para jugar online y competir por la mayor cantidad de puntos (ver `README.md`). Desarrollo guiado por especificaciones con `/spec` y `/spec-impl`, usando las skills de `Klerith/fernando-skills` (`npx skills@latest add Klerith/fernando-skills`). Actualmente es un scaffold nuevo de `create-next-app`: solo existen `app/layout.tsx`, `app/page.tsx` y `app/globals.css`.

## Advertencia sobre la versión de Next.js

Next 16.4.3 + React 19.3. Las APIs difieren de lo conocido previamente. Según `AGENTS.md`, leer la guía relevante en `node_modules/next/dist/docs/` (empezar por `index.md`) antes de escribir código de Next.js. Atender los avisos de deprecación.

## Skills
Usa siempre /frontend-design para hacer interfaz de usuario.


## Notas de arquitectura

- Solo App Router (`app/`). El layout raíz usa el tipo global `LayoutProps<"/">` (sin import) y las fuentes Geist de `next/font/google` expuestas como variables CSS.
- `next.config.ts` activa funciones no predeterminadas que cambian el comportamiento: `cacheComponents: true`, `experimental.partialPrefetching`, `experimental.agentFeedback`. Revisar la documentación sobre las reglas de caché y datos dinámicos bajo `cacheComponents` antes de obtener datos o usar APIs de request.
- Tailwind v4 conectado vía Turbopack: `turbopack.rules["*.css"]` usa el loader `@tailwindcss/turbopack` (sin config de PostCSS). Mantener esta regla al editar la config.
