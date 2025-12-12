/**
 * Sound Effects for Pomodoro Plant
 * Uses Web Audio API to generate natural, cute chime sounds
 */

class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
    }

    // Initialize audio context (must be called after user interaction)
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume if suspended (happens on page load without user interaction)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    // Play a pleasant chime sound (like a wind chime / nature bell)
    playChime(frequency = 800, duration = 0.4) {
        if (!this.enabled) return;

        const ctx = this.init();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Use sine wave for soft, pleasant tone
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

        // Natural decay envelope
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }

    // Cute plant growing sound (ascending tones)
    playGrowSound() {
        if (!this.enabled) return;

        // Play ascending chimes like leaves rustling / growing
        setTimeout(() => this.playChime(523, 0.2), 0);    // C5
        setTimeout(() => this.playChime(659, 0.2), 100);  // E5
        setTimeout(() => this.playChime(784, 0.3), 200);  // G5
    }

    // Session complete sound (celebratory nature chime)
    playCompleteSound() {
        if (!this.enabled) return;

        // Harmonious ascending arpeggio
        setTimeout(() => this.playChime(523, 0.3), 0);    // C5
        setTimeout(() => this.playChime(659, 0.3), 150);  // E5
        setTimeout(() => this.playChime(784, 0.3), 300);  // G5
        setTimeout(() => this.playChime(1047, 0.5), 450); // C6
    }

    // Timer start sound (gentle notification)
    playStartSound() {
        if (!this.enabled) return;

        this.playChime(659, 0.2);  // E5
        setTimeout(() => this.playChime(784, 0.3), 100);  // G5
    }

    // Break time sound (relaxing lower tone)
    playBreakSound() {
        if (!this.enabled) return;

        // Descending relaxing tones
        setTimeout(() => this.playChime(784, 0.3), 0);    // G5
        setTimeout(() => this.playChime(659, 0.3), 150);  // E5
        setTimeout(() => this.playChime(523, 0.4), 300);  // C5
    }

    // Pause sound (soft descending)
    playPauseSound() {
        if (!this.enabled) return;

        // Short soft descending tone
        this.playChime(523, 0.15);  // C5
        setTimeout(() => this.playChime(392, 0.2), 80);  // G4
    }

    // Flower unlocked sound (magical celebration)
    playUnlockSound() {
        if (!this.enabled) return;

        // Magical sparkle effect
        setTimeout(() => this.playChime(523, 0.2), 0);    // C5
        setTimeout(() => this.playChime(659, 0.2), 80);   // E5
        setTimeout(() => this.playChime(784, 0.2), 160);  // G5
        setTimeout(() => this.playChime(1047, 0.2), 240); // C6
        setTimeout(() => this.playChime(1319, 0.4), 320); // E6
        setTimeout(() => this.playChime(1568, 0.5), 400); // G6
    }

    // Toggle sound on/off
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Global sound effects instance
const soundEffects = new SoundEffects();
