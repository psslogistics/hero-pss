import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./hero-performance.css";

export const metadata: Metadata = {
  title: "PSS Logistics | Courier, Freight & Shipment Tracking in India",
  description: "PSS Logistics helps businesses book courier and freight shipments, manage pickups, track AWB numbers, and control delivery operations across India.",
  keywords: ["logistics", "freight forwarding", "courier shipping", "shipment tracking", "business shipping", "India logistics"],
  applicationName: "PSS Logistics",
  creator: "PSS Logistics",
  publisher: "PSS Logistics",
  category: "business",
  formatDetection: { telephone: false },
  metadataBase: new URL("https://psslogistics.in"),
  alternates: { canonical: "https://psslogistics.in/" },
  openGraph: { title: "PSS Logistics | Courier, Freight & Shipment Tracking in India", description: "Book, move, and track business shipments with PSS Logistics.", url: "https://psslogistics.in/", siteName: "PSS Logistics", type: "website", locale: "en_IN", images: [{ url: "/brand/pss-logo.png", width: 1398, height: 432, alt: "PSS Logistics — Direct to every direction" }] },
  twitter: { card: "summary_large_image", title: "PSS Logistics | Courier, Freight & Shipment Tracking in India", description: "Book, move, and track business shipments with PSS Logistics.", images: ["/brand/pss-logo.png"] },
  icons: { icon: "/brand/pss-mark.png" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
