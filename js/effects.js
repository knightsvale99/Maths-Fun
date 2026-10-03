// Sounds (Web Audio, no files), confetti and Ollie the owl.
window.MF = window.MF || {};

MF.fx = (function () {
  const reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ctx = null;

  function audio() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    const c = audio();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime + start;
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // Filtered white noise: crunchy digging and the creeper's hiss.
  function noise(start, dur, freq, vol, filterType) {
    const c = audio();
    if (!c) return;
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    const filter = c.createBiquadFilter();
    const g = c.createGain();
    const t = c.currentTime + start;
    src.buffer = buf;
    filter.type = filterType || 'bandpass';
    filter.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t);
  }

  const SOUNDS = {
    dig:   () => { noise(0, 0.07, 900, 0.35); noise(0.09, 0.07, 700, 0.3); noise(0.18, 0.09, 500, 0.3); },
    hiss:  () => noise(0, 0.9, 3000, 0.12, 'highpass'),
    right: () => { tone(660, 0, 0.15, 'triangle'); tone(990, 0.1, 0.25, 'triangle'); },
    wrong: () => { tone(260, 0, 0.18, 'sine', 0.12); tone(220, 0.12, 0.25, 'sine', 0.1); },
    pop:   () => { tone(900, 0, 0.06, 'square', 0.08); tone(1400, 0.03, 0.08, 'triangle', 0.1); },
    click: () => tone(520, 0, 0.05, 'triangle', 0.06),
    tick:  () => tone(1200, 0, 0.04, 'sine', 0.05),
    win:   () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.14))
  };

  function play(name) {
    if (!MF.progress.get().sound || !SOUNDS[name]) return;
    try { SOUNDS[name](); } catch (e) { /* audio not available */ }
  }

  function confetti(count) {
    if (reducedMotion) return;
    const cv = document.createElement('canvas');
    cv.className = 'confetti';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    const W = cv.width = innerWidth;
    const H = cv.height = innerHeight;
    const c = cv.getContext('2d');
    const cols = ['#FF5D8F', '#FFC92E', '#2DBE60', '#1A9CEB', '#9B5DE5', '#FF8A1F'];
    const ps = Array.from({ length: count || 140 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.4,
      y: H * 0.4,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 14 - 5,
      r: Math.random() * 7 + 5,
      c: cols[Math.random() * cols.length | 0],
      a: Math.random() * 6,
      va: (Math.random() - 0.5) * 0.3
    }));
    // Animation frames pause in background tabs, so also remove on a timer.
    setTimeout(() => cv.remove(), 4000);
    let frame = 0;
    (function step() {
      c.clearRect(0, 0, W, H);
      ps.forEach(p => {
        p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
        c.save(); c.translate(p.x, p.y); c.rotate(p.a);
        c.fillStyle = p.c; c.fillRect(-p.r / 2, -p.r / 3, p.r, p.r * 0.6);
        c.restore();
      });
      if (++frame < 160) requestAnimationFrame(step); else cv.remove();
    })();
  }

  function owl(size) {
    return `<svg class="owl" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
      <polygon points="20,32 24,6 40,24" fill="#7A5230"/><polygon points="80,32 76,6 60,24" fill="#7A5230"/>
      <ellipse cx="50" cy="58" rx="36" ry="38" fill="#9C6B3F"/>
      <ellipse cx="16" cy="64" rx="8" ry="18" fill="#7A5230"/><ellipse cx="84" cy="64" rx="8" ry="18" fill="#7A5230"/>
      <ellipse cx="50" cy="70" rx="23" ry="24" fill="#F6E2C3"/>
      <path d="M38 66 q4 4 8 0 M50 72 q4 4 8 0 M40 80 q4 4 8 0 M52 84 q3 3 6 0" stroke="#D8B88E" stroke-width="2" fill="none"/>
      <circle cx="36" cy="42" r="14" fill="#fff"/><circle cx="64" cy="42" r="14" fill="#fff"/>
      <circle class="owl-eye" cx="38" cy="44" r="6.5" fill="#2B2453"/><circle class="owl-eye" cx="62" cy="44" r="6.5" fill="#2B2453"/>
      <circle cx="40" cy="41.5" r="2.2" fill="#fff"/><circle cx="64" cy="41.5" r="2.2" fill="#fff"/>
      <polygon points="44,52 56,52 50,62" fill="#FFB300"/>
      <ellipse cx="40" cy="95" rx="7" ry="4" fill="#FFB300"/><ellipse cx="60" cy="95" rx="7" ry="4" fill="#FFB300"/>
    </svg>`;
  }

  return { play, confetti, owl, reducedMotion };
})();
