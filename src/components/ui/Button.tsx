import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "bracket" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  ...props
}) => {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    bracket: "btn-bracket",
    danger: "btn-danger",
  }[variant];

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "0.5rem 0.875rem", fontSize: "0.75rem" },
    md: { padding: "0.75rem 1.25rem", fontSize: "0.875rem" },
    lg: { padding: "0.875rem 1.75rem", fontSize: "1rem" },
  };

  return (
    <button
      className={`btn ${variantClass} ${className}`}
      style={sizeStyles[size]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="tech-spinner" style={{ width: "1rem", height: "1rem" }} />
          <span>PROCESSANDO...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
