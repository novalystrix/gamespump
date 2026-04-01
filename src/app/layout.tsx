import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { AnalyticsInit } from "@/components/AnalyticsInit";
import { headers } from "next/headers";

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

function getServerLocale(): 'en' | 'he' {
  try {
    const headersList = headers();
    const host = headersList.get('host') || '';
    return host.includes('mamadgames') ? 'he' : 'en';
  } catch {
    return 'en';
  }
}

// Metadata is generated dynamically based on locale
export async function generateMetadata(): Promise<Metadata> {
  const locale = getServerLocale();
  const isHe = locale === 'he';
  const title = isHe ? 'משחקי ממ״ד — משחקים קבוצתיים לכולם' : 'GamesPump — Party Games for Everyone';
  const description = isHe
    ? 'בלי הרשמה, בלי הורדות. פשוט בחרו שם, הצטרפו לחדר ושחקו. משחקים קבוצתיים למובייל לחברים ולמשפחה.'
    : 'No signup, no downloads. Just pick a name, join a room, and play. Mobile-first party games for groups of friends and family.';
  const shortDesc = isHe ? 'בלי הרשמה. בלי הורדות. בחרו שם. שחקו עם חברים.' : 'No signup. No downloads. Pick a name. Play with friends.';
  const siteUrl = isHe ? 'https://mamadgames.com' : 'https://gamespump.onrender.com';
  const siteName = isHe ? 'משחקי ממ״ד' : 'GamesPump';

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    manifest: '/manifest.json',
    icons: {
      icon: '/favicon.ico',
      apple: '/icon-512.png',
    },
    openGraph: {
      title,
      description: shortDesc,
      url: siteUrl,
      siteName,
      images: [
        {
          url: '/og',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: shortDesc,
      images: ['/og'],
    },
  };
}

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
  const locale = getServerLocale();
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={`${inter.variable} ${spaceGrotesk.variable}`}>
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
        <AnalyticsInit />
        {children}
      </body>
    </html>
  );
}
