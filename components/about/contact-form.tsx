"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendContact } from "@/app/acerca/actions";
import { CONTACT_LIMITS, type ContactState } from "@/lib/contact";

const INITIAL_STATE: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(
    sendContact,
    INITIAL_STATE,
  );
  // Estado de éxito ya descartado con "ENVIAR OTRO MENSAJE".
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Reinicia la animación shake en cada error, aunque sea consecutivo.
  useEffect(() => {
    const el = formRef.current;
    if (!el || state.status !== "error") return;
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
    const t = window.setTimeout(() => el.classList.remove("shake"), 400);
    return () => window.clearTimeout(t);
  }, [state]);

  const showSuccess = state.status === "success" && state !== dismissed;
  const values = state.values;

  return (
    <form ref={formRef} className="contact-form" action={formAction} noValidate>
      {!showSuccess ? (
        <>
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              defaultValue={values?.name}
              placeholder="px_kai"
              maxLength={CONTACT_LIMITS.name}
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              defaultValue={values?.email}
              placeholder="jugador@vault.gg"
              maxLength={CONTACT_LIMITS.email}
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-message">MENSAJE</label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              defaultValue={values?.message}
              placeholder="Cuéntanos qué tienes en mente…"
              maxLength={CONTACT_LIMITS.message}
            />
          </div>

          {/* Honeypot: invisible para personas, los bots suelen rellenarlo. */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
          >
            <label htmlFor="contact-website">NO RELLENAR</label>
            <input
              id="contact-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {state.status === "error" && state.error && (
            <p
              role="alert"
              className="pixel"
              style={{
                margin: "0 0 14px",
                fontSize: 9,
                lineHeight: 1.7,
                letterSpacing: "0.1em",
                color: "var(--magenta)",
              }}
            >
              ▸ {state.error}
            </p>
          )}

          <button
            className="btn xl press"
            type="submit"
            disabled={isPending}
            style={{ width: "100%" }}
          >
            {isPending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      ) : (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span>
            <span className="dot y"></span>
            <span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success" role="status">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS,{" "}
              {(state.name ?? "").toUpperCase()}.<span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button
                className="btn ghost"
                type="button"
                onClick={() => setDismissed(state)}
              >
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
