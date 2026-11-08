# SPEC 03 — Página "Acerca de" y formulario de contacto con Resend

> **Estado:** Aprobado  
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-08
> **Objetivo:** Construir la página `/acerca` portando `references/templates/home-about/about.jsx` tal cual, y hacer que su formulario de contacto envíe un correo real mediante Resend desde una Server Action.

## Por qué existe esta spec

La SPEC 02 dejó fuera "Acerca de" y su formulario. En el template, el formulario solo muestra un éxito simulado (`setSent(name)`) y no envía nada. Esta spec porta la página con el mismo diseño y añade el envío real, que el template no tiene.

Los estilos de "Acerca de" siguen en `references/templates/home-about/styles.css` (aprox. líneas 1072–1155) y no están en `app/globals.css`. Esta spec copia solo los que usa `about.jsx`.

El template no define estado de error de envío. Se añade uno mínimo, coherente con el estilo existente (ver Decisiones).

## Alcance

**Dentro:**

- Nueva ruta `/acerca` con las dos secciones de `about.jsx`:
  1. Hero `ACERCA DE ARCADE VAULT`: kicker `▸ ACERCA DE`, título, texto de misión y 3 tarjetas `highlight` con icono SVG pixel (HEART, BROWSER, PLANT).
  2. Divisor decorativo (`.about-divider`, 24 píxeles animados) y sección `CONTÁCTANOS` con intro (3 `tip` con LED) y formulario.
- Formulario con campos `NOMBRE`, `CORREO ELECTRÓNICO`, `MENSAJE` y botón `▶  ENVIAR MENSAJE`, con los mismos textos y placeholders del template.
- Envío real con Resend desde una Server Action (`'use server'`) usando `useActionState`.
- Validación en servidor: campos obligatorios, correo con formato válido, límites de largo.
- Campo honeypot oculto contra bots.
- Estados del formulario: normal, enviando, error de validación (con animación `shake` del template), error de envío y éxito con la terminal `VAULT-OS // TERMINAL` mostrando `GRACIAS, {NOMBRE EN MAYÚSCULAS}.`.
- Botón `ENVIAR OTRO MENSAJE` que vuelve al formulario vacío.
- Efecto "reveal" en el divisor y en la sección de contacto, reutilizando `components/home/reveal.tsx` de la SPEC 02.
- Navbar: añadir enlace "Acerca de" (`/acerca`) en escritorio y panel móvil, con estado activo, después de "Salón de la Fama" como en `nav.jsx`.
- Copiar a `app/globals.css` solo las clases de `about.jsx` que no existan (`.about*`, `.highlight*`, `.hl-*`, `.div-*`, `.contact-*`, `.tip*`, `.terminal-success`, `.term-*`, `.btn.press:active`, `@keyframes shake` y media queries asociadas) y la regla `textarea` dentro de `.field` si hace falta.
- Dependencia `resend` en `package.json` y variables de entorno documentadas en `.env.example`.
- Metadatos de página (`title`, `description`) de `/acerca`.
- Contenido en español, igual que el template.

**Fuera de alcance (specs futuras):**

- Dominio propio verificado en Resend; el remitente es `onboarding@resend.dev`.
- Límite de envíos por IP (rate limit) y CAPTCHA.
- Guardar los mensajes en base de datos o mostrarlos en un panel.
- Correo de confirmación al usuario que escribe.
- Plantillas de correo con React Email; el cuerpo es texto plano.
- Internacionalización.
- Tests automatizados (el proyecto sigue sin test runner).
- Cambios en estilos ya existentes de `app/globals.css`, salvo un bug evidente al portar.
- Enlace a "Acerca de" en el footer.

## Modelo de datos

Sin persistencia. Estructuras nuevas solo para el formulario.

```ts
// lib/contact.ts
export const CONTACT_LIMITS = {
  name: 60,
  email: 120,
  message: 2000,
} as const;

export interface ContactState {
  status: "idle" | "success" | "error";
  /** Nombre ya recortado, para el mensaje de éxito. */
  name?: string;
  /** Mensaje de error mostrado al usuario. */
  error?: string;
  /** Valores reenviados para no perder lo escrito si hay error. */
  values?: { name: string; email: string; message: string };
}
```

```ts
// app/acerca/actions.ts
"use server";
export async function sendContact(
  prev: ContactState,
  formData: FormData,
): Promise<ContactState>;
```

Variables de entorno (solo servidor, sin prefijo `NEXT_PUBLIC_`):

```
RESEND_API_KEY=         # clave de Resend
CONTACT_FROM_EMAIL=     # onboarding@resend.dev
CONTACT_TO_EMAIL=       # correo dueño de la cuenta de Resend
```

Convenciones:

- Campos del `FormData`: `name`, `email`, `message` y el honeypot `website`.
- Asunto del correo: `[ARCADE VAULT] Mensaje de {name}`. Se pasa `replyTo` con el correo del visitante.
- Cuerpo en texto plano: nombre, correo y mensaje.
- Honeypot con valor no vacío: la acción devuelve `status: "success"` sin llamar a Resend, para no dar pistas al bot.
- Sin `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` o `CONTACT_TO_EMAIL`: la acción devuelve `status: "error"` con mensaje genérico y registra el motivo con `console.error`. No lanza excepción.
- Mensajes de error al usuario en español, sin exponer detalles de Resend ni la API key.
- `.env*` ya está en `.gitignore`; solo se versiona `.env.example`, sin valores reales.

## Plan de implementación

1. **Dependencia y entorno.** Instalar `resend`. Crear `.env.example` con las 3 variables vacías. Comprobar que `.env.example` no queda ignorado por `.gitignore` (la regla `.env*` lo ignora; añadir `!.env.example`). Verificación: `npm run build` pasa.
2. **Estilos de "Acerca de".** Copiar de `references/templates/home-about/styles.css` a `app/globals.css` solo las clases de `about.jsx` listadas en el alcance. No duplicar reglas ya presentes ni tocar las existentes. Verificación: `npm run build` sin errores; `/juegos`, `/` y `/salon` se ven igual.
3. **Lógica de contacto.** Crear `lib/contact.ts` (límites y tipo) y `app/acerca/actions.ts` con `sendContact`: honeypot, recorte (`trim`), validación, envío con Resend, manejo de errores. Verificación: `npx tsc --noEmit` y `npm run lint` pasan.
4. **Componentes.** Crear:
   - `components/about/highlight-icon.tsx` (Server Component, iconos HEART, BROWSER, PLANT con `aria-hidden`).
   - `components/about/contact-form.tsx` (cliente, `useActionState(sendContact, ...)`; muestra formulario, `shake` en error, terminal en éxito, botón `ENVIAR OTRO MENSAJE`; botón deshabilitado con `useFormStatus` o `isPending` mientras envía).
   Verificación: compilan e importan sin errores de tipos.
5. **Página y navbar.** Crear `app/acerca/page.tsx` (Server Component, metadatos) con hero, divisor y contacto, usando `Reveal` donde el template usa `.reveal`. Añadir "Acerca de" a `components/nav.tsx` (escritorio, panel móvil y estado activo por `usePathname`). Leer `node_modules/next/dist/docs/` (Server Actions y `cacheComponents`) antes de escribir la acción. Verificación: abrir `/acerca` desde el navbar y enviar un mensaje real con las variables configuradas.
6. **Pulido.** Revisar vista móvil (rejilla `highlight-row` y `contact-grid` en una columna, sin scroll horizontal) y que `npm run lint` y `npm run build` terminen sin errores ni avisos de deprecación nuevos.

## Criterios de aceptación

- [x] `npm run lint` y `npm run build` terminan sin errores ni avisos de deprecación nuevos.
- [x] `/acerca` muestra, en orden: kicker `▸ ACERCA DE`, título `ACERCA DE ARCADE VAULT`, texto de misión, 3 tarjetas highlight, divisor con 24 píxeles y la sección `CONTÁCTANOS`.
- [x] Las 3 tarjetas muestran los textos `HECHO CON ❤️ PARA JUGADORES`, `JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR` y `PROYECTO EN CONSTANTE CRECIMIENTO`, en magenta, cian y verde.
- [x] La intro de contacto muestra los 3 tips `RESPUESTA EN 24-48H`, `SUGERENCIAS BIENVENIDAS` y `SIN SPAM, JAMÁS`.
- [x] El navbar muestra "Acerca de" en escritorio y panel móvil; es el enlace activo solo en `/acerca`.
- [x] Enviar el formulario con algún campo vacío no llama a Resend, aplica la animación `shake` y conserva lo escrito.
- [x] Enviar un correo con formato inválido (ej. `abc@`) devuelve error de validación sin llamar a Resend.
- [x] Un mensaje de más de 2000 caracteres o un nombre de más de 60 devuelve error de validación.
- [x] Con datos válidos y variables correctas, llega un correo a `CONTACT_TO_EMAIL` desde `CONTACT_FROM_EMAIL`, con asunto `[ARCADE VAULT] Mensaje de {nombre}` y `replyTo` igual al correo del visitante.
- [ ] Tras un envío exitoso aparece la terminal `VAULT-OS // TERMINAL` con `MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {NOMBRE EN MAYÚSCULAS}.`.
- [ ] `ENVIAR OTRO MENSAJE` muestra el formulario con los tres campos vacíos.
- [ ] Mientras se envía, el botón queda deshabilitado y no permite un segundo envío.
- [ ] Si Resend falla o faltan variables de entorno, el usuario ve un mensaje de error en español sin detalles internos, el formulario conserva lo escrito y no hay error no controlado en el servidor.
- [ ] Con el campo honeypot `website` relleno no se llama a Resend y la UI muestra éxito.
- [x] `RESEND_API_KEY` no aparece en el código cliente ni en la salida de `npm run build` (`.next/static`).
- [x] `.env.example` existe en el repositorio con las 3 variables vacías; `.env.local` sigue ignorado por git.
- [x] Con ancho menor a 900 px, `highlight-row` y `contact-grid` pasan a una columna y no hay scroll horizontal de página.
- [ ] Recargar `/acerca` con sesión iniciada no produce errores de hidratación en consola.
- [x] `app/globals.css` no tiene reglas duplicadas respecto al template para las clases copiadas y no se modificó ninguna regla anterior.

## Decisiones tomadas y descartadas

- **Sí:** Server Action con `useActionState`. Sin endpoint público que mantener y encaja con Next 16 / React 19. Solicitado en la definición.
- **No:** Route Handler `POST /api/contacto`. Solo tendría sentido con un cliente externo.
- **Sí:** remitente `onboarding@resend.dev`, destino en `CONTACT_TO_EMAIL`. Sin dominio propio, Resend limita el destino al correo de la cuenta. Remitente y destino en variables de entorno para cambiarlos sin tocar código.
- **No:** dominio verificado. No existe aún; va en otra spec cuando haya dominio.
- **Sí:** validación en servidor más honeypot. Sin infraestructura extra. El cliente no es de fiar y el template solo validaba en cliente.
- **No:** rate limit y CAPTCHA. En serverless un límite en memoria no es fiable sin Redis/KV y abriría otra dependencia.
- **Sí:** ruta `/acerca`. Coherente con `/juegos` y `/salon`.
- **No:** `/about`. Mezclaría inglés en las URLs.
- **Sí:** enlace "Acerca de" en el navbar. Reemplaza la exclusión de la SPEC 02, cuya razón (página inexistente) ya no aplica.
- **Sí:** honeypot devuelve éxito falso. No avisa al bot de que fue detectado.
- **Sí:** añadir un estado de error de envío, ausente en el template. Sin él, un fallo de Resend dejaría al usuario sin respuesta. Se muestra como línea de texto dentro del formulario, con los estilos existentes.
- **Sí:** correo en texto plano. Basta para un buzón interno; React Email añade dependencia sin valor aquí.
- **Sí:** reutilizar `Reveal` de la SPEC 02 en lugar del `useReveal` global del template, por la misma razón de aquella spec.
- **Sí:** estilos copiados a `app/globals.css` solo los de "Acerca de". Evita CSS muerto.
- **No:** correo de confirmación al visitante. Duplica el envío y expone el dominio de pruebas.

## Riesgos identificados

| Riesgo | Mitigación |
| ------ | ---------- |
| `onboarding@resend.dev` solo entrega al correo dueño de la cuenta; otro destino falla | `CONTACT_TO_EMAIL` debe ser ese correo; documentarlo en `.env.example`. Un fallo se ve como error de envío controlado. |
| Next 16.4.3 con `cacheComponents` cambia reglas de Server Actions y componentes cliente | Leer `node_modules/next/dist/docs/` (empezar por `index.md`) antes de escribir la acción; atender avisos de deprecación. |
| La API key se filtra al cliente | Leerla solo en `app/acerca/actions.ts` (`'use server'`), sin prefijo `NEXT_PUBLIC_`; verificar `.next/static` tras el build. |
| Spam de bots | Honeypot + validación. Si el abuso aparece, rate limit en otra spec. |
| Inyección de cabeceras vía nombre en el asunto | Quitar saltos de línea del nombre antes de armarlo; `replyTo` solo con correo validado. |
| Copiar CSS del template pisa reglas existentes | Comparar contra `app/globals.css`; copiar solo clases nuevas; revisar `/`, `/juegos` y `/auth` (`.field`) tras el cambio. |
| Se pierde lo escrito si falla el envío (React 19 resetea el formulario tras la acción) | Devolver `values` en el estado y usarlos como `defaultValue`. |
| Doble envío por doble clic | Botón deshabilitado mientras `isPending`. |

## Qué **no** está en esta spec

- Dominio propio verificado en Resend.
- Rate limit, CAPTCHA o cualquier protección más allá de honeypot y validación.
- Almacenamiento o panel de mensajes.
- Correo de confirmación al visitante y plantillas HTML.
- Enlace a "Acerca de" en el footer.
- Tests automatizados.

Cada uno de estos puntos, si se aborda, va en su propia spec.
