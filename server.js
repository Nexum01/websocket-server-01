const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// guarda usuários
let users = [];

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

wss.on('connection', (ws) => {
  const userId = Date.now(); // ID simples
  users.push(userId);

  console.log("Usuário entrou:", userId);

  // 🔥 avisa que entrou
  broadcast({
    type: "join",
    userId,
    total: users.length
  });

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    // mensagem normal
    if (data.type === "message") {
      broadcast({
        type: "message",
        userId,
        text: data.text
      });
    }

    // digitando
    if (data.type === "typing") {
      broadcast({
        type: "typing",
        userId
      });
    }

    // parou de digitar
    if (data.type === "stop_typing") {
      broadcast({
        type: "stop_typing",
        userId
      });
    }
  });

  ws.on('close', () => {
    users = users.filter(id => id !== userId);

    console.log("Usuário saiu:", userId);

    broadcast({
      type: "leave",
      userId,
      total: users.length
    });
  });
});

server.listen(PORT, '0.0.0.0');