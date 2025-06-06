import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'CommanderGPT',
  description: 'Your MTG AI Companion',
  keywords: ["Magic: The Gathering", "MTG", "AI", "Chatbot", "Deck Building", "Rules"],
  authors: [{ name: "MTG Chat Team" }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
