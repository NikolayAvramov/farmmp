import type { Metadata } from "next";
import { DM_Sans, Literata } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Farm log",
  description: "Simple crop, harvest, inventory, and sales tracking",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      className={`${dmSans.variable} ${literata.variable} min-h-dvh antialiased`}
    >
      <body className="min-h-dvh flex flex-col text-farm-bark">
        <div
          className="relative mx-auto flex w-full min-w-0 max-w-lg flex-col px-3 pb-[var(--farm-content-pad-bottom)] pt-6 sm:px-4 sm:pt-7"
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-1 max-w-lg bg-gradient-to-r from-transparent via-farm-wheat/70 to-transparent"
            aria-hidden
          />
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
