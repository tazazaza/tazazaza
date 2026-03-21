// server.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

// public フォルダ公開
app.use(express.static('public'));

const server = http.createServer(app);

// WebSocketサーバー
const wss = new WebSocket.Server({ server });

// 接続時
wss.on('connection', (ws) => {
  console.log('New client connected');

  // メッセージ受信
  ws.on('message', (message) => {

    const msg = message.toString();

    console.log('Received:', msg);

    // 全クライアントへ送信（安定版）
    wss.clients.forEach((client) => {

      if (
        client.readyState === WebSocket.OPEN
      ) {
        client.send(msg);
      }

    });

  });

  // 切断時
  ws.on('close', () => {
    console.log('Client disconnected');
  });

});

// Render用ポート
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});