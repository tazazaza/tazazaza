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

// 駒デザイン定義（確定デザイン + パターンB: リッチ発光）
class PieceDesigns {
    // パターンB: リッチ発光のヘルパー関数
    static applyRichGlow(ctx, owner, r) {
        const color1 = owner === 1 ? '#ff4444' : '#4488ff';
        const color2 = owner === 1 ? '#cc0000' : '#0044cc';
        const colorLight = owner === 1 ? '#ff6666' : '#6699ff';
        const glowColor = owner === 1 ? '#ff4444' : '#4488ff';
        
        // 発光
        ctx.shadowBlur = 18;
        ctx.shadowColor = glowColor;
        
        // グラデーション
        const gradient = ctx.createRadialGradient(0, -r * 0.3, 0, 0, 0, r * 1.2);
        gradient.addColorStop(0, colorLight);
        gradient.addColorStop(1, color2);
        
        return {
            fillStyle: gradient,
            strokeStyle: '#ffffff',
            lineWidth: 2.8
        };
    }
    
    static drawKing(ctx, size, baseColor, colors, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        // #8: 放射円
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI / 6) * i;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * r * 0.5, Math.sin(angle) * r * 0.5);
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
    }
    
    static drawGold(ctx, size, baseColor, colors, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        // #18: 厚リング六角
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = Math.cos(angle) * r * 0.45;
            const y = Math.sin(angle) * r * 0.45;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = '#0a0e1a';
        ctx.fill();
        ctx.strokeStyle = styles.strokeStyle;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    static drawSoldier(ctx, size, baseColor, colors, level, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        if (level === 0) {
            // #21: 円
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (level === 1) {
            // #22: 二重円
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // #28: 三重円
            for (let i = 3; i >= 1; i--) {
                ctx.beginPath();
                ctx.arc(0, 0, r * (i / 3), 0, Math.PI * 2);
                if (i === 3) ctx.fill();
                ctx.stroke();
            }
        }
        
        ctx.shadowBlur = 0;
    }
    
    static drawRook(ctx, size, baseColor, colors, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        // R9: 矢印風十字
        const w = r * 0.4;
        const h = r * 1.25;
        ctx.fillRect(-w/2, -h/2, w, h);
        ctx.fillRect(-h/2, -w/2, h, w);
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.strokeRect(-h/2, -w/2, h, w);
        // 4方向に小さい三角
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, -h/2 - r * 0.15);
            ctx.lineTo(r * 0.2, -h/2);
            ctx.lineTo(-r * 0.2, -h/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.shadowBlur = 0;
    }
    
    static drawBishop(ctx, size, baseColor, colors, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.save();
        ctx.rotate(Math.PI / 4);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        // B9: 矢印風X
        const w = r * 0.4;
        const h = r * 1.3;
        ctx.fillRect(-w/2, -h/2, w, h);
        ctx.fillRect(-h/2, -w/2, h, w);
        ctx.strokeRect(-w/2, -h/2, w, h);
        ctx.strokeRect(-h/2, -w/2, h, w);
        // 4方向に小さい三角
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0, -h/2 - r * 0.15);
            ctx.lineTo(r * 0.2, -h/2);
            ctx.lineTo(-r * 0.2, -h/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }
    
    static drawLance(ctx, size, baseColor, colors, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        // #55: 縦六角
        ctx.beginPath();
        ctx.moveTo(0, -r * 1.15);
        ctx.lineTo(r * 0.55, -r * 0.55);
        ctx.lineTo(r * 0.55, r * 0.55);
        ctx.lineTo(0, r * 1.15);
        ctx.lineTo(-r * 0.55, r * 0.55);
        ctx.lineTo(-r * 0.55, -r * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    static drawSideLance(ctx, size, baseColor, colors, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        // #64: 横六角
        ctx.beginPath();
        ctx.moveTo(-r * 1.15, 0);
        ctx.lineTo(-r * 0.55, r * 0.55);
        ctx.lineTo(r * 0.55, r * 0.55);
        ctx.lineTo(r * 1.15, 0);
        ctx.lineTo(r * 0.55, -r * 0.55);
        ctx.lineTo(-r * 0.55, -r * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    static drawVKnight(ctx, size, baseColor, colors, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        // 縦楕円
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.52, r * 1.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    static drawHKnight(ctx, size, baseColor, colors, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        // 横楕円
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.25, r * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
    }
    
    static drawJump2(ctx, size, baseColor, colors, owner) {
        const r = size * 0.3;
        const styles = this.applyRichGlow(ctx, owner, r);
        
        ctx.fillStyle = styles.fillStyle;
        ctx.strokeStyle = styles.strokeStyle;
        ctx.lineWidth = styles.lineWidth;
        
        // #36: 縦矩形
        ctx.fillRect(-r * 0.45, -r * 1.15, r * 0.9, r * 2.3);
        ctx.strokeRect(-r * 0.45, -r * 1.15, r * 0.9, r * 2.3);
        ctx.strokeRect(-r * 0.25, -r * 0.95, r * 0.5, r * 1.9);
        
        ctx.shadowBlur = 0;
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
            PieceDesigns.drawSoldier(ctx, size, baseColor, colors, piece.level || 0, owner);
        } else if (PieceDesigns[drawMethod]) {
            PieceDesigns[drawMethod](ctx, size, baseColor, colors, owner);
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
        this.lastMove = null; // 最後の手
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
        
        // 最後の手をハイライト表示（黄色）
        if (this.lastMove) {
            this.ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
            
            // 移動元（持ち駒配置の場合はnull）
            if (this.lastMove.from) {
                const fromDisplayRow = isRotated ? 9 - this.lastMove.from.row : this.lastMove.from.row;
                const fromDisplayCol = isRotated ? 9 - this.lastMove.from.col : this.lastMove.from.col;
                this.ctx.fillRect(fromDisplayCol * this.cellSize, fromDisplayRow * this.cellSize, 
                                this.cellSize, this.cellSize);
            }
            
            // 移動先
            const toDisplayRow = isRotated ? 9 - this.lastMove.to.row : this.lastMove.to.row;
            const toDisplayCol = isRotated ? 9 - this.lastMove.to.col : this.lastMove.to.col;
            this.ctx.fillRect(toDisplayCol * this.cellSize, toDisplayRow * this.cellSize, 
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
    
    setLastMove(move) {
        this.lastMove = move;
    }
    
    clearLastMove() {
        this.lastMove = null;
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