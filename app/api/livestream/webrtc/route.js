export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { webrtcStore } from '@/lib/webrtc-store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const streamId = searchParams.get('streamId') || 'consentmod';
    const role = searchParams.get('role') || 'viewer';
    const peerId = searchParams.get('peerId') || '';
    const candidateIndex = parseInt(searchParams.get('candidateIndex') || '0', 10);

    if (action === 'list') {
      const active = webrtcStore.getActiveStreams();
      return NextResponse.json({ ok: true, streams: active });
    }

    if (role === 'viewer') {
      const offerData = webrtcStore.getOffer(streamId);
      const { candidates, nextIndex } = webrtcStore.getCandidates(streamId, 'broadcaster', peerId, candidateIndex);
      
      // Ping heartbeat
      if (peerId) webrtcStore.heartbeat(streamId, 'viewer', peerId);

      return NextResponse.json({
        ok: true,
        streamId,
        hasBroadcaster: !!offerData,
        offer: offerData?.offer || null,
        broadcasterId: offerData?.broadcasterId || null,
        metadata: offerData?.metadata || {},
        candidates,
        nextCandidateIndex: nextIndex,
      });
    }

    if (role === 'broadcaster') {
      const answerData = webrtcStore.getAnswer(streamId, peerId);
      const { candidates, nextIndex } = webrtcStore.getCandidates(streamId, 'viewer', peerId, candidateIndex);

      if (peerId) webrtcStore.heartbeat(streamId, 'broadcaster', peerId);

      return NextResponse.json({
        ok: true,
        streamId,
        answer: typeof answerData === 'object' && answerData?.answer ? answerData.answer : answerData,
        viewerId: typeof answerData === 'object' && answerData?.viewerId ? answerData.viewerId : peerId,
        candidates,
        nextCandidateIndex: nextIndex,
      });
    }

    return NextResponse.json({ ok: false, error: 'Invalid role' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, streamId = 'consentmod', role, peerId, sdp, candidate, metadata } = body;

    if (!action) {
      return NextResponse.json({ ok: false, error: 'Action required' }, { status: 400 });
    }

    switch (action) {
      case 'register':
        if (role === 'broadcaster') {
          const bc = webrtcStore.setBroadcaster(streamId, peerId, metadata);
          return NextResponse.json({ ok: true, broadcasterId: bc.id });
        }
        return NextResponse.json({ ok: true });

      case 'offer':
        if (!sdp) return NextResponse.json({ ok: false, error: 'SDP required' }, { status: 400 });
        webrtcStore.setOffer(streamId, sdp, metadata);
        return NextResponse.json({ ok: true, streamId });

      case 'answer':
        if (!sdp) return NextResponse.json({ ok: false, error: 'SDP required' }, { status: 400 });
        webrtcStore.setAnswer(streamId, peerId || 'viewer-' + Date.now(), sdp);
        return NextResponse.json({ ok: true });

      case 'candidate':
        if (!candidate) return NextResponse.json({ ok: false, error: 'Candidate required' }, { status: 400 });
        webrtcStore.addCandidate(streamId, role || 'viewer', peerId, candidate);
        return NextResponse.json({ ok: true });

      case 'heartbeat':
        webrtcStore.heartbeat(streamId, role, peerId);
        return NextResponse.json({ ok: true });

      case 'close':
        webrtcStore.closeStream(streamId);
        return NextResponse.json({ ok: true });

      default:
        return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
