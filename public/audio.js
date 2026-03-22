// PIKUO サウンドシステム
// tap.mp3とsword.mp3を使用

class AudioSystem {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.loadSounds();
    }

    loadSounds() {
        // tap.mp3とsword.mp3を読み込み
        this.sounds.tap = new Audio('tap.mp3');
        this.sounds.sword = new Audio('sword.mp3');
        
        // 音量調整
        this.sounds.tap.volume = 0.5;
        this.sounds.sword.volume = 0.6;
    }

    playTap() {
        if (!this.enabled) return;
        const sound = this.sounds.tap.cloneNode();
        sound.play().catch(e => console.log('Audio play failed:', e));
    }

    playSword() {
        if (!this.enabled) return;
        const sound = this.sounds.sword.cloneNode();
        sound.play().catch(e => console.log('Audio play failed:', e));
    }

    // 旧API互換性のため
    playHover() {
        // ホバー音は無効化
    }

    playClick() {
        this.playTap();
    }

    playPlace(rank) {
        this.playTap();
    }

    playCapture(rank) {
        this.playSword();
    }

    playEvolution(level) {
        // 進化音は無効化（移動時の音バグを防ぐ）
    }

    playKingCaptured() {
        this.playSword();
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// グローバルインスタンス
const audioSystem = new AudioSystem();