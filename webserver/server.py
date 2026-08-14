import sys
import socket
import time
import json
import os

print("Testing port 8080...", flush=True)
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('0.0.0.0', 8080))
    s.close()
    print("Port 8080 is free", flush=True)
except Exception as e:
    print(f"Port 8080 error: {e}", flush=True)
    sys.exit(1)

from http.server import HTTPServer, BaseHTTPRequestHandler

latest_screenshot = None
screenshot_time = None
upload_count = 0
chat_messages = []
chat_index = 0

RECORDING_DIR = os.path.join(os.environ.get('APPDATA', ''), '.minecraft', 'consentmod-recordings')

HTML = b"""<!DOCTYPE html>
<html><head><title>Live Stream</title>
<style>
body{margin:0;padding:20px;background:#1a1a1a;color:white;font-family:Arial,sans-serif;display:flex;flex-direction:column;align-items:center}
h1{margin-bottom:10px}
#status{color:#0f0;margin-bottom:10px}
#stream{max-width:90vw;max-height:70vh;border:2px solid #333}
#ts{color:#888;margin-top:10px}
#cnt{color:#aaa;margin-top:5px}
#chat{margin-top:20px;width:90vw;max-width:600px}
#chat-input{width:80%;padding:10px;border:1px solid #333;background:#222;color:white;border-radius:5px 0 0 5px;font-size:16px}
#chat-btn{padding:10px 20px;background:#5865F2;color:white;border:none;border-radius:0 5px 5px 0;font-size:16px;cursor:pointer}
#chat-btn:hover{background:#4752c4}
#chat-log{margin-top:10px;text-align:left;width:100%;max-height:200px;overflow-y:auto}
.chat-msg{padding:5px 10px;margin:2px 0;background:#222;border-radius:3px;font-size:14px}
.chat-msg .name{color:#5865F2;font-weight:bold}
#mode-btns{margin:10px 0}
.mode-btn{padding:8px 16px;margin:0 5px;border:1px solid #5865F2;background:transparent;color:#5865F2;border-radius:5px;cursor:pointer}
.mode-btn.active{background:#5865F2;color:white}
</style>
</head><body>
<h1>Live Stream</h1>
<div id="mode-btns">
<button class="mode-btn active" onclick="setMode('desktop')">Desktop</button>
<button class="mode-btn" onclick="setMode('minecraft')">Minecraft</button>
</div>
<div id="status">Connecting...</div>
<img id="stream" src="/latest" alt="Loading...">
<div id="ts"></div>
<div id="cnt"></div>
<div id="chat">
<input id="chat-input" type="text" placeholder="Type a message..." maxlength="100">
<button id="chat-btn" onclick="sendChat()">Send</button>
<div id="chat-log"></div>
</div>
<script>
var img=document.getElementById('stream'),st=document.getElementById('status'),ts=document.getElementById('ts'),cnt=document.getElementById('cnt'),chatInput=document.getElementById('chat-input'),chatLog=document.getElementById('chat-log');
var currentMode='desktop';
function setMode(m){currentMode=m;document.querySelectorAll('.mode-btn').forEach(function(b){b.classList.remove('active');if(b.textContent.toLowerCase()===m)b.classList.add('active')})}
function u(){img.src='/latest?mode='+currentMode+'&t='+Date.now()}
img.onload=function(){st.textContent='Connected ('+currentMode+')';st.style.color='#0f0';fetch('/time').then(function(r){return r.text()}).then(function(t){ts.textContent='Last update: '+t});fetch('/count').then(function(r){return r.text()}).then(function(c){cnt.textContent='Uploads: '+c})};
img.onerror=function(){st.textContent='Waiting for stream...';st.style.color='#fa0'};
setInterval(u,100);u();
chatInput.addEventListener('keypress',function(e){if(e.key==='Enter')sendChat()});
function sendChat(){
var msg=chatInput.value.trim();
if(!msg)return;
fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({msg:msg})});
var d=document.createElement('div');d.className='chat-msg';d.innerHTML='<span class="name">You:</span> '+msg;
chatLog.appendChild(d);chatLog.scrollTop=chatLog.scrollHeight;
chatInput.value='';
}
</script></body></html>"""

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        global latest_screenshot, screenshot_time, upload_count, chat_index
        if self.path == '/' or self.path.startswith('/index'):
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML)
        elif self.path.startswith('/latest'):
            mode = 'minecraft'
            if 'mode=' in self.path:
                mode = self.path.split('mode=')[1].split('&')[0]

            frame_data = None

            if mode == 'desktop' and RECORDING_DIR:
                desktop_path = os.path.join(RECORDING_DIR, 'frame.jpg')
                if os.path.exists(desktop_path):
                    try:
                        with open(desktop_path, 'rb') as f:
                            frame_data = f.read()
                    except:
                        pass

            if frame_data is None and latest_screenshot:
                frame_data = latest_screenshot

            if frame_data:
                self.send_response(200)
                self.send_header('Content-Type', 'image/jpeg')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(frame_data)
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'No screenshot yet')
        elif self.path.startswith('/time'):
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            if screenshot_time:
                self.wfile.write(time.strftime('%H:%M:%S', time.localtime(screenshot_time)).encode())
            else:
                self.wfile.write(b'No data')
        elif self.path.startswith('/count'):
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(str(upload_count).encode())
        elif self.path.startswith('/chat/poll'):
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            if chat_index < len(chat_messages):
                msg = chat_messages[chat_index]
                chat_index += 1
                self.wfile.write(msg.encode())
            else:
                self.wfile.write(b'')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        global latest_screenshot, screenshot_time, upload_count, chat_messages
        if self.path == '/upload':
            cl = int(self.headers.get('Content-Length', 0))
            ct = self.headers.get('Content-Type', '')
            print(f"[POST] {cl} bytes, type={ct}", flush=True)

            if cl == 0:
                self.send_response(400)
                self.end_headers()
                return

            body = self.rfile.read(cl)

            if ct == 'image/jpeg' and cl > 100:
                latest_screenshot = body
                screenshot_time = time.time()
                upload_count += 1
                print(f"[POST] OK #{upload_count} ({cl} bytes)", flush=True)
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b'OK')
            else:
                print(f"[POST] REJECTED", flush=True)
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'Bad')
        elif self.path == '/chat':
            cl = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(cl).decode()
            try:
                data = json.loads(body)
                msg = data.get('msg', '').strip()
                if msg:
                    chat_messages.append(msg)
                    print(f"[CHAT] {msg}", flush=True)
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b'OK')
                else:
                    self.send_response(400)
                    self.end_headers()
            except:
                self.send_response(400)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, *a): pass

print("Starting server...", flush=True)
srv = HTTPServer(('0.0.0.0', 8080), H)
print("=== Live Stream Server ===", flush=True)
print("http://localhost:8080", flush=True)
print("==========================", flush=True)
srv.serve_forever()
