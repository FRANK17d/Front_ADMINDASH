import { useEffect } from "react";
import AuthLayout from "../../layout/AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  useEffect(() => {
    document.title = "Iniciar sesión - Hotel Plaza Trujillo";
  }, []);

  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
