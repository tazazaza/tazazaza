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

// 駒デザイン定義（game.jsに統合）
class PieceDesigns {
    static drawKing(ctx, size, baseColor, colors) {
        const radius = size * 0.38;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const outerR = i % 2 === 0 ? radius * 1.0 : radius * 0.7;
            const x1 = Math.cos(angle) * outerR;
            const y1 = Math.sin(angle) * outerR;
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
        }
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 25;
        ctx.shadowColor = colors.glow;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            const x = Math.cos(angle) * radius * 0.4;
            const y = Math.sin(angle) * radius * 0.4;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = colors.border;
        ctx.fill();
    }
    
    static drawGold(ctx, size, baseColor, colors) {
        const radius = size * 0.36;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * radius * 0.6;
            const y = Math.sin(angle) * radius * 0.6;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * radius * 0.6, Math.sin(angle) * radius * 0.6);
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
    
    static drawSoldier(ctx, size, baseColor, colors, level) {
        const radius = size * 0.32;
        if (level === 0) {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = colors.border;
            ctx.fill();
        } else if (level === 1) {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * radius * 0.65, Math.sin(angle) * radius * 0.65, radius * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = colors.border;
                ctx.fill();
            }
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * radius * 0.7, Math.sin(angle) * radius * 0.7, radius * 0.18, 0, Math.PI * 2);
                ctx.fillStyle = colors.border;
                ctx.fill();
            }
        }
    }
    
    static drawRook(ctx, size, baseColor, colors) {
        const length = size * 0.4;
        const width = size * 0.22;
        ctx.fillStyle = baseColor;
        ctx.fillRect(-width / 2, -length, width, length * 2);
        ctx.fillRect(-length, -width / 2, length * 2, width);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-width / 2, -length, width, length * 2);
        ctx.strokeRect(-length, -width / 2, length * 2, width);
        ctx.shadowBlur = 20;
        ctx.shadowColor = colors.glow;
        ctx.strokeRect(-width / 2, -length, width, length * 2);
        ctx.strokeRect(-length, -width / 2, length * 2, width);
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, width * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = colors.border;
        ctx.fill();
    }
    
    static drawBishop(ctx, size, baseColor, colors) {
        const length = size * 0.4;
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = baseColor;
        ctx.fillRect(-length * 0.7, -length * 0.7, length * 1.4, length * 1.4);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-length * 0.7, -length * 0.7, length * 1.4, length * 1.4);
        ctx.strokeRect(-length * 0.35, -length * 0.35, length * 0.7, length * 0.7);
        ctx.restore();
        ctx.shadowBlur = 20;
        ctx.shadowColor = colors.glow;
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-length * 0.7, -length * 0.7, length * 1.4, length * 1.4);
        ctx.restore();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(0, 0, length * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = colors.border;
        ctx.fill();
    }
    
    static drawLance(ctx, size, baseColor, colors) {
        // 三角形 - 上下左右対称
        const radius = size * 0.36;
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius * 0.866, radius * 0.5);
        ctx.lineTo(-radius * 0.866, radius * 0.5);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // 内側の三角形
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.5);
        ctx.lineTo(radius * 0.433, radius * 0.25);
        ctx.lineTo(-radius * 0.433, radius * 0.25);
        ctx.closePath();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawSideLance(ctx, size, baseColor, colors) {
        // 逆三角形 - 上下左右対称（Lanceの逆）
        const radius = size * 0.36;
        ctx.beginPath();
        ctx.moveTo(0, radius);
        ctx.lineTo(radius * 0.866, -radius * 0.5);
        ctx.lineTo(-radius * 0.866, -radius * 0.5);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // 内側の三角形
        ctx.beginPath();
        ctx.moveTo(0, radius * 0.5);
        ctx.lineTo(radius * 0.433, -radius * 0.25);
        ctx.lineTo(-radius * 0.433, -radius * 0.25);
        ctx.closePath();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawVKnight(ctx, size, baseColor, colors) {
        // 正方形 - 完全な上下左右対称
        const length = size * 0.32;
        ctx.fillStyle = baseColor;
        ctx.fillRect(-length, -length, length * 2, length * 2);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-length, -length, length * 2, length * 2);
        // 内側の正方形
        ctx.strokeRect(-length * 0.6, -length * 0.6, length * 1.2, length * 1.2);
        // 4隅の点
        ctx.beginPath();
        ctx.arc(-length * 0.5, -length * 0.5, length * 0.15, 0, Math.PI * 2);
        ctx.arc(length * 0.5, -length * 0.5, length * 0.15, 0, Math.PI * 2);
        ctx.arc(-length * 0.5, length * 0.5, length * 0.15, 0, Math.PI * 2);
        ctx.arc(length * 0.5, length * 0.5, length * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = colors.border;
        ctx.fill();
    }
    
    static drawHKnight(ctx, size, baseColor, colors) {
        // 八角形 - 完全な上下左右対称
        const radius = size * 0.36;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // 内側の八角形
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const x = Math.cos(angle) * radius * 0.6;
            const y = Math.sin(angle) * radius * 0.6;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawJump2(ctx, size, baseColor, colors) {
        const radius = size * 0.38;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            const x = Math.cos(angle) * radius * 0.55;
            const y = Math.sin(angle) * radius * 0.55;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const x = Math.cos(angle) * radius * 0.3;
            const y = Math.sin(angle) * radius * 0.3;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.12, 0, Math.PI * 2);
            ctx.fillStyle = colors.border;
            ctx.fill();
        }
    }
}

// 駒の幾何学デザイン描画
class PieceRenderer {
    static draw(ctx, piece, x, y, size, owner, rotation = 0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        const rank = this.getPieceRank(piece);
        const colors = RANK_COLORS[rank];
        
        // Player1=赤、Player2=青
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