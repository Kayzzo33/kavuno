import React from "react";
import Link from "next/link";
import Image from "next/image";

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        backgroundColor: "#080a0d",
        paddingTop: "3rem",
        paddingBottom: "2rem",
        marginTop: "auto",
      }}
    >
      <div className="container">
        {/* Banner de destaque no rodapé (Estilo streetwear / alta conversão) */}
        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            marginBottom: "3rem",
            border: "1px solid var(--border-medium)",
            background: "linear-gradient(135deg, rgba(255, 92, 0, 0.15) 0%, rgba(13, 16, 23, 0.95) 100%)",
            padding: "clamp(2rem, 5vw, 3.5rem)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            style={{
              textTransform: "uppercase",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              color: "var(--color-primary)",
              marginBottom: "0.75rem",
            }}
          >
            Oficina de Impressão 3D &bull; KAVUNO LAB
          </div>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              maxWidth: "700px",
              lineHeight: 1.15,
              marginBottom: "1rem",
            }}
          >
            CRIADO PARA DURAR. FORJADO COM PRECISÃO.
          </h2>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              maxWidth: "520px",
              marginBottom: "2rem",
              lineHeight: 1.6,
            }}
          >
            Peças exclusivas com preenchimento reforçado, filamentos nobres e entrega rápida em todo o território nacional.
          </p>
          <Link
            href="/catalogo"
            className="btn btn-primary"
            style={{
              padding: "0.85rem 2.25rem",
              fontSize: "0.9375rem",
              fontWeight: 800,
              letterSpacing: "0.05em",
              borderRadius: "var(--radius-full)",
              textTransform: "uppercase",
            }}
          >
            Conferir Catálogo Completo &rarr;
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* Coluna 1: Sobre */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "1rem",
              }}
            >
              <Image
                src="/logo.png"
                alt="KAVUNO Logo"
                width={140}
                height={32}
                style={{ height: "32px", width: "auto", objectFit: "contain" }}
              />
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                marginBottom: "1rem",
              }}
            >
              Manufatura aditiva e impressão 3D de alta performance. Colecionáveis geek, action figures épicas e suportes técnicos de precisão.
            </p>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              📍 Brasil &bull; Envio para todos os estados
            </div>
          </div>

          {/* Coluna 2: Departamentos */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "var(--text-primary)",
                marginBottom: "1rem",
              }}
            >
              Departamentos
            </div>
            <ul
              style={{
                listStyle: "none",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <li>
                <Link href="/catalogo?modalidade=in_stock" style={{ color: "var(--mode-in-stock)", fontWeight: 600 }}>
                  ⚡ Pronta Entrega
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=decoracao-design" style={{ color: "var(--text-secondary)" }}>
                  🎮 Action Figures & Geek
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=setup-produtividade" style={{ color: "var(--text-secondary)" }}>
                  🖥️ Suportes & Setup
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=miniaturas-rpg" style={{ color: "var(--text-secondary)" }}>
                  🎲 Miniaturas para RPG
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=prototipagem-engenharia" style={{ color: "var(--text-secondary)" }}>
                  ⚙️ Peças Mecânicas
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Atendimento e Conta */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "var(--text-primary)",
                marginBottom: "1rem",
              }}
            >
              Minha Conta & Ajuda
            </div>
            <ul
              style={{
                listStyle: "none",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <li>
                <Link href="/perfil" style={{ color: "var(--text-secondary)" }}>
                  Meus Pedidos & Rastreio
                </Link>
              </li>
              <li>
                <Link href="/login" style={{ color: "var(--text-secondary)" }}>
                  Acessar Conta
                </Link>
              </li>
              <li>
                <Link href="/cadastro" style={{ color: "var(--text-secondary)" }}>
                  Criar Conta
                </Link>
              </li>
              <li>
                <Link href="/carrinho" style={{ color: "var(--text-secondary)" }}>
                  Carrinho de Compras
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 4: Pagamento Seguro */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "var(--text-primary)",
                marginBottom: "1rem",
              }}
            >
              Pagamento 100% Seguro
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.75rem", lineHeight: 1.5 }}>
              Processamento seguro via Mercado Pago. Seus dados estão criptografados de ponta a ponta.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 700, color: "var(--mode-in-stock)" }}>
                ⚡ PIX
              </span>
              <span style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600 }}>
                💳 Cartão até 12x
              </span>
              <span style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-sm)", fontSize: "0.75rem", fontWeight: 600 }}>
                📄 Boleto
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé inferior com Copyright e Link Seguro Admin */}
        <div
          style={{
            borderTop: "1px solid var(--border-subtle)",
            paddingTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} <strong>KAVUNO 3D</strong> &bull; Todos os direitos reservados. E-commerce de Impressão 3D.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Link
              href="/admin-login"
              style={{
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                textDecoration: "none",
                transition: "color var(--transition-fast)",
              }}
            >
              🔒 Acesso Administrativo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
