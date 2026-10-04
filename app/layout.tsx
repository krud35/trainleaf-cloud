import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trainleaf — planer ultimate frisbee",
  applicationName: "Trainleaf",
  description: "Twój kalendarz, treningi i obciążenie w jednym miejscu.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
