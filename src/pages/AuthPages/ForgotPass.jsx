import { useEffect } from "react";
import AuthLayout from "../../layout/AuthPageLayout";
import ForgotPassForm from "../../components/auth/ForgotPassForm";

export default function ForgotPass() {
  useEffect(() => {
    // Asegurar que el título se actualice cuando el componente se monte
    document.title = "Recuperar Contraseña - Hotel Plaza Trujillo";
  }, []);

  return (
    <AuthLayout>
      <ForgotPassForm />
    </AuthLayout>
  );
}