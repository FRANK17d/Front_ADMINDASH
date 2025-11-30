import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";

// Esquema de validación
const schema = yup.object({
  email: yup
    .string()
    .email("Formato de correo inválido")
    .required("El correo es requerido"),
});

export default function ForgotPassForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  // Efecto para el contador de 60 segundos
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSuccess, countdown]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setIsSuccess(false);
    setCountdown(0);

    try {
      console.log("Enviando email de recuperación a:", data.email);
      await sendPasswordResetEmail(auth, data.email);
      
      // Mostrar mensaje de éxito e iniciar contador de 60 segundos
      setIsSuccess(true);
      setCountdown(60);
      console.log("Email de recuperación enviado exitosamente");
      
    } catch (error) {
      console.error("Error al enviar email de recuperación:", error);
      
      let errorMessage = "Error al enviar el correo. Intenta nuevamente.";
      
      // Manejar errores específicos de Firebase
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No existe una cuenta con este correo electrónico.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "El correo electrónico no es válido.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Demasiados intentos. Intenta más tarde.";
      }
      
      setError("general", {
        type: "server",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Olvidaste tu contraseña?
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ingresa tu correo electrónico para recibir las instrucciones de recuperación de contraseña.
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)} name="forgotPasswordForm">
              <div className="space-y-5">
                {/* Mensaje de éxito */}
                {isSuccess && (
                  <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    ¡Email enviado exitosamente! Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                    {countdown > 0 && (
                      <p className="mt-2 text-xs">
                        Puedes reenviar el correo en {countdown} segundos.
                      </p>
                    )}
                  </div>
                )}

                {/* Error general */}
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                    {errors.general.message}
                  </div>
                )}

                {/* Email */}
                <div>
                  <Label htmlFor="email">
                    Correo<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="Ingresa tu correo"
                    autoComplete="email"
                    {...register("email")}
                    error={!!errors.email}
                    hint={errors.email?.message}
                  />
                </div>
                {/* Button */}
                <div>
                  <button
                    type="submit"
                    disabled={isLoading || (isSuccess && countdown > 0)}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-orange-500 shadow-theme-xs hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </span>
                    ) : isSuccess && countdown > 0 ? (
                      `Reenviar en ${countdown}s`
                    ) : isSuccess ? (
                      "Reenviar correo"
                    ) : (
                      "Enviar enlace de recuperación"
                    )}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Recordaste tu contraseña? {""}
                <Link
                  to="/iniciar-sesion"
                  className="text-orange-500 hover:text-orange-600 dark:text-orange-400"
                >
                  Iniciar Sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}