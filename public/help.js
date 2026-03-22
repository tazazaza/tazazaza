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
            {
                type: 'king',
                description: 'Moves 1 square in any direction (8 directions).'
            },
            {
                type: 'gold',
                description: 'Moves 1 square forward/sideways/diagonally forward. Cannot move diagonally backward.'
            },
            {
                type: 'soldier',
                description: 'Evolves when capturing enemy pieces:<br>Lv0: Forward only<br>Lv1: Forward + Left/Right<br>Lv2: Cross (Forward/Back/Left/Right)'
            },
            {
                type: 'rook',
                description: 'Moves any number of squares vertically or horizontally.'
            },
            {
                type: 'bishop',
                description: 'Moves any number of squares diagonally.'
            },
            {
                type: 'lance',
                description: 'Moves any number of squares forward only.'
            },
            {
                type: 'sideLance',
                description: 'Moves any number of squares left or right.'
            },
            {
                type: 'vKnight',
                description: 'Moves in an L-shape: 2 squares vertically, then 1 square horizontally.'
            },
            {
                type: 'hKnight',
                description: 'Moves in an L-shape: 2 squares horizontally, then 1 square vertically.'
            },
            {
                type: 'jump2',
                description: 'Jumps exactly 2 squares forward or backward (can jump over pieces).'
            }
        ];
        
        pieces.forEach(pieceInfo => {
            const item = document.createElement('div');
            item.className = 'help-item';
            
            // Soldierの場合は3つのレベルを表示
            if (pieceInfo.type === 'soldier') {
                const canvas = document.createElement('canvas');
                canvas.width = 180;
                canvas.height = 60;
                const ctx = canvas.getContext('2d');
                
                // Lv0, Lv1, Lv2を並べて表示
                for (let level = 0; level <= 2; level++) {
                    const piece = { type: 'soldier', level: level, owner: 1 };
                    PieceRenderer.draw(ctx, piece, 30 + level * 60, 30, 60, 1, 0);
                    
                    // レベル表示
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`Lv${level}`, 30 + level * 60, 55);
                }
                
                item.appendChild(canvas);
            } else {
                // 通常の駒
                const canvas = document.createElement('canvas');
                canvas.width = 80;
                canvas.height = 80;
                const ctx = canvas.getContext('2d');
                
                const piece = { type: pieceInfo.type, level: 0, owner: 1 };
                PieceRenderer.draw(ctx, piece, 40, 40, 80, 1, 0);
                
                item.appendChild(canvas);
            }
            
            const text = document.createElement('div');
            text.className = 'help-item-text';
            text.innerHTML = pieceInfo.description;
            item.appendChild(text);
            
            this.helpContent.appendChild(item);
        });
    }
}

// グローバルインスタンス
const helpSystem = new HelpSystem();

// DOMContentLoadedで初期化
document.addEventListener('DOMContentLoaded', () => {
    helpSystem.init();
});