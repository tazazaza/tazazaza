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
        const baseColor = owner === 1 ? '#ffffff' : '#1a1a1a';
        const accentColor = owner === 1 ? '#f0f0f0' : '#000000';
        
        // 駒の種類に応じた形状
        switch (piece.type) {
            case 'king':
                this.drawKing(ctx, size, baseColor, colors);
                break;
            case 'gold':
                this.drawGold(ctx, size, baseColor, colors);
                break;
            case 'soldier':
                this.drawSoldier(ctx, size, baseColor, colors, piece.level || 0);
                break;
            case 'rook':
                this.drawRook(ctx, size, baseColor, colors);
                break;
            case 'bishop':
                this.drawBishop(ctx, size, baseColor, colors);
                break;
            case 'lance':
                this.drawLance(ctx, size, baseColor, colors);
                break;
            case 'sideLance':
                this.drawSideLance(ctx, size, baseColor, colors);
                break;
            case 'vKnight':
                this.drawVKnight(ctx, size, baseColor, colors);
                break;
            case 'hKnight':
                this.drawHKnight(ctx, size, baseColor, colors);
                break;
            case 'jump2':
                this.drawJump2(ctx, size, baseColor, colors);
                break;
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
    
    static drawKing(ctx, size, baseColor, colors) {
        // 複雑な多面体（六角形ベース）
        const radius = size * 0.35;
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
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 内側の小さい六角形
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * radius * 0.5;
            const y = Math.sin(angle) * radius * 0.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // グロー効果
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.glow;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    static drawGold(ctx, size, baseColor, colors) {
        // 五角形（家型）
        const radius = size * 0.35;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawSoldier(ctx, size, baseColor, colors, level) {
        const radius = size * 0.3;
        
        // 中心の円
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // レベルに応じた突起
        if (level >= 1) {
            // 左右の突起
            ctx.beginPath();
            ctx.arc(-radius, 0, radius * 0.4, 0, Math.PI * 2);
            ctx.arc(radius, 0, radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.stroke();
        }
        
        if (level >= 2) {
            // 上下の突起
            ctx.beginPath();
            ctx.arc(0, -radius, radius * 0.4, 0, Math.PI * 2);
            ctx.arc(0, radius, radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.stroke();
        }
    }
    
    static drawRook(ctx, size, baseColor, colors) {
        // 十字型
        const length = size * 0.35;
        const width = size * 0.15;
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(-width / 2, -length, width, length * 2);
        ctx.fillRect(-length, -width / 2, length * 2, width);
        
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(-width / 2, -length, width, length * 2);
        ctx.strokeRect(-length, -width / 2, length * 2, width);
    }
    
    static drawBishop(ctx, size, baseColor, colors) {
        // ダイヤ型
        const radius = size * 0.35;
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(radius, 0);
        ctx.lineTo(0, radius);
        ctx.lineTo(-radius, 0);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawLance(ctx, size, baseColor, colors) {
        // 縦長三角形
        const height = size * 0.4;
        const width = size * 0.25;
        ctx.beginPath();
        ctx.moveTo(0, -height);
        ctx.lineTo(width, height);
        ctx.lineTo(-width, height);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawSideLance(ctx, size, baseColor, colors) {
        // 横長三角形
        const height = size * 0.25;
        const width = size * 0.4;
        ctx.beginPath();
        ctx.moveTo(width, 0);
        ctx.lineTo(-width, height);
        ctx.lineTo(-width, -height);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawVKnight(ctx, size, baseColor, colors) {
        // L字型（縦基準）
        const length = size * 0.35;
        const width = size * 0.15;
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(-width / 2, -length, width, length * 1.5);
        ctx.fillRect(-width / 2, length * 0.3, length * 0.7, width);
        
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(-width / 2, -length, width, length * 1.5);
        ctx.strokeRect(-width / 2, length * 0.3, length * 0.7, width);
    }
    
    static drawHKnight(ctx, size, baseColor, colors) {
        // L字型（横基準）
        const length = size * 0.35;
        const width = size * 0.15;
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(-length, -width / 2, length * 1.5, width);
        ctx.fillRect(length * 0.3, -width / 2, width, length * 0.7);
        
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(-length, -width / 2, length * 1.5, width);
        ctx.strokeRect(length * 0.3, -width / 2, width, length * 0.7);
    }
    
    static drawJump2(ctx, size, baseColor, colors) {
        // 上下矢印
        const height = size * 0.3;
        const width = size * 0.2;
        
        // 上矢印
        ctx.beginPath();
        ctx.moveTo(0, -height);
        ctx.lineTo(width, -height * 0.5);
        ctx.lineTo(width * 0.4, -height * 0.5);
        ctx.lineTo(width * 0.4, 0);
        ctx.lineTo(-width * 0.4, 0);
        ctx.lineTo(-width * 0.4, -height * 0.5);
        ctx.lineTo(-width, -height * 0.5);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 下矢印
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width, height * 0.5);
        ctx.lineTo(width * 0.4, height * 0.5);
        ctx.lineTo(width * 0.4, 0);
        ctx.lineTo(-width * 0.4, 0);
        ctx.lineTo(-width * 0.4, height * 0.5);
        ctx.lineTo(-width, height * 0.5);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.stroke();
    }
}

// 盤面描画クラス
class BoardRenderer {
    constructor(canvas, cellSize = 80) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = cellSize;
        this.highlightedCells = [];
        this.selectedPiece = null;
    }
    
    drawBoard(board, perspective = 1) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
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
            this.ctx.fillRect(cell.col * this.cellSize, cell.row * this.cellSize, 
                            this.cellSize, this.cellSize);
        }
        
        // 駒の描画
        if (board) {
            for (let row = 0; row < 10; row++) {
                for (let col = 0; col < 10; col++) {
                    const piece = board[row][col];
                    if (piece) {
                        const x = col * this.cellSize + this.cellSize / 2;
                        const y = row * this.cellSize + this.cellSize / 2;
                        
                        // プレイヤー2の駒は180度回転
                        const rotation = piece.owner === 2 ? Math.PI : 0;
                        
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
        
        if (row >= 0 && row < 10 && col >= 0 && col < 10) {
            return { row, col };
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