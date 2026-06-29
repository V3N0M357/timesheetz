import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Timesheetz - Effortless Work Logger",
  description: "Type in your hours and rates, view your work log, and manage earnings in a secure dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable}`}>
        {/* Glowing visual blobs for premium dark UI */}
        <div className="glow-blob blob-purple" />
        <div className="glow-blob blob-cyan" />
        {children}
      </body>
    </html>
  );
}
