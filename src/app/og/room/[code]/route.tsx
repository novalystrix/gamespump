import { ImageResponse } from 'next/og';

export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code;

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
        {/* Decorative emojis */}
        <div style={{ position: 'absolute', top: '40px', left: '60px', fontSize: '64px', opacity: 0.3, display: 'flex' }}>🎲</div>
        <div style={{ position: 'absolute', top: '80px', right: '80px', fontSize: '56px', opacity: 0.3, display: 'flex' }}>🎯</div>
        <div style={{ position: 'absolute', bottom: '60px', left: '100px', fontSize: '48px', opacity: 0.3, display: 'flex' }}>🏆</div>
        <div style={{ position: 'absolute', bottom: '80px', right: '60px', fontSize: '60px', opacity: 0.3, display: 'flex' }}>🎮</div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: '48px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
            }}
          >
            🎮 GamesPump
          </div>

          {/* Join prompt */}
          <div
            style={{
              fontSize: '40px',
              fontWeight: 700,
              color: 'white',
              display: 'flex',
            }}
          >
            Join my game!
          </div>

          {/* Room code - big and bold */}
          <div
            style={{
              marginTop: '8px',
              padding: '24px 64px',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                display: 'flex',
              }}
            >
              Room Code
            </div>
            <div
              style={{
                fontSize: '120px',
                fontWeight: 900,
                color: 'white',
                letterSpacing: '16px',
                textShadow: '0 4px 12px rgba(0,0,0,0.3)',
                display: 'flex',
              }}
            >
              {code}
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              marginTop: '12px',
              fontSize: '24px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
            }}
          >
            No signup needed — just tap and play
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
