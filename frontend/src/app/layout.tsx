import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import { GlobalHeader } from "@/components/navigation/GlobalHeader";
import { MobileBottomBar } from "@/components/navigation/MobileBottomBar";
import { GovernmentFooter } from "@/components/government/GovernmentFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Skill Sphere — PM-AJAY GIA Skilling & Livelihood Assistant",
  description:
    "AI-driven voice assistant for livelihood mapping and NSQF-aligned skilling recommendations for SC communities under the GIA component of PM-AJAY.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-900 selection:text-white pb-14 lg:pb-0`}
      >
        <AppProvider>
          <GlobalHeader />
          <main className="flex-1 flex flex-col">{children}</main>
          <MobileBottomBar />
          <GovernmentFooter />
        </AppProvider>
      </body>
    </html>
  );
}
