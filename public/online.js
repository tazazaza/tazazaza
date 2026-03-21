// PIKUO オンライン対戦モード（改良版）

class OnlineGame {
    constructor() {
        this.ws = null;
        this.myPlayerNum = null;
        this.gameState = {
            phase: 'waiting',
            costLimit: 30,
            board: null,
            currentTurn: null
        };
        this.setupPieces = [];
        this.remainingCost = 30;
        this.boardRenderer = null;
        this.selectedCell = null;
        this.selectedCapturedIndex = null;
        this.capturedPieces = { player1: [], player2: [] };
        this.draggedPiece = null;
        this.draggedPiecePos = { x: 0, y: 0 };
        this.highlightedMoves = [];
        this.isMyTurn = false;
        this.originalTitle = document.title;
    }

    init() {
        // WebSocket接続
        this.connectWebSocket();

        // イベントリスナー
        document.getElementById('onlineMode').addEventListener('click', () => {
            showScreen('waitingRoom');
        });

        document.getElementById('backToMode').addEventListener('click', () => {
            this.leaveGame();
            showScreen('modeSelect');
        });

        document.getElementById('sitBtn1').addEventListener('click', () => {
            this.sit(1);
        });

        document.getElementById('sitBtn2').addEventListener('click', () => {
            this.sit(2);
        });

        document.getElementById('costSlider').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('costValue').textContent = value;
            this.send({ type: 'setCostLimit', value });
        });

        document.getElementById('readyBtn').addEventListener('click', () => {
            this.sendSetupComplete();
        });

        document.getElementById('leaveSetup').addEventListener('click', () => {
            this.leaveGame();
        });

        document.getElementById('surrenderBtn').addEventListener('click', () => {
            if (confirm('本当に投了しますか？')) {
                this.send({ type: 'surrender' });
            }
        });

        document.getElementById('leaveGame').addEventListener('click', () => {
            this.leaveGame();
        });

        document.getElementById('nextGame').addEventListener('click', () => {
            showScreen('waitingRoom');
        });

        // ページの可視性変更イベント
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isMyTurn) {
                document.title = this.originalTitle;
            }
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket接続成功');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };

        this.ws.onclose = () => {
            console.log('WebSocket切断');
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocketエラー:', error);
        };
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'gameState':
                this.updateGameState(data.state);
                break;
            case 'playerSat':
                this.handlePlayerSat(data.player);
                break;
            case 'playerLeft':
                this.handlePlayerLeft(data.player);
                break;
            case 'costLimitChanged':
                document.getElementById('costValue').textContent = data.value;
                document.getElementById('costSlider').value = data.value;
                this.gameState.costLimit = data.value;
                this.remainingCost = data.value;
                break;
            case 'phaseChanged':
                this.gameState.phase = data.phase;
                if (data.phase === 'setup') {
                    this.startSetup();
                }
                break;
            case 'playerReady':
                // 相手がReady
                break;
            case 'gameStarted':
                this.startGame(data);
                break;
            case 'validMoves':
                this.showValidMoves(data.moves);
                break;
            case 'moved':
                this.handleMove(data);
                break;
            case 'placedFromHand':
                this.handlePlaceFromHand(data);
                break;
            case 'gameEnded':
                this.showResult(data.winner);
                break;
            case 'gameReset':
                this.resetGame();
                break;
        }
    }

    sit(playerNum) {
        this.myPlayerNum = playerNum;
        this.send({ type: 'sit', player: playerNum });
    }

    leaveGame() {
        this.send({ type: 'leave' });
        this.myPlayerNum = null;
        this.resetGame();
        showScreen('waitingRoom');
    }

    handlePlayerSat(playerNum) {
        const seatBtn = document.getElementById(`sitBtn${playerNum}`);
        const indicator = document.querySelector(`#seat${playerNum} .seated-indicator`);
        
        seatBtn.classList.add('hidden');
        indicator.classList.remove('hidden');
    }

    handlePlayerLeft(playerNum) {
        const seatBtn = document.getElementById(`sitBtn${playerNum}`);
        const indicator = document.querySelector(`#seat${playerNum} .seated-indicator`);
        
        seatBtn.classList.remove('hidden');
        indicator.classList.add('hidden');
    }

    updateGameState(state) {
        this.gameState = { ...this.gameState, ...state };
    }

    startSetup() {
        showScreen('setupScreen');
        
        this.remainingCost = this.gameState.costLimit;
        this.setupPieces = [];
        document.getElementById('remainingCost').textContent = this.remainingCost;
        
        // 駒パレットの作成
        this.createPiecePalette();
        
        // キャンバスの設定（playerNumを渡す）
        const canvas = document.getElementById('setupCanvas');
        this.boardRenderer = new BoardRenderer(canvas, 80, this.myPlayerNum);
        this.setupCanvasForPlacement(canvas);
        this.boardRenderer.drawBoard(null);
    }

    createPiecePalette() {
        const container = document.getElementById('pieceList');
        container.innerHTML = '';
        
        for (const [type, info] of Object.entries(PIECES)) {
            const div = document.createElement('div');
            div.className = 'piece-item';
            div.draggable = true;
            div.dataset.type = type;
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'piece-name';
            nameSpan.textContent = info.name;
            
            const costSpan = document.createElement('span');
            costSpan.className = 'piece-cost';
            costSpan.textContent = `${info.cost}`;
            
            div.appendChild(nameSpan);
            div.appendChild(costSpan);
            
            div.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('pieceType', type);
                div.classList.add('dragging');
            });
            
            div.addEventListener('dragend', () => {
                div.classList.remove('dragging');
            });
            
            container.appendChild(div);
        }
    }

    setupCanvasForPlacement(canvas) {
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            
            const pieceType = e.dataTransfer.getData('pieceType');
            if (!pieceType) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.boardRenderer.getCellFromPosition(x, y);
            
            if (cell && this.canPlaceInSetup(cell.row, pieceType)) {
                this.placePieceInSetup(cell.row, cell.col, pieceType);
            }
        });
        
        // 右クリックで削除
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.boardRenderer.getCellFromPosition(x, y);
            
            if (cell) {
                this.removePieceFromSetup(cell.row, cell.col);
            }
        });
    }

    canPlaceInSetup(row, pieceType) {
        // 自陣（下3行）にのみ配置可能
        const validRows = this.myPlayerNum === 1 ? [7, 8, 9] : [0, 1, 2];
        
        if (!validRows.includes(row)) {
            return false;
        }
        
        // コストチェック
        const cost = PIECES[pieceType].cost;
        if (this.remainingCost - cost < 0) {
            return false;
        }
        
        return true;
    }

    placePieceInSetup(row, col, type) {
        // Kingは1個まで
        if (type === 'king') {
            const hasKing = this.setupPieces.some(p => p.type === 'king');
            if (hasKing) {
                alert('王は1個までです');
                return;
            }
        }
        
        // 既に駒がある場合は削除
        const existingIndex = this.setupPieces.findIndex(p => p.row === row && p.col === col);
        if (existingIndex !== -1) {
            const existingPiece = this.setupPieces[existingIndex];
            this.remainingCost += PIECES[existingPiece.type].cost;
            this.setupPieces.splice(existingIndex, 1);
        }
        
        // 新しい駒を配置
        this.setupPieces.push({
            type,
            row,
            col,
            level: 0
        });
        
        this.remainingCost -= PIECES[type].cost;
        document.getElementById('remainingCost').textContent = this.remainingCost;
        
        // 盤面を更新
        const tempBoard = Array(10).fill(null).map(() => Array(10).fill(null));
        for (const piece of this.setupPieces) {
            tempBoard[piece.row][piece.col] = {
                type: piece.type,
                level: 0,
                owner: this.myPlayerNum
            };
        }
        this.boardRenderer.drawBoard(tempBoard);
        
        audioSystem.playPlace('C');
    }

    removePieceFromSetup(row, col) {
        const index = this.setupPieces.findIndex(p => p.row === row && p.col === col);
        if (index !== -1) {
            const piece = this.setupPieces[index];
            this.remainingCost += PIECES[piece.type].cost;
            this.setupPieces.splice(index, 1);
            
            document.getElementById('remainingCost').textContent = this.remainingCost;
            
            // 盤面を更新
            const tempBoard = Array(10).fill(null).map(() => Array(10).fill(null));
            for (const piece of this.setupPieces) {
                tempBoard[piece.row][piece.col] = {
                    type: piece.type,
                    level: 0,
                    owner: this.myPlayerNum
                };
            }
            this.boardRenderer.drawBoard(tempBoard);
        }
    }

    sendSetupComplete() {
        // 王が配置されているかチェック
        const hasKing = this.setupPieces.some(p => p.type === 'king');
        if (!hasKing) {
            alert('王を配置してください');
            return;
        }
        
        this.send({
            type: 'setupComplete',
            setup: this.setupPieces
        });
    }

    startGame(data) {
        showScreen('gameScreen');
        
        this.gameState.board = data.board;
        this.gameState.currentTurn = data.firstPlayer;
        this.updateTurnDisplay();
        
        const canvas = document.getElementById('gameCanvas');
        this.boardRenderer = new BoardRenderer(canvas, 80, this.myPlayerNum);
        this.setupGameCanvas(canvas);
        this.boardRenderer.drawBoard(this.gameState.board);
    }

    setupGameCanvas(canvas) {
        let isDragging = false;
        let dragStartCell = null;

        canvas.addEventListener('mousedown', (e) => {
            if (this.gameState.currentTurn !== this.myPlayerNum) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.boardRenderer.getCellFromPosition(x, y);

            if (!cell) return;

            const piece = this.gameState.board[cell.row][cell.col];
            
            if (piece && piece.owner === this.myPlayerNum) {
                this.selectedCell = cell;
                dragStartCell = cell;
                isDragging = true;
                this.draggedPiece = piece;
                this.draggedPiecePos = { x: e.clientX, y: e.clientY };
                
                // サーバーに移動可能範囲をリクエスト
                this.send({
                    type: 'getValidMoves',
                    row: cell.row,
                    col: cell.col
                });
                
                canvas.style.cursor = 'grabbing';
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            this.draggedPiecePos = { x: e.clientX, y: e.clientY };
            this.redrawWithDraggedPiece();
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!isDragging || !dragStartCell) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.boardRenderer.getCellFromPosition(x, y);

            if (cell && !(cell.row === dragStartCell.row && cell.col === dragStartCell.col)) {
                // 移動を送信
                this.send({
                    type: 'move',
                    fromRow: dragStartCell.row,
                    fromCol: dragStartCell.col,
                    toRow: cell.row,
                    toCol: cell.col
                });
            }

            isDragging = false;
            dragStartCell = null;
            this.selectedCell = null;
            this.draggedPiece = null;
            this.highlightedMoves = [];
            this.boardRenderer.clearHighlight();
            this.boardRenderer.drawBoard(this.gameState.board);
            canvas.style.cursor = 'default';
        });
    }

    showValidMoves(moves) {
        this.highlightedMoves = moves;
        this.boardRenderer.setHighlight(moves);
        this.boardRenderer.drawBoard(this.gameState.board);
        
        if (this.draggedPiece) {
            this.redrawWithDraggedPiece();
        }
    }

    redrawWithDraggedPiece() {
        if (!this.draggedPiece) return;
        
        // 盤面を再描画
        this.boardRenderer.drawBoard(this.gameState.board);
        
        // ドラッグ中の駒を描画
        const canvas = document.getElementById('gameCanvas');
        const rect = canvas.getBoundingClientRect();
        const ctx = canvas.getContext('2d');
        
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        
        const x = this.draggedPiecePos.x - rect.left;
        const y = this.draggedPiecePos.y - rect.top;
        const rotation = this.draggedPiece.owner === 2 ? Math.PI : 0;
        
        PieceRenderer.draw(ctx, this.draggedPiece, x, y, this.boardRenderer.cellSize, 
                          this.draggedPiece.owner, rotation);
        
        ctx.restore();
    }

    handleMove(data) {
        // 盤面を更新
        const piece = this.gameState.board[data.fromRow][data.fromCol];
        this.gameState.board[data.toRow][data.toCol] = piece;
        this.gameState.board[data.fromRow][data.fromCol] = null;
        
        // 駒を取った場合
        if (data.capturedPiece) {
            const captor = piece.owner;
            const playerKey = `player${captor}`;
            this.capturedPieces[playerKey].push(data.capturedPiece);
            
            const rank = PieceRenderer.getPieceRank(data.capturedPiece);
            audioSystem.playCapture(rank);
        }
        
        // 進化した場合
        if (data.evolvedPiece) {
            audioSystem.playEvolution(data.evolvedPiece.level);
        }
        
        // 音を鳴らす（相手の手の場合は違う音）
        if (piece.owner !== this.myPlayerNum) {
            audioSystem.playClick();
        }
        
        // ターン更新
        this.gameState.currentTurn = data.nextTurn;
        this.updateTurnDisplay();
        
        this.boardRenderer.drawBoard(this.gameState.board);
        this.updateCapturedDisplay();
    }

    handlePlaceFromHand(data) {
        this.gameState.board[data.row][data.col] = data.piece;
        this.gameState.currentTurn = data.nextTurn;
        
        this.updateTurnDisplay();
        
        const rank = PieceRenderer.getPieceRank(data.piece);
        audioSystem.playPlace(rank);
        
        this.boardRenderer.drawBoard(this.gameState.board);
        this.updateCapturedDisplay();
    }

    updateTurnDisplay() {
        this.isMyTurn = this.gameState.currentTurn === this.myPlayerNum;
        const turnText = this.isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN";
        document.getElementById('currentPlayer').textContent = turnText;
        
        // 盤面の縁を光らせる
        const boardContainer = document.querySelector('.board-container');
        if (this.isMyTurn) {
            boardContainer.classList.add('my-turn');
            // 非アクティブ時はタブタイトルを変更
            if (document.hidden) {
                document.title = '[YOUR TURN] ' + this.originalTitle;
            }
        } else {
            boardContainer.classList.remove('my-turn');
            document.title = this.originalTitle;
        }
    }

    updateCapturedDisplay() {
        // 自分の持ち駒
        const myKey = `player${this.myPlayerNum}`;
        const myContainer = document.getElementById('playerCaptured');
        myContainer.innerHTML = '';
        
        if (this.capturedPieces[myKey]) {
            this.capturedPieces[myKey].forEach((piece, index) => {
                const div = document.createElement('div');
                div.className = 'captured-piece';
                div.textContent = PIECES[piece.type].name;
                if (piece.level) {
                    div.textContent += ` Lv${piece.level}`;
                }
                myContainer.appendChild(div);
            });
        }
        
        // 相手の持ち駒
        const oppKey = `player${this.myPlayerNum === 1 ? 2 : 1}`;
        const oppContainer = document.getElementById('opponentCaptured');
        oppContainer.innerHTML = '';
        
        if (this.capturedPieces[oppKey]) {
            this.capturedPieces[oppKey].forEach((piece) => {
                const div = document.createElement('div');
                div.className = 'captured-piece';
                div.textContent = PIECES[piece.type].name;
                if (piece.level) {
                    div.textContent += ` Lv${piece.level}`;
                }
                oppContainer.appendChild(div);
            });
        }
    }

    showResult(winner) {
        const resultText = winner === this.myPlayerNum ? 'YOU WIN!' : 'YOU LOSE';
        document.getElementById('resultText').textContent = resultText;
        showScreen('resultScreen');
        
        if (winner === this.myPlayerNum) {
            audioSystem.playEvolution(2); // 勝利音
        } else {
            audioSystem.playKingCaptured();
        }
        
        // 試合終了後に自動退席
        this.send({ type: 'leave' });
        this.myPlayerNum = null;
    }

    resetGame() {
        this.gameState = {
            phase: 'waiting',
            costLimit: 30,
            board: null,
            currentTurn: null
        };
        this.setupPieces = [];
        this.capturedPieces = { player1: [], player2: [] };
        this.isMyTurn = false;
        document.title = this.originalTitle;
    }
}

// グローバルインスタンス
const onlineGame = new OnlineGame();
document.addEventListener('DOMContentLoaded', () => {
    onlineGame.init();
});