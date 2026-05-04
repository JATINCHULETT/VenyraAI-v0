import type { Session } from "@auth/core/types";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { auth } from "@/auth";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Venyra AI — SOC 2 compliance, done for you",
  description:
    "Upload your docs. AI handles evidence, controls, and auditor-ready outputs. Built for startups that need calm, inevitable execution.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await auth()) as Session | null;
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} dark`}>
      <body className="min-h-screen antialiased">
        <AppProviders session={session}>{children}</AppProviders>
      </body>
    </html>
  );
}
