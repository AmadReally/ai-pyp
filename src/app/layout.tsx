import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PYP — Exam Paper Generator",
  description:
    "AI-powered exam paper generator for university students. Upload your source material and past year papers to generate brand new final exam papers instantly.",
  keywords: [
    "exam paper generator",
    "AI exam",
    "past year paper",
    "university exam",
    "study tool",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
