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
  
  // セットアップ情報を検証
  if (validateSetup(setup)) {
    gameState.setupReady[player] = true;
    gameState[`${player}Setup`] = setup;
    
    // 両プレイヤーがReadyならゲーム開始
    if (gameState.setupReady.player1 && gameState.setupReady.player2) {
      startGame();
    } else {
      broadcast({ type: 'playerReady', player: ws.playerNum });
    }
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
  gameState.phase = 'playing';
  
  // 先手後手をランダムに決定
  gameState.currentTurn = Math.random() < 0.5 ? 1 : 2;
  
  // 盤面を初期化
  initializeBoard();
  
  broadcast({
    type: 'gameStarted',
    firstPlayer: gameState.currentTurn,
    board: gameState.board
  });
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
  
  // 移動先の駒を取得（取る場合）
  const capturedPiece = gameState.board[toRow][toCol];
  
  // 駒を移動
  gameState.board[toRow][toCol] = piece;
  gameState.board[fromRow][fromCol] = null;
  
  // Soldierのレベルアップ処理
  if (piece.type === 'soldier' && capturedPiece) {
    if (!piece.level) piece.level = 0;
    if (piece.level < 2) {
      piece.level++;
    }
  }
  
  // 駒を取った場合、持ち駒に追加
  if (capturedPiece) {
    const capturer = `player${ws.playerNum}`;
    if (!gameState.capturedPieces[capturer]) {
      gameState.capturedPieces[capturer] = [];
    }
    
    // 取った駒をリセット（レベルなど）
    const resetPiece = {
      type: capturedPiece.type,
      owner: ws.playerNum
    };
    
    gameState.capturedPieces[capturer].push(resetPiece);
    
    // 王を取ったらゲーム終了
    if (capturedPiece.type === 'king') {
      endGame(ws.playerNum);
      return;
    }
  }
  
  // ターン交代
  gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
  
  broadcast({
    type: 'moved',
    from: { row: fromRow, col: fromCol },
    to: { row: toRow, col: toCol },
    board: gameState.board,
    currentTurn: gameState.currentTurn,
    capturedPieces: gameState.capturedPieces
  });
}

function handlePlaceFromHand(ws, data) {
  // ターンチェック
  if (ws.playerNum !== gameState.currentTurn) {
    return;
  }
  
  const { pieceIndex, row, col } = data;
  const player = `player${ws.playerNum}`;
  
  // 持ち駒から取得
  const piece = gameState.capturedPieces[player][pieceIndex];
  if (!piece) return;
  
  // 配置先が空かチェック
  if (gameState.board[row][col] !== null) return;
  
  // 敵陣3行には配置できない
  const enemyRows = ws.playerNum === 1 ? [0, 1, 2] : [7, 8, 9];
  if (enemyRows.includes(row)) return;
  
  // 駒を配置
  gameState.board[row][col] = {
    type: piece.type,
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
    board: gameState.board,
    currentTurn: gameState.currentTurn,
    capturedPieces: gameState.capturedPieces
  });
}

function isValidMove(piece, fromRow, fromCol, toRow, toCol) {
  if (!piece) return false;
  
  // 移動先が盤面外
  if (toRow < 0 || toRow >= 10 || toCol < 0 || toCol >= 10) return false;
  
  // 移動先に自分の駒がある
  const targetPiece = gameState.board[toRow][toCol];
  if (targetPiece && targetPiece.owner === piece.owner) return false;
  
  const dr = toRow - fromRow;
  const dc = toCol - fromCol;
  
  // Player1は上向き（direction=-1）、Player2は下向き（direction=1）
  const direction = piece.owner === 1 ? -1 : 1;
  
  switch (piece.type) {
    case 'king':
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr !== 0 || dc !== 0);
      
    case 'gold':
      // 金将の動き
      if (dr === direction && Math.abs(dc) <= 1) return true; // 前3方向
      if (dr === 0 && Math.abs(dc) === 1) return true; // 左右
      if (dr === -direction && dc === 0) return true; // 真後ろ
      return false;
      
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
      
    case 'rook':
      if (dr === 0 || dc === 0) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
      }
      return false;
      
    case 'bishop':
      if (Math.abs(dr) === Math.abs(dc)) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
      }
      return false;
      
    case 'lance':
      // 前後無限（後方移動も可能）
      if (dc === 0 && dr !== 0) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
      }
      return false;
      
    case 'sideLance':
      if (dr === 0 && dc !== 0) {
        return isPathClear(fromRow, fromCol, toRow, toCol);
      }
      return false;
      
    case 'vKnight':
      // 上下方向ベースのL字
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1);
      
    case 'hKnight':
      // 左右方向ベースのL字
      return (Math.abs(dc) === 2 && Math.abs(dr) === 1);
      
    case 'jump2':
      // 前後2マス先のみ
      return Math.abs(dr) === 2 && dc === 0;
      
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
    if (gameState.board[r][c] !== null) return false;
    r += dr;
    c += dc;
  }
  
  return true;
}

function handleSurrender(ws) {
  if (ws.playerNum === gameState.currentTurn) {
    const winner = ws.playerNum === 1 ? 2 : 1;
    endGame(winner);
  }
}

function endGame(winner) {
  gameState.phase = 'finished';
  
  broadcast({
    type: 'gameEnded',
    winner: winner
  });
  
  // 両プレイヤーを自動的に退席させる
  setTimeout(() => {
    if (gameState.players.player1) {
      gameState.players.player1 = null;
    }
    if (gameState.players.player2) {
      gameState.players.player2 = null;
    }
    resetGame();
  }, 3000);
}

function resetGame() {
  gameState.phase = 'waiting';
  gameState.board = null;
  gameState.currentTurn = null;
  gameState.setupReady = {
    player1: false,
    player2: false
  };
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
      players: {
        player1: gameState.players.player1 !== null,
        player2: gameState.players.player2 !== null
      }
    }
  }));
}

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});