import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "Yönetici girişi" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
