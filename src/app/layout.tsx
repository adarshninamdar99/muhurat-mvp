import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Muhurat · Wedding previews for A Lovers Card", template: "%s · Muhurat" },
  description: "See your wedding before you book it: your faces, your venue, your décor and outfits, in matching pictures and short clips.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts load from Google Fonts; the fallbacks in tailwind.config.ts show until they arrive. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..700;1,6..96,400..600&family=Work+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
