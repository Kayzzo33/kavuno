import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kavuno.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "KAVUNO | Impressão 3D Profissional & Action Figures sob Demanda",
    template: "%s | KAVUNO 3D",
  },
  description:
    "E-commerce e manufatura aditiva sob demanda. Colecionáveis, action figures, miniaturas e peças técnicas impressas em 3D de alta precisão (PLA, PETG, ABS, TPU). Pronta entrega e pré-vendas com lotes programados.",
  keywords: [
    "kavuno",
    "impressão 3d",
    "action figures 3d",
    "manufatura aditiva",
    "peças sob demanda",
    "filamento petg",
    "filamento pla",
    "bambu lab p1s",
    "colecionáveis geek",
    "engenharia 3d brasil",
  ],
  authors: [{ name: "KAVUNO 3D Lab", url: appUrl }],
  creator: "KAVUNO",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "KAVUNO | Impressão 3D Profissional & Colecionáveis",
    description:
      "Plataforma profissional de manufatura aditiva e impressão 3D de alta performance. Pronta entrega e lotes programados com rastreabilidade total.",
    url: appUrl,
    siteName: "KAVUNO",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/logo-with-bg.jpg",
        width: 1024,
        height: 1024,
        alt: "KAVUNO 3D Commerce",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KAVUNO | Impressão 3D Profissional",
    description:
      "Action figures, colecionáveis e peças técnicas em impressão 3D de alta precisão.",
    images: ["/logo-with-bg.jpg"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: appUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0c0f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KAVUNO",
    url: appUrl,
    logo: `${appUrl}/logo.png`,
    description:
      "Manufatura aditiva sob demanda, action figures, colecionáveis e peças técnicas de impressão 3D.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "Portuguese",
    },
  };

  const jsonLdWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KAVUNO",
    url: appUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${appUrl}/catalogo?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
      </head>
      <body>
        <CartProvider>
          <Navbar />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
          <CookieConsentBanner />
        </CartProvider>
      </body>
    </html>
  );
}
