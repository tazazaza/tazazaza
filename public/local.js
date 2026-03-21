// PIKUO ローカル対局モード

class LocalGame {
    constructor() {
        this.board = null;
        this.costLimit = 30;
        this.capturedPieces = { player1: [], player2: [] };
        this.currentSetup = { player: 1, pieces: [] };
        this.setupPhase = true;
        this.boardRenderer = null;
        this.draggedPiece = null;
        this.selectedCell = null;
        this.selectedCapturedPiece = null;
    }

    init() {
        // イベントリスナーの設定
        document.getElementById('localMode').addEventListener('click', () => {
            showScreen('localScreen');
        });

        document.getElementById('backFromLocal').addEventListener('click', () => {
            this.reset();
            showScreen('modeSelect');
        });

        document.getElementById('localCostSlider').addEventListener('input', (e) => {
            this.costLimit = parseInt(e.target.value);
            document.getElementById('localCostValue').textContent = this.costLimit;
        });

        document.getElementById('startLocal').addEventListener('click', () => {
            this.startSetup();
        });

        document.getElementById('resetLocal').addEventListener('click', () => {
            this.reset();
            this.startSetup();
        });
    }

    startSetup() {
        document.getElementById('localSetup').classList.add('hidden');
        document.getElementById('localGame').classList.remove('hidden');

        // 盤面の初期化
        this.board = Array(10).fill(null).map(() => Array(10).fill(null));
        this.capturedPieces = { player1: [], player2: [] };
        
        const canvas = document.getElementById('localCanvas');
        this.boardRenderer = new BoardRenderer(canvas);
        
        this.setupCanvasEvents(canvas);
        this.boardRenderer.drawBoard(this.board);
        
        this.setupPhase = false;
    }

    setupCanvasEvents(canvas) {
        let isDragging = false;
        let dragStartCell = null;

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.boardRenderer.getCellFromPosition(x, y);

            if (!cell) return;

            const piece = this.board[cell.row][cell.col];
            
            if (piece) {
                // 駒を選択
                this.selectedCell = cell;
                dragStartCell = cell;
                isDragging = true;
                
                // 移動可能な場所をハイライト
                const validMoves = this.getValidMoves(piece, cell.row, cell.col);
                this.boardRenderer.setHighlight(validMoves);
                this.boardRenderer.drawBoard(this.board);
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            // ドラッグ中の視覚的フィードバックは省略（シンプルに）
        });

        canvas.addEventListener('mouseup', (e) => {
            if (!isDragging || !dragStartCell) return;

            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.boardRenderer.getCellFromPosition(x, y);

            if (cell) {
                // 同じセルならキャンセル
                if (cell.row === dragStartCell.row && cell.col === dragStartCell.col) {
                    this.boardRenderer.clearHighlight();
                    this.boardRenderer.drawBoard(this.board);
                } else {
                    // 移動を試行
                    this.tryMove(dragStartCell, cell);
                }
            } else {
                // 盤外ならキャンセル
                this.boardRenderer.clearHighlight();
                this.boardRenderer.drawBoard(this.board);
            }

            isDragging = false;
            dragStartCell = null;
            this.selectedCell = null;
        });

        // 持ち駒からの配置
        this.setupCapturedPiecesEvents();
    }

    setupCapturedPiecesEvents() {
        // Player1の持ち駒
        document.getElementById('local1Captured').addEventListener('click', (e) => {
            if (e.target.classList.contains('captured-piece')) {
                const index = parseInt(e.target.dataset.index);
                this.selectCapturedPiece(1, index);
            }
        });

        // Player2の持ち駒
        document.getElementById('local2Captured').addEventListener('click', (e) => {
            if (e.target.classList.contains('captured-piece')) {
                const index = parseInt(e.target.dataset.index);
                this.selectCapturedPiece(2, index);
            }
        });

        // 盤面クリックで配置
        document.getElementById('localCanvas').addEventListener('click', (e) => {
            if (!this.selectedCapturedPiece) return;

            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.boardRenderer.getCellFromPosition(x, y);

            if (cell && this.isValidPlacement(cell.row, cell.col, this.selectedCapturedPiece.owner)) {
                this.placeCapturedPiece(cell.row, cell.col);
            }
        });
    }

    selectCapturedPiece(player, index) {
        const playerKey = `player${player}`;
        if (index >= this.capturedPieces[playerKey].length) return;

        this.selectedCapturedPiece = {
            owner: player,
            index: index,
            piece: this.capturedPieces[playerKey][index]
        };

        // 配置可能な場所をハイライト
        const validCells = [];
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                if (this.isValidPlacement(row, col, player)) {
                    validCells.push({ row, col });
                }
            }
        }
        this.boardRenderer.setHighlight(validCells);
        this.boardRenderer.drawBoard(this.board);
    }

    placeCapturedPiece(row, col) {
        if (!this.selectedCapturedPiece) return;

        const { owner, index, piece } = this.selectedCapturedPiece;
        const playerKey = `player${owner}`;

        // 駒を配置
        this.board[row][col] = {
            type: piece.type,
            level: piece.level || 0,
            owner: owner
        };

        // 持ち駒から削除
        this.capturedPieces[playerKey].splice(index, 1);

        // サウンド
        const rank = PieceRenderer.getPieceRank(piece);
        audioSystem.playPlace(rank);

        // ハイライトをクリア
        this.selectedCapturedPiece = null;
        this.boardRenderer.clearHighlight();
        this.updateDisplay();
    }

    isValidPlacement(row, col, playerNum) {
        // マスが空いているか
        if (this.board[row][col] !== null) {
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

    tryMove(fromCell, toCell) {
        const piece = this.board[fromCell.row][fromCell.col];
        if (!piece) return;

        // 移動の妥当性をチェック
        if (!this.isValidMove(piece, fromCell.row, fromCell.col, toCell.row, toCell.col)) {
            this.boardRenderer.clearHighlight();
            this.boardRenderer.drawBoard(this.board);
            return;
        }

        // 移動先に駒がある場合は取る
        const capturedPiece = this.board[toCell.row][toCell.col];
        if (capturedPiece) {
            this.capturePiece(capturedPiece, piece.owner);
            
            // Soldierの進化チェック
            if (piece.type === 'soldier') {
                const oldLevel = piece.level || 0;
                piece.level = Math.min(oldLevel + 1, 2);
                
                if (piece.level > oldLevel) {
                    audioSystem.playEvolution(piece.level);
                }
            }
        }

        // 駒を移動
        this.board[toCell.row][toCell.col] = piece;
        this.board[fromCell.row][fromCell.col] = null;

        // 王を取ったら勝利表示
        if (capturedPiece && capturedPiece.type === 'king') {
            audioSystem.playKingCaptured();
            setTimeout(() => {
                alert(`PLAYER ${piece.owner} WINS!`);
            }, 500);
        }

        this.boardRenderer.clearHighlight();
        this.updateDisplay();
    }

    getValidMoves(piece, fromRow, fromCol) {
        const validCells = [];

        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                if (this.isValidMove(piece, fromRow, fromCol, row, col)) {
                    validCells.push({ row, col });
                }
            }
        }

        return validCells;
    }

    isValidMove(piece, fromRow, fromCol, toRow, toCol) {
        // 基本的な範囲チェック
        if (toRow < 0 || toRow >= 10 || toCol < 0 || toCol >= 10) {
            return false;
        }

        // 自分の駒がある場所には移動できない
        const targetPiece = this.board[toRow][toCol];
        if (targetPiece && targetPiece.owner === piece.owner) {
            return false;
        }

        // 駒の種類に応じた移動ルールをチェック
        return this.checkPieceMovement(piece, fromRow, fromCol, toRow, toCol);
    }

    checkPieceMovement(piece, fromRow, fromCol, toRow, toCol) {
        const dr = toRow - fromRow;
        const dc = toCol - fromCol;
        const direction = piece.owner === 1 ? -1 : 1; // プレイヤー1は上向き、2は下向き

        switch (piece.type) {
            case 'king':
                return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;

            case 'soldier':
                const level = piece.level || 0;
                if (level === 0) {
                    return dr === direction && dc === 0;
                } else if (level === 1) {
                    return (dr === direction && Math.abs(dc) <= 1);
                } else {
                    return (Math.abs(dr) <= 1 && Math.abs(dc) <= 1);
                }

            case 'gold':
                if (piece.owner === 1) {
                    return (dr === -1 && Math.abs(dc) <= 1) || (dr === 0 && Math.abs(dc) === 1) || (dr === 1 && dc === 0);
                } else {
                    return (dr === 1 && Math.abs(dc) <= 1) || (dr === 0 && Math.abs(dc) === 1) || (dr === -1 && dc === 0);
                }

            case 'rook':
                return (dr === 0 || dc === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol);

            case 'bishop':
                return Math.abs(dr) === Math.abs(dc) && this.isPathClear(fromRow, fromCol, toRow, toCol);

            case 'lance':
                return dc === 0 && dr * direction < 0 && this.isPathClear(fromRow, fromCol, toRow, toCol);

            case 'sideLance':
                return dr === 0 && dc !== 0 && this.isPathClear(fromRow, fromCol, toRow, toCol);

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

    isPathClear(fromRow, fromCol, toRow, toCol) {
        const dr = Math.sign(toRow - fromRow);
        const dc = Math.sign(toCol - fromCol);
        let r = fromRow + dr;
        let c = fromCol + dc;

        while (r !== toRow || c !== toCol) {
            if (this.board[r][c] !== null) {
                return false;
            }
            r += dr;
            c += dc;
        }

        return true;
    }

    capturePiece(piece, captorOwner) {
        const playerKey = `player${captorOwner}`;
        this.capturedPieces[playerKey].push({
            type: piece.type,
            level: piece.level || 0
        });

        // サウンド
        const rank = PieceRenderer.getPieceRank(piece);
        audioSystem.playCapture(rank);
    }

    updateDisplay() {
        this.boardRenderer.drawBoard(this.board);
        this.updateCapturedDisplay();
    }

    updateCapturedDisplay() {
        // Player1の持ち駒
        const p1Container = document.getElementById('local1Captured');
        p1Container.innerHTML = '';
        this.capturedPieces.player1.forEach((piece, index) => {
            const div = document.createElement('div');
            div.className = 'captured-piece';
            div.dataset.index = index;
            div.textContent = PIECES[piece.type].name;
            if (piece.level) {
                div.textContent += ` Lv${piece.level}`;
            }
            p1Container.appendChild(div);
        });

        // Player2の持ち駒
        const p2Container = document.getElementById('local2Captured');
        p2Container.innerHTML = '';
        this.capturedPieces.player2.forEach((piece, index) => {
            const div = document.createElement('div');
            div.className = 'captured-piece';
            div.dataset.index = index;
            div.textContent = PIECES[piece.type].name;
            if (piece.level) {
                div.textContent += ` Lv${piece.level}`;
            }
            p2Container.appendChild(div);
        });
    }

    reset() {
        this.board = null;
        this.capturedPieces = { player1: [], player2: [] };
        this.setupPhase = true;
        document.getElementById('localSetup').classList.remove('hidden');
        document.getElementById('localGame').classList.add('hidden');
    }
}

// グローバルインスタンス
const localGame = new LocalGame();
document.addEventListener('DOMContentLoaded', () => {
    localGame.init();
});