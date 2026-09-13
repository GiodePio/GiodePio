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

  getFrameTime() {
    return this.frameTime;
  }

  getLatestUsername() {
    return this.latestUsername;
  }

  getUserFrame(username) {
    if (!username || username === 'latest') return this.latestFrame;
    const userEntry = this.framesByUser.get(username);
    if (userEntry) return userEntry.frame;
    return this.latestFrame;
  }

  getOnlineUsers() {
    const now = Date.now();
    const list = [];
    for (const [username, entry] of this.framesByUser.entries()) {
      if (now - entry.time < 60000) {
        list.push({ username, timestamp: entry.time });
      }
    }
    if (list.length === 0 && this.latestFrame && this.frameTime && now - this.frameTime < 60000) {
      list.push({ username: this.latestUsername || 'consentmod', timestamp: this.frameTime });
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
