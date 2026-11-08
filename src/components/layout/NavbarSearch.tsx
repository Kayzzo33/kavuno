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
        maxWidth: "520px",
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar action figures, suportes, peças 3D, colecionáveis..."
        className="search-bar-input"
        style={{
          height: "2.6rem",
          fontSize: "0.875rem",
          paddingLeft: "1.25rem",
          paddingRight: "2.75rem",
        }}
      />
      <button
        type="submit"
        aria-label="Buscar produtos"
        style={{
          position: "absolute",
          right: "4px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "34px",
          height: "34px",
          borderRadius: "var(--radius-full)",
          backgroundColor: "var(--color-primary)",
          border: "none",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background-color var(--transition-fast)",
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
