import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/scrollbar.css";
import { Navigation } from "@/components/layout/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enterprise Financial Controls",
  description: "Advanced financial controls and compliance monitoring system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
