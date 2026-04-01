import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://gamespump.onrender.com';

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const code = params.code;
  const ogUrl = `${BASE_URL}/og/room/${code}`;
  const roomUrl = `${BASE_URL}/room/${code}`;

  return {
    title: `Room ${code} — GamesPump`,
    description: `Join room ${code} on GamesPump! Party games with friends — no signup needed.`,
    openGraph: {
      title: `Join my game! Room ${code}`,
      description: 'Party games with friends — no signup, no downloads.',
      url: roomUrl,
      siteName: 'GamesPump',
      images: [{ url: ogUrl, width: 1200, height: 630, alt: `GamesPump Room ${code}` }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Join my game! Room ${code}`,
      description: 'No signup needed — just tap and play.',
      images: [ogUrl],
    },
  };
}

export default function RoomLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
