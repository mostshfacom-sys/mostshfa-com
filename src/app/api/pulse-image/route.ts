import { NextRequest, NextResponse } from 'next/server';

const allowedProtocols = new Set(['http:', 'https:']);

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.redirect(new URL('/images/defaults/article.svg', request.url));
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(imageUrl);
  } catch {
    return NextResponse.redirect(new URL('/images/defaults/article.svg', request.url));
  }

  if (!allowedProtocols.has(targetUrl.protocol)) {
    return NextResponse.redirect(new URL('/images/defaults/article.svg', request.url));
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; mostshfa-pulse-image/1.0)',
        Referer: `${request.nextUrl.origin}/medical-brief`,
      },
      next: { revalidate: 60 * 60 * 12 },
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL('/images/defaults/article.svg', request.url));
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return NextResponse.redirect(new URL('/images/defaults/article.svg', request.url));
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, s-maxage=43200, stale-while-revalidate=86400',
      },
    });
  } catch {
    return NextResponse.redirect(new URL('/images/defaults/article.svg', request.url));
  }
}
