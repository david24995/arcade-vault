"use server";

import { Resend } from "resend";
import { CONTACT_LIMITS, type ContactState } from "@/lib/contact";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_ERROR = "No pudimos enviar tu mensaje. Inténtalo de nuevo más tarde.";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function sendContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Honeypot: un bot lo rellena; fingimos éxito sin llamar a Resend.
  if (field(formData, "website") !== "") {
    return { status: "success", name: "AGENTE" };
  }

  // Sin saltos de línea en el nombre: evita inyección de cabeceras en el asunto.
  const name = field(formData, "name").replace(/[\r\n]+/g, " ").trim();
  const email = field(formData, "email");
  const message = field(formData, "message");
  const values = { name, email, message };

  const fail = (error: string): ContactState => ({
    status: "error",
    error,
    values,
  });

  if (!name || !email || !message) {
    return fail("COMPLETA TODOS LOS CAMPOS.");
  }
  if (name.length > CONTACT_LIMITS.name) {
    return fail(`EL NOMBRE NO PUEDE SUPERAR ${CONTACT_LIMITS.name} CARACTERES.`);
  }
  if (email.length > CONTACT_LIMITS.email || !EMAIL_RE.test(email)) {
    return fail("INGRESA UN CORREO ELECTRÓNICO VÁLIDO.");
  }
  if (message.length > CONTACT_LIMITS.message) {
    return fail(`EL MENSAJE NO PUEDE SUPERAR ${CONTACT_LIMITS.message} CARACTERES.`);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !from || !to) {
    console.error(
      "[contacto] Faltan variables de entorno: RESEND_API_KEY, CONTACT_FROM_EMAIL o CONTACT_TO_EMAIL.",
    );
    return fail(GENERIC_ERROR);
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[ARCADE VAULT] Mensaje de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\n${message}`,
    });
    if (error) {
      console.error("[contacto] Resend devolvió error:", error);
      return fail(GENERIC_ERROR);
    }
  } catch (err) {
    console.error("[contacto] Fallo al enviar con Resend:", err);
    return fail(GENERIC_ERROR);
  }

  return { status: "success", name };
}
