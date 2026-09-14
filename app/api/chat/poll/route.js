export const dynamic = 'force-dynamic';

import { store } from '@/lib/store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const index = parseInt(searchParams.get('index') || '0');
  const role = searchParams.get('role');
  
  if (role === 'viewer') {
    store.recordViewerActive();
  }

  const result = store.getChat(index);
  const activeViewers = store.getActiveViewers();
  
  return Response.json({
    ...result,
    viewers: activeViewers,
    targetFps: activeViewers > 0 ? 5 : 0.33,
  });
}
