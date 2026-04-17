import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Equiwings Exam Management System",
  description: "Secure multi-tenant RBAC platform for equestrian evaluations",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1E3A8A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
