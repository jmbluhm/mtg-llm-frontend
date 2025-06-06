import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'CommanderGPT',
  description: 'Your MTG AI Companion',
  keywords: ["Magic: The Gathering", "MTG", "AI", "Chatbot", "Deck Building", "Rules"],
  authors: [{ name: "MTG Chat Team" }],
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/iconWithBackground.png', type: 'image/png' }
    ],
  },
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
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
