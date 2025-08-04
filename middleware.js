import { NextResponse } from 'next/server';

export function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const isBot = /bot|crawl|spider|slack|facebook|discord|whatsapp/i.test(ua);

  const { pathname } = new URL(request.url);
  const match = pathname.match(/^\/event\/([^/]+)/);

  if (isBot && match) {
    const slug = match[1];
    return NextResponse.redirect(
      `https://photos.manchestergents.com/api/seo?slug=${slug}`,
      307
    );
  }

  return NextResponse.next();
}
