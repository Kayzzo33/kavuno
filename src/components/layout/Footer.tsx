import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        backgroundColor: "var(--bg-canvas)",
        paddingTop: "var(--spacing-2xl)",
        paddingBottom: "var(--spacing-2xl)",
        marginTop: "auto",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "var(--spacing-xl)",
            marginBottom: "var(--spacing-2xl)",
          }}
        >
          {/* Coluna 1: Sobre */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              <img
                src="/logo.png"
                alt="KAVUNO Logo"
                style={{ width: "24px", height: "24px", objectFit: "contain" }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 800,
                  fontSize: "1.125rem",
                  color: "var(--color-primary)",
                  letterSpacing: "0.05em",
                }}
              >
                KAVUNO
              </span>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              Manufatura aditiva de alta precisão, action figures, miniaturas e peças técnicas de alta performance sob demanda.
            </p>
          </div>

          {/* Coluna 2: Modalidades */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              Modalidades Comerciais
            </div>
            <ul
              style={{
                listStyle: "none",
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <li>• Pronta Entrega: Despacho imediato de estoque</li>
              <li>• Pré-venda Paga: Lotes programados com meta</li>
              <li>• Reserva Gratuita: Validação de interesse sem custo</li>
            </ul>
          </div>

          {/* Coluna 3: Engenharia & LGPD */}
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                fontSize: "0.875rem",
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              Transparência & Dados
            </div>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}
            >
              Plataforma desenvolvida em Next.js 15 e PostgreSQL (Supabase Cloud). Em conformidade com a LGPD e princípios Zero Trust.
            </p>
          </div>
        </div>

        {/* Linha Inferior */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "var(--spacing-md)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
          }}
        >
          <div>© {new Date().getFullYear()} KAVUNO — Impressão 3D Profissional. Todos os direitos reservados.</div>
          <div>STATUS OPERACIONAL: PRODUÇÃO PRONTA (B.8)</div>
        </div>
      </div>
    </footer>
  );
};
