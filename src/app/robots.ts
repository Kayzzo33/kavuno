import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kavuno.com.br";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalogo", "/produtos/", "/validacao"],
        disallow: [
          "/kavuno-gestao/",
          "/api/",
          "/perfil",
          "/checkout",
          "/carrinho",
          "/auth/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

