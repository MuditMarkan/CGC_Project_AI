import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creator Growth Copilot",
  description: "Turn creator signals into practical, measurable growth experiments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
