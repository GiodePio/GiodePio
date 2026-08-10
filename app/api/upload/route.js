export const dynamic = 'force-dynamic';

import { store } from '../../../lib/store';

export async function POST(request) {
  const body = await request.arrayBuffer();
  const bytes = Buffer.from(body);
  
  if (bytes.length < 100) {
    return Response.json({ error: 'No image data' }, { status: 400 });
  }

  store.setFrame(bytes);
  
  return Response.json({ ok: true });
}
