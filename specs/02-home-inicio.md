# SPEC 02 — Página de Inicio (Home) y biblioteca en `/juegos`

> **Estado:** Implementado  
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-03
> **Objetivo:** Construir la página de Inicio en `/` portando `references/templates/home-about/home.jsx`, y mover la biblioteca actual (hero + búsqueda + tarjetas) a la nueva ruta `/juegos`.

## Por qué existe esta spec

La SPEC 01 dejó la biblioteca como página principal (`/`). El prototipo `references/templates/home-about/` añade una landing (Inicio) con hero, propuesta de valor, vista previa de juegos, estadísticas, actividad en vivo, precios y CTA final. Esta spec porta esa landing a Next, la pone en `/` y reubica el contenido que hoy está en `/` bajo `/juegos`.

Los estilos de Inicio no están en `app/globals.css`: viven en `references/templates/home-about/styles.css`, mezclados con los de "Acerca de". Esta spec copia solo los que usa `home.jsx`.

## Alcance

**Dentro:**

- Nueva ruta `/juegos`: contiene exactamente lo que hoy renderiza `app/page.tsx` (hero `ARCADE VAULT` + `Library`), sin cambios de comportamiento.
- Nueva ruta `/` (Inicio) con las 7 secciones de `home.jsx`:
  1. Hero con siluetas flotantes SVG, eyebrow "INSERTA UNA MONEDA", título de 3 líneas, subtítulo, CTAs `EXPLORAR JUEGOS` (→ `/juegos`) y `CREAR CUENTA` (→ `/auth`) e indicador "DESLIZA".
  2. `// 01 ¿POR QUÉ ARCADE VAULT?`: 4 tarjetas de características con icono SVG pixel.
  3. `// 02 JUEGOS DISPONIBLES AHORA`: riel con los 6 primeros juegos de `GAMES` (cada mini-tarjeta enlaza a `/juegos/[id]`) y botón `VER TODOS LOS JUEGOS →` (→ `/juegos`).
  4. Franja de estadísticas (3 bloques).
  5. `// 03 ACTIVIDAD EN VIVO`: lista de últimas puntuaciones (7 filas) y TOP JUGADORES · HOY (5 filas) con enlace `VER SALÓN →` (→ `/salon`).
  6. `// 04 PRECIOS`: tarjeta "JUGADOR VAULT" ($0 / SIEMPRE) con botón `EMPEZAR GRATIS →` (→ `/auth`) y 3 preguntas frecuentes.
  7. CTA final `¿LISTO PARA JUGAR?` con botón `INSERTAR MONEDA →` (→ `/juegos`).
- Efecto "reveal" al hacer scroll (clase `.reveal` → `.in` con `IntersectionObserver`).
- Navbar: añadir enlace "Inicio" (`/`) en escritorio y en el panel móvil; "Biblioteca" pasa a apuntar a `/juegos`; el logo lleva a `/`.
- Retargeting de enlaces que hoy apuntan a `/` con intención de "volver a la biblioteca" (ver plan, paso 5).
- Copiar a `app/globals.css` solo las clases usadas por `home.jsx`, sin duplicar las que ya existen.
- Datos mock tipados de Inicio en `lib/home.ts`.
- Contenido en español, igual que el template.

**Fuera de alcance (specs futuras):**

- Página "Acerca de" y formulario de contacto (`about.jsx`) y su enlace en el navbar.
- Datos reales para actividad, top de jugadores o estadísticas (siguen siendo texto fijo).
- Cambiar el contenido, el filtrado o el diseño de la biblioteca; solo cambia su ruta.
- Redirección de rutas antiguas, sin enlaces externos que preservar.
- Tests automatizados (el proyecto sigue sin test runner).
- Cualquier cambio en estilos ya existentes de `app/globals.css`, salvo un bug evidente al portar.

## Modelo de datos

Datos mock fijos, con los mismos valores que `home.jsx`.

```ts
// lib/home.ts
import type { GameColor } from "@/lib/juegos";

export interface Feature {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  desc: string;
  color: GameColor;
}

export interface HomeStat {
  n: string;   // "12+", "MILES", "GLOBAL"
  u: string;   // "JUEGOS", "DE PARTIDAS", "RANKING"
  s: string;   // "Y CONTANDO", ...
}

export interface RecentScore {
  player: string;
  game: string;       // nombre mostrado, ej. "Caída"
  score: number;
  ago: string;        // "hace 2 min"
  color: GameColor;
}

export interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}

export interface FaqItem {
  q: string;
  a: string;
}

export const FEATURES: Feature[];        // 4
export const HOME_STATS: HomeStat[];     // 3
export const RECENT_SCORES: RecentScore[]; // 7
export const TOP_PLAYERS: TopPlayer[];   // 5
export const FAQ: FaqItem[];             // 3
```

Convenciones:

- Los juegos del riel salen de `GAMES.slice(0, 6)` en `lib/juegos.ts`; no se duplican.
- Números con `toLocaleString("es-ES")`, como en la SPEC 01.
- Cada mini-tarjeta usa la clase de portada del juego (`cover-*`) ya definida en `app/globals.css`.
- Sin persistencia: Inicio no lee ni escribe `localStorage`.

## Plan de implementación

1. **Mover la biblioteca a `/juegos`.** Crear `app/juegos/page.tsx` con el contenido actual de `app/page.tsx` (hero + `<Library />`) y metadatos de página. Dejar `app/page.tsx` con un marcador temporal. Verificación: `/juegos` se ve y funciona igual que antes el `/` (búsqueda, chips, estado vacío).
2. **Datos de Inicio.** Crear `lib/home.ts` con los tipos y constantes del modelo. Verificación: `npm run lint` y `npx tsc --noEmit` pasan.
3. **Estilos de Inicio.** Copiar de `references/templates/home-about/styles.css` a `app/globals.css` solo las clases que usa `home.jsx` (`.home*`, `.hero-*`, `.silo*`, `.section-*`, `.kicker`, `.feature-*`, `.ft-*`, `.mini-*`, `.home-stats`, `.stat-*`, `.activity-*`, `.ac-*`, `.ticker`, `.tick-row`, `.tk-*`, `.top-*`, `.tp-*`, `.lb-link`, `.pricing-*`, `.price-card`, `.pc-*`, `.faq-*`, `.home-final`, `.final-*`, `.reveal` y los `@keyframes` y media queries asociados). No duplicar reglas ya presentes. Verificación: `npm run build` sin errores; las reglas existentes no cambian.
4. **Componentes de Inicio.** Crear:
   - `components/home/floating-silhouettes.tsx` (Server Component, SVG decorativos con `aria-hidden`).
   - `components/home/feature-icon.tsx` (Server Component, 4 iconos SVG).
   - `components/home/mini-card.tsx` (enlace con `next/link` a `/juegos/[id]`).
   - `components/home/reveal.tsx` (cliente: envuelve su contenido en `<section>`, observa con `IntersectionObserver` y añade `.in` una sola vez; si no existe `IntersectionObserver` o el usuario prefiere menos movimiento, marca `.in` de inmediato).
   Verificación: los componentes compilan y se pueden importar sin errores de tipos.
5. **Página de Inicio y enlaces.** Reemplazar `app/page.tsx` por la landing (Server Component) con las 7 secciones, usando `<Link>` con `className="btn ..."` para los CTAs. Actualizar:
   - `components/nav.tsx`: añadir "Inicio" (`/`) en escritorio y panel móvil; "Biblioteca" → `/juegos`; logo → `/`; estado activo: Inicio en `/`, Biblioteca en `/juegos` y `/juegos/*`, Salón de la Fama en `/salon`.
   - Enlaces "volver a la biblioteca" que hoy apuntan a `/`: `app/juegos/[id]/page.tsx` (VOLVER AL VAULT), `components/hall-of-fame.tsx` y `components/game-player.tsx` → `/juegos`.
   - `components/auth-form.tsx`: el `router.push("/")` pasa a `router.push("/juegos")`, para conservar el flujo actual de caer en la biblioteca tras entrar.
   Verificación: recorrer los CTAs de Inicio y comprobar destinos y estado activo del navbar.
6. **Pulido y metadatos.** Revisar vista móvil (hero, rejillas en una columna, riel con scroll horizontal, precios apilados), título y descripción de `/` y `/juegos`, y que `npm run lint` y `npm run build` terminen sin errores ni avisos de deprecación nuevos.

## Criterios de aceptación

- [ ] `npm run lint` y `npm run build` terminan sin errores ni avisos de deprecación nuevos.
- [ ] `/` muestra las 7 secciones en este orden: hero, ¿POR QUÉ ARCADE VAULT?, JUEGOS DISPONIBLES AHORA, franja de estadísticas, ACTIVIDAD EN VIVO, PRECIOS, ¿LISTO PARA JUGAR?.
- [ ] El hero muestra las 3 líneas "EL ARCADE" / "CLÁSICO ESTÁ" / "DE VUELTA", los botones `EXPLORAR JUEGOS` y `CREAR CUENTA`, y 8 siluetas decorativas.
- [ ] `EXPLORAR JUEGOS`, `VER TODOS LOS JUEGOS →` e `INSERTAR MONEDA →` navegan a `/juegos`.
- [ ] `CREAR CUENTA` y `EMPEZAR GRATIS →` navegan a `/auth`.
- [ ] `VER SALÓN →` navega a `/salon`.
- [ ] El riel muestra exactamente 6 mini-tarjetas, correspondientes a los 6 primeros elementos de `GAMES`; clic en una navega a `/juegos/[id]` de ese juego.
- [ ] La sección de características muestra 4 tarjetas; la de estadísticas, 3 bloques; la actividad, 7 filas de puntuaciones; el top, 5 filas con las 3 primeras con estilos `top1`, `top2`, `top3`.
- [ ] La tarjeta de precios muestra "$0 / SIEMPRE", 6 ventajas y 3 preguntas frecuentes.
- [ ] Las secciones con `.reveal` empiezan ocultas y se muestran al entrar en el viewport; con `prefers-reduced-motion: reduce` aparecen sin animación.
- [ ] `/juegos` muestra el hero "ARCADE VAULT", el campo de búsqueda, los 5 chips y 8 tarjetas, con el mismo comportamiento de búsqueda y estado vacío "NO HAY RESULTADOS" que tenía `/` en la SPEC 01.
- [ ] El navbar muestra "Inicio", "Biblioteca" y "Salón de la Fama" (escritorio y panel móvil); no muestra "Acerca de".
- [ ] El enlace activo es "Inicio" en `/`, "Biblioteca" en `/juegos`, `/juegos/[id]` y `/juegos/[id]/jugar`, y "Salón de la Fama" en `/salon`.
- [ ] El logo lleva a `/`.
- [ ] VOLVER AL VAULT (detalle) y los botones equivalentes del salón y del reproductor navegan a `/juegos`.
- [ ] Tras enviar el formulario de `/auth` (o jugar como invitado) la app redirige a `/juegos`.
- [ ] Con ancho menor a 840 px, las rejillas de Inicio pasan a una columna y no hay scroll horizontal de página.
- [ ] Recargar `/` con sesión iniciada no produce errores de hidratación en consola.
- [ ] `app/globals.css` no tiene reglas duplicadas respecto al template para las clases copiadas y no se modificó ninguna regla anterior.
- [ ] Ninguna clase de "Acerca de" (`.about*`, `.highlight-row`, formulario de contacto) se copió a `app/globals.css`.

## Decisiones tomadas y descartadas

- **Sí:** biblioteca en `/juegos` e Inicio en `/`. Solicitado por el usuario.
- **Sí:** la biblioteca ocupa `/juegos` y el detalle/reproductor siguen en `/juegos/[id]` y `/juegos/[id]/jugar`. Una sola raíz de URL, sin cambiar rutas existentes. Solicitado por el usuario (sustituye a `/games`).
- **No:** `/games`. Se descartó para no mezclar `games` y `juegos` en las URLs.
- **Sí:** copiar a `app/globals.css` solo los estilos de Inicio. Evita CSS muerto de "Acerca de".
- **No:** copiar todo el diff del template (794 líneas). Incluye estilos de una página que no existe.
- **Sí:** portar las 7 secciones con datos mock en `lib/home.ts`. Mismo criterio de la SPEC 01: valores fijos y deterministas, compatibles con Server Components.
- **Sí:** agregar "Inicio" al navbar y no "Acerca de". Su página no existe y un enlace roto empeora la UX.
- **Sí:** Inicio es Server Component; solo `Reveal` es cliente, por usar `IntersectionObserver`. Sustituye el hook `useReveal` del template, que consultaba `document` globalmente.
- **Sí:** `Reveal` respeta `prefers-reduced-motion`. El template no lo hacía; es un ajuste de accesibilidad barato.
- **Sí:** el auth redirige a `/juegos` tras entrar. Conserva el flujo de la SPEC 01 (caer en la biblioteca). Si se quiere aterrizar en Inicio, es un cambio de una línea.
- **Sí:** los CTAs son `<Link>` con clase `btn`, no `<button onClick>`. Mejor navegación, prefetch y accesibilidad que el patrón del template.
- **No:** `generateStaticParams` ni datos dinámicos en Inicio. Todo es estático.

## Riesgos identificados

| Riesgo | Mitigación |
| ------ | ---------- |
| Next 16.4.3 con `cacheComponents` cambia reglas de cacheo y componentes cliente | Leer `node_modules/next/dist/docs/` (empezar por `index.md`) antes de escribir las páginas; atender avisos de deprecación. |
| Copiar CSS del template pisa reglas existentes | Comparar con `diff` contra `app/globals.css`; copiar solo clases nuevas; revisar `/juegos`, `/juegos/[id]` y `/salon` tras el cambio. |
| `.reveal` deja secciones invisibles si JS falla o el observer no dispara | `Reveal` marca `.in` de inmediato sin `IntersectionObserver` o con movimiento reducido; verificar en recarga y en navegación cliente. |
| Enlaces a `/` con intención de biblioteca olvidados | Buscar con `grep` `href="/"` y `push("/")` en `app/` y `components/` antes de cerrar el paso 5. |
| Hero con siluetas absolutas genera scroll horizontal en móvil | Revisar `overflow` del contenedor `.home-hero` en 360 px de ancho. |

## Qué **no** está en esta spec

- Página "Acerca de" y formulario de contacto.
- Datos reales de actividad, ranking o estadísticas.
- Cambios a la biblioteca, al detalle o al reproductor más allá de los enlaces.
- Tests automatizados.

Cada uno de estos puntos, si se aborda, va en su propia spec.
