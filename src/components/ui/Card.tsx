import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "bracket" | "standard";
  headerBadge?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "bracket",
  headerBadge,
  className = "",
  style,
  ...props
}) => {
  const isBracket = variant === "bracket";

  return (
    <div
      className={`${isBracket ? "bracket-box" : ""} ${className}`}
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-sm)",
        padding: "var(--spacing-lg)",
        ...style,
      }}
      {...props}
    >
      {headerBadge && (
        <div style={{ marginBottom: "var(--spacing-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {headerBadge}
        </div>
      )}
      {children}
    </div>
  );
};
