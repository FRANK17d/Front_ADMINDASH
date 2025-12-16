import React, { forwardRef, useRef } from "react";

const Input = forwardRef(({
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  className = "",
  min,
  max,
  step,
  disabled = false,
  success = false,
  error = false,
  hint,
  ...props
}, ref) => {
  const inputRef = useRef(null);
  const actualRef = ref || inputRef;

  // Función para abrir el picker nativo cuando se hace clic en el icono
  const handleIconClick = () => {
    if (type === "date" && actualRef?.current && !disabled) {
      actualRef.current.showPicker?.();
    }
  };

  // Ajustar padding derecho para inputs de tipo date (para el icono)
  const paddingRight = type === "date" ? "pr-10" : "pr-4";
  let inputClasses = ` h-11 w-full rounded-lg border appearance-none px-4 ${paddingRight} py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-black/5 dark:text-white dark:placeholder:text-white/30 ${className}`;

  if (disabled) {
    inputClasses += ` text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 opacity-40`;
  } else if (error) {
    inputClasses += ` border-red-500 focus:border-red-300 focus:ring-red-500/20 dark:text-red-400 dark:border-red-500 dark:focus:border-red-800`;
  } else if (success) {
    inputClasses += ` border-green-500 focus:border-green-300 focus:ring-green-500/20 dark:text-green-400 dark:border-green-500 dark:focus:border-green-800`;
  } else {
    inputClasses += ` bg-white text-black border-gray-300 focus:border-orange-300 focus:ring-orange-500/20 dark:bg-black dark:text-white dark:border-gray-700 dark:focus:border-orange-800`;
  }

  return (
    <div className="relative">
      <input
        ref={actualRef}
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={inputClasses}
        {...props}
      />

      {/* Icono de calendario para inputs de tipo date */}
      {type === "date" && !disabled && (
        <button
          type="button"
          onClick={handleIconClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer z-10"
          tabIndex={-1}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      )}

      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-red-500"
              : success
              ? "text-green-500"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
