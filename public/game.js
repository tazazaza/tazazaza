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
        // 複雑な曼荼羅風デザイン
        const radius = size * 0.35;
        
        // 外側の複雑な花びら
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const x1 = Math.cos(angle) * radius;
            const y1 = Math.sin(angle) * radius;
            const x2 = Math.cos(angle + Math.PI / 8) * radius * 0.7;
            const y2 = Math.sin(angle + Math.PI / 8) * radius * 0.7;
            
            if (i === 0) ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(x2, y2, 
                Math.cos(angle + Math.PI / 4) * radius, 
                Math.sin(angle + Math.PI / 4) * radius);
        }
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 中心の複雑な星型
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const r = i % 2 === 0 ? radius * 0.5 : radius * 0.25;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // グロー効果
        ctx.shadowBlur = 20;
        ctx.shadowColor = colors.glow;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    static drawGold(ctx, size, baseColor, colors) {
        // 五芒星ベースの複雑なデザイン
        const radius = size * 0.35;
        
        // 五芒星
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            const innerAngle = angle + Math.PI / 5;
            const innerX = Math.cos(innerAngle) * radius * 0.4;
            const innerY = Math.sin(innerAngle) * radius * 0.4;
            ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 中心の円
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawSoldier(ctx, size, baseColor, colors, level) {
        const radius = size * 0.3;
        
        // レベル0: シンプルな円
        if (level === 0) {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }
        
        // レベル1: 円 + 内側のリング
        if (level === 1) {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }
        
        // レベル2: 円 + 複数のリング + 十字
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        
        // 十字
        ctx.beginPath();
        ctx.moveTo(-radius * 0.3, 0);
        ctx.lineTo(radius * 0.3, 0);
        ctx.moveTo(0, -radius * 0.3);
        ctx.lineTo(0, radius * 0.3);
        ctx.stroke();
    }
    
    static drawRook(ctx, size, baseColor, colors) {
        // 城壁風の複雑なデザイン
        const radius = size * 0.35;
        
        // 外枠
        ctx.fillStyle = baseColor;
        ctx.fillRect(-radius * 0.7, -radius, radius * 1.4, radius * 2);
        
        // 城壁のギザギザ
        ctx.fillRect(-radius * 0.8, -radius * 1.1, radius * 0.4, radius * 0.2);
        ctx.fillRect(-radius * 0.2, -radius * 1.1, radius * 0.4, radius * 0.2);
        ctx.fillRect(radius * 0.4, -radius * 1.1, radius * 0.4, radius * 0.2);
        
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(-radius * 0.7, -radius, radius * 1.4, radius * 2);
        
        // 内側の窓
        ctx.strokeRect(-radius * 0.4, -radius * 0.5, radius * 0.8, radius * 0.5);
        ctx.strokeRect(-radius * 0.4, radius * 0.2, radius * 0.8, radius * 0.5);
        
        // 縦のライン
        ctx.beginPath();
        ctx.moveTo(0, -radius);
        ctx.lineTo(0, radius);
        ctx.stroke();
    }
    
    static drawBishop(ctx, size, baseColor, colors) {
        // 複雑な螺旋ダイヤモンド
        const radius = size * 0.35;
        
        // ダイヤ型ベース
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
        
        // 内側の螺旋パターン
        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((Math.PI / 2) * i);
            ctx.beginPath();
            ctx.moveTo(0, -radius * 0.7);
            ctx.quadraticCurveTo(radius * 0.3, -radius * 0.3, 0, 0);
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
        
        // 中心の小ダイヤ
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.3);
        ctx.lineTo(radius * 0.3, 0);
        ctx.lineTo(0, radius * 0.3);
        ctx.lineTo(-radius * 0.3, 0);
        ctx.closePath();
        ctx.stroke();
    }
    
    static drawLance(ctx, size, baseColor, colors) {
        // 槍の穂先風デザイン（左右対称）
        const height = size * 0.4;
        const width = size * 0.25;
        
        // 穂先
        ctx.beginPath();
        ctx.moveTo(0, -height);
        ctx.lineTo(width, -height * 0.6);
        ctx.lineTo(width * 0.5, -height * 0.3);
        ctx.lineTo(width * 0.5, height);
        ctx.lineTo(-width * 0.5, height);
        ctx.lineTo(-width * 0.5, -height * 0.3);
        ctx.lineTo(-width, -height * 0.6);
        ctx.closePath();
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 内側の装飾（左右対称）
        ctx.beginPath();
        ctx.moveTo(0, -height * 0.7);
        ctx.lineTo(0, height * 0.7);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-width * 0.3, -height * 0.5);
        ctx.lineTo(-width * 0.3, height * 0.5);
        ctx.moveTo(width * 0.3, -height * 0.5);
        ctx.lineTo(width * 0.3, height * 0.5);
        ctx.stroke();
    }
    
    static drawSideLance(ctx, size, baseColor, colors) {
        // 横向きの槍（左右対称）
        const height = size * 0.25;
        const width = size * 0.4;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width * 0.8, -height * 0.8);
        ctx.lineTo(width * 0.8, height * 0.8);
        ctx.closePath();
        
        ctx.moveTo(0, 0);
        ctx.lineTo(-width * 0.8, -height * 0.8);
        ctx.lineTo(-width * 0.8, height * 0.8);
        ctx.closePath();
        
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 中心線
        ctx.beginPath();
        ctx.moveTo(-width * 0.6, 0);
        ctx.lineTo(width * 0.6, 0);
        ctx.stroke();
    }
    
    static drawVKnight(ctx, size, baseColor, colors) {
        // 縦L字（左右対称）
        const length = size * 0.35;
        
        // L字の形（左右対称に）
        ctx.beginPath();
        ctx.moveTo(-length * 0.25, -length);
        ctx.lineTo(length * 0.25, -length);
        ctx.lineTo(length * 0.25, length * 0.3);
        ctx.lineTo(length * 0.6, length * 0.3);
        ctx.lineTo(length * 0.6, length * 0.7);
        ctx.lineTo(-length * 0.6, length * 0.7);
        ctx.lineTo(-length * 0.6, length * 0.3);
        ctx.lineTo(-length * 0.25, length * 0.3);
        ctx.closePath();
        
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 内側の装飾
        ctx.strokeRect(-length * 0.15, -length * 0.8, length * 0.3, length * 0.6);
    }
    
    static drawHKnight(ctx, size, baseColor, colors) {
        // 横L字（上下対称）
        const length = size * 0.35;
        
        ctx.beginPath();
        ctx.moveTo(-length, -length * 0.25);
        ctx.lineTo(-length, length * 0.25);
        ctx.lineTo(length * 0.3, length * 0.25);
        ctx.lineTo(length * 0.3, length * 0.6);
        ctx.lineTo(length * 0.7, length * 0.6);
        ctx.lineTo(length * 0.7, -length * 0.6);
        ctx.lineTo(length * 0.3, -length * 0.6);
        ctx.lineTo(length * 0.3, -length * 0.25);
        ctx.closePath();
        
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.strokeRect(-length * 0.8, -length * 0.15, length * 0.6, length * 0.3);
    }
    
    static drawJump2(ctx, size, baseColor, colors) {
        // 複雑な八角形と内部パターン
        const radius = size * 0.35;
        
        // 外側の八角形
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
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 内側の四角形
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + Math.PI / 4;
            const x = Math.cos(angle) * radius * 0.6;
            const y = Math.sin(angle) * radius * 0.6;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        // 十字の線
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.8);
        ctx.lineTo(0, radius * 0.8);
        ctx.moveTo(-radius * 0.8, 0);
        ctx.lineTo(radius * 0.8, 0);
        ctx.stroke();
        
        // 4つの小円
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            const x = Math.cos(angle) * radius * 0.4;
            const y = Math.sin(angle) * radius * 0.4;
            ctx.beginPath();
            ctx.arc(x, y, radius * 0.15, 0, Math.PI * 2);
            ctx.stroke();
        }
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