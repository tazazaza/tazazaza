// PIKUO ヘルプシステム

class HelpSystem {
    constructor() {
        this.modal = null;
        this.helpContent = null;
    }

    init() {
        this.modal = document.getElementById('helpModal');
        this.helpContent = document.getElementById('helpContent');
        
        // ヘルプボタンのイベントリスナー
        const setupHelpBtn = document.getElementById('setupHelpBtn');
        const gameHelpBtn = document.getElementById('gameHelpBtn');
        const closeBtn = document.getElementById('closeHelp');
        
        if (setupHelpBtn) {
            setupHelpBtn.addEventListener('click', () => this.show());
        }
        
        if (gameHelpBtn) {
            gameHelpBtn.addEventListener('click', () => this.show());
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // モーダル外をクリックで閉じる
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hide();
                }
            });
        }
    }

    show() {
        this.renderHelp();
        if (this.modal) {
            this.modal.classList.remove('hidden');
        }
    }

    hide() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    }

    renderHelp() {
        if (!this.helpContent) return;
        
        this.helpContent.innerHTML = '';
        
        const pieces = [
            { type: 'king' },
            { type: 'gold' },
            { type: 'soldier', levels: [0, 1, 2] },
            { type: 'rook' },
            { type: 'bishop' },
            { type: 'lance' },
            { type: 'sideLance' },
            { type: 'vKnight' },
            { type: 'hKnight' },
            { type: 'jump2' }
        ];
        
        pieces.forEach(pieceInfo => {
            const item = document.createElement('div');
            item.className = 'help-item';
            
            // Soldierの場合はwideクラスを追加
            if (pieceInfo.type === 'soldier') {
                item.classList.add('wide');
                
                const canvas = document.createElement('canvas');
                canvas.width = 540;
                canvas.height = 180;
                const ctx = canvas.getContext('2d');
                
                // Lv0, Lv1, Lv2を並べて表示
                for (let level = 0; level <= 2; level++) {
                    const offsetX = level * 180;
                    
                    // 駒を中央に描画
                    const piece = { type: 'soldier', level: level, owner: 1 };
                    PieceRenderer.draw(ctx, piece, offsetX + 90, 90, 60, 1, 0);
                    
                    // レベル表示
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`Lv${level}`, offsetX + 90, 25);
                    
                    // 動ける範囲をハイライト（3x3グリッド）
                    const cellSize = 20;
                    const gridStartX = offsetX + 90 - cellSize * 1.5;
                    const gridStartY = 90 - cellSize * 1.5;
                    
                    // グリッド描画
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.lineWidth = 1;
                    for (let i = 0; i <= 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(gridStartX, gridStartY + i * cellSize);
                        ctx.lineTo(gridStartX + cellSize * 3, gridStartY + i * cellSize);
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.moveTo(gridStartX + i * cellSize, gridStartY);
                        ctx.lineTo(gridStartX + i * cellSize, gridStartY + cellSize * 3);
                        ctx.stroke();
                    }
                    
                    // 動ける場所をハイライト
                    ctx.fillStyle = 'rgba(74, 158, 255, 0.4)';
                    
                    if (level === 0) {
                        // Lv0: 前のみ
                        ctx.fillRect(gridStartX + cellSize, gridStartY, cellSize, cellSize);
                    } else if (level === 1) {
                        // Lv1: 前 + 左右
                        ctx.fillRect(gridStartX + cellSize, gridStartY, cellSize, cellSize); // 前
                        ctx.fillRect(gridStartX, gridStartY + cellSize, cellSize, cellSize); // 左
                        ctx.fillRect(gridStartX + cellSize * 2, gridStartY + cellSize, cellSize, cellSize); // 右
                    } else {
                        // Lv2: 十字（前後左右）
                        ctx.fillRect(gridStartX + cellSize, gridStartY, cellSize, cellSize); // 前
                        ctx.fillRect(gridStartX, gridStartY + cellSize, cellSize, cellSize); // 左
                        ctx.fillRect(gridStartX + cellSize * 2, gridStartY + cellSize, cellSize, cellSize); // 右
                        ctx.fillRect(gridStartX + cellSize, gridStartY + cellSize * 2, cellSize, cellSize); // 後
                    }
                    
                    // 中央（駒の位置）
                    ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
                    ctx.fillRect(gridStartX + cellSize, gridStartY + cellSize, cellSize, cellSize);
                }
                
                item.appendChild(canvas);
            } else {
                // 通常の駒 - 駒 + 移動範囲グリッド
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 200;
                const ctx = canvas.getContext('2d');
                
                // 駒を中央に描画
                const piece = { type: pieceInfo.type, level: 0, owner: 1 };
                PieceRenderer.draw(ctx, piece, 100, 100, 60, 1, 0);
                
                // 5x5グリッドで移動範囲を表示
                const cellSize = 20;
                const gridStartX = 100 - cellSize * 2.5;
                const gridStartY = 100 - cellSize * 2.5;
                
                // グリッド描画
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 5; i++) {
                    ctx.beginPath();
                    ctx.moveTo(gridStartX, gridStartY + i * cellSize);
                    ctx.lineTo(gridStartX + cellSize * 5, gridStartY + i * cellSize);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(gridStartX + i * cellSize, gridStartY);
                    ctx.lineTo(gridStartX + i * cellSize, gridStartY + cellSize * 5);
                    ctx.stroke();
                }
                
                // 移動可能な場所をハイライト
                ctx.fillStyle = 'rgba(74, 158, 255, 0.4)';
                
                this.drawMovePattern(ctx, piece, gridStartX, gridStartY, cellSize);
                
                // 中央（駒の位置）
                ctx.fillStyle = 'rgba(212, 175, 55, 0.3)';
                ctx.fillRect(gridStartX + cellSize * 2, gridStartY + cellSize * 2, cellSize, cellSize);
                
                item.appendChild(canvas);
            }
            
            this.helpContent.appendChild(item);
        });
    }
    
    drawMovePattern(ctx, piece, startX, startY, cellSize) {
        const centerRow = 2;
        const centerCol = 2;
        
        switch (piece.type) {
            case 'king':
                // 8方向
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const r = centerRow + dr;
                        const c = centerCol + dc;
                        ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
                    }
                }
                break;
                
            case 'gold':
                // 金の動き（前3方向、横2方向、後ろ1方向）
                const goldMoves = [
                    [-1, -1], [-1, 0], [-1, 1], // 前3方向
                    [0, -1], [0, 1], // 横2方向
                    [1, 0] // 後ろ1方向
                ];
                goldMoves.forEach(([dr, dc]) => {
                    const r = centerRow + dr;
                    const c = centerCol + dc;
                    ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
                });
                break;
                
            case 'rook':
                // 縦横無限（5マスまで表示）
                for (let i = 0; i < 5; i++) {
                    if (i !== centerRow) {
                        ctx.fillRect(startX + centerCol * cellSize, startY + i * cellSize, cellSize, cellSize);
                    }
                    if (i !== centerCol) {
                        ctx.fillRect(startX + i * cellSize, startY + centerRow * cellSize, cellSize, cellSize);
                    }
                }
                break;
                
            case 'bishop':
                // 斜め無限（5マスまで表示）
                for (let i = -2; i <= 2; i++) {
                    if (i === 0) continue;
                    if (centerRow + i >= 0 && centerRow + i < 5) {
                        ctx.fillRect(startX + (centerCol + i) * cellSize, startY + (centerRow + i) * cellSize, cellSize, cellSize);
                        ctx.fillRect(startX + (centerCol - i) * cellSize, startY + (centerRow + i) * cellSize, cellSize, cellSize);
                    }
                }
                break;
                
            case 'lance':
                // 前後方向のみ
                for (let i = 0; i < 5; i++) {
                    if (i !== centerRow) {
                        ctx.fillRect(startX + centerCol * cellSize, startY + i * cellSize, cellSize, cellSize);
                    }
                }
                break;
                
            case 'sideLance':
                // 左右のみ
                for (let i = 0; i < 5; i++) {
                    if (i !== centerCol) {
                        ctx.fillRect(startX + i * cellSize, startY + centerRow * cellSize, cellSize, cellSize);
                    }
                }
                break;
                
            case 'vKnight':
                // L字（縦ベース）
                const vKnightMoves = [
                    [-2, -1], [-2, 1], // 上方向のL字
                    [2, -1], [2, 1]    // 下方向のL字
                ];
                vKnightMoves.forEach(([dr, dc]) => {
                    const r = centerRow + dr;
                    const c = centerCol + dc;
                    if (r >= 0 && r < 5 && c >= 0 && c < 5) {
                        ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
                    }
                });
                break;
                
            case 'hKnight':
                // L字（横ベース）
                const hKnightMoves = [
                    [-1, -2], [1, -2], // 左方向のL字
                    [-1, 2], [1, 2]    // 右方向のL字
                ];
                hKnightMoves.forEach(([dr, dc]) => {
                    const r = centerRow + dr;
                    const c = centerCol + dc;
                    if (r >= 0 && r < 5 && c >= 0 && c < 5) {
                        ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
                    }
                });
                break;
                
            case 'jump2':
                // 前後2マス
                ctx.fillRect(startX + centerCol * cellSize, startY + (centerRow - 2) * cellSize, cellSize, cellSize); // 前2
                ctx.fillRect(startX + centerCol * cellSize, startY + (centerRow + 2) * cellSize, cellSize, cellSize); // 後2
                break;
        }
    }
}

// グローバルインスタンス
const helpSystem = new HelpSystem();

// DOMContentLoadedで初期化
document.addEventListener('DOMContentLoaded', () => {
    helpSystem.init();
});