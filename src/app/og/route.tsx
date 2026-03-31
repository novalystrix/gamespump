import { ImageResponse } from 'next/og';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 30%, #ec4899 70%, #f97316 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Game icons scattered */}
        <div style={{ position: 'absolute', top: '40px', left: '60px', fontSize: '64px', opacity: 0.3, display: 'flex' }}>🎲</div>
        <div style={{ position: 'absolute', top: '80px', right: '80px', fontSize: '56px', opacity: 0.3, display: 'flex' }}>🎯</div>
        <div style={{ position: 'absolute', bottom: '60px', left: '100px', fontSize: '48px', opacity: 0.3, display: 'flex' }}>🏆</div>
        <div style={{ position: 'absolute', bottom: '80px', right: '60px', fontSize: '60px', opacity: 0.3, display: 'flex' }}>🎮</div>
        <div style={{ position: 'absolute', top: '160px', left: '200px', fontSize: '40px', opacity: 0.2, display: 'flex' }}>⚡</div>
        <div style={{ position: 'absolute', bottom: '160px', right: '200px', fontSize: '40px', opacity: 0.2, display: 'flex' }}>🎉</div>

        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '96px',
              fontWeight: 900,
              color: 'white',
              textShadow: '0 4px 12px rgba(0,0,0,0.3)',
              letterSpacing: '-2px',
              display: 'flex',
            }}
          >
            🎮 GamesPump
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.85)',
              display: 'flex',
            }}
          >
            Party Games for Everyone
          </div>
          <div
            style={{
              marginTop: '24px',
              padding: '16px 48px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '24px',
              fontSize: '24px',
              fontWeight: 600,
              color: 'white',
              display: 'flex',
            }}
          >
            No signup · No downloads · Just play
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
