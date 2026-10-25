"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { Database } from "@/types/database.types";

type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];

export interface ProductGalleryProps {
  images: ProductImageRow[];
  productName: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div
        style={{
          width: "100%",
          paddingTop: "75%",
          position: "relative",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            gap: "0.5rem",
          }}
        >
          <span>[ GALERIA TÉCNICA // SEM FOTOS ]</span>
          <span style={{ fontSize: "0.75rem" }}>Aguardando upload de fotos de impressão real</span>
        </div>
      </div>
    );
  }

  const currentImage = images[selectedIndex] || images[0];

  return (
    <div>
      {/* Imagem Principal em Destaque */}
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "75%", // 4:3
          backgroundColor: "var(--bg-canvas)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          marginBottom: "var(--spacing-md)",
        }}
      >
        <Image
          src={currentImage.image_url}
          alt={currentImage.alt_text || `${productName} - Foto ${selectedIndex + 1}`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* Miniaturas de Navegação */}
      {images.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
          {images.map((img, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                style={{
                  position: "relative",
                  width: "72px",
                  height: "72px",
                  flexShrink: 0,
                  backgroundColor: "var(--bg-surface)",
                  border: isSelected
                    ? "2px solid var(--color-primary)"
                    : "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  overflow: "hidden",
                  cursor: "pointer",
                  padding: 0,
                  outline: "none",
                  transition: "border-color var(--transition-fast)",
                }}
              >
                <Image
                  src={img.image_url}
                  alt={img.alt_text || `Miniatura ${idx + 1}`}
                  fill
                  sizes="72px"
                  style={{ objectFit: "cover" }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
