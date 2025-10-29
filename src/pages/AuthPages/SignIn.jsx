import { useEffect } from "react";
import AuthLayout from "../../layout/AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  useEffect(() => {
    // Asegurar que el título se actualice cuando el componente se monte
    document.title = "Iniciar sesión - Hotel Plaza Trujillo";
  }, []);

  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
