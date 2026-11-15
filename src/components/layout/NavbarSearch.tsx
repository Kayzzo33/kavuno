"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const NavbarSearch: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/catalogo?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/catalogo");
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar action figures, suportes, peças 3D, colecionáveis..."
        style={{
          width: "100%",
          height: "44px",
          paddingLeft: "1.25rem",
          paddingRight: "3rem",
          borderRadius: "9999px",
          backgroundColor: "#f1f5f9",
          border: "1px solid #e2e8f0",
          color: "#0f172a",
          fontSize: "0.875rem",
          outline: "none",
          transition: "all 0.15s ease",
          boxSizing: "border-box",
        }}
        onFocus={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
          e.currentTarget.style.borderColor = "#4f46e5";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.15)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.backgroundColor = "#f1f5f9";
          e.currentTarget.style.borderColor = "#e2e8f0";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      <button
        type="submit"
        aria-label="Buscar produtos"
        style={{
          position: "absolute",
          right: "5px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          backgroundColor: "#4f46e5",
          border: "none",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background-color 0.15s ease",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </form>
  );
};
