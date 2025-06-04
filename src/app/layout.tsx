import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Magic Chat - MTG AI Assistant",
  description: "An AI-powered chat interface for Magic: The Gathering questions, deck building, and rules assistance.",
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
