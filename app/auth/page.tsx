import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Acceso",
  description: "Inicia sesión o crea tu cuenta para competir en Arcade Vault.",
};

export default function AuthPage() {
  return <AuthForm />;
}
