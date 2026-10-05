// app/icon.tsx
import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #34d399 0%, #2dd4bf 100%)',
          borderRadius: '22%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          fontWeight: 800,
          color: '#0f172a',
          boxShadow: 'inset 0 0 4px rgba(0, 0, 0, 0.2)',
        }}
      >
        R
      </div>
    ),
    { ...size }
  );
}
