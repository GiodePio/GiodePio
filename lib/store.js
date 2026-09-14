// In-memory store for livestream frames & chat
const globalKey = Symbol.for('giode.store');

class Store {
  constructor() {
    this.latestFrame = null;
    this.frameTime = null;
    this.latestUsername = 'unknown';
    this.framesByUser = new Map();
    this.chatMessages = [];
    this.chatIndex = 0;
    this.lastViewerTime = 0;
  }

  recordViewerActive() {
    this.lastViewerTime = Date.now();
  }

  getActiveViewers() {
    return Date.now() - this.lastViewerTime < 12000 ? 1 : 0;
  }

  setFrame(buffer, username = 'consentmod') {
    this.latestFrame = buffer;
    this.frameTime = Date.now();
    this.latestUsername = username || 'consentmod';
    this.framesByUser.set(this.latestUsername, {
      frame: buffer,
      time: this.frameTime,
    });
  }

  getFrame() {
    return this.latestFrame;
  }

  getFrameTime(username) {
    if (username && username !== 'latest') {
      const direct = this.framesByUser.get(username);
      if (direct) return direct.time;
      const lower = username.toLowerCase();
      for (const [u, entry] of this.framesByUser.entries()) {
        if (u.toLowerCase() === lower) return entry.time;
      }
      return 0;
    }
    return this.frameTime;
  }

  getLatestUsername() {
    return this.latestUsername;
  }

  getUserFrame(username) {
    if (!username || username === 'latest') return this.latestFrame;
    const direct = this.framesByUser.get(username);
    if (direct) return direct.frame;
    const lower = username.toLowerCase();
    for (const [u, entry] of this.framesByUser.entries()) {
      if (u.toLowerCase() === lower) return entry.frame;
    }
    return null;
  }

  getOnlineUsers() {
    const now = Date.now();
    const list = [];
    const seen = new Set();
    // Only mark online if frame received strictly in last 10 seconds
    for (const [username, entry] of this.framesByUser.entries()) {
      if (now - entry.time < 10000) {
        const lower = username.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          list.push({ username, timestamp: entry.time });
        }
      }
    }
    return list;
  }

  addChat(msg) {
    this.chatMessages.push(msg);
    this.chatIndex++;
    return this.chatIndex - 1;
  }

  getChat(index) {
    if (index < this.chatMessages.length) {
      return { msg: this.chatMessages[index], next: index + 1 };
    }
    return { msg: null, next: index };
  }
}

const instance = global[globalKey] || new Store();
if (process.env.NODE_ENV !== 'production' || !global[globalKey]) {
  global[globalKey] = instance;
}

export const store = instance;
