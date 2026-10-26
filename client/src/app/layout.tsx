import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import { materialSymbolsHref } from "@/lib/material-symbols";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Project Submission & Review Dashboard",
  description: "A platform where students submit project work and mentors review submissions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
      <head>
        <link rel="stylesheet" href={materialSymbolsHref} />
      </head>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}