// Times tables: one table at a time, table number first (7 × 1, 7 × 2, 7 × 3 …).
// Tips and the "known fact" rule follow curriculum/context/multiplication.md.
window.MF = window.MF || {};

MF.chart = (function () {
  const N = 12;
  const HUES = ['pink', 'sun', 'add', 'sub', 'mul', 'div'];
  const hue = n => 't-' + HUES[(n - 1) % HUES.length];
  const TIPS = {
    1: 'Anything times 1 stays the same!',
    2: 'The 2s are doubles, and they\'re all even numbers.',
    3: 'Count in 3s: 3, 6, 9. The digits of each answer add up to 3, 6 or 9.',
    4: 'Double, then double again! 4 × 3: double 3 is 6, double 6 is 12.',
    5: 'The 5s always end in 5 or 0. They\'re half of the 10s.',
    6: '6 times an even number ends in that same digit: 6 × 2 = 12, 6 × 4 = 24, 6 × 6 = 36.',
    7: 'Split it up: 7 × 8 is 5 × 8 plus 2 × 8. 40 + 16 = 56!',
    8: 'Double, double, double! 8 × 3: 6, 12, 24.',
    9: 'The tens go up and the ones go down. The digits always add up to 9!',
    10: 'Just put a 0 on the end!',
    11: 'Up to 11 × 9, write the number twice: 11 × 4 = 44.',
    12: '10 times plus 2 times: 12 × 4 = 40 + 8 = 48.'
  };
  const range = n => Array.from({ length: n }, (_, k) => k + 1);
  // Cambridge Stage 2 tables (2Ni.07); the rest are ⭐ Challenge.
  const CORE = [1, 2, 5, 10];

  function render(root, mode, arg) {
    root.innerHTML = `
      <div class="screen chart t-mul">
        <div class="tt-nav">
          <a class="back-x" href="#/" aria-label="Home">✕</a>
          <h1 class="tt-title"><span aria-hidden="true">🔢</span> Times tables</h1>
        </div>
        <div class="tt-body" id="tt-body"></div>
      </div>`;
    const body = root.querySelector('#tt-body');
    const t = +arg >= 1 && +arg <= N ? +arg : (MF.progress.get().lastTable || 2);
    return explore(body, t);
  }

  // ---------- Explore one table ----------
  function explore(body, t) {
    const P = MF.progress, fx = MF.fx;
    P.set('lastTable', t);
    let guessing = false, order = [], pos = 0, mistakes = 0, wrongHere = false;
    let hop = 0, hopTimer = null;
    const timers = [];

    const rung = k => `
      <li class="rung" data-k="${k}">
        <button class="rung-main" type="button" aria-label="${t} times ${k}">
          <span class="rung-sum">${t} × ${k} =</span>
          <span class="rung-ans">${k * t}</span>
          <span class="rung-bar" aria-hidden="true">${'<i></i>'.repeat(k)}</span>
        </button>
      </li>`;
    const ACTIONS = `
      <button class="btn btn-main" id="hop-btn" type="button">🐸 Count<span class="wide-only"> in ${t}s</span></button>
      <button class="btn btn-soft" id="guess-btn" type="button">🙈 Guess</button>
      <button class="btn btn-soft" id="mix-btn" type="button">🔀 Mixed</button>`;

    body.innerHTML = `
      <div class="table-picker" role="group" aria-label="Choose a times table">
        ${range(N).map(n => `<a class="tp ${hue(n)}${n === t ? ' on' : ''}${CORE.includes(n) ? ' core' : ''}" href="#/chart/explore/${n}"${n === t ? ' aria-current="true"' : ''} title="${CORE.includes(n) ? 'Core table' : '⭐ Challenge table'}">×${n}</a>`).join('')}
      </div>
      <div class="table-card ${hue(t)}">
        <div class="say">${fx.owl(52)}<div class="bubble" id="tip" aria-live="polite"></div></div>
        <div class="hop-stage fit-box"><div class="fit-in" id="hop-line"></div></div>
        <div class="table-actions" id="actions">${ACTIONS}</div>
        <ol class="ladder" id="ladder">${range(N).map(rung).join('')}</ol>
      </div>`;

    const $ = id => body.querySelector('#' + id);
    const rungEl = k => body.querySelector(`.rung[data-k="${k}"]`);
    const say = html => { $('tip').innerHTML = html; };
    const line = k => { $('hop-line').innerHTML = MF.vis.numberLine(0, N * t, 0, k, t, { still: Math.max(0, k - 1) }); };
    const intro = () => say(`<b class="table-title">The ${t} times table</b>${CORE.includes(t) ? '' : ' <span class="challenge-tag">⭐ Challenge</span>'} 💡 ${TIPS[t]}`);
    intro();
    line(0);

    function closeOpen() { body.querySelectorAll('.rung.open').forEach(r => r.classList.remove('open')); }

    // Tap a fact: show it as dots in the picture area.
    function showDots(k) {
      stopHop();
      closeOpen();
      rungEl(k).classList.add('open');
      $('hop-line').innerHTML = `${MF.vis.array(k, t)}`;
      say(`<b>${t} × ${k} = ${k * t}</b>: ${k} ${k === 1 ? 'row' : 'rows'} of ${t} dots.`);
      fx.play('click');
    }

    // Skip count: hop along the line and light each fact in turn.
    function stopHop() {
      clearInterval(hopTimer); hopTimer = null;
      const b = $('hop-btn');
      if (b) b.innerHTML = `🐸 Count<span class="wide-only"> in ${t}s</span>`;
    }
    function startHop() {
      closeOpen();
      if (hop >= N) { hop = 0; body.querySelectorAll('.rung.lit').forEach(r => r.classList.remove('lit')); }
      $('hop-btn').textContent = '✋ Stop';
      const step = () => {
        hop++;
        line(hop);
        rungEl(hop).classList.add('lit');
        fx.play('pop');
        say(`<b class="big-count">${hop * t}</b>`);
        if (hop >= N) {
          stopHop();
          fx.play('win');
          say(`You counted all the way to ${N * t}! 🎉 Now try <b>Guess</b>.`);
        }
      };
      step();
      hopTimer = setInterval(step, 800);
    }

    // Guess: answers flip to "?", then the child fills them in.
    function startGuess(mixed) {
      stopHop(); closeOpen();
      guessing = true; pos = 0; mistakes = 0;
      order = mixed ? MF.q.shuffle(range(N)) : range(N);
      body.querySelectorAll('.rung').forEach(r => {
        r.classList.remove('lit', 'got');
        r.querySelector('.rung-ans').textContent = '?';
        r.classList.add('hide');
      });
      hop = 0; line(0);
      ask();
    }

    function ask() {
      const k = order[pos], ans = k * t;
      wrongHere = false;
      body.querySelectorAll('.rung.current').forEach(r => r.classList.remove('current'));
      rungEl(k).classList.add('current');
      const choices = MF.q.numChoices(ans, [(k + 1) * t, (k - 1) * t, ans + 1, ans - 1].filter(n => n > 0 && n !== ans));
      $('actions').innerHTML = choices.map(v => `<button class="btn choice" type="button" data-v="${v}">${v}</button>`).join('');
      say(`What is <b>${t} × ${k}</b>? (${pos + 1} of ${N})`);
    }

    function answer(btn) {
      const k = order[pos], ans = k * t;
      if (+btn.dataset.v !== ans) {
        mistakes++; wrongHere = true;
        btn.classList.add('wrong'); btn.disabled = true;
        fx.play('wrong');
        const prev = k > 1 && order.indexOf(k - 1) < pos;
        say(prev ? `Nearly! ${t} × ${k - 1} = ${(k - 1) * t}. Add ${t} more!` : `Nearly! That's ${k} groups of ${t}. Count in ${t}s!`);
        return;
      }
      fx.play('right');
      if (!wrongHere) P.recordFact(k, t);
      const el = rungEl(k);
      el.classList.remove('current', 'hide');
      el.classList.add('got');
      el.querySelector('.rung-ans').textContent = ans;
      pos++;
      if (pos < N) timers.push(setTimeout(ask, 300));
      else endGuess();
    }

    function endGuess() {
      guessing = false;
      $('actions').innerHTML = ACTIONS;
      body.querySelectorAll('.rung').forEach(r => r.classList.remove('current', 'hide'));
      const perfect = mistakes === 0;
      if (perfect) P.perfectRow();
      P.addCorrect(N);
      const fresh = P.checkBadges();
      fx.play('win'); fx.confetti();
      say(perfect ? `You know the ${t} times table! No mistakes! 🌟` : `You filled in the ${t} times table! Try again for no mistakes.`);
      MF.ui.announceBadges(fresh);
      MF.ui.refreshHeader();
    }

    function onClick(e) {
      const b = e.target.closest('button');
      if (!b || !body.contains(b)) return;
      if (b.id === 'hop-btn') { if (hopTimer) stopHop(); else startHop(); }
      else if (b.id === 'guess-btn') startGuess(false);
      else if (b.id === 'mix-btn') startGuess(true);
      else if (b.classList.contains('choice') && guessing) answer(b);
      else if (b.classList.contains('rung-main') && !guessing) showDots(+b.closest('.rung').dataset.k);
    }

    body.addEventListener('click', onClick);
    return () => { clearInterval(hopTimer); timers.forEach(clearTimeout); body.removeEventListener('click', onClick); };
  }

  return { render, TIPS };
})();
