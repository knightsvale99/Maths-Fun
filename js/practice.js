// Practice: 20-question rounds that get harder with every 2 right answers.
// Steps and the up/down rule follow curriculum/context/difficulty.md.
window.MF = window.MF || {};

MF.practice = {
  render(root, topic) {
    const P = MF.progress, fx = MF.fx, ui = MF.ui;
    const TOTAL = 20;
    const MAX = MF.q.MAX_STEP[topic];
    const PRAISE = ['Brilliant!', 'Yes! Well done!', 'Super!', 'You got it!', 'Fantastic!', 'Great thinking!', 'Spot on!'];
    let i = 0, correct = 0, streak = 0, attempts = 0, q = null, entry = '', locked = false;
    let showVis = null; // null = follow the step (pictures on for steps 1–2)
    const timers = [];

    root.innerHTML = `
      <div class="screen narrow practice t-${topic}">
        <div class="play-head">
          <a class="back-x" href="#/topic/${topic}" aria-label="Stop and go back">✕</a>
          <span id="qnum" class="play-title"></span>
          <span id="meter"></span>
          <span class="streak" id="streak" aria-label="Streak">🔥 0</span>
        </div>
        <div class="bar" aria-hidden="true"><div class="bar-fill" id="bar"></div></div>
        <div class="practice-body" id="body">
          <div class="qcard fit-box"><div class="fit-in">
            <p class="q-prompt" id="prompt" hidden></p>
            <div class="qtext" id="qtext"></div>
            <div class="vis" id="vis"></div>
          </div></div>
          <div class="pad-col">
            <div class="tools">
              <button class="btn btn-soft" id="hint-btn" type="button">💡 Hint</button>
              <button class="btn btn-soft" id="vis-btn" type="button">👀 Pictures</button>
            </div>
            <div id="answer-area"></div>
          </div>
        </div>
        <div class="say" aria-live="polite">${fx.owl(60)}<div class="bubble" id="say">Let's go! You can do it.</div></div>
      </div>`;

    const $ = id => root.querySelector('#' + id);
    const useChoices = () => q.step <= 2 || q.choiceOnly;
    const picturesOn = () => (showVis === null ? q.step <= 2 : showVis);
    const say = html => { $('say').innerHTML = html; };
    const pickOne = arr => arr[Math.floor(Math.random() * arr.length)];

    function next() {
      if (i >= TOTAL) return finish();
      q = MF.q.gen(topic, P.getStep(topic));
      attempts = 0; entry = ''; locked = false; i++;
      $('qnum').textContent = `Question ${i} of ${TOTAL}`;
      $('meter').innerHTML = ui.meterHTML(q.step, MAX);
      $('bar').style.width = ((i - 1) / TOTAL * 100) + '%';
      $('vis-btn').hidden = !MF.vis.forQuestion(q);
      $('hint-btn').disabled = false;
      $('body').classList.toggle('has-pad', !useChoices());
      renderQ(); renderVis(false); renderAnswer();
    }

    function renderQ(done) {
      const val = done ? q.answer : (entry || '?');
      $('prompt').textContent = q.prompt || '';
      $('prompt').hidden = !q.prompt;
      $('qtext').innerHTML = MF.q.display(q, `<span class="slot${done ? ' good' : ''}" id="slot">${val}</span>`);
    }

    function renderVis(reveal) {
      const v = (picturesOn() || reveal) ? MF.vis.forQuestion(q, reveal) : '';
      $('vis').innerHTML = v;
      $('vis').hidden = !v;
    }

    function renderAnswer() {
      if (useChoices()) {
        $('answer-area').innerHTML = `<div class="choices">${q.choices.map(c =>
          `<button class="btn choice" type="button" data-v="${c}">${c}</button>`).join('')}</div>`;
      } else {
        const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="btn key" type="button" data-k="${n}">${n}</button>`).join('');
        $('answer-area').innerHTML = `<div class="numpad">${keys}
          <button class="btn key key-del" type="button" data-k="del" aria-label="Delete">⌫</button>
          <button class="btn key" type="button" data-k="0">0</button>
          <button class="btn key key-go" type="button" data-k="go">Go!</button></div>`;
      }
    }

    function press(k) {
      if (locked) return;
      if (k === 'del') entry = entry.slice(0, -1);
      else if (k === 'go') { if (!entry) { say('Type your answer first, then press Go!'); return; } check(entry, null); return; }
      else if (entry.length < 4) entry = (entry === '0' ? '' : entry) + k;
      fx.play('click');
      renderQ();
    }

    function stepChange(delta) {
      const r = P.adjustStep(topic, delta);
      $('meter').innerHTML = ui.meterHTML(r.step, MAX);
      return r;
    }

    function check(val, btn) {
      if (locked) return;
      if (String(val) === String(q.answer)) {
        locked = true; correct++; streak++;
        P.recordStreak(streak);
        let msg = pickOne(PRAISE);
        if (attempts === 0) {
          P.recordQ(q);
          const r = stepChange(0.5);
          if (r.up) {
            msg = r.step > MF.q.CORE_STEPS ? '⭐ Challenge time! Bigger numbers now 🚀' : 'Level up! Bigger numbers now 🚀';
            fx.confetti(60);
          }
        }
        fx.play('right');
        if (btn) btn.classList.add('right');
        renderQ(true);
        if (streak % 5 === 0) { fx.confetti(70); msg = `${streak} in a row! You're on fire! 🔥`; }
        say(msg);
        updateStreak();
        timers.push(setTimeout(next, 1200));
        return;
      }
      attempts++; streak = 0; updateStreak();
      fx.play('wrong');
      if (btn) { btn.classList.add('wrong'); btn.disabled = true; }
      entry = '';
      if (attempts === 1) {
        renderQ();
        say(`Nearly! Try again. <span class="hint">💡 ${q.hint}</span>`);
        $('hint-btn').disabled = true;
      } else {
        locked = true;
        const r = stepChange(-0.5);
        renderQ(true);
        renderVis(true);
        say(`The answer is <b>${q.answer}</b>. ${r.down ? 'Let\'s try some smaller numbers.' : 'You\'ll get the next one!'}
          <button class="btn btn-main next-btn" id="next-btn" type="button">Next ▶</button>`);
        root.querySelectorAll('.choice, .key').forEach(b => { b.disabled = true; });
        $('next-btn').focus();
      }
    }

    function updateStreak() { $('streak').textContent = '🔥 ' + streak; }

    function finish() {
      const stars = correct >= 18 ? 3 : correct >= 12 ? 2 : 1;
      const better = P.recordStars(topic, stars);
      P.addCorrect(correct);
      const fresh = P.checkBadges();
      fx.play('win');
      fx.confetti();
      const title = stars === 3 ? 'Superstar!' : stars === 2 ? 'Great work!' : 'Well done for trying!';
      const msg = stars === 3 ? 'You really know your stuff.'
        : stars === 2 ? 'Keep practising and you\'ll get 3 stars!'
        : 'Every try makes your brain stronger. Have another go!';
      root.innerHTML = `
        <div class="screen center t-${topic}">
          <div class="end-card">
            ${fx.owl(110)}
            <h1>${title}</h1>
            <div class="big-stars" aria-label="${stars} stars">${ui.starsHTML(stars)}</div>
            <p>You got <b>${correct}</b> out of ${TOTAL} right${better ? ', a new best!' : '.'}</p>
            <p class="muted">${msg}</p>
            <div class="end-btns">
              <button class="btn btn-main" id="again" type="button">Play again</button>
              <a class="btn" href="#/topic/${topic}">Back</a>
            </div>
          </div>
        </div>`;
      $('again').addEventListener('click', () => MF.app.route());
      ui.announceBadges(fresh);
      ui.refreshHeader();
    }

    function onClick(e) {
      const b = e.target.closest('button');
      if (!b || !root.contains(b)) return;
      if (b.dataset.v !== undefined) check(b.dataset.v, b);
      else if (b.dataset.k !== undefined) press(b.dataset.k);
      else if (b.id === 'hint-btn') { say(`💡 ${q.hint}`); fx.play('click'); }
      else if (b.id === 'vis-btn') { showVis = !picturesOn(); renderVis(false); fx.play('click'); }
      else if (b.id === 'next-btn') next();
    }

    function onKey(e) {
      if (!q || e.target.tagName === 'INPUT') return;
      if (e.key === 'Enter' && locked && $('next-btn')) { e.preventDefault(); next(); return; }
      if (useChoices()) return;
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
      else if (e.key === 'Enter') { e.preventDefault(); press('go'); }
    }

    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    next();

    return () => {
      timers.forEach(clearTimeout);
      root.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }
};
