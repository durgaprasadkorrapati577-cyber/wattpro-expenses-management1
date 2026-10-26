import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WATTPRO Solar — Expense Management System",
    template: "%s · WATTPRO Solar",
  },
  description:
    "WATTPRO Solar Energy Pvt. Ltd. internal expense desk. Employees log site expenses, bills and receipts; the owner monitors, reviews and approves in real time.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-ink-950 font-sans text-zinc-100 antialiased">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
