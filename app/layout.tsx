import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PixelStage — Flux AI студия",
  description:
    "Создавайте визуальное искусство на базе Flux AI. Скорость, качество и безопасность для креаторов и команд.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={{ locale: "ru-RU" }}>
      <html lang="ru" className="dark" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Navbar />
          {children}
          <Toaster theme="dark" position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
