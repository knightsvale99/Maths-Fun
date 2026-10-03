// Router, screen fitting, and the Home, Topic and Badges screens.
window.MF = window.MF || {};

MF.TOPICS = {
  add: { name: 'Addition', sym: '+', tag: 'Put groups together' },
  sub: { name: 'Subtraction', sym: '−', tag: 'Take some away' },
  mul: { name: 'Multiplication', sym: '×', tag: 'Equal groups' },
  div: { name: 'Division', sym: '÷', tag: 'Share it out' },
  pv: { name: 'Place value', sym: '🧱', tag: 'Tens and ones' },
  count: { name: 'Counting', sym: '🦘', tag: 'Steps and patterns' }
};

MF.ui = (function () {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let toastTimer = null;

  function starsHTML(n) {
    return `<span class="stars" aria-label="${n} of 3 stars">${[1, 2, 3].map(k =>
      `<span class="${k <= n ? 'on' : ''}" aria-hidden="true">★</span>`).join('')}</span>`;
  }

  // Difficulty step shown as dots, e.g. ●●○○○ (no ages).
  function meterHTML(step, max) {
    // Dots past the core steps are ⭐ Challenge.
    return `<span class="meter" title="Difficulty" aria-label="Difficulty ${step} of ${max}${step > MF.q.CORE_STEPS ? ', challenge' : ''}">${Array.from({ length: max }, (_, k) =>
      `<i class="${k < step ? 'on' : ''}${k >= MF.q.CORE_STEPS ? ' ch' : ''}"></i>`).join('')}</span>`;
  }

  function toast(html) {
    const t = document.getElementById('toast');
    t.innerHTML = html;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
  }

  function announceBadges(list) {
    if (!list || !list.length) return;
    const b = list[0];
    toast(`<span class="toast-ico">${b.icon}</span><span><b>New badge: ${b.name}!</b><br>${b.desc}${list.length > 1 ? ` (+${list.length - 1} more)` : ''}</span>`);
  }

  function refreshHeader() {
    const d = MF.progress.get();
    document.getElementById('star-count').textContent = MF.progress.totalStars();
    const sb = document.getElementById('sound-btn');
    sb.textContent = d.sound ? '🔊' : '🔇';
    sb.setAttribute('aria-label', d.sound ? 'Turn sound off' : 'Turn sound on');
  }

  return { esc, starsHTML, meterHTML, toast, announceBadges, refreshHeader };
})();

// Keeps every screen inside the window: shrinks the whole screen if its fixed parts
// don't fit, then shrinks each .fit-box picture that is bigger than its box.
MF.fit = (function () {
  const app = document.getElementById('app');
  let queued = false;
  const inner = (el, cs) => [
    el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
    el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
  ];

  function run() {
    queued = false;
    const screen = app.firstElementChild;
    if (!screen) return;
    screen.style.zoom = '';
    app.querySelectorAll('.fit-in').forEach(el => { el.style.zoom = ''; });

    const [aw, ah] = inner(app, getComputedStyle(app));
    const z = Math.min(1, ah / screen.scrollHeight, aw / screen.scrollWidth);
    if (z < 0.995) screen.style.zoom = Math.max(0.5, z).toFixed(3);

    app.querySelectorAll('.fit-box').forEach(box => {
      const el = box.querySelector(':scope > .fit-in');
      if (!el) return;
      const [bw, bh] = inner(box, getComputedStyle(box));
      const z2 = Math.min(1, bh / el.scrollHeight, bw / el.scrollWidth);
      if (z2 < 0.995) el.style.zoom = Math.max(0.3, z2).toFixed(3);
    });
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  new MutationObserver(queue).observe(app, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  window.addEventListener('resize', queue);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(queue);
  return { queue, run };
})();

MF.app = (function () {
  const P = MF.progress, ui = MF.ui, T = MF.TOPICS;
  const app = document.getElementById('app');
  let cleanup = null;

  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    document.querySelectorAll('.confetti').forEach(c => c.remove());
    const [view, topic, sub] = location.hash.replace(/^#\/?/, '').split('/');
    if (['topic', 'learn', 'practice', 'play'].includes(view) && !T[topic]) { location.hash = '#/'; return; }
    app.className = 'view-' + (view || 'home');
    switch (view) {
      case 'topic': renderTopic(topic); break;
      case 'learn': cleanup = MF.learn.render(app, topic, sub); break;
      case 'practice': cleanup = MF.practice.render(app, topic); break;
      case 'play': cleanup = MF.game.render(app, topic); break;
      case 'chart': cleanup = MF.chart.render(app, topic, sub); break;
      case 'badges': renderBadges(); break;
      default: renderHome();
    }
    ui.refreshHeader();
    MF.fit.run();
    app.focus({ preventScroll: true });
  }

  function renderHome() {
    const d = P.get();
    const greet = d.name
      ? `Hi <b>${ui.esc(d.name)}</b>! What shall we learn today?`
      : `Hi! I'm Ollie the owl. 👋 What's your name?`;
    app.innerHTML = `
      <div class="screen home">
        <section class="hero">
          ${MF.fx.owl(110)}
          <div class="bubble big-bubble">
            <p>${greet}</p>
            ${d.name
              ? `<button class="link-btn change-name" id="change-name" type="button">Not ${ui.esc(d.name)}? Change name</button>`
              : `<form class="name-form" id="name-form">
                  <label class="sr-only" for="name-in">Your name</label>
                  <input id="name-in" maxlength="16" placeholder="Type your name" autocomplete="off">
                  <button class="btn btn-sun" type="submit">OK</button>
                </form>`}
          </div>
        </section>
        <div class="topics">
          ${Object.keys(T).map((t, k) => `
            <a class="topic-card t-${t}" href="#/topic/${t}" style="--i:${k}">
              <span class="sym" aria-hidden="true">${T[t].sym}</span>
              <span class="tname">${T[t].name}</span>
              <span class="ttag">${T[t].tag}</span>
              ${ui.starsHTML(P.getStars(t))}
            </a>`).join('')}
        </div>
        <div class="extras">
          <a class="extra-card t-sun" href="#/chart"><span class="extra-ico" aria-hidden="true">🔢</span>Times tables</a>
          <a class="extra-card t-pink" href="#/badges"><span class="extra-ico" aria-hidden="true">🏅</span>My badges</a>
        </div>
      </div>`;

    const form = document.getElementById('name-form');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const v = document.getElementById('name-in').value.trim();
      if (!v) { document.getElementById('name-in').focus(); return; }
      P.set('name', v);
      MF.fx.play('right');
      renderHome();
    });
    const cn = document.getElementById('change-name');
    if (cn) cn.addEventListener('click', () => { P.set('name', ''); renderHome(); document.getElementById('name-in').focus(); });
  }

  function renderTopic(t) {
    const lessons = MF.LESSONS[t].length;
    app.innerHTML = `
      <div class="screen t-${t}">
        <div class="page-head">
          <a class="back" href="#/">← Home</a>
          <span class="chip" aria-label="Best practice stars">${ui.starsHTML(P.getStars(t))}</span>
        </div>
        <div class="topic-banner">
          <span class="sym" aria-hidden="true">${T[t].sym}</span>
          <div><h1>${T[t].name}</h1><p>${T[t].tag}</p></div>
        </div>
        <div class="modes">
          <a class="mode" href="#/learn/${t}" style="--i:0">
            <span class="mode-ico" aria-hidden="true">📖</span>
            <span class="mode-text"><b>Learn</b><small>${lessons} lessons</small>
            <span class="mode-meta">${P.lessonsDone(t)} of ${lessons} done</span></span>
          </a>
          <a class="mode" href="#/practice/${t}" style="--i:1">
            <span class="mode-ico" aria-hidden="true">✏️</span>
            <span class="mode-text"><b>Practice</b><small>20 questions, harder as you go</small>
            <span class="mode-meta">${ui.meterHTML(P.getStep(t), MF.q.MAX_STEP[t])}</span></span>
          </a>
          <a class="mode" href="#/play/${t}" style="--i:2">
            <span class="mode-ico" aria-hidden="true">⛏️</span>
            <span class="mode-text"><b>Play</b><small>Diamond Dig</small>
            <span class="mode-meta">Best: ${P.getBest(t)} 💎</span></span>
          </a>
        </div>
      </div>`;
  }

  function renderBadges() {
    const d = P.get();
    app.innerHTML = `
      <div class="screen">
        <div class="page-head"><a class="back" href="#/">← Home</a><h1>My badges</h1><span class="chip">${d.badges.length} of ${P.BADGES.length}</span></div>
        <div class="topic-stars">
          ${Object.keys(T).map(t => `
            <div class="ts t-${t}">
              <span class="sym" aria-hidden="true">${T[t].sym}</span>
              <span class="sr-only">${T[t].name}</span>
              ${ui.starsHTML(P.getStars(t))}
            </div>`).join('')}
        </div>
        <div class="badge-grid">
          ${P.BADGES.map(b => {
            const got = d.badges.includes(b.id);
            return `<button class="badge${got ? ' got' : ''}" type="button" data-id="${b.id}" title="${b.desc}">
              <span class="badge-ico" aria-hidden="true">${got ? b.icon : '🔒'}</span>
              <b>${b.name}</b>
              <span class="sr-only">${b.desc}. ${got ? 'Earned' : 'Not earned yet'}</span>
            </button>`;
          }).join('')}
        </div>
        <div class="badge-foot">
          <span>Tap a badge to see how to earn it · Stars are saved on this device</span>
          <button class="link-btn" id="reset" type="button">Start again (ask a grown-up)</button>
        </div>
      </div>`;
    app.querySelector('.badge-grid').addEventListener('click', e => {
      const btn = e.target.closest('.badge');
      if (!btn) return;
      const b = P.BADGES.find(x => x.id === btn.dataset.id);
      const got = d.badges.includes(b.id);
      MF.fx.play('click');
      ui.toast(`<span class="toast-ico">${got ? b.icon : '🔒'}</span><span><b>${b.name}</b><br>${got ? 'You earned this!' : b.desc}</span>`);
    });
    document.getElementById('reset').addEventListener('click', () => {
      if (confirm('Grown-ups: this deletes all stars, scores and badges on this device. Are you sure?')) {
        P.reset();
        route();
      }
    });
  }

  document.getElementById('sound-btn').addEventListener('click', () => {
    P.set('sound', !P.get().sound);
    ui.refreshHeader();
    MF.fx.play('click');
  });

  window.addEventListener('hashchange', route);
  route();

  return { route };
})();
