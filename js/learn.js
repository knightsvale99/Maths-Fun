// Learn: a menu of lessons per topic; each lesson is a few picture steps,
// then 3 "your turn" questions. Lesson content lives in lessons.js.
window.MF = window.MF || {};

MF.learn = (function () {
  const TRIES = 3;

  function lessonsFor(topic) { return MF.LESSONS[topic] || []; }

  function renderMenu(root, topic) {
    const P = MF.progress, T = MF.TOPICS[topic];
    const list = lessonsFor(topic);
    const done = list.filter(l => P.lessonIsDone(topic, l.id)).length;
    root.innerHTML = `
      <div class="screen t-${topic}">
        <div class="page-head">
          <a class="back" href="#/topic/${topic}">← Back</a>
          <h1>Learn ${T.name.toLowerCase()}</h1>
          <span class="chip">${done} of ${list.length} done</span>
        </div>
        <div class="lesson-grid">
          ${list.map((l, k) => {
            const isDone = P.lessonIsDone(topic, l.id);
            return `<a class="lesson-card${isDone ? ' done' : ''}${l.challenge ? ' challenge' : ''}" href="#/learn/${topic}/${l.id}" style="--i:${k}">
              <span class="lesson-num">${k + 1}</span>
              <span class="lesson-ico" aria-hidden="true">${l.icon}</span>
              <b>${l.title}</b>
              <small>${l.desc}</small>
              ${l.challenge ? '<span class="challenge-tag">⭐ Challenge</span>' : ''}
              ${isDone ? '<span class="lesson-tick" aria-label="Done">✔</span>' : ''}
            </a>`;
          }).join('')}
        </div>
      </div>`;
  }

  function renderLesson(root, topic, lessonId) {
    const P = MF.progress, fx = MF.fx;
    const list = lessonsFor(topic);
    const idx = list.findIndex(l => l.id === lessonId);
    const lesson = list[idx];
    const steps = lesson.steps.slice();
    for (let k = 0; k < TRIES; k++) steps.push({ tryIt: true });
    let i = 0, solved = false, attempts = 0;
    const timers = [];

    root.innerHTML = `
      <div class="screen narrow learn t-${topic}">
        <div class="play-head">
          <a class="back-x" href="#/learn/${topic}" aria-label="Back to lessons">✕</a>
          <span class="step-dots" id="dots" aria-hidden="true"></span>
          <span class="play-title" id="step-label"></span>
        </div>
        <h1 class="lesson-title"><span aria-hidden="true">${lesson.icon}</span> ${lesson.title}${lesson.challenge ? ' <span class="challenge-tag">⭐ Challenge</span>' : ''}</h1>
        <div class="stage fit-box"><div class="fit-in" id="stage"></div></div>
        <div id="answers"></div>
        <div class="say" aria-live="polite">${fx.owl(60)}<div class="bubble" id="say"></div></div>
        <div class="nav">
          <button class="btn" id="prev" type="button">◀ Back</button>
          <button class="btn btn-main" id="next" type="button">Next ▶</button>
        </div>
      </div>`;
    const $ = id => root.querySelector('#' + id);
    const say = html => { $('say').innerHTML = html; };

    function show() {
      const s = steps[i];
      $('dots').innerHTML = steps.map((_, k) => `<i class="${k === i ? 'on' : k < i ? 'done' : ''}"></i>`).join('');
      $('step-label').textContent = s.tryIt ? 'Your turn!' : `Step ${i + 1} of ${lesson.steps.length}`;
      $('prev').disabled = i === 0;
      $('next').textContent = i === steps.length - 1 ? 'Finish 🎉' : 'Next ▶';

      const stage = $('stage');
      $('answers').innerHTML = '';

      if (s.tryIt) {
        if (!s.q) {
          const seen = steps.filter(x => x.q).map(x => x.q.text);
          let tries = 0;
          do { s.q = lesson.q(); } while (seen.includes(s.q.text) && ++tries < 20);
        }
        solved = false; attempts = 0;
        const q = s.q;
        const vis = q.visHtml || (q.noVis ? '' : MF.vis.forQuestion(q));
        const sum = MF.q.display(q, '<span class="slot" id="slot">?</span>');
        stage.innerHTML = `
          ${q.prompt ? `<p class="q-prompt">${q.prompt}</p>` : ''}
          <div class="qtext">${sum}</div>
          ${vis ? `<div class="vis">${vis}</div>` : ''}`;
        $('answers').innerHTML = `<div class="choices">${q.choices.map(c => `<button class="btn choice" type="button" data-v="${c}">${c}</button>`).join('')}</div>`;
        say(i === lesson.steps.length ? 'Your turn! Tap the right answer.' : pickOne(['Here\'s another!', 'You\'re doing great. Try this one!', 'Last one!']));
        $('next').hidden = true;
      } else {
        stage.innerHTML = s.html;
        say(s.say);
        $('next').hidden = false;
      }
    }

    function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function answer(btn) {
      const q = steps[i].q;
      if (solved) return;
      if (btn.dataset.v === String(q.answer)) {
        solved = true;
        if (attempts === 0) P.recordQ(q);
        btn.classList.add('right');
        $('slot').textContent = q.answer;
        $('slot').classList.add('good');
        fx.play('right');
        say(pickOne(['Yes! Well done!', 'Brilliant!', 'You got it!', 'Super!']));
        timers.push(setTimeout(() => (i === steps.length - 1 ? finish() : (i++, show())), 1100));
      } else {
        attempts++;
        btn.classList.add('wrong'); btn.disabled = true;
        fx.play('wrong');
        say(attempts === 1 ? `Nearly! Try again. <span class="hint">💡 ${q.hint}</span>` : `Have another look. 💡 ${q.hint}`);
      }
    }

    function finish() {
      P.lessonDone(topic, lesson.id);
      const fresh = P.checkBadges();
      fx.play('win'); fx.confetti();
      const next = list[idx + 1];
      root.innerHTML = `
        <div class="screen center t-${topic}">
          <div class="end-card">
            ${fx.owl(110)}
            <h1>Lesson done!</h1>
            <p>You learned <b>${lesson.title.toLowerCase()}</b>. 🎉</p>
            <div class="end-btns">
              ${next ? `<a class="btn btn-main" href="#/learn/${topic}/${next.id}">Next: ${next.title} ▶</a>` : `<a class="btn btn-main" href="#/practice/${topic}">Practice ✏️</a>`}
              <a class="btn" href="#/learn/${topic}">All lessons</a>
            </div>
          </div>
        </div>`;
      MF.ui.announceBadges(fresh);
    }

    function onClick(e) {
      const b = e.target.closest('button');
      if (!b || !root.contains(b)) return;
      if (b.classList.contains('choice')) answer(b);
      else if (b.id === 'next') { fx.play('click'); if (i === steps.length - 1) finish(); else { i++; show(); } }
      else if (b.id === 'prev' && i > 0) { fx.play('click'); i--; show(); }
    }

    root.addEventListener('click', onClick);
    show();
    return () => { timers.forEach(clearTimeout); root.removeEventListener('click', onClick); };
  }

  function render(root, topic, lessonId) {
    if (lessonId && lessonsFor(topic).some(l => l.id === lessonId)) return renderLesson(root, topic, lessonId);
    renderMenu(root, topic);
    return null;
  }

  return { render };
})();
