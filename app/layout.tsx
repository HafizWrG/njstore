import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// --- UPDATE BAGIAN INI ---
export const metadata: Metadata = {
  title: "Wureg Store",
  description: "Digital Products & Services",
  icons: {
    // Pastikan URL ini bisa diakses publik
    icon: 'https://cdn.lynkid.my.id/profile/10-04-2025/1744247502273_9419383',
    // Opsional: Jika ingin spesifik untuk Apple devices
    apple: 'https://cdn.lynkid.my.id/profile/10-04-2025/1744247502273_9419383',
  },
};
// -------------------------

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
