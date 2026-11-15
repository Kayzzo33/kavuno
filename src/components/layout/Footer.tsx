import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: "1px solid #e2e8f0",
        backgroundColor: "#ffffff",
        color: "#475569",
        paddingTop: "3.5rem",
        paddingBottom: "2rem",
        marginTop: "auto",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "2.5rem",
            marginBottom: "2.5rem",
          }}
        >
          {/* Coluna 1: Sobre & Identidade */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginBottom: "1rem",
              }}
            >
              <div style={{ backgroundColor: "#0f172a", borderRadius: "8px", padding: "5px 10px", display: "inline-flex", alignItems: "center" }}>
                <img
                  src="/logo.png"
                  alt="KAVUNO Logo"
                  style={{
                    height: "28px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
            <p
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                lineHeight: 1.6,
                marginBottom: "1rem",
              }}
            >
              Manufatura aditiva e impressão 3D de alta performance. Colecionáveis geek, action figures épicas e suportes técnicos de precisão sob demanda.
            </p>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
              📍 Brasil &bull; Envio seguro para todo o território nacional
            </div>
          </div>

          {/* Coluna 2: Departamentos */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.9375rem",
                color: "#0f172a",
                marginBottom: "1rem",
              }}
            >
              Departamentos
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <li>
                <Link href="/catalogo?modalidade=in_stock" style={{ color: "#10b981", fontWeight: 600, textDecoration: "none" }}>
                  ⚡ Pronta Entrega
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=decoracao-design" style={{ color: "#475569", textDecoration: "none" }}>
                  🎮 Action Figures & Colecionáveis
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=setup-produtividade" style={{ color: "#475569", textDecoration: "none" }}>
                  🖥️ Suportes para Headset & Setup
                </Link>
              </li>
              <li>
                <Link href="/catalogo?categoria=prototipagem-engenharia" style={{ color: "#475569", textDecoration: "none" }}>
                  ⚙️ Peças Técnicas & Mecânicas
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
                color: "#0f172a",
                marginBottom: "1rem",
              }}
            >
              Minha Conta & Ajuda
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: "0.875rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}
            >
              <li>
                <Link href="/perfil" style={{ color: "#475569", textDecoration: "none" }}>
                  Meus Pedidos & Rastreio
                </Link>
              </li>
              <li>
                <Link href="/login" style={{ color: "#475569", textDecoration: "none" }}>
                  Acessar Conta
                </Link>
              </li>
              <li>
                <Link href="/cadastro" style={{ color: "#475569", textDecoration: "none" }}>
                  Cadastrar-se
                </Link>
              </li>
              <li>
                <Link href="/carrinho" style={{ color: "#475569", textDecoration: "none" }}>
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
                color: "#0f172a",
                marginBottom: "1rem",
              }}
            >
              Pagamento 100% Seguro
            </div>
            <p style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: "0.75rem", lineHeight: 1.5 }}>
              Processamento seguro via Mercado Pago com criptografia SSL de ponta a ponta.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <span style={{ padding: "0.35rem 0.65rem", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, color: "#10b981" }}>
                ⚡ PIX com desconto
              </span>
              <span style={{ padding: "0.35rem 0.65rem", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                💳 Cartão até 12x
              </span>
              <span style={{ padding: "0.35rem 0.65rem", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600, color: "#334155" }}>
                📄 Boleto Bancário
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé inferior com Copyright */}
        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            paddingTop: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            fontSize: "0.8125rem",
            color: "#94a3b8",
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} <strong>KAVUNO 3D</strong> &bull; Todos os direitos reservados. E-commerce de Manufatura Aditiva.
          </div>
          <div>
            Design & Tecnologia de Alta Precisão 3D
          </div>
        </div>
      </div>
    </footer>
  );
};
