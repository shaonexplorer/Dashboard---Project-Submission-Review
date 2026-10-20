import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";

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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional&icon_names=sync,terminal,verified,verified_user,security,info,layers,done_all,grading,alt_route,lock,login,arrow_forward,account_balance,visibility,visibility_off,check_circle,radio_button_unchecked,tune,error,mark_email_read,alternate_email,school,code_blocks,person,logout,code,rocket_launch,open_in_new,public,schedule,cancel,rate_review,done,check,more_horiz"
        />
      </head>
      <body className="bg-background text-foreground min-h-screen antialiased">
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}