"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { trackClientEvent } from "@/lib/analytics/tracker";

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  slug: string;
  imageUrl?: string;
  price: number;
  weightG: number;
  commercialMode: "in_stock" | "pre_order" | "interest_lead";
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  totalWeightG: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "3d_commerce_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega do localStorage no cliente
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // Ignora erro de JSON
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persiste no localStorage sempre que alterar
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignora
      }
    }
  }, [items, isLoaded]);

  const addItem = (newItem: CartItem) => {
    // Regra de Domínio: 'interest_lead' NÃO gera compra transacional nem vai para carrinho
    if (newItem.commercialMode === "interest_lead") {
      alert("Produtos em validação de demanda devem ser registrados pelo formulário de reserva gratuita de interesse.");
      return;
    }

    // Dispara evento anônimo de adição ao carrinho
    trackClientEvent({
      eventName: "cart_add",
      productId: newItem.productId,
      metadata: {
        variant_id: newItem.variantId,
        sku: newItem.sku,
        price: newItem.price,
        quantity: newItem.quantity,
        commercial_mode: newItem.commercialMode,
      },
    });

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.variantId === newItem.variantId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (variantId: string) => {
    const itemToRemove = items.find((i) => i.variantId === variantId);
    if (itemToRemove) {
      trackClientEvent({
        eventName: "cart_remove",
        productId: itemToRemove.productId,
        metadata: {
          variant_id: itemToRemove.variantId,
          sku: itemToRemove.sku,
        },
      });
    }
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const totalWeightG = items.reduce((acc, i) => acc + i.weightG * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        totalWeightG,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser utilizado dentro de um CartProvider.");
  }
  return context;
}
