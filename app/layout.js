import "./globals.css";

export const metadata = {
  title: "Plan B Navigator",
  description: "Keep chasing JEE. Make your Plan B a strong one. Real 2026 data, personal AI counsellor report in English, Telugu and Hindi.",
};

export const viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;600&family=Noto+Sans+Devanagari:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
