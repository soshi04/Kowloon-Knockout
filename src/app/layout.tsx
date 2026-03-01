import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kowloon Knockout — 九龍淘汰賽",
  description: "A 2D retro pixel-art boxing game set in 90s Hong Kong. Choose your fighter, master combos, and become the champion of Kowloon.",
  keywords: ["boxing", "game", "retro", "pixel art", "hong kong", "kowloon", "90s", "neon"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
