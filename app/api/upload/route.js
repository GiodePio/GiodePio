export const dynamic = 'force-dynamic';

import { store } from '@/lib/store';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    let username = 'consentmod';
    if (authHeader) {
      username = authHeader.replace('Bearer ', '').trim() || 'consentmod';
    }

    const body = await request.arrayBuffer();
    const bytes = Buffer.from(body);
    
    if (bytes.length < 100) {
      return Response.json({ error: 'No image data' }, { status: 400 });
    }

    store.setFrame(bytes, username);
    
    return Response.json({ ok: true, username, size: bytes.length });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
