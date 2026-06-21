import "@repo/tailwind-config/globals.css";

export const metadata = {
  title: "DriverOS - Gestão para Motoristas",
  description:
    "Plataforma SaaS completa para gestão operacional e financeira de motoristas de aplicativo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-white">{children}</body>
    </html>
  );
}
