import React from "react";

export interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
  className = "",
}) => {
  const alertClass = {
    info: "alert-info",
    success: "alert-success",
    warning: "alert-warning",
    error: "alert-error",
  }[type];

  return (
    <div className={`alert ${alertClass} ${className}`} role="alert">
      <div>
        {title && (
          <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)", marginBottom: "0.25rem" }}>
            {title}
          </div>
        )}
        <div style={{ lineHeight: 1.4 }}>{children}</div>
      </div>
    </div>
  );
};
