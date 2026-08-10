let latestFrame = null;
let frameTime = null;
let chatMessages = [];
let chatIndex = 0;

function setFrame(buffer) {
  latestFrame = buffer;
  frameTime = Date.now();
}

function getFrame() {
  return latestFrame;
}

function getFrameTime() {
  return frameTime;
}

function addChat(msg) {
  chatMessages.push(msg);
  chatIndex++;
  return chatIndex - 1;
}

function getChat(index) {
  if (index < chatMessages.length) {
    return { msg: chatMessages[index], next: index + 1 };
  }
  return { msg: null, next: index };
}

export const store = { setFrame, getFrame, getFrameTime, addChat, getChat };
