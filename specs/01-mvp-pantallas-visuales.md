# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Implementado  
> **Depende de:** ninguna
> **Fecha:** 2026-10-28
> **Objetivo:** Portar a Next.js las cinco pantallas de `references/templates/` (biblioteca, detalle, reproductor, auth y salón de la fama) como rutas del App Router, solo en su parte visual y con datos mock, sin implementar ningún juego.

## Por qué existe esta spec

`references/templates/` es un prototipo SPA en React vía CDN (navegación por hash, globals en `window`, `localStorage`). El proyecto real es Next 16 con App Router. Esta spec traduce el prototipo a rutas reales, componentes tipados y datos en módulos TypeScript, y deja fuera toda lógica de juego o backend.

`app/globals.css` y `app/layout.tsx` ya contienen el tema, las clases CSS (`.av-nav`, `.card`, `.crt`, etc.), el fondo (`.av-bg`, `.av-noise`) y las fuentes. Esta spec no reescribe estilos: reutiliza las clases existentes del template.

## Alcance

**Dentro:**

- Rutas del App Router: `/` (biblioteca), `/juegos/[id]` (detalle), `/juegos/[id]/jugar` (reproductor), `/auth`, `/salon`.
- Navbar (con menú móvil) y footer compartidos desde `app/layout.tsx`.
- Biblioteca con búsqueda por nombre y chips de categoría, tarjetas con efecto tilt y estado vacío "NO HAY RESULTADOS".
- Detalle con portada, etiquetas, descripción, franja de estadísticas, ranking top 10 y botones JUGAR AHORA / VOLVER AL VAULT.
- Reproductor simulado: HUD (jugador, puntuación, vidas, nivel), arena CSS decorativa, puntaje que sube solo, PAUSA/REANUDAR, FIN, SALIR y modal de fin de juego con guardado de puntuación.
- Auth con pestañas INICIAR SESIÓN / CREAR CUENTA, campo de correo solo en "crear cuenta", botón JUGAR COMO INVITADO y botones sociales decorativos (GOOGLE, GITHUB).
- Salón de la Fama con pestañas por juego, podio top 3, tabla de 12 filas y fila "TU MEJOR MARCA" cuando hay sesión.
- Sesión simulada en cliente (contexto React + `localStorage`).
- Datos mock tipados en `lib/`.
- Contenido en español, igual que el template.

**Fuera de alcance (specs futuras):**

- Cualquier juego real (lógica, canvas, colisiones, controles).
- Backend, base de datos, autenticación real, OAuth con Google/GitHub, validación de credenciales.
- Persistencia real de puntuaciones y lectura de `av_scores` en otras pantallas.
- Rankings reales, cálculo de la "mejor marca" del usuario, contador de partidas real.
- Contador de CRÉDITOS dinámico (queda fijo en `03`, como en el template).
- Tests automatizados (el proyecto no tiene test runner).
- Cambios a `app/globals.css`, salvo un bug evidente al portar.

## Modelo de datos

Datos mock en módulos TypeScript, con los mismos valores del template (`data.jsx`).

```ts
// lib/games.ts
export type GameColor = "cyan" | "magenta" | "yellow" | "green";
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export interface Game {
  id: string;            // slug: "bloque-buster", "caida", ...
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;         // clase CSS: "cover-bricks", "cover-tetro", ...
  color: GameColor;
  best: number;
  plays: string;         // ya formateado: "12.4K"
}

export const GAMES: Game[];                              // 8 juegos, idénticos al template
export const CATS: ("TODOS" | GameCategory)[];
export function getGame(id: string): Game | undefined;
```

```ts
// lib/scores.ts
export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;          // "DD/MM/2026"
}

export function seededScores(seed: number, count?: number): ScoreRow[]; // port exacto del template
```

```ts
// lib/session.tsx (cliente)
export interface User { name: string }  // máx. 10 caracteres, en mayúsculas

// Contexto: { user: User | null; login(u: User | null): void; signOut(): void }
```

Convenciones:

- Clave de `localStorage` para la sesión: `av_user` (JSON de `User`).
- Clave de `localStorage` para puntuaciones guardadas: `av_scores` (arreglo de `{ game, score, name, at }`). Solo se escribe; nadie lo lee en esta spec.
- Formato de números: `toLocaleString("es-ES")`.
- La semilla del ranking es la misma del template: `id.length * 17 + 3` en el detalle y `id.length * 23 + 7` en el salón. Así los valores son deterministas y compatibles con Server Components.
- Si la sesión se lee de `localStorage`, se hace dentro de `useEffect` para evitar errores de hidratación; el primer render siempre es "sin sesión".

## Plan de implementación

1. **Datos mock.** Crear `lib/games.ts` y `lib/scores.ts` portando `data.jsx` a TypeScript. Verificación manual: `npm run lint` y `npx tsc --noEmit` pasan.
2. **Sesión y marco de la app.** Crear `lib/session.tsx` (proveedor + hook `useSession`), `components/nav.tsx` (cliente, con menú móvil y estado activo por `usePathname`) y `components/footer.tsx`. Integrarlos en `app/layout.tsx` dentro de `.av-root` (nav, `<main className="av-main">`, footer). Verificación: la app arranca y muestra navbar y footer sobre la página actual.
3. **Biblioteca.** Crear `components/game-card.tsx` (cliente, tilt) y `components/library.tsx` (cliente, búsqueda y chips). Reemplazar `app/page.tsx` por el hero + `Library`. Las tarjetas enlazan a `/juegos/[id]` con `next/link`. Verificación: filtrar por texto y categoría; estado vacío visible.
4. **Detalle.** Crear `app/juegos/[id]/page.tsx` (Server Component) con ranking `seededScores(id.length * 17 + 3, 10)`. ID inexistente llama a `notFound()`. Botones enlazan a `/juegos/[id]/jugar` y `/`. Verificación: abrir los 8 juegos; abrir `/juegos/no-existe` muestra 404.
5. **Auth.** Crear `components/auth-form.tsx` (cliente) y `app/auth/page.tsx`. Enviar el formulario hace `login({ name })` con `(usuario || "PLAYER1").toUpperCase().slice(0, 10)` y navega a `/` con `useRouter`. "Jugar como invitado" hace `login(null)` y navega a `/`. Verificación: tras entrar, el navbar muestra el nombre; "Cerrar sesión" desde el botón del nombre vuelve a "Iniciar Sesión".
6. **Reproductor simulado.** Crear `components/game-player.tsx` (cliente) y `app/juegos/[id]/jugar/page.tsx`. Puntaje sube cada 220 ms con incremento aleatorio de 10 a 99, pausa congela el puntaje, FIN abre el modal, JUGAR DE NUEVO reinicia, GUARDAR PUNTUACIÓN escribe en `av_scores` y muestra el toast "PUNTUACIÓN GUARDADA_". Nombre inicial: `user.name` o `"INVITADO"`. Verificación: recorrer pausa, fin, guardar, reiniciar y volver al vault.
7. **Salón de la Fama.** Crear `components/hall-of-fame.tsx` (cliente, pestaña activa en estado) y `app/salon/page.tsx`. Podio, tabla de 12 filas con animación escalonada y fila "TU MEJOR MARCA EN {TÍTULO}" solo con sesión. Verificación: cambiar de pestaña cambia podio y tabla; con y sin sesión la fila del usuario aparece o no.
8. **Pulido final.** Revisar la vista móvil (menú hamburguesa, `.podium` en una columna, tabla compacta), título y metadatos por página, y que `npm run lint` y `npm run build` terminen sin errores.

## Criterios de aceptación

- [x] `npm run lint` y `npm run build` terminan sin errores ni avisos de deprecación nuevos.
- [x] `/` muestra el hero "ARCADE VAULT", el campo de búsqueda, los 5 chips (`TODOS`, `ARCADE`, `PUZZLE`, `SHOOTER`, `VERSUS`) y 8 tarjetas.
- [x] Escribir "caí" en la búsqueda deja solo la tarjeta CAÍDA.
- [x] Buscar un texto sin coincidencias muestra "NO HAY RESULTADOS".
- [x] Clic en una tarjeta o en su botón JUGAR navega a `/juegos/[id]` del juego correspondiente.
- [x] `/juegos/[id]` muestra título, descripción larga, 4 etiquetas, franja de estadísticas y 10 filas de ranking con las 3 primeras en dorado, plata y bronce.
- [x] `/juegos/no-existe` devuelve la página 404 de Next.
- [x] JUGAR AHORA navega a `/juegos/[id]/jugar`; VOLVER AL VAULT navega a `/`.
- [x] En el reproductor, el puntaje aumenta solo; con PAUSA deja de aumentar y aparece "EN PAUSA"; REANUDAR lo reactiva.
- [x] FIN abre el modal "FIN DEL JUEGO" con la puntuación final; GUARDAR PUNTUACIÓN agrega una entrada a `localStorage.av_scores` y muestra "PUNTUACIÓN GUARDADA_".
- [x] JUGAR DE NUEVO reinicia puntaje en 0, vidas en 3 y nivel en 01; SALIR navega a `/juegos/[id]`.
- [x] En `/auth`, la pestaña CREAR CUENTA muestra el campo de correo; INICIAR SESIÓN lo oculta.
- [x] Enviar el formulario con usuario "px_kai" guarda `av_user = {"name":"PX_KAI"}`, redirige a `/` y el navbar muestra `PX_KAI ▾`.
- [x] Enviar el formulario vacío crea el usuario `PLAYER1`.
- [x] Clic en el botón con el nombre del usuario cierra la sesión y el navbar vuelve a mostrar "Iniciar Sesión".
- [x] Los botones GOOGLE y GITHUB no hacen nada ni producen errores en consola.
- [x] Recargar la página con sesión iniciada mantiene el nombre en el navbar sin errores de hidratación en consola.
- [x] `/salon` muestra 8 pestañas (una por juego), podio con 1.º, 2.º y 3.º, y tabla de 12 filas.
- [x] Cambiar la pestaña del salón actualiza podio y tabla.
- [x] En `/salon`, la fila "TU MEJOR MARCA EN {TÍTULO}" aparece solo con sesión iniciada.
- [x] El enlace activo del navbar es "Biblioteca" en `/`, `/juegos/[id]` y `/juegos/[id]/jugar`, y "Salón de la Fama" en `/salon`.
- [x] Con ancho menor a 840 px se oculta el menú de enlaces, aparece el botón `≡` y abre el panel lateral con los enlaces.
- [x] El contador "CRÉDITOS · 03" y el footer "© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0" se muestran como en el template.

## Decisiones tomadas y descartadas

- **Sí:** rutas reales del App Router. URLs compartibles y Server Components por defecto. Se descarta la SPA con hash del template porque no encaja con Next ni con `cacheComponents`.
- **Sí:** sesión simulada con contexto React y `localStorage` (`av_user`), igual que el template. Permite probar los dos estados visuales del navbar y del salón sin backend.
- **No:** sesión estática sin estado. Dejaría sin poder ver la variante "con usuario" de navbar y salón.
- **Sí:** reproductor con simulación y escritura en `av_scores`. Reproduce el flujo completo (jugar, terminar, guardar) para validar el diseño del modal y del toast.
- **No:** leer `av_scores` en detalle o salón. Es lógica de producto, no visual; va en una spec de puntuaciones.
- **Sí:** datos mock en `lib/games.ts` y `lib/scores.ts`, con el generador con semilla del template. Los valores son deterministas, por lo que sirven en Server Components sin diferencias entre servidor y cliente.
- **Sí:** reutilizar las clases CSS de `app/globals.css` tal cual, sin reescribir con utilidades de Tailwind. Evita divergir del diseño del template.
- **Sí:** componentes `"use client"` solo donde hay estado o eventos (nav, tarjeta, biblioteca, auth, reproductor, salón). Páginas de detalle y contenedores son Server Components.
- **Sí:** pestaña del salón en estado de cliente, no en la URL. Es lo que hace el template; los enlaces profundos por juego quedan para otra spec.
- **No:** `generateStaticParams` obligatorio. Se decide en la implementación según lo que indique la documentación de `cacheComponents`.

## Riesgos identificados

| Riesgo | Mitigación |
| ------ | ---------- |
| Next 16.4.3 con `cacheComponents` cambia reglas de datos dinámicos y `params` | Leer `node_modules/next/dist/docs/` (empezar por `index.md`) antes de escribir las páginas con `[id]`; atender avisos de deprecación. |
| Errores de hidratación al leer `localStorage` | Leer la sesión solo en `useEffect`; el primer render es siempre "sin sesión". |
| `localStorage` bloqueado o no disponible | Envolver lecturas y escrituras en `try/catch`; si falla, la app sigue sin persistir. |
| El incremento aleatorio del puntaje difiere entre renders | Usar `Math.random()` solo dentro del `setInterval` del cliente, nunca durante el render. |
| El template usa `window.scrollTo` al cambiar de ruta | Next ya restablece el scroll al navegar; no replicar ese efecto salvo que falte. |

## Qué **no** está en esta spec

- Ningún juego jugable.
- Backend, base de datos o autenticación real.
- Lectura y ranking real de puntuaciones guardadas.
- Créditos dinámicos.
- Tests automatizados.
- Internacionalización (la interfaz queda solo en español).

Cada uno de estos puntos, si se aborda, va en su propia spec.
