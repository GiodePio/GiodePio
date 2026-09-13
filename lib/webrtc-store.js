// In-memory WebRTC signaling store
// Manages rooms/streams for both /livestream and /dashboard/remote-control

class WebRTCStore {
  constructor() {
    this.rooms = new Map();
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 30000);
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

  setOffer(streamId, sdp, metadata = {}) {
    const room = this.getRoom(streamId);
    if (!room.broadcaster) {
      this.setBroadcaster(streamId, 'broadcaster-' + Date.now(), metadata);
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

  getAnswer(streamId, viewerId) {
    const room = this.getRoom(streamId);
    if (viewerId) {
      const viewer = room.viewers.get(viewerId);
      return viewer?.answer || null;
    }
    for (const [, v] of room.viewers) {
      if (v.answer && Date.now() - v.lastSeen < 60000) {
        return { viewerId: v.id, answer: v.answer };
      }
    }
    return null;
  }

  addCandidate(streamId, role, peerId, candidate) {
    const room = this.getRoom(streamId);
    if (role === 'broadcaster') {
      if (room.broadcaster) {
        room.broadcaster.candidates.push(candidate);
        room.broadcaster.lastSeen = Date.now();
      }
    } else {
      let viewer = room.viewers.get(peerId);
      if (!viewer) {
        viewer = { id: peerId, answer: null, candidates: [], lastSeen: Date.now() };
        room.viewers.set(peerId, viewer);
      }
      viewer.candidates.push(candidate);
      viewer.lastSeen = Date.now();
    }
  }

  getCandidates(streamId, targetRole, peerId, fromIndex = 0) {
    const room = this.getRoom(streamId);
    const start = Math.max(0, parseInt(fromIndex) || 0);

    if (targetRole === 'broadcaster') {
      const list = room.broadcaster?.candidates || [];
      return {
        candidates: list.slice(start),
        nextIndex: list.length,
      };
    }

    if (peerId) {
      const viewer = room.viewers.get(peerId);
      const list = viewer?.candidates || [];
      return {
        candidates: list.slice(start),
        nextIndex: list.length,
      };
    }

    let all = [];
    for (const [, v] of room.viewers) {
      all = all.concat(v.candidates);
    }
    return {
      candidates: all.slice(start),
      nextIndex: all.length,
    };
  }

  heartbeat(streamId, role, peerId) {
    const room = this.getRoom(streamId);
    if (role === 'broadcaster' && room.broadcaster) {
      room.broadcaster.lastSeen = Date.now();
    } else if (peerId && room.viewers.has(peerId)) {
      room.viewers.get(peerId).lastSeen = Date.now();
    }
    room.updatedAt = Date.now();
  }

  closeStream(streamId) {
    const key = (streamId || 'consentmod').toLowerCase();
    this.rooms.delete(key);
  }

  getActiveStreams() {
    const now = Date.now();
    const active = [];
    for (const [streamId, room] of this.rooms) {
      if (room.broadcaster && now - room.broadcaster.lastSeen < 60000) {
        active.push({
          streamId,
          broadcasterId: room.broadcaster.id,
          metadata: room.broadcaster.metadata || {},
          viewersCount: room.viewers.size,
          lastSeen: room.broadcaster.lastSeen,
        });
      }
    }
    return active;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, room] of this.rooms) {
      if (room.broadcaster && now - room.broadcaster.lastSeen > 120000) {
        room.broadcaster = null;
      }
      for (const [vid, v] of room.viewers) {
        if (now - v.lastSeen > 60000) {
          room.viewers.delete(vid);
        }
      }
      if (!room.broadcaster && room.viewers.size === 0 && now - room.updatedAt > 180000) {
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
