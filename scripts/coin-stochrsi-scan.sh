#!/bin/bash
# 3-TF StochRSI scanner — overbought/oversold + hidden divergence
# Usage: ./scripts/coin-stochrsi-scan.sh [count=20] [timeframes=60,240,D] [volume_min_m=5]

COUNT=${1:-20}
TFS=${2:-60,240,D}
VOL_MIN=${3:-5}

SYM_FILE=$(mktemp)

echo "3-TF StochRSI Scanner  |  Timeframes: ${TFS}  |  Min Vol: \$${VOL_MIN}M"
echo "Fetching top $COUNT Binance USDT pairs by 24h volume..."
echo ""

curl -s 'https://api.binance.com/api/v3/ticker/24hr' | node -e "
const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const s=['USDC','USDT','FDUSD','USD1','RLUSD','DAI','TUSD','BUSD','XAUT','PAXG','USDP'];
const c=d.filter(t=>t.symbol.endsWith('USDT')&&parseFloat(t.quoteVolume)>1e6&&!s.some(x=>t.symbol.startsWith(x))&&parseFloat(t.lastPrice)>1e-4);
c.sort((a,b)=>parseFloat(b.quoteVolume)-parseFloat(a.quoteVolume));
const top=c.slice(0,$COUNT);
top.forEach(t=>console.log(t.symbol+'  \$'+parseFloat(t.lastPrice).toFixed(4)+'  vol:\$'+(parseFloat(t.quoteVolume)/1e6).toFixed(0)+'M  chg:'+parseFloat(t.priceChangePercent).toFixed(1)+'%'));
console.log('---');
top.forEach(t=>console.log('BINANCE:'+t.symbol));
" | tee /dev/stderr | tail -n +$((COUNT+3)) > "$SYM_FILE"

echo ""
echo "Running StochRSI scan (TFs=${TFS}, min_vol=\$${VOL_MIN}M, bars=50)..."
echo ""

node src/cli/index.js coin-stochrsi --file "$SYM_FILE" --t "$TFS" --v "$VOL_MIN" --n "$COUNT" 2>/dev/null | node -e "
const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('Scanned: '+d.scanned+' | Passed: '+d.passed+' | Failed: '+d.failed+' | TFs: '+d.timeframes.join(', '));
console.log('');
if (d.top_results && d.top_results.length > 0) {
  console.log('Rank  Symbol              Dir     Score  Conv                              Oversold TF  Overbought TF  TF Details');
  d.top_results.forEach((r,i) => {
    const sym=(r.symbol||'').replace('BINANCE:','').padEnd(18).substring(0,18);
    const dir=(r.direction||'--').padEnd(5);
    const sc=(r.score||0).toString().padStart(5);
    const conv=(r.convergence||'--').padEnd(35).substring(0,35);
    const os=r.oversold_tfs||0;
    const ob=r.overbought_tfs||0;
    const tfInfo=(r.tf_results||[]).map(t=>t.timeframe+':'+(t.zone||'?').replace('OVERBOUGHT','OBOT').replace('OVERSOLD','OSLD').substring(0,4)+(t.divergence?' D:'+t.divergence.type.substring(0,6):'')).join(' | ');
    console.log(' '+(i+1+']').padStart(4)+' '+sym+' '+dir+' '+sc+'  '+conv+' '+os+'              '+ob+'               '+tfInfo);
  });
} else {
  console.log('No candidates passed filters.');
  const errs=d.all_results.filter(r=>!r.success).slice(0,3);
  errs.forEach(r=>console.log('  FAIL: '+r.symbol.replace('BINANCE:','')+' — '+(r.error||'?')));
}
"

rm -f "$SYM_FILE"
echo ""
echo "Done."
