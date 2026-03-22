// PIKUO サウンドシステム
// tap.mp3（UI音）, koma.mp3（駒移動/配置）, sword.mp3（駒取得）

class AudioSystem {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.loadSounds();
    }

    loadSounds() {
        // 3つの音源を読み込み
        this.sounds.tap = new Audio('tap.mp3');
        this.sounds.koma = new Audio('koma.mp3');
        this.sounds.sword = new Audio('sword.mp3');
        
        // 音量調整
        this.sounds.tap.volume = 0.5;
        this.sounds.koma.volume = 0.5;
        this.sounds.sword.volume = 0.6;
    }

    playTap() {
        if (!this.enabled) return;
        const sound = this.sounds.tap.cloneNode();
        sound.play().catch(e => console.log('Audio play failed:', e));
    }

    playKoma() {
        if (!this.enabled) return;
        const sound = this.sounds.koma.cloneNode();
        sound.play().catch(e => console.log('Audio play failed:', e));
    }

    playSword() {
        if (!this.enabled) return;
        const sound = this.sounds.sword.cloneNode();
        sound.play().catch(e => console.log('Audio play failed:', e));
    }

    // 旧API互換性のため
    playHover() {
        this.playTap();
    }

    playClick() {
        this.playTap();
    }

    playPlace(rank) {
        // 駒配置時はkoma音
        this.playKoma();
    }

    playCapture(rank) {
        this.playSword();
    }

    playEvolution(level) {
        // 進化音は無効化
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