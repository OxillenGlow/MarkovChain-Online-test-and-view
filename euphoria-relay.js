/**
 * euphoria-relay.js
 *
 * Why this exists: euphoria.leet.nu's websocket endpoint appears to reject
 * connections from browser pages (the browser always attaches an Origin
 * header that JS cannot remove/spoof, and the server closes with code 1006
 * right after the handshake). Non-browser clients like BotBot's EuPy
 * (Python's websocket-client) don't send an Origin header at all, and
 * connect fine.
 *
 * This relay runs locally with Node (not a browser), so it connects
 * upstream to euphoria exactly like BotBot does. Your page then talks to
 * this relay over plain ws://localhost, which browsers are fine with.
 *
 * Usage:
 *   npm install ws
 *   node euphoria-relay.js
 *
 * Then in the MarkovBot UI, point "Relay" at localhost:8765 (default) and
 * connect as usual — everything else about the bot is unchanged.
 */

const http = require('http');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8765;
const EUPHORIA_HOST = process.env.EUPHORIA_HOST || 'euphoria.leet.nu';

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (clientSocket, req) => {
  const match = (req.url || '').match(/^\/room\/([^\/?]+)/);
  if (!match) {
    clientSocket.close(1008, 'Expected path /room/<name>');
    return;
  }
  const room = match[1];
  const upstreamUrl = `wss://${EUPHORIA_HOST}/room/${room}/ws`;
  console.log(`[relay] browser connected, opening upstream ${upstreamUrl}`);

  const pending = [];
  let upstreamOpen = false;

  // No `origin` option passed here on purpose - same as BotBot/EuPy.
  const upstream = new WebSocket(upstreamUrl);

  upstream.on('open', () => {
    upstreamOpen = true;
    console.log(`[relay] upstream joined &${room}`);
    for (const msg of pending) upstream.send(msg);
    pending.length = 0;
  });

  upstream.on('message', (data) => {
    if (clientSocket.readyState === WebSocket.OPEN) clientSocket.send(data.toString());
  });

  upstream.on('close', (code, reason) => {
    console.log(`[relay] upstream closed: ${code} ${reason}`);
    if (clientSocket.readyState === WebSocket.OPEN) {
      clientSocket.close(1000, 'upstream closed: ' + code);
    }
  });

  upstream.on('error', (err) => {
    console.error('[relay] upstream error:', err.message);
  });

  clientSocket.on('message', (data) => {
    const msg = data.toString();
    if (upstreamOpen) upstream.send(msg);
    else pending.push(msg);
  });

  clientSocket.on('close', () => {
    console.log('[relay] browser disconnected, closing upstream');
    upstream.close();
  });

  clientSocket.on('error', (err) => {
    console.error('[relay] client socket error:', err.message);
  });
});

server.listen(PORT, () => {
  console.log(`Euphoria relay listening on ws://localhost:${PORT}`);
  console.log(`Point the bot's Relay field at localhost:${PORT}`);
});
