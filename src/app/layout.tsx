import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { LogoutButton } from "@/components/LogoutButton";
import { logoutAction } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Primer Stocks",
  description:
    "Learn to invest by doing — stock data and paper trading, taught in context.",
};

const NAV_LINK_CLASS =
  "text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <nav className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
            <Link href="/" className="font-semibold">
              Primer Stocks
            </Link>
            <Link href="/compare" className={NAV_LINK_CLASS}>
              Compare
            </Link>
            <div className="ml-auto flex items-center gap-6">
              {user ? (
                <>
                  <Link href="/portfolio" className={NAV_LINK_CLASS}>
                    Portfolio
                  </Link>
                  <form action={logoutAction}>
                    <LogoutButton className={NAV_LINK_CLASS} />
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className={NAV_LINK_CLASS}>
                    Log in
                  </Link>
                  <Link href="/signup" className={NAV_LINK_CLASS}>
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
