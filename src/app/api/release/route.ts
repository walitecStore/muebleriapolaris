import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json(
    {
      name: 'Polaris',
      release: process.env.NEXT_PUBLIC_APP_RELEASE || 'local',
      canonicalUrl: 'https://muebleriapolaris.vercel.app',
      features: [
        'product-cards',
        'favorites',
        'owner-access',
        'sellers',
        'offers',
        'wheel',
        'installable-app',
      ],
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
