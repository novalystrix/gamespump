import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://gamespump.onrender.com"),
  title: "GamesPump — Party Games for Everyone",
  description: "No signup, no downloads. Just pick a name, join a room, and play. Mobile-first party games for groups of friends and family.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
  openGraph: {
    title: "GamesPump — Party Games for Everyone",
    description: "No signup. No downloads. Pick a name. Play with friends.",
    url: "https://gamespump.onrender.com",
    siteName: "GamesPump",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GamesPump — Party Games for Everyone",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GamesPump — Party Games for Everyone",
    description: "No signup. No downloads. Pick a name. Play with friends.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "GamesPump",
              "description": "No signup, no downloads. Party games for everyone.",
              "url": "https://gamespump.onrender.com",
              "applicationCategory": "GameApplication",
              "operatingSystem": "Any",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg"
        >
          Skip to content
        </a>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
