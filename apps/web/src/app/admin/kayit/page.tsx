import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Ücretsiz kayıt" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
