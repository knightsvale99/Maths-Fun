// Picture helpers: objects, plates, dot arrays, number lines, column sums.
window.MF = window.MF || {};

MF.vis = (function () {
  function items(n, emoji, opts) {
    opts = opts || {};
    let s = `<div class="items" role="img" aria-label="${n} ${opts.label || 'things'}">`;
    for (let k = 0; k < n; k++) {
      const gone = opts.gone && k >= n - opts.gone;
      const num = opts.count && !gone ? `<small>${k + 1}</small>` : '';
      s += `<span class="item${gone ? ' gone' : ''}" style="--i:${Math.min(k, 30)}">${emoji}${num}</span>`;
    }
    return s + '</div>';
  }

  function groups(g, n, emoji) {
    let s = `<div class="groups" role="img" aria-label="${g} groups of ${n}">`;
    for (let k = 0; k < g; k++) s += `<div class="plate" style="--i:${k}">${items(n, emoji)}</div>`;
    return s + '</div>';
  }

  function emptyPlates(g) {
    return `<div class="groups">${'<div class="plate empty"></div>'.repeat(g)}</div>`;
  }

  function array(r, c) {
    const small = r * c > 48 ? ' small' : '';
    let s = `<div class="array${small}" style="grid-template-columns:repeat(${c},auto)" role="img" aria-label="${r} rows of ${c} dots">`;
    for (let k = 0; k < r * c; k++) s += `<span class="dot" style="--i:${Math.min(k, 40)}"></span>`;
    return s + '</div>';
  }

  // count jumps of `size` from `from` (negative count jumps backwards).
  // opts.still: how many of the first jumps are already drawn (no animation).
  function numberLine(min, max, from, count, size, opts) {
    size = size || 1;
    const still = (opts && opts.still) || 0;
    const W = 640, pad = 26, n = max - min, step = (W - pad * 2) / n;
    const x = v => pad + (v - min) * step;
    const to = from + count * size;
    const fs = n > 14 ? 15 : 19;
    // Long lines only label the jump points (or every 5) so numbers don't overlap.
    const label = v => n <= 20 || v === from || v === to ||
      (size > 1 ? (v - from) % size === 0 : v % 5 === 0);
    let s = `<svg class="numline" viewBox="0 0 ${W} 124" role="img" aria-label="Number line: start at ${from} and ${count >= 0 ? 'jump forward' : 'jump back'} to ${to}">`;
    s += `<line x1="${pad}" y1="88" x2="${W - pad}" y2="88" class="nl-axis"/>`;
    for (let v = min; v <= max; v++) {
      const cls = v === from ? 'nl-start' : v === to ? 'nl-end' : '';
      s += `<line x1="${x(v)}" y1="${label(v) ? 80 : 84}" x2="${x(v)}" y2="${label(v) ? 96 : 92}" class="nl-tick"/>`;
      if (label(v)) s += `<text x="${x(v)}" y="118" text-anchor="middle" font-size="${fs}" class="nl-num ${cls}">${v}</text>`;
    }
    const dir = Math.sign(count);
    for (let k = 0; k < Math.abs(count); k++) {
      const v1 = from + k * size * dir, v2 = v1 + size * dir;
      const h = Math.min(64, 22 + Math.abs(x(v2) - x(v1)) * 0.45);
      s += `<path d="M${x(v1)} 84 Q${(x(v1) + x(v2)) / 2} ${84 - h} ${x(v2)} 84" class="nl-jump${k < still ? ' still' : ''}" style="--i:${Math.max(0, k - still)}"/>`;
    }
    s += `<circle cx="${x(from)}" cy="88" r="9" class="nl-dot-start"/>`;
    if (count) s += `<circle cx="${x(to)}" cy="88" r="9" class="nl-dot-end" style="--i:${Math.abs(count) - still}"/>`;
    return s + '</svg>';
  }

  // Base-ten blocks: flats for hundreds, rods for tens, cubes for ones.
  // `gone` is crossed out place by place (no borrowing).
  function blocks(n, gone) {
    gone = gone || 0;
    const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
    const gh = Math.floor(gone / 100), gt = Math.floor(gone / 10) % 10, go = gone % 10;
    const piece = (cls, count, goneCount, offset) => Array.from({ length: count }, (_, k) =>
      `<span class="${cls}${k >= count - goneCount ? ' gone-b' : ''}" style="--i:${k + offset}"></span>`).join('');
    let s = `<div class="blocks${h ? ' has-h' : ''}" role="img" aria-label="${h ? h + ' hundreds, ' : ''}${t} tens and ${o} ones">`;
    if (h) s += `<div class="flats">${piece('flat', h, gh, 0)}</div>`;
    s += `<div class="rods">${piece('rod', t, gt, h)}</div>`;
    s += `<div class="cubes">${piece('cube', o, go, h + t)}</div>`;
    return s + '</div>';
  }

  // Written method on a grid so every digit lines up with its column.
  // result: string where spaces are blank columns (" 5" = only the ones written so far).
  // opts.marks: small carry/borrow notes per column, right-aligned to the digits;
  // opts.strike: top digits crossed out (column indexes).
  function column(a, b, op, result, opts) {
    opts = opts || {};
    const res = String(result == null ? '' : result);
    const n = Math.max(String(a).length, String(b).length, res.length, (opts.marks || []).length);
    const pad = v => String(v).padStart(n, ' ').split('');
    const cell = (ch, cls) => `<span class="cc${cls ? ' ' + cls : ''}">${ch === ' ' ? '' : ch}</span>`;
    const marks = (opts.marks || []).slice();
    while (marks.length < n) marks.unshift('');
    const strike = opts.strike || []; // column indexes, 0 = leftmost
    let s = `<div class="column" style="grid-template-columns:auto repeat(${n}, 1fr)" role="img" aria-label="${a} ${op} ${b}${res.trim() ? ' = ' + res.trim() : ''}">`;
    s += cell(' ') + marks.map(m => cell(m || ' ', 'mark')).join('');
    s += cell(' ') + pad(a).map((d, i) => cell(d, strike.includes(i) ? 'struck' : '')).join('');
    s += cell(op, 'col-op') + pad(b).map(d => cell(d)).join('');
    s += '<span class="col-line"></span>';
    s += cell(' ') + pad(res).map(d => cell(d, 'col-res')).join('');
    return s + '</div>';
  }

  // Short division ("bus stop"): quotient on top, divisor outside the bracket.
  // quotient: string with spaces for digits not written yet; carries: small leftover per digit.
  function busStop(a, d, quotient, carries) {
    const digs = String(a).split(''), n = digs.length;
    const q = String(quotient || '').padEnd(n, ' ').split('');
    const c = carries || [];
    let s = `<div class="bus" style="grid-template-columns:auto repeat(${n}, 1fr)" role="img" aria-label="${a} divided by ${d}${String(quotient || '').trim() ? ', answer so far ' + String(quotient).trim() : ''}">`;
    s += '<span class="cc"></span>' + q.map(x => `<span class="cc col-res">${x === ' ' ? '' : x}</span>`).join('');
    s += `<span class="cc bs-div">${d}</span>` + digs.map((x, i) => `<span class="cc bs-num">${c[i] ? `<sup>${c[i]}</sup>` : ''}${x}</span>`).join('');
    return s + '</div>';
  }

  // Picture for a practice question; `reveal` shows the finished picture.
  // Odd and even: dots in pairs; an odd number has one left over.
  function pairs(n) {
    let s = `<div class="array pairs" style="grid-template-columns:repeat(${Math.ceil(n / 2)},auto)" role="img" aria-label="${n} dots in pairs${n % 2 ? ', one left over' : ''}">`;
    for (let k = 0; k < n; k++) s += `<span class="dot${n % 2 && k === n - 1 ? ' alt' : ''}" style="--i:${Math.min(k, 40)}"></span>`;
    return s + '</div>';
  }

  // Picture for a practice question; `reveal` shows the finished picture.
  // Chosen by question kind (see MF.q), so lessons and practice match.
  const COLUMN_KINDS = { twoCarry: 1, three: 1, twoBorrow: 1, twoBy: 1, threeBy: 1 };
  const BUS_KINDS = { by2to5: 1, twoDigitAnswer: 1, threeBy: 1 };
  function forQuestion(q, reveal) {
    if (q.noVis) return '';
    if (q.visBlocks) return blocks(q.visBlocks);
    const { op, a, b, kind } = q;
    if (op === 'div' && BUS_KINDS[kind]) return busStop(a, b, reveal ? String(q.answer).padStart(String(a).length, ' ') : '');
    if (COLUMN_KINDS[kind]) return column(a, b, SYM[op], reveal ? q.answer : '');
    if (kind === 'twoNoCarry') return `<div class="eq-vis">${blocks(a)}<span class="vis-op">+</span>${blocks(b)}</div>`;
    if (kind === 'twoNoBorrow') return blocks(a, b);
    if (op === 'add' && a + b <= 20) {
      return `<div class="eq-vis">${items(a, '🍎', { label: 'apples' })}<span class="vis-op">+</span>${items(b, '🍎', { label: 'apples' })}</div>`;
    }
    if (op === 'sub' && a <= 20) return items(a, '🍬', { gone: b, label: 'sweets' });
    if (op === 'mul' && a * b <= 30) return groups(a, b, '⭐');
    if (op === 'div' && a <= 40) {
      return reveal ? groups(b, a / b, '🍪')
        : `${items(a, '🍪', { label: 'cookies' })}<p class="vis-note">Share onto ${b} plates</p>${emptyPlates(b)}`;
    }
    return '';
  }

  const SYM = { add: '+', sub: '−', mul: '×', div: '÷' };
  return { items, groups, emptyPlates, array, pairs, numberLine, column, busStop, blocks, forQuestion };
})();
