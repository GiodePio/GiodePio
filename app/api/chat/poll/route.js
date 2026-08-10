import { store } from '../../../../lib/store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const index = parseInt(searchParams.get('index') || '0');
  
  const result = store.getChat(index);
  
  return Response.json(result);
}
