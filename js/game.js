// Play: Diamond Dig, a blocky mining game in a Minecraft style (original pixel art, made in code).
// 20 questions, 20 seconds each: the right block wins a diamond, a wrong block costs one.
// Difficulty adapts like Practice (curriculum/context/difficulty.md).
window.MF = window.MF || {};

// Pixel textures drawn as tiny SVGs, cached as CSS url(...) values.
MF.pixel = (function () {
  const cache = {};
  const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const DIRT = ['#8B5A2B', '#7A4E24', '#9C6B3A', '#6E4420'];
  const STONE = ['#8C8C8C', '#7B7B7B', '#9A9A9A', '#6F6F6F'];
  const KINDS = {
    grass: (x, y, r) => (y < 3 || (y === 3 && r() < 0.5)) ? ['#5DBB3F', '#4CA12F', '#6FD04B'][Math.floor(r() * 3)] : DIRT[Math.floor(r() * 4)],
    dirt: (x, y, r) => DIRT[Math.floor(r() * 4)],
    stone: (x, y, r) => STONE[Math.floor(r() * 4)],
    sand: (x, y, r) => ['#E8D9A0', '#DCCB8C', '#F0E3B2', '#D6C487'][Math.floor(r() * 4)],
    oak: (x, y, r) => (y % 4 === 3 || x === ((y >> 2) * 5 + 3) % 16) ? '#7A5530' : ['#B8894F', '#A97C45', '#C3955A'][Math.floor(r() * 3)],
    diamond: (x, y, r) => {
      const ore = [[3, 3], [4, 3], [3, 4], [10, 5], [11, 5], [11, 6], [5, 10], [6, 10], [6, 11], [12, 11], [12, 12], [11, 12]];
      return ore.some(([a, b]) => a === x && b === y) ? (r() < 0.5 ? '#5CE1E6' : '#B3F6F7') : STONE[Math.floor(r() * 4)];
    },
    creeper: (x, y, r) => {
      const face = (x >= 3 && x <= 5 && y >= 4 && y <= 6) || (x >= 10 && x <= 12 && y >= 4 && y <= 6) ||
        (x >= 6 && x <= 9 && y >= 7 && y <= 10) || ((x === 5 || x === 10) && y >= 9 && y <= 12);
      return face ? '#1B1B1B' : ['#5DBB3F', '#4CA12F', '#7BD861', '#3E8E2A'][Math.floor(r() * 4)];
    }
  };

  function texture(kind) {
    if (cache[kind]) return cache[kind];
    const r = rng(kind.split('').reduce((n, ch) => n * 31 + ch.charCodeAt(0), 7) % 2147483646 + 1);
    let rects = '';
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${KINDS[kind](x, y, r)}"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects}</svg>`;
    // Single quotes: the value goes inside style="..." attributes.
    return (cache[kind] = `url('data:image/svg+xml,${encodeURIComponent(svg)}')`);
  }

  // Colours for the bits that fly out when a block breaks.
  const BITS = { grass: ['#5DBB3F', '#8B5A2B'], dirt: DIRT, stone: STONE, sand: ['#E8D9A0', '#D6C487'], oak: ['#B8894F', '#7A5530'] };
  return { texture, BITS };
})();

MF.game = {
  render(root, topic) {
    const P = MF.progress, fx = MF.fx, ui = MF.ui, px = MF.pixel;
    const QUESTIONS = 20, SECONDS = 20;
    const BLOCKS = ['grass', 'stone', 'dirt', 'sand', 'oak'];
    let q = null, n = 0, score = 0, right = 0, streak = 0, left = SECONDS, timer = null, playing = false, waiting = false;
    const timers = [];

    root.innerHTML = `
      <div class="screen narrow game">
        <div class="play-head">
          <a class="back-x" href="#/topic/${topic}" aria-label="Stop and go back">✕</a>
          <span class="score" id="count" aria-label="Question">⛏️ <b>0</b>/${QUESTIONS}</span>
          <span class="timer" id="timer" aria-label="Seconds left">⏱️ ${SECONDS}</span>
          <span class="score gems">💎 <b id="score">0</b></span>
          <span class="score best" aria-label="Best">🏆 <b>${P.getBest(topic)}</b></span>
        </div>
        <div class="sign" style="--tex:${px.texture('oak')}"><div class="qtext" id="qtext" aria-live="polite">Ready?</div></div>
        <div class="mine" id="arena" style="--t:0">
          <div class="sky"><div class="sun"></div><div class="moon"></div><div class="night-stars"></div>
            <div class="px-cloud c1"></div><div class="px-cloud c2"></div></div>
          <div class="ground" style="--tex:${px.texture('grass')}; --dirt:${px.texture('dirt')}"></div>
          <div class="zombie" aria-hidden="true">🧟</div>
          <div class="ore-row" id="blocks"></div>
          <div class="creeper" id="creeper" aria-hidden="true"><div class="creeper-face" style="--tex:${px.texture('creeper')}"></div><span class="hiss">Sssss…</span></div>
          <div class="overlay" id="overlay">
            <div class="overlay-card mc-card">
              <div class="mc-ore" style="--tex:${px.texture('diamond')}" aria-hidden="true"></div>
              <h2 class="mc-title">Diamond Dig</h2>
              <p>${QUESTIONS} blocks to mine, ${SECONDS} seconds each. Pick the right answer to win a 💎. A wrong block costs a 💎, so watch out for creepers!</p>
              <button class="btn btn-mc big" id="start" type="button">⛏️ Start mining</button>
            </div>
          </div>
        </div>
      </div>`;
    const $ = id => root.querySelector('#' + id);

    function start() {
      playing = true; n = 0; score = 0; right = 0; streak = 0;
      $('overlay').hidden = true;
      $('score').textContent = '0';
      newQuestion();
    }

    function newQuestion() {
      if (n >= QUESTIONS) return end();
      n++;
      q = MF.q.gen(topic, P.getStep(topic));
      waiting = false;
      // The sky moves from day to night across the round.
      $('arena').style.setProperty('--t', ((n - 1) / (QUESTIONS - 1)).toFixed(3));
      $('arena').classList.toggle('night', n > QUESTIONS - 5);
      $('count').innerHTML = `⛏️ <b>${n}</b>/${QUESTIONS}`;
      $('qtext').textContent = (q.prompt ? q.prompt + ' ' : '') + MF.q.display(q, '?');
      const kinds = MF.q.shuffle(BLOCKS).slice(0, 4);
      $('blocks').innerHTML = q.choices.map((c, k) => `
        <button class="mc-block" type="button" data-v="${c}" data-kind="${kinds[k]}" style="--tex:${px.texture(kinds[k])}; --i:${k}">
          <span>${c}</span>
        </button>`).join('');
      startClock();
    }

    function startClock() {
      clearInterval(timer);
      left = SECONDS;
      showClock();
      timer = setInterval(() => {
        left--;
        showClock();
        if (left <= 3 && left > 0) fx.play('tick');
        if (left <= 0) timeUp();
      }, 1000);
    }

    function showClock() {
      $('timer').textContent = '⏱️ ' + left;
      $('timer').classList.toggle('hurry', left <= 3);
    }

    // Lock the blocks and stop the clock, then move on.
    function finish(delay) {
      waiting = true;
      clearInterval(timer);
      root.querySelectorAll('.mc-block').forEach(b => { b.disabled = true; });
      timers.push(setTimeout(() => playing && newQuestion(), delay));
    }

    function reveal() {
      const good = root.querySelector(`.mc-block[data-v="${q.answer}"]`);
      if (good) good.classList.add('reveal');
    }

    // Bits of block fly out when it breaks.
    function burst(btn) {
      const colours = px.BITS[btn.dataset.kind] || px.BITS.stone;
      for (let k = 0; k < 10; k++) {
        const bit = document.createElement('i');
        bit.className = 'bit';
        bit.style.background = colours[k % colours.length];
        bit.style.setProperty('--dx', (Math.random() * 160 - 80).toFixed(0) + 'px');
        bit.style.setProperty('--dy', (-Math.random() * 120 - 20).toFixed(0) + 'px');
        btn.appendChild(bit);
      }
    }

    function creeper() {
      const c = $('creeper');
      c.classList.remove('peek');
      void c.offsetWidth; // restart the animation
      c.classList.add('peek');
      fx.play('hiss');
      timers.push(setTimeout(() => c.classList.remove('peek'), 1400));
    }

    function mine(btn) {
      if (!playing || waiting) return;
      if (btn.dataset.v === String(q.answer)) {
        finish(750);
        btn.classList.add('mining');
        fx.play('dig');
        right++; streak++;
        const gems = streak % 5 === 0 ? 2 : 1;
        score += gems;
        P.recordQ(q);
        if (P.adjustStep(topic, 0.5).up) timers.push(setTimeout(() => floater('Level up! 🚀'), 500));
        P.recordStreak(streak);
        timers.push(setTimeout(() => {
          btn.classList.add('broken');
          burst(btn);
          fx.play('right');
          floater(gems === 2 ? '+2 💎 Bonus!' : '+1 💎');
          $('score').textContent = score;
        }, 260));
      } else {
        // A wrong block costs a diamond (never below 0).
        finish(4000);
        P.adjustStep(topic, -0.25);
        streak = 0;
        const lost = score > 0;
        if (lost) score--;
        $('score').textContent = score;
        btn.classList.add('shake');
        reveal();
        fx.play('wrong');
        creeper();
        floater(lost ? '−1 💎' : 'Oops!');
      }
    }

    // Out of time: no diamond won or lost, and the right block is shown.
    function timeUp() {
      finish(4000);
      P.adjustStep(topic, -0.25);
      streak = 0;
      reveal();
      fx.play('wrong');
      floater('Time’s up! ⏰');
    }

    function floater(text) {
      const f = document.createElement('div');
      f.className = 'floater';
      f.textContent = text;
      $('arena').appendChild(f);
      timers.push(setTimeout(() => f.remove(), 1300));
    }

    function end() {
      playing = false;
      clearInterval(timer);
      $('blocks').innerHTML = '';
      const better = P.recordBest(topic, score);
      P.addCorrect(right);
      const fresh = P.checkBadges();
      fx.play('win');
      if (better && score > 0) fx.confetti();
      $('qtext').textContent = 'Night has fallen!';
      $('overlay').hidden = false;
      $('overlay').innerHTML = `
        <div class="overlay-card mc-card">
          <div class="mc-ore" style="--tex:${px.texture('diamond')}" aria-hidden="true"></div>
          <h2 class="mc-title">${score} 💎</h2>
          <p>${right} of ${QUESTIONS} right. ${better && score > 0 ? 'A new record! Your best mining ever! 🎉' : score >= 15 ? 'Amazing mining!' : 'Great digging! Can you find more next time?'}</p>
          <div class="end-btns">
            <button class="btn btn-mc" id="again" type="button">⛏️ Mine again</button>
            <a class="btn" href="#/topic/${topic}">Back</a>
          </div>
        </div>`;
      ui.announceBadges(fresh);
      ui.refreshHeader();
    }

    function onClick(e) {
      const b = e.target.closest('button');
      if (!b || !root.contains(b)) return;
      if (b.id === 'start') start();
      else if (b.id === 'again') MF.app.route();
      else if (b.classList.contains('mc-block')) mine(b);
    }

    root.addEventListener('click', onClick);
    return () => {
      playing = false;
      clearInterval(timer);
      timers.forEach(clearTimeout);
      root.removeEventListener('click', onClick);
    };
  }
};
