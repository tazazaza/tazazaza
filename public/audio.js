// PIKUO サウンドシステム
// Web Audio APIを使った合成音

class AudioSystem {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.3;
        this.initialized = true;
    }

    // ランクに応じた駒を取る音
    playCapture(rank) {
        this.init();
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // ランク別の設定
        const configs = {
            'S': { freq: 800, duration: 0.8, volume: 0.5 },
            'A': { freq: 600, duration: 0.5, volume: 0.4 },
            'B': { freq: 400, duration: 0.3, volume: 0.3 },
            'C': { freq: 300, duration: 0.2, volume: 0.2 }
        };
        
        const config = configs[rank] || configs['C'];
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(config.freq, now);
        oscillator.frequency.exponentialRampToValueAtTime(config.freq * 0.5, now + config.duration);
        
        gainNode.gain.setValueAtTime(config.volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + config.duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + config.duration);
        
        // 追加の金属音レイヤー
        if (rank === 'S' || rank === 'A') {
            this.addMetallicLayer(now, config.duration, config.volume);
        }
    }

    addMetallicLayer(startTime, duration, volume) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1200, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, startTime + duration);
        
        gainNode.gain.setValueAtTime(volume * 0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    // 駒を配置する音
    playPlace(rank) {
        this.init();
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }

    // Soldier進化音
    playEvolution(level) {
        this.init();
        
        const now = this.audioContext.currentTime;
        
        if (level === 1) {
            // Lv0 → Lv1: ピロリン
            this.playTone(now, 440, 0.15, 0.3);
            this.playTone(now + 0.15, 587, 0.15, 0.3);
        } else if (level === 2) {
            // Lv1 → Lv2: ピロリロリーン
            this.playTone(now, 523, 0.12, 0.3);
            this.playTone(now + 0.12, 659, 0.12, 0.3);
            this.playTone(now + 0.24, 784, 0.12, 0.3);
            this.playTone(now + 0.36, 880, 0.2, 0.35);
        }
    }

    playTone(startTime, frequency, duration, volume) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);
        
        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    // 王が取られる音
    playKingCaptured() {
        this.init();
        
        const now = this.audioContext.currentTime;
        
        // ガラスが割れる音（高周波ノイズ）
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(2000, now);
        
        const noiseGain = this.audioContext.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        noise.start(now);
        
        // 低音ドラム
        const bass = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();
        
        bass.type = 'sine';
        bass.frequency.setValueAtTime(60, now);
        bass.frequency.exponentialRampToValueAtTime(30, now + 1);
        
        bassGain.gain.setValueAtTime(0.6, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        
        bass.connect(bassGain);
        bassGain.connect(this.masterGain);
        
        bass.start(now);
        bass.stop(now + 1);
    }

    // UI操作音（クリック）
    playClick() {
        this.init();
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + 0.05);
    }

    // ホバー音
    playHover() {
        this.init();
        
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, now);
        
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(now);
        oscillator.stop(now + 0.03);
    }
}

// グローバルインスタンス
const audioSystem = new AudioSystem();