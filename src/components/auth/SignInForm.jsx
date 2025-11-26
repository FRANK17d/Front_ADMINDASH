import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Checkbox from "../../components/form/input/Checkbox";
import Button from "../../components/ui/button/Button";
import { useAuth, ROLES } from "../../context/AuthContext";

// validación
const schema = yup.object({
  email: yup
    .string()
    .email("Formato de correo inválido")
    .required("El correo es requerido"),
  password: yup
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .matches(/[a-z]/, "Debe contener al menos una letra minúscula")
    .matches(/[A-Z]/, "Debe contener al menos una letra mayúscula")
    .matches(/[0-9]/, "Debe contener al menos un número")
    .required("La contraseña es requerida"),
});

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const { login, userRole, user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Efecto para manejar la redirección cuando el usuario se autentica
  useEffect(() => {
    // Solo redirigir si se marcó shouldRedirect (después de un login exitoso)
    if (shouldRedirect && user && userRole && !loading) {
      console.log("Usuario autenticado:", user.email, "Rol:", userRole);
      
      if (userRole === ROLES.ADMIN) {
        navigate('/admin/dashboard');
      } else if (userRole === ROLES.RECEPTIONIST) {
        navigate('/recepcionista/dashboard');
      } else if (userRole === ROLES.HOUSEKEEPING) {
        navigate('/hoteler/dashboard');
      }
    }
  }, [shouldRedirect, user, userRole, loading, navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    console.log("Intentando login con:", data.email);

    try {
      await login(data.email, data.password, isChecked);
      console.log("Login exitoso, esperando redirección...");
      // Activar la redirección después de un login exitoso
      setShouldRedirect(true);
    } catch (error) {
      console.error("Error de login:", error);
      
      let errorMessage = "Error al iniciar sesión. Verifica tus credenciales.";
      
      // Manejar error específico de usuario sin rol
      if (error.message === 'NO_ROLE_ASSIGNED') {
        errorMessage = "Usuario sin rol asignado. Contacta al administrador para obtener acceso.";
      }
      // Manejar error de correo no verificado
      else if (error.message === 'EMAIL_NOT_VERIFIED') {
        errorMessage = "Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada y haz clic en el botón de verificación en el correo que recibiste.";
      }
      // Manejar errores específicos de Firebase
      else if (error.code === 'auth/user-not-found') {
        errorMessage = "Usuario no encontrado.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Contraseña incorrecta.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Email inválido.";
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
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full dark:bg-orange-900/30">
                <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h1 className="mb-2 font-bold text-center text-gray-900 text-title-sm dark:text-white sm:text-title-md">
              Hotel Plaza Trujillo
            </h1>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Sistema de Gestión Hotelera
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)} name="loginForm">
              <div className="space-y-6">
                {/* Error general */}
                {errors.general && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                    <p className="mb-2">{errors.general.message}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="email">
                    Correo <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@gmail.com"
                    autoComplete="email"
                    {...register("email")}
                    error={!!errors.email}
                    hint={errors.email?.message}
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Contraseña <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingresa tu contraseña"
                      autoComplete="current-password"
                      {...register("password")}
                      error={!!errors.password}
                      hint={errors.password?.message}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 cursor-pointer right-4 top-[11px]"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Siempre conectado
                    </span>
                  </div>
                  <Link
                    to="/recuperar-contraseña"
                    className="text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 shadow-lg"
                    size="sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 animate-spin text-orange-500" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verificando credenciales...
                      </span>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}