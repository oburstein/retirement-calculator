// Comma formatting for currency inputs
document.querySelectorAll('#currentSavings, #contribution').forEach(input => {
  input.addEventListener('input', function () {
    let raw = this.value.replace(/[^0-9]/g, '');
    if (raw) {
      this.value = parseInt(raw).toLocaleString();
    }
  });
});

let contributionFrequency = 'yearly';

function setFrequency(freq) {
  contributionFrequency = freq;
  document.getElementById('btnYearly').classList.toggle('active', freq === 'yearly');
  document.getElementById('btnMonthly').classList.toggle('active', freq === 'monthly');
  const input = document.getElementById('contribution');
  input.placeholder = freq === 'monthly' ? 'e.g. 500' : 'e.g. 10,000';
}

function parseMoney(id) {
  return parseFloat(document.getElementById(id).value.replace(/[^0-9.]/g, '')) || 0;
}

function formatMoney(amount) {
  return '$' + Math.round(amount).toLocaleString();
}

function computeGrowth(currentSavings, contribution, isMonthly, returnRate, inflationRate, years, currentAge) {
  let total = currentSavings;
  const monthlyRate = returnRate / 12;
  const data = [];

  for (let i = 0; i <= years; i++) {
    const yearlyContrib = isMonthly ? contribution * 12 : contribution;
    const contributed = currentSavings + (yearlyContrib * i);
    const inflationFactor = Math.pow(1 + inflationRate, i);
    const realTotal = total / inflationFactor;
    data.push({ age: currentAge + i, total: total, contributed: contributed, growth: total - contributed, realTotal: realTotal });

    if (isMonthly) {
      for (let m = 0; m < 12; m++) {
        total = (total + contribution) * (1 + monthlyRate);
      }
    } else {
      total = (total + contribution) * (1 + returnRate);
    }
  }
  return data;
}

function calculate() {
  const currentAge = parseInt(document.getElementById('currentAge').value);
  const retirementAge = parseInt(document.getElementById('retirementAge').value);
  const currentSavings = parseMoney('currentSavings');
  const contribution = parseMoney('contribution');
  const isMonthly = contributionFrequency === 'monthly';
  const rateLow = parseFloat(document.getElementById('returnRateLow').value) / 100 || 0;
  const rateHigh = parseFloat(document.getElementById('returnRateHigh').value) / 100 || 0;
  const inflationRate = parseFloat(document.getElementById('inflationRate').value) / 100 || 0;

  if (!currentAge || !retirementAge || retirementAge <= currentAge) {
    alert('Please enter valid ages. Retirement age must be greater than current age.');
    return;
  }

  if (rateHigh < rateLow) {
    alert('High return rate should be greater than or equal to low return rate.');
    return;
  }

  const years = retirementAge - currentAge;
  const dataLow = computeGrowth(currentSavings, contribution, isMonthly, rateLow, inflationRate, years, currentAge);
  const dataHigh = computeGrowth(currentSavings, contribution, isMonthly, rateHigh, inflationRate, years, currentAge);

  const finalLow = dataLow[dataLow.length - 1];
  const finalHigh = dataHigh[dataHigh.length - 1];

  document.getElementById('lowLabel').textContent = 'At ' + (rateLow * 100).toFixed(1) + '%';
  document.getElementById('highLabel').textContent = 'At ' + (rateHigh * 100).toFixed(1) + '%';
  document.getElementById('totalLow').textContent = formatMoney(finalLow.total);
  document.getElementById('totalHigh').textContent = formatMoney(finalHigh.total);
  document.getElementById('realLow').textContent = '~' + formatMoney(finalLow.realTotal) + " in today's $";
  document.getElementById('realHigh').textContent = '~' + formatMoney(finalHigh.realTotal) + " in today's $";
  document.getElementById('years').textContent = years + ' years';
  document.getElementById('totalContributions').textContent = formatMoney(finalLow.contributed);
  document.getElementById('investmentGrowthLow').textContent = formatMoney(finalLow.growth);
  document.getElementById('investmentGrowthHigh').textContent = formatMoney(finalHigh.growth);
  document.getElementById('placeholder').style.display = 'none';
  document.getElementById('results').classList.add('visible');

  drawChart(dataLow, dataHigh);
}

function drawChart(dataLow, dataHigh) {
  const canvas = document.getElementById('chart');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 200 * dpr;
  canvas.style.height = '200px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 200;
  const pad = { top: 15, right: 15, bottom: 30, left: 60 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  const maxVal = Math.max(...dataHigh.map(d => d.total));
  const niceMax = Math.ceil(maxVal / 100000) * 100000 || 1;
  const xStep = chartW / (dataLow.length - 1 || 1);

  function getX(i) { return pad.left + i * xStep; }
  function getY(val) { return pad.top + chartH - (val / niceMax) * chartH; }

  // Grid lines
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#718096';
  ctx.font = '10px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = pad.top + chartH - (i / gridLines) * chartH;
    const val = (i / gridLines) * niceMax;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + chartW, y);
    ctx.stroke();
    ctx.fillText(formatMoney(val), pad.left - 6, y + 3);
  }

  // Band between low and high
  ctx.beginPath();
  dataHigh.forEach((d, i) => {
    if (i === 0) ctx.moveTo(getX(i), getY(d.total));
    else ctx.lineTo(getX(i), getY(d.total));
  });
  for (let i = dataLow.length - 1; i >= 0; i--) ctx.lineTo(getX(i), getY(dataLow[i].total));
  ctx.closePath();
  ctx.fillStyle = 'rgba(72, 187, 120, 0.15)';
  ctx.fill();

  // Contributions area
  ctx.beginPath();
  ctx.moveTo(getX(0), pad.top + chartH);
  dataLow.forEach((d, i) => ctx.lineTo(getX(i), getY(d.contributed)));
  ctx.lineTo(getX(dataLow.length - 1), pad.top + chartH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(49, 130, 206, 0.25)';
  ctx.fill();

  // High return line
  ctx.beginPath();
  dataHigh.forEach((d, i) => {
    if (i === 0) ctx.moveTo(getX(i), getY(d.total));
    else ctx.lineTo(getX(i), getY(d.total));
  });
  ctx.strokeStyle = '#276749';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Low return line
  ctx.beginPath();
  dataLow.forEach((d, i) => {
    if (i === 0) ctx.moveTo(getX(i), getY(d.total));
    else ctx.lineTo(getX(i), getY(d.total));
  });
  ctx.strokeStyle = '#c05621';
  ctx.lineWidth = 2;
  ctx.stroke();

  // High return inflation-adjusted (dashed)
  ctx.beginPath();
  dataHigh.forEach((d, i) => {
    if (i === 0) ctx.moveTo(getX(i), getY(d.realTotal));
    else ctx.lineTo(getX(i), getY(d.realTotal));
  });
  ctx.strokeStyle = '#9f7aea';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Contributions line
  ctx.beginPath();
  dataLow.forEach((d, i) => {
    if (i === 0) ctx.moveTo(getX(i), getY(d.contributed));
    else ctx.lineTo(getX(i), getY(d.contributed));
  });
  ctx.strokeStyle = '#3182ce';
  ctx.lineWidth = 2;
  ctx.stroke();

  // X-axis labels
  ctx.fillStyle = '#718096';
  ctx.textAlign = 'center';
  ctx.font = '10px -apple-system, sans-serif';
  const labelInterval = Math.max(1, Math.floor(dataLow.length / 6));
  dataLow.forEach((d, i) => {
    if (i % labelInterval === 0 || i === dataLow.length - 1) {
      ctx.fillText('Age ' + d.age, getX(i), pad.top + chartH + 18);
    }
  });
}
