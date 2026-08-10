import { store } from '../../../lib/store';

export async function GET() {
  const frame = store.getFrame();
  
  if (!frame) {
    return new Response('No frame', { status: 404 });
  }

  return new Response(frame, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-cache',
    },
  });
}
