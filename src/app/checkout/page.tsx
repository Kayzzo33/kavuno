"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { processCheckoutAction, type CheckoutActionResult } from "@/app/checkout/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { trackClientEvent } from "@/lib/analytics/tracker";
import Link from "next/link";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cpf: "",
    postalCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "SP",
    paymentMethod: "pix" as "pix" | "credit_card",
    couponCode: "",
  });

  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutActionResult | null>(null);

  // Gera uma idempotencyKey para o pedido na montagem da tela
  const [idempotencyKey] = useState(() => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  // Dispara evento anônimo checkout_start
  useEffect(() => {
    if (items.length > 0) {
      trackClientEvent({
        eventName: "checkout_start",
        metadata: {
          items_count: items.length,
          subtotal: subtotal,
        },
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("Seu carrinho está vazio.");
      return;
    }

    setIsPending(true);
    setErrorMessage(null);

    const result = await processCheckoutAction({
      idempotencyKey,
      items: items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      address: {
        recipientName: formData.fullName,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        postalCode: formData.postalCode,
      },
      guest: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
      },
      couponCode: formData.couponCode.trim() || undefined,
      shippingServiceId: "pac",
      paymentMethod: formData.paymentMethod,
    });

    setIsPending(false);

    if (!result.success) {
      setErrorMessage(result.error || "Ocorreu um erro ao processar o checkout.");
    } else {
      setCheckoutResult(result);
      clearCart();
    }
  };

  // Se o pedido já foi gerado com sucesso:
  if (checkoutResult && checkoutResult.success) {
    return (
      <div className="container" style={{ padding: "var(--spacing-3xl) var(--spacing-md)", maxWidth: "650px" }}>
        <Card variant="bracket" style={{ padding: "var(--spacing-2xl)", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⚡</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--mode-in-stock)", marginBottom: "0.5rem" }}>
            // PEDIDO REGISTRADO COM SUCESSO
          </div>
          <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
            Nº {checkoutResult.orderNumber}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "var(--spacing-lg)" }}>
            Total autorizado: <strong>R$ {checkoutResult.totalAmount?.toFixed(2).replace(".", ",")}</strong>
          </p>

          {formData.paymentMethod === "pix" && checkoutResult.qrCode && (
            <div
              style={{
                padding: "var(--spacing-md)",
                backgroundColor: "var(--bg-canvas)",
                border: "1px dashed var(--border-medium)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "0.5rem" }}>
                PIX COPIA E COLA // PAGAMENTO INSTANTÂNEO
              </div>
              <textarea
                readOnly
                value={checkoutResult.qrCode}
                rows={3}
                className="form-input"
                style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", resize: "none" }}
              />
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: "0.5rem", width: "100%", fontSize: "0.8125rem" }}
                onClick={() => {
                  navigator.clipboard.writeText(checkoutResult.qrCode!);
                  alert("Código Pix copiado com sucesso!");
                }}
              >
                COPIAR CÓDIGO PIX
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link href="/" className="btn btn-bracket">
              VOLTAR À LOJA
            </Link>
            <Link href="/perfil" className="btn btn-bracket">
              VER MEUS PEDIDOS
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: "var(--spacing-3xl) var(--spacing-md)", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
          Não há itens no seu carrinho para finalizar o checkout.
        </p>
        <Link href="/catalogo" className="btn btn-primary">
          IR PARA O CATÁLOGO
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "var(--spacing-2xl) var(--spacing-md)", maxWidth: "800px" }}>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "0.25rem" }}>
          // ETAPA 02 // FINALIZAÇÃO AUTORITATIVA
        </div>
        <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800 }}>
          CHECKOUT & PAGAMENTO
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Preencha seus dados de entrega. O cálculo e a reserva são confirmados no servidor.
        </p>
      </div>

      {errorMessage && (
        <Alert type="error" title="FALHA NO CHECKOUT">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Dados do Cliente */}
        <Card variant="bracket" style={{ padding: "var(--spacing-lg)", marginBottom: "var(--spacing-lg)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "var(--spacing-md)" }}>
            1. DADOS DE IDENTIFICAÇÃO (CLIENTE / VISITANTE)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <Input
              label="Nome Completo *"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ex: Carlos Eduardo"
            />
            <Input
              label="E-mail *"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="carlos@exemplo.com"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Input
              label="WhatsApp / Celular *"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(11) 99999-8888"
            />
            <Input
              label="CPF (opcional p/ NF)"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </div>
        </Card>

        {/* Endereço de Entrega */}
        <Card variant="bracket" style={{ padding: "var(--spacing-lg)", marginBottom: "var(--spacing-lg)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "var(--spacing-md)" }}>
            2. ENDEREÇO DE ENTREGA
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.75rem" }}>
            <Input
              label="CEP *"
              required
              maxLength={9}
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="00000-000"
            />
            <Input
              label="Rua / Logradouro *"
              required
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              placeholder="Av. Paulista"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Input
              label="Número *"
              required
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="1000"
            />
            <Input
              label="Complemento"
              value={formData.complement}
              onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
              placeholder="Apto 42"
            />
            <Input
              label="Bairro *"
              required
              value={formData.neighborhood}
              onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              placeholder="Bela Vista"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
            <Input
              label="Cidade *"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="São Paulo"
            />
            <Input
              label="UF *"
              required
              maxLength={2}
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              placeholder="SP"
            />
          </div>
        </Card>

        {/* Pagamento e Cupom */}
        <Card variant="bracket" style={{ padding: "var(--spacing-lg)", marginBottom: "var(--spacing-lg)" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-primary)", marginBottom: "var(--spacing-md)" }}>
            3. FORMA DE PAGAMENTO & CUPOM
          </div>

          <div style={{ display: "flex", gap: "1rem", marginBottom: "var(--spacing-md)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
              <input
                type="radio"
                name="paymentMethod"
                value="pix"
                checked={formData.paymentMethod === "pix"}
                onChange={() => setFormData({ ...formData, paymentMethod: "pix" })}
              />
              PIX (Aprovação Imediata)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
              <input
                type="radio"
                name="paymentMethod"
                value="credit_card"
                checked={formData.paymentMethod === "credit_card"}
                onChange={() => setFormData({ ...formData, paymentMethod: "credit_card" })}
              />
              Cartão de Crédito
            </label>
          </div>

          <Input
            label="Cupom de Desconto (opcional)"
            value={formData.couponCode}
            onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
            placeholder="Ex: 3DPRIMEIRACOMPRA"
            helperText="Desconto validado e aplicado com precisão no servidor"
          />
        </Card>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--spacing-lg)" }}>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
              Subtotal do Carrinho
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
              R$ {subtotal.toFixed(2).replace(".", ",")}
            </div>
          </div>

          <Button type="submit" variant="primary" isLoading={isPending} style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}>
            FINALIZAR PEDIDO // GERAR PAGAMENTO →
          </Button>
        </div>
      </form>
    </div>
  );
}
