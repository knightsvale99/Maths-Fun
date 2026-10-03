// Saved progress (stars, best scores, difficulty steps, lessons, facts, badges) in localStorage.
window.MF = window.MF || {};

MF.progress = (function () {
  const KEY = 'mathsfun.v1';
  const TOPIC_IDS = ['add', 'sub', 'mul', 'div', 'pv', 'count'];

  const blank = () => ({
    name: '', sound: true,
    stars: {},        // "add": 3   (best practice round)
    best: {},         // "add": 14  (most diamonds in Diamond Dig)
    skill: {},        // "add": 2.67 (difficulty step; see curriculum/context/difficulty.md)
    lessons: {},      // "add/bonds": true
    facts: {},        // "3x4": times answered right first go (3 × 4 and 4 × 3 share a key)
    lastTable: 2,
    totalCorrect: 0, bestStreak: 0, perfectRows: 0,
    badges: []
  });

  let data = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(blank(), JSON.parse(raw));
  } catch (e) { /* storage blocked: play without saving */ }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  // Older saves stored stars and scores per age level ("add-2"); take the best of them.
  const bestOf = (store, t) => Math.max(store[t] || 0, ...[1, 2, 3].map(l => store[t + '-' + l] || 0));

  // Lesson keys look like "add/column". Only count lessons that still exist.
  const lessonExists = k => { const [t, id] = k.split('/'); return !!(MF.LESSONS && MF.LESSONS[t] || []).find(l => l.id === id); };
  const lessonKeys = () => Object.keys(data.lessons).filter(lessonExists);
  const totalLessons = () => TOPIC_IDS.reduce((n, t) => n + ((MF.LESSONS && MF.LESSONS[t]) || []).length, 0);
  const factKey = (a, b) => Math.min(a, b) + 'x' + Math.max(a, b);
  // A fact is "known" after 2 first-try right answers (curriculum/context/multiplication.md).
  const factsKnown = () => Object.values(data.facts).filter(n => n >= 2).length;
  const maxStars = t => bestOf(data.stars, t);
  // The small tolerance stops rounding errors (e.g. 0.999…) from missing a whole step.
  const stepOf = t => Math.min(Math.floor((data.skill[t] || 1) + 0.01), MF.q.MAX_STEP[t]);

  const BADGES = [
    { id: 'first10',  icon: '🎯', name: 'First 10',         desc: 'Get 10 answers right',               test: d => d.totalCorrect >= 10 },
    { id: 'hundred',  icon: '💯', name: 'Century',          desc: 'Get 100 answers right',              test: d => d.totalCorrect >= 100 },
    { id: 'streak5',  icon: '🔥', name: 'Hot streak',       desc: '5 right in a row',                   test: d => d.bestStreak >= 5 },
    { id: 'streak10', icon: '🚀', name: 'Rocket',           desc: '10 right in a row',                  test: d => d.bestStreak >= 10 },
    { id: 'learner',  icon: '📖', name: 'Bookworm',         desc: 'Finish a lesson',                    test: () => lessonKeys().length >= 1 },
    { id: 'prof',     icon: '🎓', name: 'Little professor', desc: 'Finish a lesson in every topic',     test: () => TOPIC_IDS.every(t => lessonKeys().some(k => k.startsWith(t + '/'))) },
    { id: 'scholar',  icon: '📚', name: 'Super scholar',    desc: 'Finish 4 lessons',                   test: () => lessonKeys().length >= 4 },
    { id: 'graduate', icon: '🏆', name: 'Maths graduate',   desc: 'Finish every lesson',                test: () => lessonKeys().length >= totalLessons() },
    { id: 'ace-add',  icon: '➕', name: 'Addition ace',     desc: '3 stars in addition practice',       test: () => maxStars('add') === 3 },
    { id: 'ace-sub',  icon: '➖', name: 'Subtraction ace',  desc: '3 stars in subtraction practice',    test: () => maxStars('sub') === 3 },
    { id: 'ace-mul',  icon: '✖️', name: 'Times ace',        desc: '3 stars in multiplication practice', test: () => maxStars('mul') === 3 },
    { id: 'ace-div',  icon: '➗', name: 'Sharing ace',      desc: '3 stars in division practice',       test: () => maxStars('div') === 3 },
    { id: 'ace-pv',   icon: '🧱', name: 'Place value ace',  desc: '3 stars in place value practice',    test: () => maxStars('pv') === 3 },
    { id: 'ace-count', icon: '🦘', name: 'Pattern ace',     desc: '3 stars in counting practice',       test: () => maxStars('count') === 3 },
    { id: 'challenger', icon: '⭐', name: 'Challenger',     desc: 'Reach a ⭐ Challenge step',           test: () => TOPIC_IDS.some(t => stepOf(t) > MF.q.CORE_STEPS) },
    { id: 'big-nums', icon: '🏔️', name: 'Big numbers',      desc: 'Reach the top step in any topic', test: () => TOPIC_IDS.some(t => stepOf(t) >= MF.q.MAX_STEP[t]) },
    { id: 'speedy',   icon: '💎', name: 'Diamond hunter',   desc: 'Mine 15 diamonds in Diamond Dig',    test: d => Object.values(d.best).some(v => v >= 15) },
    { id: 'tables',   icon: '🔢', name: 'Tables master',    desc: 'Guess 3 whole tables with no mistakes', test: d => d.perfectRows >= 3 },
    { id: 'facts39',  icon: '🌟', name: 'Fact collector',   desc: 'Know half of the 78 times facts',    test: () => factsKnown() >= 39 },
    { id: 'facts78',  icon: '👑', name: 'Times champion',   desc: 'Know all 78 times facts',            test: () => factsKnown() >= 78 },
    { id: 'explorer', icon: '🌍', name: 'Explorer',         desc: 'Earn stars in all 6 topics',         test: () => TOPIC_IDS.every(t => maxStars(t) > 0) }
  ];

  return {
    BADGES,
    get: () => data,
    set(key, value) { data[key] = value; save(); },

    getStars: maxStars,
    totalStars: () => TOPIC_IDS.reduce((n, t) => n + maxStars(t), 0),
    recordStars(t, n) {
      const better = n > maxStars(t);
      if (better) { data.stars[t] = n; save(); }
      return better;
    },
    getBest: t => bestOf(data.best, t),
    recordBest(t, score) {
      const better = score > bestOf(data.best, t);
      if (better) { data.best[t] = score; save(); }
      return better;
    },

    // Difficulty step for a topic: right first time +1/2, answer shown −1/2.
    getStep: t => stepOf(t),
    adjustStep(t, delta) {
      const max = MF.q.MAX_STEP[t];
      const before = stepOf(t);
      data.skill[t] = Math.max(1, Math.min(max + 0.99, (data.skill[t] || 1) + delta));
      save();
      const after = stepOf(t);
      return { step: after, up: after > before, down: after < before };
    },

    addCorrect(n) { data.totalCorrect += n; save(); },
    recordStreak(s) { if (s > data.bestStreak) { data.bestStreak = s; save(); } },
    lessonDone(t, id) { data.lessons[t + '/' + id] = true; save(); },
    lessonIsDone: (t, id) => !!data.lessons[t + '/' + id],
    lessonsDone: t => lessonKeys().filter(k => k.startsWith(t + '/')).length,
    perfectRow() { data.perfectRows += 1; save(); },
    recordFact(a, b) {
      if (!(a >= 1 && b >= 1 && a <= 12 && b <= 12)) return;
      const k = factKey(a, b);
      data.facts[k] = (data.facts[k] || 0) + 1;
      save();
    },
    // Record a times fact from a question answered right first time.
    recordQ(q) {
      if (q.op === 'mul') this.recordFact(q.a, q.b);
      else if (q.op === 'div' && !q.remainder) this.recordFact(q.b, q.answer);
    },
    factLevel: (a, b) => data.facts[factKey(a, b)] || 0,
    factsKnown,
    factsLearning: () => Object.values(data.facts).filter(n => n === 1).length,

    // Returns badges earned just now.
    checkBadges() {
      const fresh = BADGES.filter(b => !data.badges.includes(b.id) && b.test(data));
      if (fresh.length) { data.badges.push(...fresh.map(b => b.id)); save(); }
      return fresh;
    },
    reset() {
      const keep = { sound: data.sound };
      data = Object.assign(blank(), keep);
      save();
    }
  };
})();
