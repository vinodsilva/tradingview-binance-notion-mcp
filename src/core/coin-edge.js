const ADX_PERIOD = 14;
const ATR_PERIOD = 14;
const PIVOT_LOOKBACK = 3;

export function calcADX(closes, highs, lows, period = ADX_PERIOD) {
  const n = Math.min(closes.length, highs.length, lows.length);
  if (n < period * 2) return { adx: null, plusDI: null, minusDI: null, regime: 'INSUFFICIENT_DATA' };

  const tr = [null];
  const plusDM = [null];
  const minusDM = [null];
  for (let i = 1; i < n; i++) {
    const h = highs[i], l = lows[i], ph = highs[i - 1], pl = lows[i - 1], pc = closes[i - 1];
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    const upMove = h - ph;
    const downMove = pl - l;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }

  const smooth = (vals) => {
    const s = [null];
    let sum = 0, count = 0;
    for (let i = 1; i < vals.length && i < period + 1; i++) {
      if (vals[i] !== null) { sum += vals[i]; count++; }
    }
    s.push(count > 0 ? sum / count : null);
    for (let i = period + 1; i < vals.length; i++) {
      const prev = s[s.length - 1];
      if (prev !== null && vals[i] !== null) {
        s.push((prev * (period - 1) + vals[i]) / period);
      } else { s.push(vals[i] !== null ? vals[i] : null); }
    }
    return s;
  };

  const smoothedTR = smooth(tr);
  const smoothedPDM = smooth(plusDM);
  const smoothedMDM = smooth(minusDM);

  const pdi = [], mdi = [], dx = [];
  for (let i = 0; i < n; i++) {
    if (smoothedTR[i] !== null && smoothedTR[i] > 0) {
      pdi.push((smoothedPDM[i] || 0) / smoothedTR[i] * 100);
      mdi.push((smoothedMDM[i] || 0) / smoothedTR[i] * 100);
    } else {
      pdi.push(null);
      mdi.push(null);
    }
  }

  for (let i = 0; i < n; i++) {
    const sum = (pdi[i] || 0) + (mdi[i] || 0);
    dx.push(sum > 0 ? Math.abs((pdi[i] || 0) - (mdi[i] || 0)) / sum * 100 : null);
  }

  const adxVals = smooth(dx);
  const lastADX = adxVals[adxVals.length - 1];
  const lastPDI = pdi[pdi.length - 1];
  const lastMDI = mdi[mdi.length - 1];

  let regime;
  if (lastADX === null) regime = 'INSUFFICIENT_DATA';
  else if (lastADX >= 25) regime = 'TRENDING';
  else regime = 'RANGING';

  let direction = 'NEUTRAL';
  if (lastPDI !== null && lastMDI !== null) {
    if (lastPDI > lastMDI) direction = 'BULL';
    else if (lastMDI > lastPDI) direction = 'BEAR';
  }

  return {
    adx: lastADX !== null ? Math.round(lastADX * 10) / 10 : null,
    plus_di: lastPDI !== null ? Math.round(lastPDI * 10) / 10 : null,
    minus_di: lastMDI !== null ? Math.round(lastMDI * 10) / 10 : null,
    regime,
    direction,
  };
}

export function calcATR(highs, lows, closes, period = ATR_PERIOD) {
  const n = Math.min(highs.length, lows.length, closes.length);
  if (n < period + 1) return null;

  const tr = [];
  for (let i = 1; i < n; i++) {
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  }

  const atr = [];
  const initial = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  atr.push(initial);
  for (let i = period; i < tr.length; i++) {
    atr.push((atr[atr.length - 1] * (period - 1) + tr[i]) / period);
  }
  return Math.round(atr[atr.length - 1] * 100) / 100;
}

export function findPivotPoints(highs, lows, left = PIVOT_LOOKBACK, right = PIVOT_LOOKBACK) {
  const n = Math.min(highs.length, lows.length);
  const pivots = [];

  for (let i = left; i < n - right; i++) {
    let isHigh = true, isLow = true;
    for (let j = i - left; j <= i + right; j++) {
      if (j === i) continue;
      if (highs[j] > highs[i]) isHigh = false;
      if (lows[j] < lows[i]) isLow = false;
    }
    if (isHigh) pivots.push({ type: 'HIGH', idx: i, price: highs[i] });
    if (isLow) pivots.push({ type: 'LOW', idx: i, price: lows[i] });
  }
  return pivots;
}

export function detectEnhancedDivergence(priceData, stochK, pivots) {
  const n = priceData.length;
  const stochAt = (idx) => {
    if (idx < 0 || idx >= stochK.length) return null;
    const v = stochK[idx];
    return (v !== null && v !== undefined) ? v : null;
  };

  const getStochBar = (vals, pivotIdx) => {
    for (let offset = -2; offset <= 2; offset++) {
      const idx = pivotIdx + offset;
      if (idx >= 0 && idx < vals.length) {
        const v = vals[idx];
        if (v !== null && v !== undefined) return v;
      }
    }
    return null;
  };

  const result = { regular_bull: [], regular_bear: [], hidden_bull: [], hidden_bear: [] };

  if (pivots.length < 2) return result;

  for (let i = 1; i < pivots.length; i++) {
    const p1 = pivots[i - 1];
    const p2 = pivots[i];

    if (p1.type !== p2.type) continue;

    const s1 = getStochBar(stochK, p1.idx);
    const s2 = getStochBar(stochK, p2.idx);
    if (s1 === null || s2 === null) continue;

    const highScore = (volumes, avgVol) => {
      let score = 10;
      const recentVol = volumes.slice(-3).reduce((a, b) => a + b, 0) / 3;
      if (recentVol > avgVol * 1.5) score += 20;
      const p1NearEnd = p1.idx > n * 0.7;
      const p2NearEnd = p2.idx > n * 0.7;
      if (p1NearEnd && p2NearEnd) score += 10;
      return score;
    };

    if (p1.type === 'HIGH') {
      if (p2.price > p1.price && s2 < s1) {
        result.regular_bear.push({ strength: 'STRONG', score: highScore(priceData.map(b => b.volume), 0), pivots: [p1, p2], stoch_values: [s1, s2] });
      } else if (p2.price < p1.price && s2 > s1) {
        result.hidden_bear.push({ strength: 'STRONG', score: highScore(priceData.map(b => b.volume), 0), pivots: [p1, p2], stoch_values: [s1, s2] });
      }
    } else if (p1.type === 'LOW') {
      if (p2.price < p1.price && s2 > s1) {
        result.regular_bull.push({ strength: 'STRONG', score: highScore(priceData.map(b => b.volume), 0), pivots: [p1, p2], stoch_values: [s1, s2] });
      } else if (p2.price > p1.price && s2 < s1) {
        result.hidden_bull.push({ strength: 'STRONG', score: highScore(priceData.map(b => b.volume), 0), pivots: [p1, p2], stoch_values: [s1, s2] });
      }
    }
  }

  return result;
}

export function structureContext(price, pivots, lookback = 20) {
  const recent = pivots.filter(p => p.idx >= pivots.length - lookback || true);

  const resistances = recent.filter(p => p.type === 'HIGH').map(p => p.price).sort((a, b) => b - a);
  const supports = recent.filter(p => p.type === 'LOW').map(p => p.price).sort((a, b) => a - b);

  const nearestResistance = resistances.find(r => r > price) || null;
  const nearestSupport = supports.find(s => s < price) || null;

  const atSwingHigh = nearestResistance !== null && Math.abs(price - nearestResistance) / price < 0.005;
  const atSwingLow = nearestSupport !== null && Math.abs(price - nearestSupport) / price < 0.005;

  return {
    nearest_resistance: nearestResistance !== null ? Math.round(nearestResistance * 100) / 100 : null,
    nearest_support: nearestSupport !== null ? Math.round(nearestSupport * 100) / 100 : null,
    at_swing_high: atSwingHigh,
    at_swing_low: atSwingLow,
    resistance_distance_pct: nearestResistance !== null ? Math.round(((nearestResistance - price) / price) * 1000) / 10 : null,
    support_distance_pct: nearestSupport !== null ? Math.round(((price - nearestSupport) / price) * 1000) / 10 : null,
    pivot_count: pivots.length,
  };
}

export function volumeAnalysis(volumes, avgVolume) {
  const n = volumes.length;
  if (n < 10 || avgVolume <= 0) return { spike: false, climax: false, trend: 'NEUTRAL', ratio: 1 };

  const lastVol = volumes[n - 1];
  const ratio = lastVol / avgVolume;

  const recent5 = volumes.slice(-5);
  const avgRecent5 = recent5.reduce((a, b) => a + b, 0) / recent5.length;
  const spike = ratio > 1.5;
  const climax = ratio > 2.5;

  const firstHalf = volumes.slice(0, Math.floor(n / 2)).reduce((a, b) => a + b, 0) / Math.floor(n / 2);
  const secondHalf = volumes.slice(Math.floor(n / 2)).reduce((a, b) => a + b, 0) / (n - Math.floor(n / 2));
  let trend = 'NEUTRAL';
  if (secondHalf > firstHalf * 1.3) trend = 'RISING';
  else if (secondHalf < firstHalf * 0.7) trend = 'FALLING';

  return {
    spike,
    climax,
    trend,
    ratio: Math.round(ratio * 100) / 100,
    avg_recent_5: Math.round(avgRecent5 * 100) / 100,
  };
}

export function calculateRealEdgeScore(stochTFResults, edgeData) {
  let score = 0;
  const components = {};

  const stochScores = stochTFResults.map(tf => {
    let s = 0;
    if (tf.zone === 'OVERSOLD') s += 25;
    else if (tf.zone === 'OVERBOUGHT') s += 25;
    else if (tf.zone === 'BULLISH' && tf.cross_over) s += 10;
    else if (tf.zone === 'BEARISH' && tf.cross_under) s += 10;
    return s;
  });
  const stochScore = stochScores.reduce((a, b) => a + b, 0) / stochScores.length;
  components.stoch_alignment = stochScore;

  const adxScores = edgeData.adx.map(a => {
    if (a === null || a.regime === 'INSUFFICIENT_DATA') return 0;
    if (a.regime === 'TRENDING') return 15;
    return 5;
  });
  const adxScore = adxScores.reduce((a, b) => a + b, 0) / Math.max(1, adxScores.length);
  components.adx_regime = adxScore;

  const divScores = edgeData.divergence.map(d => {
    if (!d) return 0;
    let s = 0;
    if (d.regular_bull.length > 0 || d.regular_bear.length > 0) s += 30;
    if (d.hidden_bull.length > 0 || d.hidden_bear.length > 0) s += 15;
    const totalDivs = d.regular_bull.length + d.regular_bear.length + d.hidden_bull.length + d.hidden_bear.length;
    if (totalDivs >= 2) s += 15;
    return s;
  });
  const divScore = divScores.reduce((a, b) => a + b, 0) / Math.max(1, divScores.length);
  components.divergence = divScore;

  const volScores = edgeData.volume.map(v => {
    if (!v) return 0;
    if (v.climax) return 5;
    if (v.spike) return 15;
    if (v.trend === 'RISING') return 10;
    return 5;
  });
  const volScore = volScores.reduce((a, b) => a + b, 0) / Math.max(1, volScores.length);
  components.volume = volScore;

  const structScores = edgeData.structure.map(s => {
    if (!s) return 0;
    if (s.at_swing_high || s.at_swing_low) return 20;
    if (s.nearest_resistance !== null || s.nearest_support !== null) return 10;
    return 5;
  });
  const structScore = structScores.reduce((a, b) => a + b, 0) / Math.max(1, structScores.length);
  components.structure = structScore;

  score = stochScore * 0.30 + adxScore * 0.20 + divScore * 0.25 + volScore * 0.15 + structScore * 0.10;

  let conviction;
  if (score >= 70) conviction = 'HIGH';
  else if (score >= 50) conviction = 'MODERATE';
  else if (score >= 30) conviction = 'LOW';
  else conviction = 'NOISE';

  return {
    score: Math.min(100, Math.round(score)),
    components,
    conviction,
    edge_confidence: Math.round(score / 100 * 10) / 10,
  };
}

export function classifyVolatilityRegime(currentATR, avgATR) {
  if (!currentATR || !avgATR || avgATR === 0) return { regime: 'UNKNOWN', ratio: 0 };
  const ratio = currentATR / avgATR;
  let regime;
  if (ratio < 0.5) regime = 'LOW';
  else if (ratio < 1.3) regime = 'NORMAL';
  else if (ratio < 2.0) regime = 'HIGH';
  else regime = 'EXTREME';
  return { regime, ratio: Math.round(ratio * 100) / 100 };
}
