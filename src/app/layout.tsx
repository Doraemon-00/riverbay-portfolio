import type { Metadata } from "next";
import "./globals.css";

// Staff pages read the session on every request; no static authenticated shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Riverbay · Learning portfolios",
  description:
    "A calm space for teachers to prepare learning portfolios. Fictional demo data only.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
