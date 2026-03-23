const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();

// public フォルダ公開
app.use(express.static('public'));

const server = http.createServer(app);

// WebSocketサーバー
const wss = new WebSocket.Server({ server });

// ゲーム状態の管理
let gameState = {
  players: {
    player1: null,
    player2: null
  },
  spectators: [],
  costLimit: 30,
  board: null,
  currentTurn: null,
  phase: 'waiting', // waiting, setup, playing, finished
  setupReady: {
    player1: false,
    player2: false
  }
};

// 接続時
wss.on('connection', (ws) => {
  console.log('New client connected');

  // 接続時に現在の状態を送信
  sendGameState(ws);

  // メッセージ受信
  ws.on('message', (message) => {
    try {
      const msg = message.toString();
      console.log('Received:', msg);
      
      // JSONパース試行
      try {
        const data = JSON.parse(msg);
        handleMessage(ws, data);
      } catch (e) {
        // JSONでない場合は単純なブロードキャスト（後方互換性）
        broadcast(msg);
      }
    } catch (error) {
      console.error('メッセージ処理エラー:', error);
    }
  });

  // 切断時
  ws.on('close', () => {
    console.log('Client disconnected');
    handleDisconnect(ws);
  });
});

function handleMessage(ws, data) {
  switch (data.type) {
    case 'sit':
      handleSit(ws, data.player);
      break;
    case 'leave':
      handleLeave(ws);
      break;
    case 'setCostLimit':
      if (gameState.phase === 'waiting') {
        gameState.costLimit = data.value;
        broadcast({ type: 'costLimitChanged', value: data.value });
      }
      break;
    case 'setupComplete':
      handleSetupComplete(ws, data.setup);
      break;
    case 'cancelReady':
      handleCancelReady(ws);
      break;
    case 'getValidMoves':
      handleGetValidMoves(ws, data);
      break;
    case 'move':
      handleMove(ws, data);
      break;
    case 'placeFromHand':
      handlePlaceFromHand(ws, data);
      break;
    case 'surrender':
      handleSurrender(ws);
      break;
  }
}

function handleSit(ws, playerNum) {
  const player = `player${playerNum}`;
  
  if (gameState.players[player] === null) {
    gameState.players[player] = ws;
    ws.playerNum = playerNum;
    
    // 両プレイヤーが着席したらセットアップフェーズへ
    if (gameState.players.player1 && gameState.players.player2) {
      gameState.phase = 'setup';
      broadcast({ type: 'phaseChanged', phase: 'setup' });
    }
    
    broadcast({ type: 'playerSat', player: playerNum });
  }
}

function handleLeave(ws) {
  if (ws.playerNum) {
    const player = `player${ws.playerNum}`;
    gameState.players[player] = null;
    gameState.setupReady[player] = false;
    
    // ゲームをリセット
    if (gameState.phase !== 'waiting') {
      resetGame();
    }
    
    broadcast({ type: 'playerLeft', player: ws.playerNum });
  }
}

function handleSetupComplete(ws, setup) {
  const player = `player${ws.playerNum}`;
  
  console.log(`[SETUP] Player ${ws.playerNum} sent setup complete`);
  console.log(`[SETUP] Setup pieces:`, setup);
  
  // セットアップ情報を検証
  if (validateSetup(setup)) {
    gameState.setupReady[player] = true;
    gameState[`${player}Setup`] = setup;
    
    console.log(`[SETUP] Player ${ws.playerNum} setup validated and saved`);
    console.log(`[SETUP] setupReady state:`, gameState.setupReady);
    
    // 両プレイヤーがReadyならゲーム開始
    if (gameState.setupReady.player1 && gameState.setupReady.player2) {
      console.log('[SETUP] Both players ready! Starting game...');
      startGame();
    } else {
      console.log('[SETUP] Waiting for other player...');
      broadcast({ type: 'playerReady', player: ws.playerNum });
    }
  } else {
    console.log(`[SETUP] Player ${ws.playerNum} setup validation FAILED`);
  }
}

function handleCancelReady(ws) {
  const player = `player${ws.playerNum}`;
  gameState.setupReady[player] = false;
  
  broadcast({ type: 'playerCancelReady', player: ws.playerNum });
}

function handleGetValidMoves(ws, data) {
  const { row, col } = data;
  const piece = gameState.board[row][col];
  
  if (!piece) return;
  
  const validMoves = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (isValidMove(piece, row, col, r, c)) {
        validMoves.push({ row: r, col: c });
      }
    }
  }
  
  ws.send(JSON.stringify({
    type: 'validMoves',
    moves: validMoves
  }));
}

function validateSetup(setup) {
  // コスト計算と配置の妥当性をチェック
  let totalCost = 0;
  let hasKing = false;
  
  for (const piece of setup) {
    totalCost += getPieceCost(piece.type);
    if (piece.type === 'king') hasKing = true;
  }
  
  return totalCost <= gameState.costLimit && hasKing;
}

function getPieceCost(type) {
  const costs = {
    king: 0,
    soldier: 1,
    lance: 2,
    sideLance: 2,
    jump2: 2,
    vKnight: 3,
    hKnight: 3,
    gold: 5,
    bishop: 7,
    rook: 8
  };
  return costs[type] || 0;
}

function startGame() {
  console.log('[GAME] Starting game!');
  console.log('[GAME] Player1 setup:', gameState.player1Setup);
  console.log('[GAME] Player2 setup:', gameState.player2Setup);
  
  gameState.phase = 'playing';
  
  // 先手後手をランダムに決定
  gameState.currentTurn = Math.random() < 0.5 ? 1 : 2;
  
  console.log(`[GAME] First player: ${gameState.currentTurn}`);
  
  // 盤面を初期化
  initializeBoard();
  
  broadcast({
    type: 'gameStarted',
    firstPlayer: gameState.currentTurn,
    board: gameState.board
  });
  
  console.log('[GAME] Game started successfully!');
}

function initializeBoard() {
  // 10x10の盤面を初期化
  gameState.board = Array(10).fill(null).map(() => Array(10).fill(null));
  
  // プレイヤー1の駒を配置
  for (const piece of gameState.player1Setup) {
    gameState.board[piece.row][piece.col] = {
      ...piece,
      owner: 1
    };
  }
  
  // プレイヤー2の駒を配置
  for (const piece of gameState.player2Setup) {
    gameState.board[piece.row][piece.col] = {
      ...piece,
      owner: 2
    };
  }
  
  // 持ち駒を初期化
  gameState.capturedPieces = {
    player1: [],
    player2: []
  };
}

function handleMove(ws, data) {
  // ターンチェック
  if (ws.playerNum !== gameState.currentTurn) {
    return;
  }
  
  const { fromRow, fromCol, toRow, toCol } = data;
  const piece = gameState.board[fromRow][fromCol];
  
  // 移動の妥当性をチェック
  if (!isValidMove(piece, fromRow, fromCol, toRow, toCol)) {
    return;
  }
  
  // 移動先に駒がある場合は取る
  const capturedPiece = gameState.board[toRow][toCol];
  if (capturedPiece) {
    capturePiece(capturedPiece, ws.playerNum);
  }
  
  // 駒を移動
  gameState.board[toRow][toCol] = piece;
  gameState.board[fromRow][fromCol] = null;
  
  // Soldierの進化チェック
  if (piece.type === 'soldier' && capturedPiece) {
    piece.level = Math.min((piece.level || 0) + 1, 2);
  }
  
  // 王を取ったら勝利
  if (capturedPiece && capturedPiece.type === 'king') {
    endGame(ws.playerNum);
    return;
  }
  
  // ターン交代
  gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
  
  broadcast({
    type: 'moved',
    fromRow,
    fromCol,
    toRow,
    toCol,
    capturedPiece,
    evolvedPiece: piece.type === 'soldier' ? piece : null,
    nextTurn: gameState.currentTurn
  });
}

function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
  // 基本的な範囲チェック
  if (toRow < 0 || toRow >= 10 || toCol < 0 || toCol >= 10) {
    return false;
  }
  
  // 自分の駒がある場所には移動できない
  const targetPiece = gameState.board[toRow][toCol];
  if (targetPiece && targetPiece.owner === piece.owner) {
    return false;
  }
  
  // 駒の種類に応じた移動ルールをチェック
  return checkPieceMovement(piece, fromRow, fromCol, toRow, toCol);
}

function checkPieceMovement(piece, fromRow, fromCol, toRow, toCol) {
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  const direction = piece.owner === 1 ? -1 : 1; // プレイヤー1は上向き、2は下向き
  
  switch (piece.type) {
    case 'king':
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    
    case 'soldier':
      const level = piece.level || 0;
      if (level === 0) {
        // Lv0: 前のみ
        return dr === direction && dc === 0;
      } else if (level === 1) {
        // Lv1: 前 + 左右
        return (dr === direction && dc === 0) || (dr === 0 && Math.abs(dc) === 1);
      } else {
        // Lv2: 十字（前後左右）
        return (Math.abs(dr) === 1 && dc === 0) || (dr === 0 && Math.abs(dc) === 1);
      }
    
    case 'gold':
      if (piece.owner === 1) {
        return (dr === -1 && Math.abs(dc) <= 1) || (dr === 0 && Math.abs(dc) === 1) || (dr === 1 && dc === 0);
      } else {
        return (dr === 1 && Math.abs(dc) <= 1) || (dr === 0 && Math.abs(dc) === 1) || (dr === -1 && dc === 0);
      }
    
    case 'rook':
      return (dr === 0 || dc === 0) && isPathClear(fromRow, fromCol, toRow, toCol);
    
    case 'bishop':
      return Math.abs(dr) === Math.abs(dc) && isPathClear(fromRow, fromCol, toRow, toCol);
    
    case 'lance':
      // 前後方向に無限移動可能
      return dc === 0 && dr !== 0 && isPathClear(fromRow, fromCol, toRow, toCol);
    
    case 'sideLance':
      return dr === 0 && dc !== 0 && isPathClear(fromRow, fromCol, toRow, toCol);
    
    case 'vKnight':
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1);
    
    case 'hKnight':
      return (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    
    case 'jump2':
      return (dr === 2 * direction && dc === 0) || (dr === -2 * direction && dc === 0);
    
    default:
      return false;
  }
}

function isPathClear(fromRow, fromCol, toRow, toCol) {
  const dr = Math.sign(toRow - fromRow);
  const dc = Math.sign(toCol - fromCol);
  let r = fromRow + dr;
  let c = fromCol + dc;
  
  while (r !== toRow || c !== toCol) {
    if (gameState.board[r][c] !== null) {
      return false;
    }
    r += dr;
    c += dc;
  }
  
  return true;
}

function capturePiece(piece, captorPlayer) {
  const player = `player${captorPlayer}`;
  gameState.capturedPieces[player].push({
    type: piece.type,
    level: piece.level || 0
  });
}

function handlePlaceFromHand(ws, data) {
  // ターンチェック
  if (ws.playerNum !== gameState.currentTurn) {
    return;
  }
  
  const { pieceIndex, row, col } = data;
  const player = `player${ws.playerNum}`;
  const piece = gameState.capturedPieces[player][pieceIndex];
  
  // 配置の妥当性をチェック
  if (!isValidPlacement(row, col, ws.playerNum)) {
    return;
  }
  
  // 駒を配置
  gameState.board[row][col] = {
    type: piece.type,
    level: piece.level,
    owner: ws.playerNum
  };
  
  // 持ち駒から削除
  gameState.capturedPieces[player].splice(pieceIndex, 1);
  
  // ターン交代
  gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
  
  broadcast({
    type: 'placedFromHand',
    row,
    col,
    piece: gameState.board[row][col],
    nextTurn: gameState.currentTurn
  });
}

function isValidPlacement(row, col, playerNum) {
  // マスが空いているか
  if (gameState.board[row][col] !== null) {
    return false;
  }
  
  // 敵陣（相手側の3行）には配置できない
  if (playerNum === 1 && row < 3) {
    return false;
  }
  if (playerNum === 2 && row > 6) {
    return false;
  }
  
  return true;
}

function handleSurrender(ws) {
  const winner = ws.playerNum === 1 ? 2 : 1;
  endGame(winner);
}

function endGame(winner) {
  gameState.phase = 'finished';
  broadcast({
    type: 'gameEnded',
    winner
  });
}

function resetGame() {
  console.log('[RESET] Resetting game state');
  gameState.phase = 'waiting';
  gameState.board = null;
  gameState.currentTurn = null;
  gameState.setupReady = {
    player1: false,
    player2: false
  };
  gameState.player1Setup = null;
  gameState.player2Setup = null;
  broadcast({ type: 'gameReset' });
}

function handleDisconnect(ws) {
  handleLeave(ws);
}

function sendGameState(ws) {
  ws.send(JSON.stringify({
    type: 'gameState',
    state: {
      phase: gameState.phase,
      costLimit: gameState.costLimit,
      player1Seated: gameState.players.player1 !== null,
      player2Seated: gameState.players.player2 !== null
    }
  }));
}

function broadcast(data) {
  // dataが文字列ならそのまま、オブジェクトならJSON化
  const message = typeof data === 'string' ? data : JSON.stringify(data);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`PIKUOサーバーがポート${PORT}で起動しました`);
});