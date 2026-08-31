import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSS Logistics | Direct to every direction",
  description: "Commercial and courier logistics with every movement in view.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
