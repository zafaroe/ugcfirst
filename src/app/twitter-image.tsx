import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'UGCFirst — Turn product images into viral UGC videos'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  // Load Outfit font from local files (avoids Google Fonts URL issues)
  const outfitBold = fetch(
    new URL('../../public/fonts/Outfit-Bold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer())

  const outfitExtraBold = fetch(
    new URL('../../public/fonts/Outfit-ExtraBold.ttf', import.meta.url)
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0C0A09',
          position: 'relative',
        }}
      >
        {/* Ambient glow - top right */}
        <div
          style={{
            position: 'absolute',
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #10B981 0%, transparent 70%)',
            opacity: 0.08,
            filter: 'blur(160px)',
            top: -350,
            right: -150,
          }}
        />

        {/* Ambient glow - bottom left */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #059669 0%, transparent 70%)',
            opacity: 0.06,
            filter: 'blur(180px)',
            bottom: -300,
            left: -100,
          }}
        />

        {/* Center glow */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #10B981 0%, transparent 70%)',
            filter: 'blur(200px)',
            opacity: 0.05,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '0 80px',
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              marginBottom: 28,
            }}
          >
            <span
              style={{
                fontFamily: 'Outfit',
                fontWeight: 800,
                fontSize: 72,
                letterSpacing: -2,
                color: '#FAFAF9',
              }}
            >
              ugcfirst
            </span>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#10B981',
                marginLeft: 5,
                marginBottom: 4,
                boxShadow: '0 0 24px rgba(16, 185, 129, 0.6), 0 0 60px rgba(16, 185, 129, 0.3)',
              }}
            />
          </div>

          {/* Tagline */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontFamily: 'Outfit',
              fontWeight: 700,
              fontSize: 38,
              letterSpacing: -0.5,
              lineHeight: 1.25,
              color: '#E7E5E4',
            }}
          >
            <span>
              Turn product images into{' '}
              <span style={{ color: '#10B981' }}>viral UGC videos</span>
            </span>
            <span>in under 5 minutes</span>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: 40,
              background: '#1C1917',
              border: '1px solid #44403C',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '22px 40px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  fontSize: 32,
                  letterSpacing: -1,
                  color: '#10B981',
                  lineHeight: 1.1,
                }}
              >
                &lt;5 min
              </span>
              <span
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#78716C',
                  marginTop: 4,
                }}
              >
                per video
              </span>
            </div>

            <div
              style={{
                width: 1,
                height: 60,
                background: '#44403C',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '22px 40px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  fontSize: 32,
                  letterSpacing: -1,
                  color: '#10B981',
                  lineHeight: 1.1,
                }}
              >
                98%
              </span>
              <span
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#78716C',
                  marginTop: 4,
                }}
              >
                cheaper
              </span>
            </div>

            <div
              style={{
                width: 1,
                height: 60,
                background: '#44403C',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '22px 40px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  fontSize: 32,
                  letterSpacing: -1,
                  color: '#10B981',
                  lineHeight: 1.1,
                }}
              >
                3.1x
              </span>
              <span
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#78716C',
                  marginTop: 4,
                }}
              >
                avg ROAS
              </span>
            </div>

            <div
              style={{
                width: 1,
                height: 60,
                background: '#44403C',
              }}
            />

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '22px 40px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 800,
                  fontSize: 32,
                  letterSpacing: -1,
                  color: '#10B981',
                  lineHeight: 1.1,
                }}
              >
                $2.50
              </span>
              <span
                style={{
                  fontFamily: 'Outfit',
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#78716C',
                  marginTop: 4,
                }}
              >
                per video
              </span>
            </div>
          </div>

          {/* URL */}
          <span
            style={{
              fontFamily: 'Outfit',
              fontWeight: 500,
              fontSize: 18,
              color: '#78716C',
              marginTop: 28,
              letterSpacing: 0.5,
            }}
          >
            ugcfirst.com
          </span>
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: 'linear-gradient(90deg, transparent, #34D399, #10B981, #059669, transparent)',
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Outfit',
          data: await outfitBold,
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Outfit',
          data: await outfitExtraBold,
          weight: 800,
          style: 'normal',
        },
      ],
    }
  )
}
