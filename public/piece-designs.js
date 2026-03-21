// PIKUO 駒デザイン定義 v2.0
// このファイルで駒のデザインを自由にカスタマイズできます
// Last updated: 2026-03-22

console.log('Loading PieceDesigns v2.0...');

class PieceDesigns {
    static drawKing(ctx, size, baseColor, colors) {
        // 王冠モチーフ - 威厳のある8方向の輝き
        const radius = size * 0.38;
        
        // 外側の王冠
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const nextAngle = (Math.PI / 4) * (i + 1);
            
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
        
        // グロー効果
        ctx.shadowBlur = 25;
        ctx.shadowColor = colors.glow;
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // 内側のダイヤモンド
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
        
        // 中心の宝石
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = colors.border;
        ctx.fill();
    }
    
    static drawGold(ctx, size, baseColor, colors) {
        // ヘキサゴン（六角形）- 安定感
        const radius = size * 0.36;
        
        // 外側の六角形
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
        
        // 内側の六角形
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
        
        // 6本の線
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
            // Lv0: シンプルな円
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            
            // 中心点
            ctx.beginPath();
            ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = colors.border;
            ctx.fill();
        } else if (level === 1) {
            // Lv1: 円 + 4方向の突起
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            
            // 4方向の突起
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * radius * 0.65, Math.sin(angle) * radius * 0.65, 
                       radius * 0.2, 0, Math.PI * 2);
                ctx.fillStyle = colors.border;
                ctx.fill();
            }
        } else {
            // Lv2: 円 + 8方向の突起
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = baseColor;
            ctx.fill();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            
            // 8方向の突起
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI / 4) * i;
                ctx.beginPath();
                ctx.arc(Math.cos(angle) * radius * 0.7, Math.sin(angle) * radius * 0.7, 
                       radius * 0.18, 0, Math.PI * 2);
                ctx.fillStyle = colors.border;
                ctx.fill();
            }
        }
    }
    
    static drawRook(ctx, size, baseColor, colors) {
        // 十字架 - 縦横無限の動き
        const length = size * 0.4;
        const width = size * 0.22;
        
        // 縦棒
        ctx.fillStyle = baseColor;
        ctx.fillRect(-width / 2, -length, width, length * 2);
        
        // 横棒
        ctx.fillRect(-length, -width / 2, length * 2, width);
        
        // 縁取り
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-width / 2, -length, width, length * 2);
        ctx.strokeRect(-length, -width / 2, length * 2, width);
        
        // グロー
        ctx.shadowBlur = 20;
        ctx.shadowColor = colors.glow;
        ctx.strokeRect(-width / 2, -length, width, length * 2);
        ctx.strokeRect(-length, -width / 2, length * 2, width);
        ctx.shadowBlur = 0;
        
        // 中心の宝石
        ctx.beginPath();
        ctx.arc(0, 0, width * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = colors.border;
        ctx.fill();
    }
    
    static drawBishop(ctx, size, baseColor, colors) {
        // X字型ダイヤモンド - 斜め無限の動き
        const length = size * 0.4;
        
        // 45度回転した正方形（ダイヤ型）
        ctx.save();
        ctx.rotate(Math.PI / 4);
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(-length * 0.7, -length * 0.7, length * 1.4, length * 1.4);
        
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-length * 0.7, -length * 0.7, length * 1.4, length * 1.4);
        
        // 内側の小さいダイヤ
        ctx.strokeRect(-length * 0.35, -length * 0.35, length * 0.7, length * 0.7);
        
        ctx.restore();
        
        // グロー
        ctx.shadowBlur = 20;
        ctx.shadowColor = colors.glow;
        ctx.save();
        ctx.rotate(Math.PI / 4);
        ctx.strokeRect(-length * 0.7, -length * 0.7, length * 1.4, length * 1.4);
        ctx.restore();
        ctx.shadowBlur = 0;
        
        // 中心の宝石
        ctx.beginPath();
        ctx.arc(0, 0, length * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = colors.border;
        ctx.fill();
    }
    
    static drawLance(ctx, size, baseColor, colors) {
        // 矢印 - 前方への推進力
        const height = size * 0.42;
        const width = size * 0.28;
        
        // 矢印の形
        ctx.beginPath();
        ctx.moveTo(0, -height); // 先端
        ctx.lineTo(width * 0.8, -height * 0.5);
        ctx.lineTo(width * 0.4, -height * 0.5);
        ctx.lineTo(width * 0.4, height * 0.7);
        ctx.lineTo(-width * 0.4, height * 0.7);
        ctx.lineTo(-width * 0.4, -height * 0.5);
        ctx.lineTo(-width * 0.8, -height * 0.5);
        ctx.closePath();
        
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // 中心線
        ctx.beginPath();
        ctx.moveTo(0, -height * 0.8);
        ctx.lineTo(0, height * 0.5);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawSideLance(ctx, size, baseColor, colors) {
        // 左右矢印 - 横方向への推進力
        const height = size * 0.28;
        const width = size * 0.42;
        
        // 右矢印
        ctx.beginPath();
        ctx.moveTo(width, 0); // 右先端
        ctx.lineTo(width * 0.5, -height * 0.8);
        ctx.lineTo(width * 0.5, -height * 0.4);
        ctx.lineTo(-width * 0.5, -height * 0.4);
        ctx.lineTo(-width * 0.5, -height * 0.8);
        ctx.lineTo(-width, 0); // 左先端
        ctx.lineTo(-width * 0.5, height * 0.8);
        ctx.lineTo(-width * 0.5, height * 0.4);
        ctx.lineTo(width * 0.5, height * 0.4);
        ctx.lineTo(width * 0.5, height * 0.8);
        ctx.closePath();
        
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // 中心線
        ctx.beginPath();
        ctx.moveTo(-width * 0.8, 0);
        ctx.lineTo(width * 0.8, 0);
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    static drawVKnight(ctx, size, baseColor, colors) {
        // L字（縦ベース）
        const length = size * 0.38;
        const thickness = size * 0.16;
        
        ctx.beginPath();
        // 縦棒
        ctx.rect(-thickness / 2, -length, thickness, length * 1.3);
        // 横棒（下）
        ctx.rect(-thickness / 2, length * 0.3, length * 0.8, thickness);
        
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // 装飾の点
        ctx.beginPath();
        ctx.arc(0, -length * 0.6, thickness * 0.4, 0, Math.PI * 2);
        ctx.arc(length * 0.4, length * 0.3 + thickness / 2, thickness * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = colors.border;
        ctx.fill();
    }
    
    static drawHKnight(ctx, size, baseColor, colors) {
        // L字（横ベース）
        const length = size * 0.38;
        const thickness = size * 0.16;
        
        ctx.beginPath();
        // 横棒
        ctx.rect(-length, -thickness / 2, length * 1.3, thickness);
        // 縦棒（右）
        ctx.rect(length * 0.3, -thickness / 2, thickness, length * 0.8);
        
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // 装飾の点
        ctx.beginPath();
        ctx.arc(-length * 0.6, 0, thickness * 0.4, 0, Math.PI * 2);
        ctx.arc(length * 0.3 + thickness / 2, length * 0.4, thickness * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = colors.border;
        ctx.fill();
    }
    
    static drawJump2(ctx, size, baseColor, colors) {
        // 二重の菱形 - 跳躍のイメージ
        const radius = size * 0.38;
        
        // 外側の菱形（8角形的）
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
        
        // 内側の菱形
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
        
        // 4方向の点（跳躍の軌跡）
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

// ロード確認
console.log('PieceDesigns loaded successfully');