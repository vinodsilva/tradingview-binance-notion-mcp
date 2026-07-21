import { evaluate, evaluateAsync, safeString } from '../connection.js';
import { waitForChartReady } from '../wait.js';

const API = 'window.TradingViewApi._activeChartWidgetWV.value()';

const STATES = ['SS', 'SB', 'N', 'WB', 'WS'];
const STATE_LABELS = { SS: 'Strong Bull', SB: 'Weak Bull', N: 'Neutral', WB: 'Weak Bear', WS: 'Strong Bear' };

const HTF_EMA = 21;

function classifyReturn(ret) {
  if (ret > 1.5) return 'SS';
  if (ret > 0.5) return 'SB';
  if (ret > -0.5) return 'N';
  if (ret > -1.5) return 'WB';
  return 'WS';
}

function buildTransitionMatrix(states) {
  const counts = {};
  for (const s of STATES) counts[s] = {};
  for (const s of STATES) for (const t of STATES) counts[s][t] = 0;
  for (let i = 1; i < states.length; i++) counts[states[i - 1]][states[i]]++;

  const probs = {};
  for (const s of STATES) {
    probs[s] = {};
    const total = Object.values(counts[s]).reduce((a, b) => a + b, 0);
    for (const t of STATES) probs[s][t] = total > 0 ? counts[s][t] / total : 0;
  }
  return { counts, probs };
}

function entropy(probs) {
  let h = 0;
  for (const t of STATES) {
    if (probs[t] > 0) h -= probs[t] * Math.log2(probs[t]);
  }
  return h;
}

function computeSteadyState(probs) {
  let vec = {};
  for (const s of STATES) vec[s] = 1 / STATES.length;
  for (let iter = 0; iter < 100; iter++) {
    const next = {};
    for (const s of STATES) next[s] = 0;
    for (const i of STATES) for (const j of STATES) next[j] += vec[i] * (probs[i][j] || 0);
    vec = next;
  }
  return vec;
}

// ── Hidden Markov Model (Gaussian HMM, 3 hidden states) ──
// Hidden states: UP, DOWN, RANGE
function kmeansInit(returns, k) {
  const sorted = [...returns].sort((a, b) => a - b);
  const centroids = [];
  for (let i = 0; i < k; i++) centroids.push(sorted[Math.floor((i + 0.5) * sorted.length / k)]);
  let assignments = new Array(returns.length).fill(0);
  for (let iter = 0; iter < 20; iter++) {
    for (let i = 0; i < returns.length; i++) {
      let best = 0, bestD = Infinity;
      for (let j = 0; j < k; j++) {
        const d = Math.abs(returns[i] - centroids[j]);
        if (d < bestD) { bestD = d; best = j; }
      }
      assignments[i] = best;
    }
    for (let j = 0; j < k; j++) {
      const group = returns.filter((_, i) => assignments[i] === j);
      centroids[j] = group.length > 0 ? group.reduce((a, b) => a + b, 0) / group.length : 0;
    }
  }
  return centroids;
}

function gaussPdf(x, mu, sigma) {
  if (sigma < 1e-10) sigma = 1e-10;
  return (1 / (Math.sqrt(2 * Math.PI) * sigma)) * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}

function analyzeHMM(returns) {
  const N = 3;
  const T = returns.length;
  const HMM_LABELS = ['UP', 'DOWN', 'RANGE'];

  const cents = kmeansInit(returns, N);
  const sortedCents = [...cents].sort((a, b) => a - b);

  let pi = Array(N).fill(1 / N);
  let A = Array.from({ length: N }, () => Array(N).fill(1 / N));
  let mus = Array(N);
  let sigmas = Array(N);

  for (let i = 0; i < N; i++) {
    mus[i] = sortedCents[i];
    sigmas[i] = returns.reduce((sum, r) => sum + (r - mus[i]) ** 2, 0) / Math.max(1, returns.length);
    sigmas[i] = Math.sqrt(sigmas[i]) || 0.5;
  }

  for (let em = 0; em < 15; em++) {
    const alpha = Array.from({ length: T }, () => Array(N).fill(0));
    const beta = Array.from({ length: T }, () => Array(N).fill(0));
    const gamma = Array.from({ length: T }, () => Array(N).fill(0));
    const xi = Array.from({ length: T - 1 }, () => Array.from({ length: N }, () => Array(N).fill(0)));

    for (let i = 0; i < N; i++) alpha[0][i] = pi[i] * gaussPdf(returns[0], mus[i], sigmas[i]);
    let aNorm = alpha[0].reduce((s, v) => s + v, 0) || 1;
    for (let i = 0; i < N; i++) alpha[0][i] /= aNorm;

    for (let t = 1; t < T; t++) {
      for (let j = 0; j < N; j++) {
        let sum = 0;
        for (let i = 0; i < N; i++) sum += alpha[t - 1][i] * A[i][j];
        alpha[t][j] = sum * gaussPdf(returns[t], mus[j], sigmas[j]);
      }
      const norm = alpha[t].reduce((s, v) => s + v, 0) || 1;
      for (let j = 0; j < N; j++) alpha[t][j] /= norm;
    }

    for (let i = 0; i < N; i++) beta[T - 1][i] = 1;
    for (let t = T - 2; t >= 0; t--) {
      for (let i = 0; i < N; i++) {
        let sum = 0;
        for (let j = 0; j < N; j++) sum += A[i][j] * gaussPdf(returns[t + 1], mus[j], sigmas[j]) * beta[t + 1][j];
        beta[t][i] = sum;
      }
      const norm = beta[t].reduce((s, v) => s + v, 0) || 1;
      for (let i = 0; i < N; i++) beta[t][i] /= norm;
    }

    for (let t = 0; t < T; t++) {
      let sum = 0;
      for (let i = 0; i < N; i++) sum += alpha[t][i] * beta[t][i];
      sum = sum || 1;
      for (let i = 0; i < N; i++) gamma[t][i] = alpha[t][i] * beta[t][i] / sum;
    }

    for (let t = 0; t < T - 1; t++) {
      let sum = 0;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
        sum += alpha[t][i] * A[i][j] * gaussPdf(returns[t + 1], mus[j], sigmas[j]) * beta[t + 1][j];
      sum = sum || 1;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++)
        xi[t][i][j] = alpha[t][i] * A[i][j] * gaussPdf(returns[t + 1], mus[j], sigmas[j]) * beta[t + 1][j] / sum;
    }

    for (let i = 0; i < N; i++) pi[i] = gamma[0][i];

    for (let i = 0; i < N; i++) {
      let denom = 0;
      for (let t = 0; t < T - 1; t++) denom += gamma[t][i];
      denom = denom || 1;
      for (let j = 0; j < N; j++) {
        let numer = 0;
        for (let t = 0; t < T - 1; t++) numer += xi[t][i][j];
        A[i][j] = numer / denom;
      }
    }

    for (let j = 0; j < N; j++) {
      let numer = 0, denom = 0;
      for (let t = 0; t < T; t++) { numer += gamma[t][j] * returns[t]; denom += gamma[t][j]; }
      mus[j] = denom > 0 ? numer / denom : mus[j];
    }

    for (let j = 0; j < N; j++) {
      let numer = 0, denom = 0;
      for (let t = 0; t < T; t++) { numer += gamma[t][j] * (returns[t] - mus[j]) ** 2; denom += gamma[t][j]; }
      sigmas[j] = denom > 0 ? Math.sqrt(numer / denom) || 0.3 : sigmas[j];
    }
  }

  const vit = Array.from({ length: T }, () => Array(N).fill(0));
  const back = Array.from({ length: T }, () => Array(N).fill(0));
  for (let i = 0; i < N; i++) vit[0][i] = Math.log(pi[i] + 1e-15) + Math.log(gaussPdf(returns[0], mus[i], sigmas[i]) + 1e-15);
  for (let t = 1; t < T; t++) {
    for (let j = 0; j < N; j++) {
      let best = -Infinity, bestIdx = 0;
      for (let i = 0; i < N; i++) {
        const val = vit[t - 1][i] + Math.log(A[i][j] + 1e-15);
        if (val > best) { best = val; bestIdx = i; }
      }
      vit[t][j] = best + Math.log(gaussPdf(returns[t], mus[j], sigmas[j]) + 1e-15);
      back[t][j] = bestIdx;
    }
  }

  const stateSeq = Array(T).fill(0);
  stateSeq[T - 1] = vit[T - 1].indexOf(Math.max(...vit[T - 1]));
  for (let t = T - 2; t >= 0; t--) stateSeq[t] = back[t + 1][stateSeq[t + 1]];

  const lastProbs = (() => {
    let sum = 0;
    const raw = [];
    for (let i = 0; i < N; i++) { const v = alpha[T - 1][i] * beta[T - 1][i]; raw.push(v); sum += v; }
    sum = sum || 1;
    return raw.map(v => Math.round(v / sum * 1000) / 10);
  })();

  const regimeTransitions = stateSeq.slice(1).filter((s, i) => s !== stateSeq[i]).length;
  const regimeStability = T > 1 ? 1 - regimeTransitions / (T - 1) : 1;

  const label = HMM_LABELS[stateSeq[stateSeq.length - 1]];

  const direction = (() => {
    if (label === 'UP') return 'BULL';
    if (label === 'DOWN') return 'BEAR';
    const upW = lastProbs[HMM_LABELS.indexOf('UP')];
    const downW = lastProbs[HMM_LABELS.indexOf('DOWN')];
    if (upW > downW * 1.5) return 'BULL';
    if (downW > upW * 1.5) return 'BEAR';
    return 'NEUTRAL';
  })();

  return {
    hmm_direction: direction,
    hmm_regime: label,
    hmm_regime_stability: Math.round(regimeStability * 1000) / 1000,
    hmm_state_probs: {
      up_pct: lastProbs[HMM_LABELS.indexOf('UP')],
      down_pct: lastProbs[HMM_LABELS.indexOf('DOWN')],
      range_pct: lastProbs[HMM_LABELS.indexOf('RANGE')],
    },
    hmm_state_means: mus.map(m => Math.round(m * 1000) / 1000),
    hmm_state_sigmas: sigmas.map(s => Math.round(s * 1000) / 1000),
    hmm_viterbi_path: stateSeq.join(''),
    hmm_last_state_idx: stateSeq[stateSeq.length - 1],
    hmm_state_labels: HMM_LABELS,
  };
}

function analyzeMarkov(closes) {
  const returns = [];
  for (let i = 1; i < closes.length; i++) returns.push(((closes[i] - closes[i - 1]) / closes[i - 1]) * 100);

  const stateSeq = returns.map(classifyReturn);
  const { probs } = buildTransitionMatrix(stateSeq);

  const entropies = {};
  for (const s of STATES) entropies[s] = entropy(probs[s]);
  const avgEntropy = Object.values(entropies).reduce((a, b) => a + b, 0) / STATES.length;

  const momentumPersistence = (probs['SS']['SS'] + probs['SS']['SB'] + probs['WS']['WS'] + probs['WS']['WB']) / 2;

  const directionalBias = (
    probs['SS']['SS'] + probs['SS']['SB'] + probs['SB']['SS'] + probs['SB']['SB'] +
    probs['N']['SS'] + probs['N']['SB']
  ) - (
    probs['WS']['WS'] + probs['WS']['WB'] + probs['WB']['WS'] + probs['WB']['WB'] +
    probs['N']['WS'] + probs['N']['WB']
  );

  const steadyState = computeSteadyState(probs);
  const trendProbability = (steadyState['SS'] || 0) + (steadyState['WS'] || 0);

  const totalMove = closes.length > 0 ? ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100 : 0;

  const entropyScore = Math.max(0, 1 - avgEntropy / 2.32);
  const reliability = momentumPersistence * 0.4 + entropyScore * 0.3 + Math.min(Math.abs(directionalBias) / 2, 1) * 0.3;

  const lastState = stateSeq.length > 0 ? stateSeq[stateSeq.length - 1] : 'N';
  const direction = ['SS', 'SB'].includes(lastState) ? 'BULL' : ['WS', 'WB'].includes(lastState) ? 'BEAR' : 'NEUTRAL';

  return {
    direction,
    reliability,
    momentum_persistence: Math.round(momentumPersistence * 1000) / 1000,
    directional_bias: Math.round(directionalBias * 1000) / 1000,
    entropy: Math.round(avgEntropy * 1000) / 1000,
    entropy_score: Math.round(entropyScore * 1000) / 1000,
    trend_probability: Math.round(trendProbability * 1000) / 1000,
    total_move_pct: Math.round(totalMove * 100) / 100,
    last_state: STATE_LABELS[lastState],
    last_state_key: lastState,
    transition_matrix: probs,
    steady_state: steadyState,
  };
}

async function getHtfContext(symbol, htf) {
  await evaluateAsync(`new Promise(function(r){ ${API}.setSymbol(${safeString(symbol)}, {}); setTimeout(r, 500); })`);
  await waitForChartReady(symbol);
  await evaluate(`${API}.setResolution(${safeString(htf)}, {})`);
  await new Promise(r => setTimeout(r, 1000));

  const data = await evaluate(`
    (function() {
      var bars = window.TradingViewApi._activeChartWidgetWV.value()._chartWidget.model().mainSeries().bars();
      if (!bars || typeof bars.lastIndex !== 'function') return null;
      var end = bars.lastIndex();
      var limit = Math.min(30, end - bars.firstIndex() + 1);
      var start = end - limit + 1;
      var closes = [];
      for (var i = start; i <= end; i++) {
        var v = bars.valueAt(i);
        if (v) closes.push(v[4]);
      }
      return closes.length >= 5 ? closes : null;
    })()
  `);

  if (!data || data.length < 5) return null;

  const lastPrice = data[data.length - 1];
  const ema = data.slice(-HTF_EMA).reduce((a, b) => a + b, 0) / Math.min(HTF_EMA, data.length);
  const priceVsEma = lastPrice > ema ? 'ABOVE' : 'BELOW';

  const returns = [];
  for (let i = 1; i < data.length; i++) returns.push(((data[i] - data[i - 1]) / data[i - 1]) * 100);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const htfRsi = 50 + avgReturn * 10;
  const rsiZone = htfRsi > 55 ? 'BULL' : htfRsi < 45 ? 'BEAR' : 'NEUTRAL';

  const macdLine = data.slice(-12).reduce((a, b) => a + b, 0) / 12 - data.slice(-26).reduce((a, b) => a + b, 0) / 26;
  const signalLine = data.slice(-9).reduce((a, b) => a + b, 0) / 9;
  const macdSignal = macdLine > signalLine ? 'BULL' : 'BEAR';

  const bullCount = [priceVsEma === 'ABOVE' ? 1 : 0, rsiZone === 'BULL' ? 1 : 0, macdSignal === 'BULL' ? 1 : 0].reduce((a, b) => a + b, 0);
  const bearCount = [priceVsEma === 'BELOW' ? 1 : 0, rsiZone === 'BEAR' ? 1 : 0, macdSignal === 'BEAR' ? 1 : 0].reduce((a, b) => a + b, 0);

  let trend;
  if (bullCount >= 2) trend = 'BULL';
  else if (bearCount >= 2) trend = 'BEAR';
  else trend = 'NEUTRAL';

  return { trend, price_vs_ema: priceVsEma, rsi_zone: rsiZone, macd_signal: macdSignal, htf };
}

export async function scanCoins({ symbols, timeframe = '60', bars = 30, volume_min = 10, top_n = 10, htf = null } = {}) {
  if (!symbols || symbols.length === 0) throw new Error('symbols array required');

  const results = [];

  for (const symbol of symbols) {
    try {
      await evaluateAsync(`new Promise(function(r){ ${API}.setSymbol(${safeString(symbol)}, {}); setTimeout(r, 1000); })`);
      await waitForChartReady(symbol);

      await evaluate(`${API}.setResolution(${safeString(timeframe)}, {})`);
      await new Promise(r => setTimeout(r, 1000));

      const data = await evaluate(`
        (function() {
          var bars = window.TradingViewApi._activeChartWidgetWV.value()._chartWidget.model().mainSeries().bars();
          if (!bars || typeof bars.lastIndex !== 'function') return null;
          var end = bars.lastIndex();
          var limit = Math.min(${bars}, end - bars.firstIndex() + 1);
          var start = end - limit + 1;
          var result = [];
          for (var i = start; i <= end; i++) {
            var bar = bars.valueAt(i);
            if (bar) result.push({ time: bar[0], open: bar[1], high: bar[2], low: bar[3], close: bar[4], volume: bar[5] || 0 });
          }
          return result;
        })()
      `);

      if (!data || data.length < 10) {
        results.push({ symbol, success: false, error: 'Insufficient bars' });
        continue;
      }

      const closes = data.map(b => b.close);
      const volumes = data.map(b => b.volume);
      const lastPrice = closes[closes.length - 1];
      const avgVolumeCoins = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      const volumeUSD = avgVolumeCoins * lastPrice;

      if (volumeUSD < volume_min * 1e6) {
        results.push({ symbol, success: false, error: `Volume ${(volumeUSD / 1e6).toFixed(1)}M below min ${volume_min}M` });
        continue;
      }

      const avgVol = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const volumeRatio = avgVolumeCoins > 0 ? avgVol / avgVolumeCoins : 1;

      const analysis = analyzeMarkov(closes);
      const returns = [];
      for (let i = 1; i < closes.length; i++) returns.push(((closes[i] - closes[i - 1]) / closes[i - 1]) * 100);
      const hmm = analyzeHMM(returns);

      let htfContext = null;
      if (htf) {
        htfContext = await getHtfContext(symbol, htf);
      }

      let mtfScore = analysis.reliability;
      if (htfContext) {
        if (htfContext.trend === analysis.direction) mtfScore += 0.2;
        else if (htfContext.trend !== 'NEUTRAL' && analysis.direction !== 'NEUTRAL') mtfScore -= 0.15;
        mtfScore = Math.max(0, Math.min(1, mtfScore));
      }

      results.push({
        symbol,
        success: true,
        price: lastPrice,
        avg_volume_usd: Math.round(volumeUSD / 1e6 * 10) / 10 + 'M',
        volume_ratio: Math.round(volumeRatio * 100) / 100,
        mtf_score: Math.round(mtfScore * 1000) / 1000,
        htf_context: htfContext,
        ...analysis,
        ...hmm,
      });
    } catch (err) {
      results.push({ symbol, success: false, error: err.message });
    }
  }

  const passed = results.filter(r => r.success);
  passed.sort((a, b) => (b.mtf_score || b.reliability) - (a.mtf_score || a.reliability));

  const top = passed.slice(0, top_n);

  return {
    success: true,
    timeframe,
    htf,
    scanned: results.length,
    passed: passed.length,
    failed: results.length - passed.length,
    top_results: top,
    all_results: results,
  };
}
