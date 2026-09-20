import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSS Logistics | Direct to every direction",
  description: "Commercial freight, courier shipping, pickup, tracking, billing, and shipment support from PSS Logistics.",
  keywords: ["logistics", "freight forwarding", "courier shipping", "shipment tracking", "business shipping", "India logistics"],
  metadataBase: new URL("https://psslogistics.in"),
  alternates: { canonical: "/" },
  openGraph: { title: "PSS Logistics | Direct to every direction", description: "Commercial freight, courier shipping, pickup, tracking, billing, and shipment support.", url: "https://psslogistics.in", siteName: "PSS Logistics", type: "website", images: [{ url: "/brand/pss-logo.png", alt: "PSS Logistics" }] },
  twitter: { card: "summary", title: "PSS Logistics | Direct to every direction", description: "Commercial freight and courier logistics with every movement in view." },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
