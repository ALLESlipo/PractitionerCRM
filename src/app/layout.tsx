import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gut Health Practitioner Platform",
  description: "Client, test kit and results management for gut health practitioners",
};

async function Nav() {
  const user = await getCurrentUser();
  if (!user) return null;
  const links =
    user.role === "admin"
      ? [{ href: "/admin", label: "Practitioner review" }]
      : user.verified
        ? [
            { href: "/", label: "Dashboard" },
            { href: "/clients", label: "Clients" },
          ]
        : [{ href: "/onboarding", label: "Verification" }];
  return (
    <div className="flex flex-1 items-center justify-between gap-4">
      <nav className="flex gap-4 text-sm">
        {links.map((n) => (
          <Link key={n.href} href={n.href} className="text-slate-600 hover:text-slate-900">
            {n.label}
          </Link>
        ))}
      </nav>
      <form action={logout} className="flex items-center gap-3 text-sm">
        <span className="hidden text-slate-500 sm:inline">{user.fullName}</span>
        <button type="submit" className="text-slate-600 hover:text-slate-900">
          Log out
        </button>
      </form>
    </div>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold text-teal-800">
              Gut Health Platform
            </Link>
            <Suspense>
              <Nav />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
