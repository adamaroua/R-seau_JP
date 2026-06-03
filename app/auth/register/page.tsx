import Link from "next/link";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthFrame
      title="Inscription"
      subtitle="Un identifiant, un mot de passe, et c'est parti."
      footer={
        <>
          Deja inscrit ?{" "}
          <Link href="/auth/login" className="font-bold text-danger">
            Connexion
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthFrame>
  );
}
