import type { Metadata } from "next";
import { Manrope, Plus_Jakarta_Sans, JetBrains_Mono, Newsreader } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/wallet/wallet-provider";
import { Header } from "@/components/layout/header";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Puffy — forms worth keeping.",
  description:
    "A form builder for people who would rather not hand their respondents' answers to a third party. Stored on Walrus. Encrypted with Seal. Secured by Sui.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
