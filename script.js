const inputButtons = [...document.querySelectorAll('#resultInputs button')];
const analyzeButton = document.querySelector('#analyzeButton');
const orb = document.querySelector('#orb');
const resultLabel = document.querySelector('#resultLabel');
const resultDetail = document.querySelector('#resultDetail');
const roundLabel = document.querySelector('#roundLabel');
const historyList = document.querySelector('#historyList');
const historyCount = document.querySelector('#historyCount');
const panel = document.querySelector('#historyPanel');
const scrim = document.querySelector('#scrim');
let results = JSON.parse(localStorage.getItem('oddly-inputs') || 'null') || Array(10).fill(null);
results = results.map(item => item === '홀' ? '키' : item === '짝' ? '쿠' : item);

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
}

inputButtons.forEach(button => button.addEventListener('click', () => {
  const index = Number(button.dataset.index);
  results[index] = results[index] === null ? '키' : results[index] === '키' ? '쿠' : null;
  if (results.filter(Boolean).length < 10) {
    orb.className = 'orb';
    orb.textContent = '?';
    resultLabel.textContent = '분석을 시작해 보세요';
    resultDetail.textContent = '최근 10개 결과를 모두 입력하면 표본 기반 확률을 계산합니다.';
  }
  render();
}));

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
  localStorage.removeItem('oddly-inputs');
  orb.className = 'orb';
  orb.textContent = '?';
  resultLabel.textContent = '분석을 시작해 보세요';
  resultDetail.textContent = '최근 10개 결과를 모두 입력하면 표본 기반 확률을 계산합니다.';
  render();
});
render();
