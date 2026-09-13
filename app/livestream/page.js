<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Stream Test (Zonder Server)</title>
    <style>
        body { margin: 0; padding: 20px; background: '#1a1a1a'; background-color: #1a1a1a; color: white; fontFamily: 'Arial, sans-serif'; font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; min-height: 100vh; }
        h1 { margin-bottom: 10px; }
        #status { font-weight: bold; margin-bottom: 10px; }
        #canvas-stream { max-width: 90vw; max-height: 70vh; border: 2px solid #333; background-color: #000; border-radius: 4px; }
        .chat-container { margin-top: 20px; width: 90vw; max-width: 600px; }
        .input-area { display: flex; gap: 0; }
        input { flex: 1; padding: 10px; border: 1px solid #333; background: #222; color: white; border-radius: 5px 0 0 5px; font-size: 16px; }
        button { padding: 10px 20px; background: #5865F2; color: white; border: none; border-radius: 0 5px 5px 0; font-size: 16px; cursor: pointer; font-weight: bold; }
        #chat-log { marginTop: 10px; margin-top: 10px; text-align: left; max-height: 200px; overflow-y: auto; border: 1px solid #2a2a2a; padding: 5px; border-radius: 4px; }
        .chat-msg { padding: 5px 10px; margin: 4px 0; background: #222; border-radius: 3px; font-size: 14px; }
        .user-you { color: #43b581; font-weight: bold; }
        .user-player { color: #5865F2; font-weight: bold; }
    </style>
</head>
<body>

    <h1>Live Stream Panel</h1>
    <div id="status" style="color: #0f0;">Connected (Gestimuleerd)</div>
    
    <!-- We gebruiken een canvas om een bewegend beeld te simuleren zonder server -->
    <canvas id="canvas-stream" width="640" height="360"></canvas>
    
    <div style="color: #888; margin-top: 10px; font-size: 12px;">Laatste update: <span id="last-update">-</span></div>
    
    <div class="chat-container">
        <div class="input-area">
            <input type="text" id="chat-input" placeholder="Typ een bericht..." maxlength="100">
            <button id="send-btn">Send</button>
        </div>
        <div id="chat-log"></div>
    </div>

    <script>
        const canvas = document.getElementById('canvas-stream');
        const ctx = canvas.getContext('2d');
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');
        const chatLog = document.getElementById('chat-log');
        const lastUpdateText = document.getElementById('last-update');

        // 1. Simuleer een videostream op het canvas (30 frames per seconde)
        let angle = 0;
        setInterval(() => {
            // Maak het scherm zwart
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Teken een bewegend object om "activiteit" te simuleren
            ctx.fillStyle = '#5865F2';
            const x = canvas.width / 2 + Math.cos(angle) * 150;
            const y = canvas.height / 2 + Math.sin(angle) * 80;
            ctx.beginPath();
            ctx.arc(x, y, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // Teken dummy tekst (zoals een Minecraft overlay)
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText("Simulated Gameplay Feed - 30 FPS", 20, 30);
            
            angle += 0.05;
            lastUpdateText.innerText = new Date().toLocaleTimeString();
        }, 33);

        // 2. Functie om berichten toe te voegen aan de UI
        function appendMessage(from, text) {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-msg';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = from === 'You' ? 'user-you' : 'user-player';
            nameSpan.innerText = from + ': ';
            
            msgDiv.appendChild(nameSpan);
            msgDiv.append(text);
            chatLog.appendChild(msgDiv);
            
            // Automatisch naar beneden scrollen
            chatLog.scrollTop = chatLog.scrollHeight;
        }

        // 3. Chat verzenden als gebruiker
        function sendMessage() {
            const text = chatInput.value.trim();
            if (!text) return;
            
            appendMessage('You', text);
            chatInput.value = '';
            
            // Simuleer een automatische reactie van de 'Player' na 1.5 seconde
            setTimeout(() => {
                const botAntwoorden = [
                    "Wat bedoel je?",
                    "Ik ben aan het spelen.",
                    "Lobby 3?",
                    "Laggg",
                    "Aha ik zie het"
                ];
                const randomAntwoord = botAntwoorden[Math.floor(Math.random() * botAntwoorden.length)];
                appendMessage('Player', randomAntwoord);
            }, 1500);
        }

        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    </script>
</body>
</html>
