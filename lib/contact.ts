// Límites y tipos compartidos entre el formulario (cliente) y la Server Action.
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
