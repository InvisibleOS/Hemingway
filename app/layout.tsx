import type { Metadata } from "next";
import { Playfair_Display, Source_Serif_4, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Display serif: high-contrast, editorial. Used for the wordmark, page titles,
// headings, and report headings. Sets the royal, premium tone.
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

// Body serif: humanist and readable at UI sizes. The default face for all copy,
// tables, and controls.
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

// Monospace is kept only for keyboard hints and any digits that must align.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hemingway",
  description: "Internal PR and earned-media operations for Strategi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${sourceSerif.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
