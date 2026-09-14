// In-memory WebRTC P2P signaling store
// Manages rooms, broadcasters, and viewers for /livestream and /dashboard/remote-control

class WebRTCStore {
  constructor() {
    this.rooms = new Map();
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 20000);
    }
  }

  getRoom(streamId = 'consentmod') {
    const key = (streamId || 'consentmod').toLowerCase();
    if (!this.rooms.has(key)) {
      this.rooms.set(key, {
        streamId: key,
        broadcaster: null,
        viewers: new Map(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    return this.rooms.get(key);
  }

  setBroadcaster(streamId, broadcasterId, metadata = {}) {
    const room = this.getRoom(streamId);
    room.broadcaster = {
      id: broadcasterId || 'broadcaster-' + Date.now(),
      offer: null,
      candidates: [],
      metadata: metadata || {},
      lastSeen: Date.now(),
    };
    room.updatedAt = Date.now();
    return room.broadcaster;
  }

  setOffer(streamId, sdp, metadata = {}, broadcasterId = null) {
    const room = this.getRoom(streamId);
    if (!room.broadcaster) {
      this.setBroadcaster(streamId, broadcasterId || 'broadcaster-' + Date.now(), metadata);
    } else if (broadcasterId) {
      room.broadcaster.id = broadcasterId;
    }
    room.broadcaster.offer = sdp;
    room.broadcaster.lastSeen = Date.now();
    if (metadata) room.broadcaster.metadata = { ...room.broadcaster.metadata, ...metadata };
    room.updatedAt = Date.now();
    return room.broadcaster;
  }

  getOffer(streamId) {
    const room = this.getRoom(streamId);
    if (room.broadcaster && Date.now() - room.broadcaster.lastSeen < 60000) {
      return {
        offer: room.broadcaster.offer,
        broadcasterId: room.broadcaster.id,
        metadata: room.broadcaster.metadata,
        updatedAt: room.broadcaster.lastSeen,
      };
    }
    return null;
  }

  setAnswer(streamId, viewerId, sdp) {
    const room = this.getRoom(streamId);
    let viewer = room.viewers.get(viewerId);
    if (!viewer) {
      viewer = { id: viewerId, answer: null, candidates: [], lastSeen: Date.now() };
      room.viewers.set(viewerId, viewer);
    }
    viewer.answer = sdp;
    viewer.lastSeen = Date.now();
    room.updatedAt = Date.now();
    return viewer;
  }

  getAnswer(streamId, viewerId = null) {
    const room = this.getRoom(streamId);
    if (viewerId && room.viewers.has(viewerId)) {
      const viewer = room.viewers.get(viewerId);
      return { viewerId: viewer.id, answer: viewer.answer };
    }
    // Return first active viewer answer if viewerId is not found or null
    for (const [, v] of room.viewers) {
      if (v.answer && Date.now() - v.lastSeen < 60000) {
        return { viewerId: v.id, answer: v.answer };
      }
    }
    return null;
  }

  getAllAnswers(streamId) {
    const room = this.getRoom(streamId);
    const answers = [];
    const now = Date.now();
    for (const [, v] of room.viewers) {
      if (v.answer && now - v.lastSeen < 60000) {
        answers.push({ viewerId: v.id, answer: v.answer, lastSeen: v.lastSeen });
      }
    }
    return answers;
  }

  addCandidate(streamId, role, peerId, candidate, targetPeerId = null) {
    const room = this.getRoom(streamId);
    if (role === 'broadcaster') {
      if (room.broadcaster) {
        room.broadcaster.candidates.push({ candidate, targetPeerId, timestamp: Date.now() });
        room.broadcaster.lastSeen = Date.now();
      }
    } else {
      let viewer = room.viewers.get(peerId);
      if (!viewer) {
        viewer = { id: peerId, answer: null, candidates: [], lastSeen: Date.now() };
        room.viewers.set(peerId, viewer);
      }
      viewer.candidates.push({ candidate, targetPeerId, timestamp: Date.now() });
      viewer.lastSeen = Date.now();
    }
    room.updatedAt = Date.now();
  }

  getCandidates(streamId, targetRole, peerId = null, fromIndex = 0) {
    const room = this.getRoom(streamId);
    const start = Math.max(0, parseInt(fromIndex, 10) || 0);

    if (targetRole === 'broadcaster') {
      // Viewer is requesting broadcaster's candidates
      const rawList = room.broadcaster?.candidates || [];
      const list = rawList.map(c => (c && c.candidate ? c.candidate : c));
      return {
        candidates: list.slice(start),
        nextIndex: list.length,
      };
    }

    // Broadcaster is requesting viewer's candidates
    if (peerId && room.viewers.has(peerId)) {
      const viewer = room.viewers.get(peerId);
      const rawList = viewer?.candidates || [];
      const list = rawList.map(c => (c && c.candidate ? c.candidate : c));
      return {
        candidates: list.slice(start),
        nextIndex: list.length,
        viewerId: peerId,
      };
    }

    // Aggregate candidates from all active viewers with viewer IDs
    let all = [];
    for (const [, v] of room.viewers) {
      if (Date.now() - v.lastSeen < 60000) {
        const viewerCandidates = v.candidates.map(c => ({
          viewerId: v.id,
          candidate: c && c.candidate ? c.candidate : c,
        }));
        all = all.concat(viewerCandidates);
      }
    }

    return {
      candidates: all.slice(start),
      nextIndex: all.length,
    };
  }

  heartbeat(streamId, role, peerId) {
    const room = this.getRoom(streamId);
    const now = Date.now();
    if (role === 'broadcaster' && room.broadcaster) {
      room.broadcaster.lastSeen = now;
    } else if (peerId && room.viewers.has(peerId)) {
      room.viewers.get(peerId).lastSeen = now;
    } else if (peerId && role === 'viewer') {
      room.viewers.set(peerId, { id: peerId, answer: null, candidates: [], lastSeen: now });
    }
    room.updatedAt = now;
  }

  closeStream(streamId) {
    const key = (streamId || 'consentmod').toLowerCase();
    this.rooms.delete(key);
  }

  getActiveStreams() {
    const now = Date.now();
    const active = [];
    for (const [streamId, room] of this.rooms) {
      const isBroadcasterLive = room.broadcaster && now - room.broadcaster.lastSeen < 10000;

      if (isBroadcasterLive) {
        active.push({
          streamId,
          hasBroadcaster: isBroadcasterLive,
          broadcasterId: room.broadcaster?.id || null,
          metadata: room.broadcaster?.metadata || { title: `${streamId} P2P Stream` },
          viewersCount: Array.from(room.viewers.values()).filter(v => now - v.lastSeen < 10000).length,
          lastSeen: room.broadcaster?.lastSeen || room.updatedAt,
        });
      }
    }
    return active;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, room] of this.rooms) {
      if (room.broadcaster && now - room.broadcaster.lastSeen > 90000) {
        room.broadcaster = null;
      }
      for (const [vid, v] of room.viewers) {
        if (now - v.lastSeen > 60000) {
          room.viewers.delete(vid);
        }
      }
      if (!room.broadcaster && room.viewers.size === 0 && key !== 'consentmod' && now - room.updatedAt > 120000) {
        this.rooms.delete(key);
      }
    }
  }
}

const globalKey = Symbol.for('giode.webrtc.store');
const store = global[globalKey] || new WebRTCStore();
if (process.env.NODE_ENV !== 'production' || !global[globalKey]) {
  global[globalKey] = store;
}

export const webrtcStore = store;
