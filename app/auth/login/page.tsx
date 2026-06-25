import Link from "next/link";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthFrame
      title="Connexion"
      subtitle="Entre avec ton identifiant Jean Prevost."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/auth/register" className="font-bold text-danger">
            Inscription
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthFrame>
  );
}
