// Lesson content for every topic. Order, methods and levels follow curriculum/context/<topic>.md:
// Cambridge Stage 2 lessons first, then lessons marked `challenge` (beyond Grade 2).
// Each lesson: picture steps, then `q` makes its 3 "your turn" questions.
window.MF = window.MF || {};

MF.LESSONS = (function () {
  const V = MF.vis;
  const eq = s => `<div class="eq">${s}</div>`;
  const chips = arr => `<div class="chips">${arr.map((c, i) => `<span class="chip-n" style="--i:${i}">${c}</span>`).join('')}</div>`;
  const kinds = (topic, ...names) => () => MF.q.make(topic, MF.q.pick(names));
  const side = (a, op, b) => `<div class="eq-vis">${a}<span class="vis-op">${op}</span>${b}</div>`;

  // Column marks and crossed-out digits: index 0 is the leftmost column.
  const CARRY_47_38 = { marks: ['1', ''] };
  const BORROW_52_27 = { marks: ['4', '12'], strike: [0, 1] };

  return {
    add: [
      { id: 'twocol', icon: '📝', title: '2-column adding', desc: 'Ones, then tens',
        steps: [
          { say: 'Write the numbers in columns: tens under tens, ones under ones. Let\'s add 34 + 25.', html: side(V.blocks(34), '+', V.blocks(25)) + V.column(34, 25, '+', '') },
          { say: 'Ones first: 4 + 5 = 9. Write 9 in the ones column.', html: V.column(34, 25, '+', ' 9') },
          { say: 'Then the tens: 3 + 2 = 5. The answer is 59!', html: V.column(34, 25, '+', '59') + eq('34 + 25 = <b>59</b>') }
        ],
        q: kinds('add', 'twoNoCarry') },

      { id: 'pairs', icon: '🤝', title: 'Pairs to 20 and 100', desc: 'Number bonds',
        steps: [
          { say: '7 + 3 = 10. So 17 + 3 = 20! Pairs to 10 help you make 20.', html: V.numberLine(10, 20, 17, 3) + eq('17 + 3 = 20') },
          { say: 'Tens work the same way. 6 + 4 = 10, so 60 + 40 = 100!', html: V.numberLine(0, 100, 60, 4, 10) + eq('60 + 40 = 100') },
          { say: 'To get from 30 to 80, count on in tens: 5 jumps of 10. So 30 + 50 = 80.', html: V.numberLine(0, 100, 30, 5, 10) + eq('30 + <b>50</b> = 80') }
        ],
        q: kinds('add', 'bond', 'bond100') },

      { id: 'column', icon: '🧗', title: '2-column adding with carrying', desc: 'Carry the 1', challenge: true,
        steps: [
          { say: 'Let\'s add 47 + 38. Line up the tens and the ones.', html: V.column(47, 38, '+', '') },
          { say: 'Ones first: 7 + 8 = 15. That\'s too big for one column! Write the 5 and carry the 1 ten.', html: V.column(47, 38, '+', ' 5', CARRY_47_38) },
          { say: 'Now the tens: 1 + 4 + 3 = 8. The answer is 85!', html: V.column(47, 38, '+', '85', CARRY_47_38) + eq('47 + 38 = <b>85</b>') }
        ],
        q: kinds('add', 'twoCarry') },

      { id: 'bigcolumn', icon: '🏔️', title: '3-column adding', desc: 'Carry more than once', challenge: true,
        steps: [
          { say: 'Let\'s add 256 + 178. Line up hundreds, tens and ones.', html: V.column(256, 178, '+', '') },
          { say: 'Ones: 6 + 8 = 14. Write the 4 and carry 1 ten.', html: V.column(256, 178, '+', '  4', { marks: ['', '1', ''] }) },
          { say: 'Tens: 1 + 5 + 7 = 13. Write the 3 and carry 1 hundred.', html: V.column(256, 178, '+', ' 34', { marks: ['1', '1', ''] }) },
          { say: 'Hundreds: 1 + 2 + 1 = 4. The answer is 434!', html: V.column(256, 178, '+', '434', { marks: ['1', '1', ''] }) + eq('256 + 178 = <b>434</b>') }
        ],
        q: kinds('add', 'three') }
    ],

    sub: [
      { id: 'twocol', icon: '📝', title: '2-column subtracting', desc: 'Ones, then tens',
        steps: [
          { say: 'Let\'s do 58 − 23. Here is 58, with 2 tens and 3 ones crossed out.', html: V.blocks(58, 23) + V.column(58, 23, '−', '') },
          { say: 'Ones first: 8 − 3 = 5.', html: V.column(58, 23, '−', ' 5') },
          { say: 'Then the tens: 5 − 2 = 3. The answer is 35!', html: V.column(58, 23, '−', '35') + eq('58 − 23 = <b>35</b>') }
        ],
        q: kinds('sub', 'twoNoBorrow') },

      { id: 'team', icon: '🤝', title: 'Adding and subtracting are a team', desc: 'Undo with the opposite',
        steps: [
          { say: '9 + 6 = 15. Taking away is the opposite of adding, so it can undo it!', html: V.numberLine(0, 20, 9, 6) + eq('9 + 6 = 15') },
          { say: '15 − 6 jumps back to 9.', html: V.numberLine(0, 20, 15, -6) + eq('15 − 6 = 9') },
          { say: 'One adding fact gives you two taking-away facts!', html: eq('9 + 6 = 15') + eq('15 − 6 = <b>9</b>') + eq('15 − 9 = <b>6</b>') }
        ],
        q: kinds('sub', 'inverse') },

      { id: 'borrow', icon: '🧗', title: '2-column subtracting with borrowing', desc: 'Borrow from next door', challenge: true,
        steps: [
          { say: 'Let\'s do 52 − 27. Always start with the ones.', html: V.column(52, 27, '−', '') },
          { say: '2 − 7? 2 is too small! Borrow 1 ten from the 5. Now we have 4 tens and 12 ones.', html: V.column(52, 27, '−', '', BORROW_52_27) },
          { say: '12 − 7 = 5. Then the tens: 4 − 2 = 2. The answer is 25!', html: V.column(52, 27, '−', '25', BORROW_52_27) + eq('52 − 27 = <b>25</b>') }
        ],
        q: kinds('sub', 'twoBorrow') },

      { id: 'bigcolumn', icon: '🏔️', title: '3-column subtracting', desc: 'Borrow more than once', challenge: true,
        steps: [
          { say: 'Let\'s do 425 − 168. Line up hundreds, tens and ones, and start with the ones.', html: V.column(425, 168, '−', '') },
          { say: '5 − 8? Too small! Borrow 1 ten: the 2 tens become 1, and the ones become 15. 15 − 8 = 7.', html: V.column(425, 168, '−', '  7', { marks: ['', '1', '15'], strike: [1, 2] }) },
          { say: 'Tens: 1 − 6? Too small again! Borrow 1 hundred: 4 becomes 3, and the tens become 11. 11 − 6 = 5.', html: V.column(425, 168, '−', ' 57', { marks: ['3', '11', '15'], strike: [0, 1, 2] }) },
          { say: 'Hundreds: 3 − 1 = 2. The answer is 257!', html: V.column(425, 168, '−', '257', { marks: ['3', '11', '15'], strike: [0, 1, 2] }) + eq('425 − 168 = <b>257</b>') }
        ],
        q: kinds('sub', 'three') }
    ],

    mul: [
      { id: 'repeat', icon: '🍪', title: 'Repeated addition', desc: 'Add the same number again',
        steps: [
          { say: 'Here are 3 plates with 5 cookies on each.', html: V.groups(3, 5, '🍪') },
          { say: 'Add them up: 5 + 5 + 5 = 15.', html: eq('5 + 5 + 5 = 15') },
          { say: 'Adding the same number again and again is multiplying! 3 lots of 5 is 3 × 5.', html: eq('3 × 5 = <b>15</b>') }
        ],
        q: kinds('mul', 'repeated', 'groups') },

      { id: 'arrays', icon: '🔵', title: 'Arrays', desc: 'Rows and columns',
        steps: [
          { say: 'An array has rows with the same number in each. This is 2 rows of 5.', html: V.array(2, 5) + eq('2 × 5 = 10') },
          { say: 'Turn it around: 5 rows of 2 is still 10!', html: V.array(5, 2) + eq('5 × 2 = 10') },
          { say: 'Count the rows, count how many in each row, then multiply.', html: V.array(3, 10) + eq('3 × 10 = <b>30</b>') }
        ],
        q: () => { const q = MF.q.make('mul', 'groups'); q.visHtml = V.array(q.a, q.b); return q; } },

      { id: 'tables', icon: '🦘', title: 'The 1, 2, 5 and 10 tables', desc: 'Count in steps',
        steps: [
          { say: 'Count in 2s: 2, 4, 6, 8, 10… That\'s the 2 times table!', html: V.numberLine(0, 20, 0, 10, 2) },
          { say: 'Count in 5s: 5, 10, 15, 20… The 5s always end in 5 or 0.', html: V.numberLine(0, 50, 0, 10, 5) },
          { say: 'Count in 10s: 10, 20, 30… And anything × 1 stays the same!', html: chips(['10', '20', '30', '40', '50', '60', '70', '80', '90', '100']) + eq('7 × 1 = 7') }
        ],
        q: kinds('mul', 'tables', 'missing') },

      { id: 'column', icon: '🧗', title: '2-column multiplying', desc: 'Carry the tens', challenge: true,
        steps: [
          { say: 'Let\'s do 23 × 4. Write the 4 under the ones.', html: V.column(23, 4, '×', '') },
          { say: 'Ones first: 3 × 4 = 12. Write the 2 and carry 1 ten.', html: V.column(23, 4, '×', ' 2', { marks: ['1', ''] }) },
          { say: 'Tens: 2 × 4 = 8, plus the 1 we carried makes 9. The answer is 92!', html: V.column(23, 4, '×', '92', { marks: ['1', ''] }) + eq('23 × 4 = <b>92</b>') }
        ],
        q: kinds('mul', 'twoBy') },

      { id: 'bigcolumn', icon: '🏔️', title: '3-column multiplying', desc: 'Carry more than once', challenge: true,
        steps: [
          { say: 'Let\'s do 236 × 4. Write the 4 under the ones.', html: V.column(236, 4, '×', '') },
          { say: 'Ones: 6 × 4 = 24. Write the 4 and carry 2 tens.', html: V.column(236, 4, '×', '  4', { marks: ['', '2', ''] }) },
          { say: 'Tens: 3 × 4 = 12, plus the 2 we carried makes 14. Write the 4 and carry 1 hundred.', html: V.column(236, 4, '×', ' 44', { marks: ['1', '2', ''] }) },
          { say: 'Hundreds: 2 × 4 = 8, plus 1 makes 9. The answer is 944!', html: V.column(236, 4, '×', '944', { marks: ['1', '2', ''] }) + eq('236 × 4 = <b>944</b>') }
        ],
        q: kinds('mul', 'threeBy') }
    ],

    div: [
      { id: 'share', icon: '🍬', title: 'Sharing', desc: 'Share out equally',
        steps: [
          { say: 'Dividing can mean sharing equally. We have 12 sweets for 3 friends.', html: V.items(12, '🍬') + V.emptyPlates(3) },
          { say: 'Give one each, round and round, until they\'re all gone. Everyone gets 4!', html: V.groups(3, 4, '🍬') },
          { say: '12 shared between 3 is 4. We write it like this.', html: eq('12 ÷ 3 = <b>4</b>') }
        ],
        q: kinds('div', 'share') },

      { id: 'group', icon: '🍓', title: 'Grouping', desc: 'How many groups?',
        steps: [
          { say: 'Dividing can also mean making groups. How many groups of 5 can we make from 20 strawberries?', html: V.items(20, '🍓') },
          { say: 'Put them in groups of 5. There are 4 groups!', html: V.groups(4, 5, '🍓') + eq('20 ÷ 5 = <b>4</b>') },
          { say: 'Or jump in 5s from 0 to 20 and count the jumps: 4 jumps.', html: V.numberLine(0, 20, 0, 4, 5) }
        ],
        q: kinds('div', 'group', 'half') },

      { id: 'short', icon: '🚌', title: '2-column dividing', desc: 'The bus stop method', challenge: true,
        steps: [
          { say: 'Let\'s share 72 between 3 with the bus stop. 72 goes inside, and 3 waits outside.', html: V.busStop(72, 3, '') },
          { say: 'First digit: 7 ÷ 3 = 2, with 1 left over. Write 2 on top, and carry the 1 to make 12.', html: V.busStop(72, 3, '2', ['', '1']) },
          { say: 'Now 12 ÷ 3 = 4. Write 4 on top. The answer is 24!', html: V.busStop(72, 3, '24', ['', '1']) + eq('72 ÷ 3 = <b>24</b>') }
        ],
        q: kinds('div', 'twoDigitAnswer') },

      { id: 'bigshort', icon: '🏔️', title: '3-column dividing', desc: 'The bus stop with 3 digits', challenge: true,
        steps: [
          { say: 'Let\'s do 852 ÷ 4. Put 852 inside the bus stop and 4 outside.', html: V.busStop(852, 4, '') },
          { say: '8 ÷ 4 = 2. Write 2 on top.', html: V.busStop(852, 4, '2') },
          { say: '5 ÷ 4 = 1, with 1 left over. Write 1 on top and carry the 1 to make 12.', html: V.busStop(852, 4, '21', ['', '', '1']) },
          { say: '12 ÷ 4 = 3. Write 3 on top. The answer is 213!', html: V.busStop(852, 4, '213', ['', '', '1']) + eq('852 ÷ 4 = <b>213</b>') }
        ],
        q: kinds('div', 'threeBy') }
    ],

    pv: [
      { id: 'tens', icon: '🧱', title: 'Tens and ones', desc: 'What each digit is worth',
        steps: [
          { say: '36 is 3 tens and 6 ones. The 3 is worth 30!', html: V.blocks(36) + eq('36 = 30 + 6') },
          { say: '40 is 4 tens and 0 ones. The 0 keeps the ones place, so the 4 stays worth 40.', html: V.blocks(40) + eq('40 = 40 + 0') },
          { say: '10 ones can swap for 1 ten! 2 tens and 15 ones is the same as 3 tens and 5 ones: 35.', html: eq('20 + 15 = 30 + 5 = <b>35</b>') }
        ],
        q: kinds('pv', 'make', 'partition', 'digit') },

      { id: 'compare', icon: '⚖️', title: 'Bigger or smaller?', desc: 'Compare tens first',
        steps: [
          { say: 'Which is bigger, 38 or 83? Look at the tens first.', html: side(V.blocks(38), 'or', V.blocks(83)) },
          { say: '83 has 8 tens, but 38 has only 3 tens. So 83 is bigger!', html: eq('83 is bigger than 38') },
          { say: 'If the tens are the same, look at the ones. 45 and 42 both have 4 tens, but 5 ones beats 2 ones.', html: eq('45 is bigger than 42') }
        ],
        q: kinds('pv', 'compare') },

      { id: 'round', icon: '🎯', title: 'Round to the nearest 10', desc: 'Which ten is closer?',
        steps: [
          { say: '47 is between 40 and 50. Which one is it closer to?', html: V.numberLine(40, 50, 47, 0) },
          { say: '47 is 3 away from 50, but 7 away from 40. So 47 rounds to 50.', html: V.numberLine(40, 50, 47, 3) + eq('47 → <b>50</b>') },
          { say: 'If the ones digit is 5 or more, round up. Less than 5, round down. 45 rounds up to 50, and 43 rounds down to 40.', html: eq('45 → 50') + eq('43 → 40') }
        ],
        q: kinds('pv', 'round10') },

      { id: 'hundreds', icon: '🏔️', title: 'Hundreds, tens and ones', desc: '3-digit numbers', challenge: true,
        steps: [
          { say: 'A hundred is 10 tens. Here is 472: 4 hundreds, 7 tens and 2 ones.', html: V.blocks(472) },
          { say: 'So 472 = 400 + 70 + 2. The 7 is worth 70 because it\'s in the tens place.', html: eq('472 = 400 + 70 + 2') }
        ],
        q: kinds('pv', 'make3', 'digit3') }
    ],

    count: [
      { id: 'steps', icon: '🦘', title: 'Count in 2s, 5s and 10s', desc: 'From any number',
        steps: [
          { say: 'Start at 6 and count on in 2s: 8, 10, 12, 14, 16.', html: V.numberLine(0, 20, 6, 5, 2) },
          { say: 'Start at 15 and count on in 5s: 20, 25, 30, 35.', html: V.numberLine(0, 50, 15, 4, 5) },
          { say: 'Count in 10s from 23: 33, 43, 53, 63. Only the tens digit changes!', html: chips(['23', '33', '43', '53', '63']) }
        ],
        q: kinds('count', 'on') },

      { id: 'back', icon: '⏪', title: 'Count back', desc: 'Jump backwards',
        steps: [
          { say: 'You can count back too. Start at 55 and count back in 5s.', html: V.numberLine(0, 60, 55, -5, 5) },
          { say: '55, 50, 45, 40, 35, 30. Each jump takes away 5.', html: chips(['55', '50', '45', '40', '35', '30']) },
          { say: 'Count back in 10s from 92: 82, 72, 62.', html: chips(['92', '82', '72', '62']) }
        ],
        q: kinds('count', 'onBack') },

      { id: 'oddeven', icon: '👯', title: 'Odd and even', desc: 'Pairs or one left over',
        steps: [
          { say: '8 dots make pairs with none left over. 8 is even!', html: V.pairs(8) },
          { say: '7 dots have one left over. 7 is odd!', html: V.pairs(7) },
          { say: 'Even numbers end in 0, 2, 4, 6 or 8. Odd numbers end in 1, 3, 5, 7 or 9. So 36 is even and 41 is odd!', html: chips(['0', '2', '4', '6', '8']) + chips(['1', '3', '5', '7', '9']) }
        ],
        q: kinds('count', 'oddEven') },

      { id: 'patterns', icon: '🔁', title: 'Number patterns', desc: 'Find the rule',
        steps: [
          { say: 'Look at 3, 6, 9, 12. Each number is 3 more than the one before.', html: chips(['3', '6', '9', '12', '?']) },
          { say: 'The rule is "add 3", so the next number is 15!', html: V.numberLine(0, 15, 3, 4, 3) },
          { say: 'Patterns can go down too: 40, 36, 32, 28. The rule is "take away 4".', html: chips(['40', '36', '32', '28', '24']) }
        ],
        q: kinds('count', 'pattern') },

      { id: 'big', icon: '🏔️', title: 'Count to 1000', desc: 'Steps of 10 and 100', challenge: true,
        steps: [
          { say: 'Count in 10s from 340: 350, 360, 370. The tens digit goes up by 1.', html: chips(['340', '350', '360', '370', '380']) },
          { say: 'Count back in 100s from 700: 600, 500, 400. The hundreds digit goes down by 1.', html: chips(['700', '600', '500', '400', '300']) }
        ],
        q: kinds('count', 'big') }
    ]
  };
})();
