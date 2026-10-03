// Question generator. Steps follow curriculum/context/difficulty.md:
// steps 1–3 are Cambridge Stage 2 (Grade 2); steps 4–5 are ⭐ Challenge.
// Each topic has named question "kinds"; a step picks one of its kinds at random.
window.MF = window.MF || {};

MF.q = (function () {
  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = rand(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const SYM = { add: '+', sub: '−', mul: '×', div: '÷' };
  const MAX_STEP = { add: 5, sub: 5, mul: 5, div: 5, pv: 5, count: 5 };
  const CORE_STEPS = 3; // steps above this are ⭐ Challenge
  const digit = (n, place) => Math.floor(n / place) % 10;
  const units = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`; // 1 ten, 2 tens

  // Answer plus 3 believable wrong answers, never negative.
  function numChoices(ans, near) {
    const set = new Set([ans]);
    const big = ans >= 100 ? [ans + 100, ans - 100] : [];
    const pool = shuffle(near || []).concat(shuffle([ans + 1, ans - 1, ans + 10, ans - 10, ans + 2, ...big]));
    for (const c of pool) if (c >= 0 && set.size < 4) set.add(c);
    let k = 3;
    while (set.size < 4) set.add(ans + k++);
    return shuffle([...set]);
  }

  // Question shapes. `text` with □ shows the answer box there; otherwise it's "text = □".
  const sum = (op, a, b, answer, extra) => Object.assign(
    { a, b, answer, text: `${a} ${SYM[op]} ${b}`, choices: numChoices(answer, extra && extra.near) }, extra);
  const fill = (text, answer, extra) => Object.assign(
    { text, answer, noVis: true, choices: numChoices(answer, extra && extra.near) }, extra);
  const choose = (text, answer, options, extra) => Object.assign(
    { text, answer, noVis: true, choiceOnly: true, choices: shuffle(options) }, extra);
  const seqText = arr => arr.join(', ') + ', □';

  const KINDS = {
    add: {
      within20() { const a = rand(1, 15), b = rand(1, 20 - a); return sum('add', a, b, a + b, { hint: 'Start at the bigger number and count on.' }); },
      bond() { const t = pick([10, 20]), a = rand(1, t - 1); return fill(`${a} + □ = ${t}`, t - a, { hint: `How many more to make ${t}?` }); },
      tens() { const a = rand(1, 8) * 10, b = rand(1, 9 - a / 10) * 10; return sum('add', a, b, a + b, { hint: `Add the tens: ${a / 10} tens + ${b / 10} tens.`, noVis: true }); },
      bond100() { const a = rand(1, 9) * 10, t = rand(a / 10 + 1, 10) * 10; return fill(`${a} + □ = ${t}`, t - a, { hint: `Count on in tens from ${a} to ${t}.` }); },
      twoNoCarry() { // 2Ni.04
        // Sometimes 2-digit + 1-digit; every column stays at 9 or less.
        const at = rand(1, 8), bt = Math.random() < 0.3 ? 0 : rand(1, 9 - at);
        const au = rand(0, 8), bu = rand(bt ? 0 : 1, 9 - au);
        const a = at * 10 + au, b = bt * 10 + bu;
        return sum('add', a, b, a + b, { hint: 'Add the ones, then add the tens.' });
      },
      twoCarry() { let a, b; do { a = rand(15, 84); b = rand(15, 84); } while (a % 10 + b % 10 < 10 || a + b > 99); return sum('add', a, b, a + b, { hint: 'Add the ones first. Is it 10 or more? Carry the 1!' }); },
      three() { let a, b; do { a = rand(100, 899); b = Math.random() < 0.5 ? rand(100, 899) : rand(12, 99); } while (a + b > 999); return sum('add', a, b, a + b, { hint: 'Add the ones first. Is it 10 or more? Carry the 1!' }); }
    },
    sub: {
      within20() { const a = rand(5, 20), b = rand(1, a); return sum('sub', a, b, a - b, { hint: 'Start at the big number and jump back.' }); },
      inverse() { // 2Ni.02
        const a = rand(2, 10), b = rand(2, 10);
        return sum('sub', a + b, b, a, { prompt: `If ${a} + ${b} = ${a + b}, then…`, noVis: true, hint: 'Use the adding fact!' });
      },
      tens() { const a = rand(2, 10) * 10, b = rand(1, a / 10) * 10; return sum('sub', a, b, a - b, { hint: `Take away tens: ${a / 10} tens − ${b / 10} tens.`, noVis: true }); },
      from100() { const b = rand(1, 9) * 10; return sum('sub', 100, b, 100 - b, { hint: `What goes with ${b} to make 100?`, noVis: true }); },
      twoNoBorrow() { // 2Ni.04
        const at = rand(2, 9), au = rand(0, 9), bt = rand(1, at), bu = rand(0, au);
        return sum('sub', at * 10 + au, bt * 10 + bu, (at - bt) * 10 + (au - bu), { hint: 'Take away the ones, then the tens.' });
      },
      twoBorrow() { let a, b; do { a = rand(30, 99); b = rand(12, a - 1); } while (b % 10 <= a % 10); return sum('sub', a, b, a - b, { hint: 'Is the top number big enough? If not, borrow 10 from next door.' }); },
      three() { const a = rand(120, 999), b = Math.random() < 0.5 ? rand(100, a - 1) : rand(12, 99); return sum('sub', a, b, a - b, { hint: 'Start with the ones. Borrow 10 from next door if you need to.' }); }
    },
    mul: {
      groups() { const s = pick([1, 2, 5, 10]), g = rand(1, 5); return sum('mul', g, s, g * s, { hint: `${g} groups of ${s}. Count them all!` }); },
      tables() { // 2Ni.07
        const s = pick([1, 2, 5, 10]), g = rand(1, 10);
        return sum('mul', g, s, g * s, { hint: `Count in ${s}s, ${g} times.`, near: [g * s + s, Math.max(0, g * s - s)] });
      },
      missing() { const s = pick([2, 5, 10]), g = rand(1, 10); return fill(`□ × ${s} = ${g * s}`, g, { a: g, b: s, op: 'mul', hint: `How many ${s}s make ${g * s}? Count in ${s}s.` }); },
      repeated() { // 2Ni.05
        const s = pick([2, 5, 10]), g = rand(2, 5);
        return fill(`${Array(g).fill(s).join(' + ')} = □ × ${s}`, g, { a: g, b: s, op: 'mul', hint: `Count how many ${s}s you are adding.` });
      },
      tables3() { const s = pick([3, 4, 6, 8, 9]), g = rand(1, 10); return sum('mul', g, s, g * s, { hint: `${g} groups of ${s}. Count in ${s}s!`, near: [g * s + s, Math.max(0, g * s - s)] }); },
      twoBy() { // 3Ni.08
        let a; do { a = rand(12, 49); } while (a % 10 === 0);
        const b = rand(2, 5);
        return sum('mul', a, b, a * b, { hint: 'Multiply the ones first. Then add any tens you carried!', near: [a * (b + 1), a * (b - 1)] });
      },
      threeBy() { // 4Ni.05
        let a; do { a = rand(102, 999); } while (a % 10 === 0);
        const b = rand(2, 9);
        return sum('mul', a, b, a * b, { hint: 'Multiply the ones first. Then add any tens you carried!', near: [a * (b + 1), a * (b - 1)] });
      }
    },
    div: {
      share() { const d = rand(2, 5), q = rand(1, Math.floor(20 / d)); return sum('div', d * q, d, q, { hint: 'Share them out one at a time. Does every plate have the same?' }); },
      group() { const d = pick([2, 5, 10]), q = rand(1, 10); return sum('div', d * q, d, q, { hint: `How many groups of ${d} make ${d * q}? Count in ${d}s.`, noVis: d * q > 40 }); },
      half() { const h = rand(1, 20); return fill(`Half of ${2 * h} is □`, h, { a: 2 * h, b: 2, op: 'div', hint: `What number doubled makes ${2 * h}?` }); },
      by2to5() { // 3Ni.09
        const d = rand(2, 5), q = rand(Math.ceil(10 / d), Math.floor(99 / d));
        return sum('div', d * q, d, q, { hint: 'Bus stop! Divide each digit, and carry what\'s left over.', near: [q + 1, Math.max(0, q - 1), q + 10] });
      },
      twoDigitAnswer() { // 3Ni.09, for the bus stop lesson: a 2-digit answer
        const d = rand(2, 5), q = rand(10, Math.floor(99 / d));
        return sum('div', d * q, d, q, { hint: 'Bus stop! Divide each digit, and carry what\'s left over.', near: [q + 1, q + 10] });
      },
      threeBy() { const d = rand(2, 9), q = rand(Math.ceil(100 / d), Math.floor(999 / d)); return sum('div', d * q, d, q, { hint: 'Bus stop! Divide each digit, and carry what\'s left over.', near: [q + 1, q + 10] }); }
    },
    pv: {
      make() { // 2Np.02
        const t = rand(1, 9), o = rand(0, 9), n = t * 10 + o;
        return fill(`${units(t, 'ten')} + ${units(o, 'one')} = □`, n, { visBlocks: n, noVis: false, hint: 'Count the tens, then the ones.', near: [o * 10 + t, n + 10] });
      },
      partition() { // 2Np.02
        const n = rand(21, 99);
        return Math.random() < 0.5
          ? fill(`${n} = ${n - n % 10} + □`, n % 10, { hint: 'How many ones are there?' })
          : fill(`${n} = □ + ${n % 10}`, n - n % 10, { hint: 'How many tens? Write them as a tens number.', near: [Math.floor(n / 10)] });
      },
      digit() { // 2Np.01
        let n; do { n = rand(12, 98); } while (digit(n, 10) === digit(n, 1) || n % 10 === 0);
        const tens = Math.random() < 0.5, d = tens ? digit(n, 10) : digit(n, 1), val = tens ? d * 10 : d;
        return choose(`In ${n}, the ${d} is worth □`, val, [...new Set([val, tens ? d : d * 10, tens ? digit(n, 1) : digit(n, 10) * 10, d * 100])],
          { hint: tens ? 'It\'s in the tens place.' : 'It\'s in the ones place.' });
      },
      compare() { // 2Np.03
        let a, b;
        if (Math.random() < 0.5) { do { a = rand(12, 98); } while (digit(a, 10) === digit(a, 1) || a % 10 === 0); b = digit(a, 1) * 10 + digit(a, 10); }
        else { do { a = rand(10, 99); b = rand(10, 99); } while (a === b); }
        return choose(`Which is bigger: ${a} or ${b}? □`, Math.max(a, b), [a, b], { hint: 'Look at the tens first.' });
      },
      round10() { // 2Np.05
        let n; do { n = rand(11, 99); } while (n % 10 === 0);
        const r = Math.round(n / 10) * 10;
        return fill(`${n} rounded to the nearest 10 is □`, r, { hint: 'Is the ones digit 5 or more? Round up. Less than 5? Round down.', near: [Math.floor(n / 10) * 10, Math.ceil(n / 10) * 10].filter(x => x !== r) });
      },
      make3() { const h = rand(1, 9), t = rand(0, 9), o = rand(0, 9), n = h * 100 + t * 10 + o; return fill(`${units(h, 'hundred')} + ${units(t, 'ten')} + ${units(o, 'one')} = □`, n, { visBlocks: n, noVis: false, hint: 'Hundreds, then tens, then ones.' }); },
      digit3() {
        let n; do { n = rand(102, 987); } while (new Set(String(n)).size < 3 || String(n).includes('0'));
        const place = pick([100, 10, 1]), d = digit(n, place), val = d * place;
        return choose(`In ${n}, the ${d} is worth □`, val, [...new Set([val, d, d * 10, d * 100, d * 1000])].slice(0, 4), { hint: 'Which place is it in: hundreds, tens or ones?' });
      },
      compare3() {
        let a, b; do { a = rand(100, 999); b = rand(100, 999); } while (a === b || Math.abs(a - b) > 200);
        return choose(`Which is bigger: ${a} or ${b}? □`, Math.max(a, b), [a, b], { hint: 'Compare hundreds, then tens, then ones.' });
      },
      round3() {
        let n; do { n = rand(101, 989); } while (n % 10 === 0);
        if (Math.random() < 0.5) { const r = Math.round(n / 10) * 10; return fill(`${n} rounded to the nearest 10 is □`, r, { hint: 'Look at the ones digit.', near: [Math.floor(n / 10) * 10, Math.ceil(n / 10) * 10].filter(x => x !== r) }); }
        const r = Math.round(n / 100) * 100;
        return fill(`${n} rounded to the nearest 100 is □`, r, { hint: 'Look at the tens digit. 5 or more? Round up.', near: [Math.floor(n / 100) * 100, Math.ceil(n / 100) * 100, Math.round(n / 10) * 10].filter(x => x !== r) });
      }
    },
    count: {
      on() { // 2Nc.04
        const st = pick([1, 2, 10]), s = rand(0, 100 - 3 * st);
        return fill(seqText([s, s + st, s + 2 * st]), s + 3 * st, { hint: `Count on in ${st}s.`, near: [s + 2 * st, s + 4 * st] });
      },
      onBack() { // 2Nc.04
        const st = pick([2, 5, 10]), back = Math.random() < 0.5;
        const s = back ? rand(3 * st, 100) : rand(0, 100 - 3 * st), d = back ? -st : st;
        return fill(seqText([s, s + d, s + 2 * d]), s + 3 * d, { hint: back ? `Count back in ${st}s.` : `Count on in ${st}s.`, near: [s + 2 * d, s + 4 * d].filter(x => x >= 0) });
      },
      oddEven() { const n = rand(1, 100); return choose(`${n} is □`, n % 2 ? 'odd' : 'even', ['odd', 'even'], { hint: 'Look at the ones digit: 0, 2, 4, 6 or 8 means even.' }); },
      pattern() { // 2Nc.06
        const st = pick([3, 4]), s = rand(0, 20);
        return fill(seqText([s, s + st, s + 2 * st, s + 3 * st]), s + 4 * st, { hint: `How much does it go up each time?`, near: [s + 4 * st + 1, s + 5 * st] });
      },
      big() { // 3Nc.02
        const st = pick([3, 4, 5, 6, 7, 8, 9, 10, 100]), back = Math.random() < 0.4;
        const lo = back ? 3 * st : 0, hi = back ? 1000 : 1000 - 3 * st, s = rand(lo, hi), d = back ? -st : st;
        return fill(seqText([s, s + d, s + 2 * d]), s + 3 * d, { hint: back ? `Count back in ${st}s.` : `Count on in ${st}s.`, near: [s + 2 * d, s + 4 * d].filter(x => x >= 0) });
      },
      rule() { // 3Nc.05
        const st = rand(2, 10), back = Math.random() < 0.3, d = back ? -st : st;
        const s = back ? rand(4 * st, 100) : rand(0, 60);
        const r = n => (n < 0 ? '−' : '+') + Math.abs(n);
        return choose(`${[s, s + d, s + 2 * d, s + 3 * d].join(', ')}: the rule is □`, r(d),
          [...new Set([r(d), r(d + 1), r(d - 1 || d + 2), r(-d)])], { hint: 'How much does it change each time? Up or down?' });
      }
    }
  };

  // Which kinds each step uses (curriculum/context/difficulty.md).
  const STEPS = {
    add: [['within20', 'within20', 'bond'], ['tens', 'bond100', 'bond'], ['twoNoCarry'], ['twoCarry'], ['three']],
    sub: [['within20', 'within20', 'inverse'], ['tens', 'from100', 'inverse'], ['twoNoBorrow'], ['twoBorrow'], ['three']],
    mul: [['groups'], ['tables'], ['tables', 'missing', 'repeated'], ['tables3', 'twoBy'], ['threeBy']],
    div: [['share'], ['group'], ['group', 'half'], ['by2to5'], ['threeBy']],
    pv: [['make'], ['partition', 'digit'], ['compare', 'round10'], ['make3', 'digit3'], ['compare3', 'round3']],
    count: [['on'], ['onBack'], ['oddEven', 'pattern', 'onBack'], ['big'], ['rule', 'big']]
  };

  function make(topic, kindName, step) {
    const q = KINDS[topic][kindName]();
    q.op = q.op || topic;
    q.topic = topic;
    q.kind = kindName;
    q.step = step || 0;
    return q;
  }

  function gen(topic, step) {
    step = Math.max(1, Math.min(MAX_STEP[topic], Math.floor(step) || 1));
    return make(topic, pick(STEPS[topic][step - 1]), step);
  }

  // How a question reads, with `slot` where the answer goes.
  function display(q, slot) {
    return q.text.includes('□') ? q.text.replace('□', slot) : `${q.text} = ${slot}`;
  }

  return { gen, make, display, numChoices, shuffle, rand, pick, SYM, MAX_STEP, CORE_STEPS, STEPS };
})();
