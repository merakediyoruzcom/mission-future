/* Mission: Future — Web Audio API Ambiyans & Ses Efektleri
 * Harici ses dosyası gerektirmez; tarayıcıda sentezlenir.
 * Öğrencinin sesi açma/kapama davranışı (işitsel duyarlılık) Tracker'a kaydedilir.
 */
window.MF = window.MF || {};

MF.Audio = (function () {
  let ctx = null;
  let muted = false;
  let ambGain = null;
  let started = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function startAmbience() {
    if (started) return;
    const c = ensure();
    if (!c) return;
    started = true;
    ambGain = c.createGain();
    ambGain.gain.value = muted ? 0 : 0.045;
    ambGain.connect(c.destination);

    // Uzay uğultusu: iki düşük frekanslı osilatör
    [55, 82.4, 110].forEach((freq, i) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = i === 1 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.35 / (i + 1);
      osc.connect(g).connect(ambGain);
      osc.start();
    });
  }

  function tone(freq = 440, dur = 0.14, type = 'sine', vol = 0.12) {
    if (muted) return;
    const c = ensure();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(g).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  }

  function click() { tone(520, 0.06, 'sine', 0.07); }
  function ok() {
    tone(523.25, 0.11, 'triangle', 0.12);
    setTimeout(() => tone(659.25, 0.14, 'triangle', 0.12), 90);
    setTimeout(() => tone(783.99, 0.2, 'triangle', 0.12), 180);
  }
  function err() {
    tone(220, 0.16, 'sawtooth', 0.1);
    setTimeout(() => tone(175, 0.22, 'sawtooth', 0.1), 120);
  }
  function note(idx) {
    const scale = [329.63, 392.0, 493.88, 587.33]; // E4, G4, B4, D5
    tone(scale[idx % scale.length], 0.28, 'sine', 0.16);
  }

  function toggle() {
    startAmbience();
    muted = !muted;
    if (ambGain && ctx) {
      ambGain.gain.setValueAtTime(muted ? 0 : 0.045, ctx.currentTime);
    }
    if (MF.Tracker) {
      MF.Tracker.count('audioToggles');
      MF.Tracker.set('audioMuted', muted);
      MF.Tracker.event('audio_toggle', { muted });
    }
    if (!muted) click();
    return !muted;
  }

  function isOn() { return !muted; }

  return { startAmbience, tone, click, ok, err, note, toggle, isOn };
})();
