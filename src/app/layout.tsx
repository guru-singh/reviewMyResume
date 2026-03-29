import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthTopBar } from "@/components/AuthTopBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resume Review MVP",
  description: "AI-powered ATS scoring, resume reviews, and rewrite suggestions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthTopBar />
        {children}
      </body>
    </html>
  );
}
