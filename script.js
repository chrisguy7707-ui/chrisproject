const inputButtons = [...document.querySelectorAll('.result-slot button')];
const betInputs = [...document.querySelectorAll('[data-field="bet"]')];
const oddsInputs = [...document.querySelectorAll('[data-field="odds"]')];
const payoutInputs = [...document.querySelectorAll('[data-field="payout"]')];
const analyzeButton = document.querySelector('#analyzeButton');
const randomFillButton = document.querySelector('#randomFillButton');
const orb = document.querySelector('#orb');
const resultLabel = document.querySelector('#resultLabel');
const resultDetail = document.querySelector('#resultDetail');
const roundLabel = document.querySelector('#roundLabel');
const historyList = document.querySelector('#historyList');
const historyCount = document.querySelector('#historyCount');
const panel = document.querySelector('#historyPanel');
const scrim = document.querySelector('#scrim');
const totalBetAmount = document.querySelector('#totalBetAmount');
const totalPayoutAmount = document.querySelector('#totalPayoutAmount');
const netPayoutAmount = document.querySelector('#netPayoutAmount');
const summaryWinAmount = document.querySelector('#summaryWinAmount');
const summaryLossAmount = document.querySelector('#summaryLossAmount');
const summaryProfitAmount = document.querySelector('#summaryProfitAmount');
const summaryProfitCard = document.querySelector('.summary-card.profit');
let results = JSON.parse(localStorage.getItem('oddly-inputs') || 'null') || Array(10).fill(null);
results = results.map(item => item === '홀' ? '키' : item === '짝' ? '쿠' : item);
let betAmounts = JSON.parse(localStorage.getItem('oddly-bets') || 'null') || Array(10).fill(0);
let oddsValues = JSON.parse(localStorage.getItem('oddly-odds') || 'null') || Array(10).fill(1.9);
let payoutAmounts = Array(10).fill(0);

function calculatePayout(bet, odds) {
  const safeBet = Number(bet || 0);
  const safeOdds = Number(odds || 1);
  return safeBet * safeOdds;
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`;
}

function updateTotals() {
  const totalBet = betAmounts.reduce((sum, next) => sum + Number(next || 0), 0);
  payoutAmounts = oddsValues.map((odds, index) => calculatePayout(betAmounts[index], odds));
  const totalPayout = payoutAmounts.reduce((sum, next) => sum + Number(next || 0), 0);
  const fee = totalPayout * 0.1;
  const net = totalPayout - fee;
  const winAmount = Math.max(net - totalBet, 0);
  const lossAmount = Math.max(totalBet - net, 0);
  const profitAmount = net - totalBet;

  totalBetAmount.textContent = formatCurrency(totalBet);
  totalPayoutAmount.textContent = formatCurrency(totalPayout);
  netPayoutAmount.textContent = formatCurrency(net);
  summaryWinAmount.textContent = formatCurrency(winAmount);
  summaryLossAmount.textContent = formatCurrency(lossAmount);
  summaryProfitAmount.textContent = formatCurrency(profitAmount);
  summaryProfitCard.classList.toggle('negative', profitAmount < 0);

  const feeNote = document.querySelector('.fee-note');
  feeNote.textContent = fee > 0
    ? `※ 당첨금의 10% 수수료 ${formatCurrency(fee)}가 차감되어 최종 지급액 ${formatCurrency(net)}이 표시됩니다.`
    : '※ 당첨금의 10% 수수료가 차감되어 최종 지급액이 표시됩니다.';
}

function fillRandomResults() {
  const generated = Array.from({ length: 10 }, () => (Math.random() < 0.5 ? '키' : '쿠'));
  results = generated;
  betAmounts = Array.from({ length: 10 }, (_, index) => (index % 3 === 0 ? 5000 : 10000));
  oddsValues = Array.from({ length: 10 }, (_, index) => (index % 2 === 0 ? 1.9 : 2.2));
  orb.className = 'orb';
  orb.textContent = '?';
  resultLabel.textContent = '랜덤 패턴을 불러왔어요';
  resultDetail.textContent = '표본을 미리 채워서 바로 분석해 볼 수 있습니다.';
  render();
}

function getStreak() {
  const latest = results.filter(Boolean).at(-1);
  if (!latest) return { value: null, length: 0 };
  let length = 0;
  for (const item of [...results].reverse()) {
    if (item === latest) length++;
    else if (item) break;
  }
  return { value: latest, length };
}

function render() {
  const entered = results.filter(Boolean);
  const oddCount = entered.filter(item => item === '키').length;
  const total = entered.length;
  const oddRate = total ? Math.round((oddCount / total) * 100) : 0;

  inputButtons.forEach((button, index) => {
    const value = results[index];
    button.className = value === '키' ? 'odd' : value === '쿠' ? 'even' : '';
    button.querySelector('strong').textContent = value || '?';
    button.setAttribute('aria-label', `${index + 1}번째 결과: ${value || '미입력'}`);
  });

  betInputs.forEach((input, index) => {
    input.value = betAmounts[index] ?? 0;
  });

  payoutInputs.forEach((input, index) => {
    const calculated = calculatePayout(betAmounts[index], oddsValues[index]);
    payoutAmounts[index] = calculated;
    input.value = calculated;
  });

  oddsInputs.forEach((input, index) => {
    input.value = oddsValues[index] ?? 1.9;
  });

  document.querySelector('#inputCount').textContent = total;
  analyzeButton.disabled = total !== 10;
  analyzeButton.firstChild.textContent = total === 10 ? '표본 기반 확률 보기 ' : `10개 입력 후 확률 보기 (${total}/10) `;
  document.querySelector('#oddRate').textContent = total ? `${oddRate}%` : '—';
  document.querySelector('#evenRate').textContent = total ? `${100 - oddRate}%` : '—';
  document.querySelector('#oddMeter').style.width = `${oddRate}%`;
  document.querySelector('#evenMeter').style.width = `${100 - oddRate}%`;
  historyCount.textContent = total;
  roundLabel.textContent = total === 10 ? '10 RESULTS READY' : `${total} / 10 ENTERED`;
  const streak = getStreak();
  document.querySelector('#streak').textContent = streak.value ? `${streak.value} ${streak.length}연속` : '기록 없음';
  document.querySelector('#streakCopy').textContent = streak.value ? '마지막 입력 기준 연속 흐름입니다.' : '10개 결과를 순서대로 입력해 보세요.';
  historyList.innerHTML = total
    ? results.map((item, index) => item ? `<li class="${item === '쿠' ? 'even' : ''}"><span>${String(index + 1).padStart(2, '0')} 번째</span><b>${item}</b><small>${index === 9 ? '최신' : ''}</small></li>` : '').join('')
    : '<li class="empty-state">입력된 결과가 없습니다.</li>';
  localStorage.setItem('oddly-inputs', JSON.stringify(results));
  localStorage.setItem('oddly-bets', JSON.stringify(betAmounts));
  localStorage.setItem('oddly-odds', JSON.stringify(oddsValues));
  localStorage.setItem('oddly-payouts', JSON.stringify(payoutAmounts));
  updateTotals();
}

inputButtons.forEach(button => button.addEventListener('click', () => {
  const slot = button.closest('.result-slot');
  const index = Number(slot.dataset.index);
  results[index] = results[index] === null ? '키' : results[index] === '키' ? '쿠' : null;
  if (results.filter(Boolean).length < 10) {
    orb.className = 'orb';
    orb.textContent = '?';
    resultLabel.textContent = '분석을 시작해 보세요';
    resultDetail.textContent = '최근 10개 결과를 모두 입력하면 표본 기반 확률을 계산합니다.';
  }
  render();
}));

betInputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    betAmounts[index] = Number(input.value || 0);
    render();
  });
});

oddsInputs.forEach((input, index) => {
  input.addEventListener('input', () => {
    oddsValues[index] = Number(input.value || 1);
    render();
  });
});

randomFillButton.addEventListener('click', fillRandomResults);

analyzeButton.addEventListener('click', () => {
  const oddRate = results.filter(item => item === '키').length * 10;
  const recommended = oddRate >= 50 ? '키' : '쿠';
  const chance = recommended === '키' ? oddRate : 100 - oddRate;
  orb.className = `orb ${recommended === '키' ? 'odd' : 'even'} roll`;
  orb.textContent = recommended;
  resultLabel.textContent = `참고 추천: ${recommended} ${chance}%`;
  resultDetail.textContent = `입력한 10개 중 ${recommended} 비율이 ${chance}%입니다. 예측값(${recommended})이 10번째 슬롯에 반영되었습니다.`;

  // 기존 10개의 항목을 한 칸씩 밀고 마지막 예측을 10번째 기록으로 추가
  results.shift();
  results.push(recommended);
  render();

  setTimeout(() => orb.classList.remove('roll'), 600);
});

function togglePanel(open) {
  panel.classList.toggle('open', open);
  scrim.classList.toggle('visible', open);
}
document.querySelector('#historyToggle').addEventListener('click', () => togglePanel(true));
document.querySelector('#closeHistory').addEventListener('click', () => togglePanel(false));
scrim.addEventListener('click', () => togglePanel(false));
document.querySelector('#clearHistory').addEventListener('click', () => {
  results = Array(10).fill(null);
  betAmounts = Array(10).fill(0);
  oddsValues = Array(10).fill(1.9);
  payoutAmounts = Array(10).fill(0);
  localStorage.removeItem('oddly-inputs');
  localStorage.removeItem('oddly-bets');
  localStorage.removeItem('oddly-odds');
  localStorage.removeItem('oddly-payouts');
  orb.className = 'orb';
  orb.textContent = '?';
  resultLabel.textContent = '분석을 시작해 보세요';
  resultDetail.textContent = '최근 10개 결과를 모두 입력하면 표본 기반 확률을 계산합니다.';
  render();
});
render();
