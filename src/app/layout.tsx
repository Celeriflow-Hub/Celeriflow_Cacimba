import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CeleriFlow | Plataforma integrada para administração pública municipal",
  description: "Processos ágeis, decisões seguras e dados confiáveis para a administração pública.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
