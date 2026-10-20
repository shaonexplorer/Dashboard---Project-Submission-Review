import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
    <html lang="en" className={`${geist.variable} font-sans`}>
      <body className="bg-background text-foreground min-h-screen">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}