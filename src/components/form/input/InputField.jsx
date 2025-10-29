import React, { forwardRef } from "react";

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
  let inputClasses = ` h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-black/5 dark:text-white dark:placeholder:text-white/30 ${className}`;

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
        ref={ref}
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