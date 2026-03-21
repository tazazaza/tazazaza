// PIKUO ゲームロジック

// 駒の定義
const PIECES = {
    king: { name: 'KING', cost: 0, rank: 'SPECIAL' },
    gold: { name: 'GOLD', cost: 5, rank: 'A' },
    soldier: { name: 'SOLDIER', cost: 1, rank: 'C' }, // ランクはレベルで変わる
    rook: { name: 'ROOK', cost: 8, rank: 'S' },
    bishop: { name: 'BISHOP', cost: 7, rank: 'S' },
    lance: { name: 'LANCE', cost: 2, rank: 'C' },
    sideLance: { name: 'SIDE LANCE', cost: 2, rank: 'C' },
    vKnight: { name: 'V-KNIGHT', cost: 3, rank: 'B' },
    hKnight: { name: 'H-KNIGHT', cost: 3, rank: 'B' },
    jump2: { name: 'JUMP-2', cost: 2, rank: 'C' }
};

// ランク別の色設定
const RANK_COLORS = {
    'S': { border: '#d4af37', glow: 'rgba(212, 175, 55, 0.6)' },
    'A': { border: '#c0c0c0', glow: 'rgba(192, 192, 192, 0.6)' },
    'B': { border: '#4a9eff', glow: 'rgba(74, 158, 255, 0.6)' },
    'C': { border: '#ffffff', glow: 'rgba(255, 255, 255, 0.3)' },
    'SPECIAL': { border: '#9b59b6', glow: 'rgba(155, 89, 182, 0.8)' }
};

// 駒の幾何学デザイン描画
class PieceRenderer {
    static draw(ctx, piece, x, y, size, owner, rotation = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        const rank = this.getPieceRank(piece);
        const colors = RANK_COLORS[rank];
        const baseColor = owner === 1 ? '#ff4444' : '#4488ff';
        
        // PieceDesignsから描画関数を呼ぶ
        const drawMethod = `draw${piece.type.charAt(0).toUpperCase() + piece.type.slice(1)}`;
        if (piece.type === 'soldier') {
            PieceDesigns.drawSoldier(ctx, size, baseColor, colors, piece.level || 0);
        } else if (PieceDesigns[drawMethod]) {
            PieceDesigns[drawMethod](ctx, size, baseColor, colors);
        }
        
        ctx.restore();
    }
    
    static getPieceRank(piece) {
        if (piece.type === 'soldier') {
            const level = piece.level || 0;
            if (level === 0) return 'C';
            if (level === 1) return 'B';
            return 'A';
        }
        return PIECES[piece.type]?.rank || 'C';
    }

// 盤面描画クラス
class BoardRenderer {
    constructor(canvas, cellSize = 80, playerNum = 1) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = cellSize;
        this.highlightedCells = [];
        this.selectedPiece = null;
        this.playerNum = playerNum; // プレイヤー番号を保存
    }
    
    drawBoard(board, perspective = 1) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Player 2の場合は盤面を180度回転
        const isRotated = this.playerNum === 2;
        
        // 盤面のグリッド
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= 10; i++) {
            // 縦線
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.cellSize, 0);
            this.ctx.lineTo(i * this.cellSize, 10 * this.cellSize);
            this.ctx.stroke();
            
            // 横線
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.cellSize);
            this.ctx.lineTo(10 * this.cellSize, i * this.cellSize);
            this.ctx.stroke();
        }
        
        // ハイライト表示
        this.ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
        for (const cell of this.highlightedCells) {
            const displayRow = isRotated ? 9 - cell.row : cell.row;
            const displayCol = isRotated ? 9 - cell.col : cell.col;
            this.ctx.fillRect(displayCol * this.cellSize, displayRow * this.cellSize, 
                            this.cellSize, this.cellSize);
        }
        
        // 駒の描画
        if (board) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const piece = board[row][col];
                    if (piece) {
                        const displayRow = isRotated ? 9 - row : row;
                        const displayCol = isRotated ? 9 - col : col;
                        const x = displayCol * this.cellSize + this.cellSize / 2;
                        const y = displayRow * this.cellSize + this.cellSize / 2;
                        
                        // 自分の駒は常に上向き、相手の駒は常に下向き
                        let rotation = 0;
                        if (this.playerNum === 1) {
                            rotation = piece.owner === 2 ? Math.PI : 0;
                        } else {
                            rotation = piece.owner === 1 ? Math.PI : 0;
                        }
                        
                        PieceRenderer.draw(this.ctx, piece, x, y, this.cellSize, piece.owner, rotation);
                    }
                }
            }
        }
    }
    
    setHighlight(cells) {
        this.highlightedCells = cells;
    }
    
    clearHighlight() {
        this.highlightedCells = [];
    }
    
    getCellFromPosition(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // Player 2の場合は座標を反転
        const isRotated = this.playerNum === 2;
        const actualRow = isRotated ? 9 - row : row;
        const actualCol = isRotated ? 9 - col : col;
        
        if (actualRow >= 0 && actualRow < 10 && actualCol >= 0 && actualCol < 10) {
            return { row: actualRow, col: actualCol };
        }
        return null;
    }
}

// 画面遷移ヘルパー
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

// UI操作音を追加
document.addEventListener('DOMContentLoaded', () => {
    // すべてのボタンにクリック音
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            audioSystem.playClick();
        });
        
        button.addEventListener('mouseenter', () => {
            audioSystem.playHover();
        });
    });
});