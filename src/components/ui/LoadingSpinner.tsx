import React from "react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  text,
}) => {
  const sizeMap = {
    sm: "1rem",
    md: "1.5rem",
    lg: "2.25rem",
  };

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.75rem",
        fontFamily: "var(--font-mono)",
        fontSize: "0.875rem",
        color: "var(--text-secondary)",
      }}
    >
      <span
        className="tech-spinner"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
        aria-hidden="true"
      />
      {text && <span>{text}</span>}
    </div>
  );
};
