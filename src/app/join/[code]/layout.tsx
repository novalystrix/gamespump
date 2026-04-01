import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://gamespump.onrender.com';

export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  const code = params.code;
  const ogUrl = `${BASE_URL}/og/room/${code}`;
  const joinUrl = `${BASE_URL}/join/${code}`;

  return {
    title: `Join Game ${code} — GamesPump`,
    description: `Join room ${code} on GamesPump! No signup needed — just tap and play party games with friends.`,
    openGraph: {
      title: `Join my game! Room ${code}`,
      description: 'No signup needed — just tap and play party games with friends.',
      url: joinUrl,
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

export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
