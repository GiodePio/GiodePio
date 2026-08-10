export const dynamic = 'force-dynamic';

import { store } from '../../../../lib/store';

export async function POST(request) {
  const { msg } = await request.json();
  
  if (!msg || !msg.trim()) {
    return Response.json({ error: 'No message' }, { status: 400 });
  }

  store.addChat(msg.trim());
  
  return Response.json({ ok: true });
}
