import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property Management",
  description: "Tenant maintenance requests and rent payment tracking for property managers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
