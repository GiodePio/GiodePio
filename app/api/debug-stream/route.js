export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({ status: 'ok', time: new Date().toISOString() });
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  const contentLength = request.headers.get('content-length');
  return Response.json({
    received: true,
    username: authHeader?.replace('Bearer ', '') || 'none',
    contentType,
    contentLength,
    time: new Date().toISOString()
  });
}