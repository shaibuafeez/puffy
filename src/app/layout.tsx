import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/wallet/wallet-provider";
import { Header } from "@/components/layout/header";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Walform — Decentralized Forms on Walrus",
  description:
    "Create encrypted feedback forms, surveys, and bug reports stored on Walrus decentralized storage. Powered by Sui and Seal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Toaster
            richColors
            position="bottom-right"
            toastOptions={{
              className: "!rounded-xl !border-border/50 !shadow-lg",
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
