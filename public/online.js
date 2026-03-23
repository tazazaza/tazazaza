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
        this.setupHistory = [];
        this.setupHistoryIndex = -1;
        this.lastMove = null; // 最後の手を記録
        this.isReady = false; // 自分のREADY状態
        this.opponentReady = false; // 相手のREADY状態
    }

    init() {
        // WebSocket接続
        this.connectWebSocket();

        // イベントリスナー（存在するものだけ）
        const addListener = (id, event, handler) => {
            const elem = document.getElementById(id);
            if (elem) elem.addEventListener(event, handler);
        };

        addListener('onlineMode', 'click', () => showScreen('waitingRoom'));
        addListener('backToMode', 'click', () => {
            this.leaveGame();
            showScreen('modeSelect');
        });
        addListener('sitBtn1', 'click', () => this.sit(1));
        addListener('sitBtn2', 'click', () => this.sit(2));
        addListener('costSlider', 'input', (e) => {
            const value = parseInt(e.target.value);
            document.getElementById('costValue').textContent = value;
            this.send({ type: 'setCostLimit', value });
        });
        addListener('readyBtn', 'click', () => this.sendSetupComplete());
        addListener('leaveSetup', 'click', () => this.leaveGame());
        addListener('undoBtn', 'click', () => this.undoSetup());
        addListener('redoBtn', 'click', () => this.redoSetup());
        addListener('resetBtn', 'click', () => this.resetSetup());
        addListener('surrenderBtn', 'click', () => {
            if (confirm('本当に投了しますか？')) {
                this.send({ type: 'surrender' });
            }
        });
        addListener('leaveGame', 'click', () => this.leaveGame());
        addListener('nextGame', 'click', () => showScreen('waitingRoom'));

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
                this.handlePlayerReady(data.player);
                break;
            case 'playerCancelReady':
                this.handlePlayerCancelReady(data.player);
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
        const seat = document.getElementById(`seat${playerNum}`);
        
        seatBtn.classList.add('hidden');
        indicator.classList.remove('hidden');
        seat.classList.add('occupied');
    }

    handlePlayerLeft(playerNum) {
        const seatBtn = document.getElementById(`sitBtn${playerNum}`);
        const indicator = document.querySelector(`#seat${playerNum} .seated-indicator`);
        const seat = document.getElementById(`seat${playerNum}`);
        
        seatBtn.classList.remove('hidden');
        indicator.classList.add('hidden');
        seat.classList.remove('occupied');
    }

    updateGameState(state) {
        this.gameState = { ...this.gameState, ...state };
    }

    handlePlayerReady(playerNum) {
        if (playerNum !== this.myPlayerNum) {
            this.opponentReady = true;
            const oppReadyState = document.querySelector('#oppReadyStatus .ready-state');
            if (oppReadyState) {
                oppReadyState.textContent = 'READY';
                oppReadyState.className = 'ready-state ready';
            }
        }
    }

    handlePlayerCancelReady(playerNum) {
        if (playerNum !== this.myPlayerNum) {
            this.opponentReady = false;
            const oppReadyState = document.querySelector('#oppReadyStatus .ready-state');
            if (oppReadyState) {
                oppReadyState.textContent = 'NOT READY';
                oppReadyState.className = 'ready-state not-ready';
            }
        }
    }

    startSetup() {
        showScreen('setupScreen');
        
        this.remainingCost = this.gameState.costLimit;
        this.setupPieces = [];
        this.setupHistory = [];
        this.setupHistoryIndex = -1;
        this.isReady = false;
        this.opponentReady = false;
        document.getElementById('remainingCost').textContent = this.remainingCost;
        
        // READY表示をリセット
        this.updateReadyDisplay();
        const oppReadyState = document.querySelector('#oppReadyStatus .ready-state');
        if (oppReadyState) {
            oppReadyState.textContent = 'NOT READY';
            oppReadyState.className = 'ready-state not-ready';
        }
        
        // キャンバスの設定（playerNumを渡す）
        const canvas = document.getElementById('setupCanvas');
        this.boardRenderer = new BoardRenderer(canvas, 80, this.myPlayerNum);
        this.setupCanvasForPlacement(canvas);
        
        // 空の盤面を描画
        const emptyBoard = Array(10).fill(null).map(() => Array(10).fill(null));
        this.boardRenderer.drawBoard(emptyBoard);
        
        // 駒パレットの作成
        this.createPiecePalette();
        
        // 初期状態を履歴に保存
        this.saveSetupHistory();
    }

    createPiecePalette() {
        const container = document.getElementById('pieceList');
        container.innerHTML = '';
        
        for (const [type, info] of Object.entries(PIECES)) {
            const div = document.createElement('div');
            div.className = 'piece-item';
            div.draggable = true; // div全体をドラッグ可能に
            div.dataset.type = type;
            
            // 小さいキャンバスで駒を描画
            const canvas = document.createElement('canvas');
            canvas.width = 60;
            canvas.height = 60;
            const ctx = canvas.getContext('2d');
            
            try {
                // 駒を描画（自分のプレイヤー番号で色を決定）
                const dummyPiece = { type: type, level: 0, owner: this.myPlayerNum };
                
                // PieceRendererを使って描画（PieceDesignsを内部で呼ぶ）
                PieceRenderer.draw(ctx, dummyPiece, 30, 30, 60, this.myPlayerNum, 0);
            } catch (e) {
                console.error('駒描画エラー:', type, e);
                // エラー時はテキストで表示
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(info.name, 30, 35);
            }
            
            const costSpan = document.createElement('span');
            costSpan.className = 'piece-cost';
            costSpan.textContent = `COST: ${info.cost}`;
            
            div.appendChild(canvas);
            div.appendChild(costSpan);
            
            // divにイベントリスナーを追加
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
        
        // 既に駒がある場合は削除（履歴は保存しない）
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
        
        // 履歴を保存（1回だけ）
        this.saveSetupHistory();
        
        // 盤面を更新
        this.updateSetupBoard();
        
        audioSystem.playPlace('C');
    }
    
    updateSetupBoard() {
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
    
    saveSetupHistory() {
        // 現在位置より後ろの履歴を削除
        this.setupHistory = this.setupHistory.slice(0, this.setupHistoryIndex + 1);
        
        // 現在の状態を保存
        this.setupHistory.push({
            pieces: JSON.parse(JSON.stringify(this.setupPieces)),
            cost: this.remainingCost
        });
        
        this.setupHistoryIndex = this.setupHistory.length - 1;
    }
    
    undoSetup() {
        if (this.setupHistoryIndex > 0) {
            this.setupHistoryIndex--;
            this.restoreSetupState();
        }
    }
    
    redoSetup() {
        if (this.setupHistoryIndex < this.setupHistory.length - 1) {
            this.setupHistoryIndex++;
            this.restoreSetupState();
        }
    }
    
    resetSetup() {
        this.setupPieces = [];
        this.remainingCost = this.gameState.costLimit;
        this.setupHistory = [];
        this.setupHistoryIndex = -1;
        document.getElementById('remainingCost').textContent = this.remainingCost;
        this.updateSetupBoard();
        this.saveSetupHistory();
    }
    
    restoreSetupState() {
        const state = this.setupHistory[this.setupHistoryIndex];
        this.setupPieces = JSON.parse(JSON.stringify(state.pieces));
        this.remainingCost = state.cost;
        document.getElementById('remainingCost').textContent = this.remainingCost;
        this.updateSetupBoard();
    }

    removePieceFromSetup(row, col) {
        const index = this.setupPieces.findIndex(p => p.row === row && p.col === col);
        if (index !== -1) {
            const piece = this.setupPieces[index];
            this.remainingCost += PIECES[piece.type].cost;
            this.setupPieces.splice(index, 1);
            
            document.getElementById('remainingCost').textContent = this.remainingCost;
            
            // 履歴を保存
            this.saveSetupHistory();
            
            // 盤面を更新
            this.updateSetupBoard();
        }
    }

    sendSetupComplete() {
        // 王が配置されているかチェック
        const hasKing = this.setupPieces.some(p => p.type === 'king');
        if (!hasKing) {
            alert('王を配置してください');
            return;
        }
        
        // READY状態をトグル
        this.isReady = !this.isReady;
        this.updateReadyDisplay();
        
        if (this.isReady) {
            // READYを送信
            this.send({
                type: 'setupComplete',
                setup: this.setupPieces
            });
        } else {
            // READY解除を送信
            this.send({
                type: 'cancelReady'
            });
        }
    }
    
    updateReadyDisplay() {
        const readyBtn = document.getElementById('readyBtn');
        const myReadyState = document.querySelector('#myReadyStatus .ready-state');
        
        if (this.isReady) {
            readyBtn.textContent = 'CANCEL READY';
            readyBtn.style.background = 'rgba(255, 100, 100, 0.2)';
            myReadyState.textContent = 'READY';
            myReadyState.className = 'ready-state ready';
        } else {
            readyBtn.textContent = 'READY';
            readyBtn.style.background = '';
            myReadyState.textContent = 'NOT READY';
            myReadyState.className = 'ready-state not-ready';
        }
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

        // 持ち駒のドロップ処理
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (this.gameState.currentTurn !== this.myPlayerNum) return;
            
            const capturedIndex = e.dataTransfer.getData('capturedIndex');
            if (capturedIndex === '') return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.boardRenderer.getCellFromPosition(x, y);
            
            if (cell) {
                // サーバーに配置を送信
                this.send({
                    type: 'placeFromHand',
                    pieceIndex: parseInt(capturedIndex),
                    row: cell.row,
                    col: cell.col
                });
            }
        });

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
        
        // 最後の手を記録
        this.lastMove = {
            from: { row: data.fromRow, col: data.fromCol },
            to: { row: data.toRow, col: data.toCol }
        };
        
        // 駒を取った場合
        if (data.capturedPiece) {
            const captor = piece.owner;
            const playerKey = `player${captor}`;
            this.capturedPieces[playerKey].push(data.capturedPiece);
            
            // 駒を取った音
            audioSystem.playSword();
        } else {
            // 通常移動の音（koma）
            audioSystem.playKoma();
        }
        
        // ターン更新
        this.gameState.currentTurn = data.nextTurn;
        this.updateTurnDisplay();
        
        // 最後の手をハイライトして描画
        this.boardRenderer.setLastMove(this.lastMove);
        this.boardRenderer.drawBoard(this.gameState.board);
        this.updateCapturedDisplay();
    }

    handlePlaceFromHand(data) {
        this.gameState.board[data.row][data.col] = data.piece;
        this.gameState.currentTurn = data.nextTurn;
        
        // 配置した場所を最後の手として記録
        this.lastMove = {
            from: null,
            to: { row: data.row, col: data.col }
        };
        
        this.updateTurnDisplay();
        
        // 配置音（koma）
        audioSystem.playKoma();
        
        this.boardRenderer.setLastMove(this.lastMove);
        this.boardRenderer.drawBoard(this.gameState.board);
        this.updateCapturedDisplay();
    }

    updateTurnDisplay() {
        this.isMyTurn = this.gameState.currentTurn === this.myPlayerNum;
        const turnText = this.isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN";
        const turnIndicator = document.querySelector('.turn-indicator');
        const currentPlayerSpan = document.getElementById('currentPlayer');
        
        currentPlayerSpan.textContent = turnText;
        
        // ターンインジケーターにクラスを追加/削除
        if (this.isMyTurn) {
            turnIndicator.classList.add('my-turn');
        } else {
            turnIndicator.classList.remove('my-turn');
        }
        
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
                div.dataset.pieceIndex = index;
                
                // 駒をcanvasで描画
                const canvas = document.createElement('canvas');
                canvas.width = 50;
                canvas.height = 50;
                canvas.draggable = true;
                canvas.style.cursor = 'grab';
                const ctx = canvas.getContext('2d');
                
                // 駒を描画
                PieceRenderer.draw(ctx, piece, 25, 25, 50, this.myPlayerNum, 0);
                
                div.appendChild(canvas);
                
                // ドラッグイベント
                canvas.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('capturedIndex', index);
                    canvas.style.opacity = '0.5';
                });
                
                canvas.addEventListener('dragend', () => {
                    canvas.style.opacity = '1';
                });
                
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
                
                // 駒をcanvasで描画（相手の色）
                const canvas = document.createElement('canvas');
                canvas.width = 50;
                canvas.height = 50;
                const ctx = canvas.getContext('2d');
                
                const oppPlayerNum = this.myPlayerNum === 1 ? 2 : 1;
                PieceRenderer.draw(ctx, piece, 25, 25, 50, oppPlayerNum, 0);
                
                div.appendChild(canvas);
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