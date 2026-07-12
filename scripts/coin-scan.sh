#!/bin/bash
# Markov MTF coin scanner — Markov on entry TF + trend context on higher TF
# Usage: ./scripts/coin-scan.sh [count=20] [timeframe=240] [volume_min_m=5] [htf=D]

COUNT=${1:-20}
TF=${2:-240}
VOL_MIN=${3:-5}
HTF=${4:-D}

SYM_FILE=$(mktemp)

echo "MTF Markov Scanner  |  Entry TF: ${TF}  |  HTF context: ${HTF}"
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
echo "Running Markov scan (TF=${TF}, HTF=${HTF}, min_vol=\$${VOL_MIN}M, bars=30)..."
echo ""

node src/cli/index.js coin-scan --file "$SYM_FILE" --timeframe "$TF" --htf "$HTF" --volume "$VOL_MIN" --top "$COUNT" 2>/dev/null | node -e "
const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('Scanned: '+d.scanned+' | Passed: '+d.passed+' | Failed: '+d.failed+' | TF: '+d.timeframe+' | HTF: '+(d.htf||'-'));
console.log('');
if (d.top_results && d.top_results.length > 0) {
  console.log('Rank  Symbol              Dir     MTFSc  Rel    Entropy  Persist  VolR  Move%  HTF_Trend  State        Priority');
  d.top_results.forEach((r,i) => {
    const mtf=r.mtf_score||0;
    const ent=r.entropy||99;
    const rel=r.reliability||0;
    const vr=r.volume_ratio||0;
    const htfT=r.htf_context?(r.htf_context.trend||'--'):'--';
    const dir=r.direction||'--';

    let priority;
    if (mtf > 0.5 && ent < 1.0 && htfT === dir) {
      priority='PRIMARY';
    } else if (rel > 0.4 && htfT === 'NEUTRAL') {
      priority='SECONDARY';
    } else if (htfT !== '--' && htfT !== dir && htfT !== 'NEUTRAL') {
      priority=(vr > 1.0 && ent < 0.8) ? 'EDGE' : 'SKIP';
    } else if (mtf > 0.3 && ent < 1.5 && vr > 0.5) {
      priority='WATCH';
    } else {
      priority='SKIP';
    }

    const sym=(r.symbol||'').replace('BINANCE:','').padEnd(18).substring(0,18);
    const dirP=(dir||'--').padEnd(5);
    const mtfP=(mtf*100).toFixed(0).padStart(6);
    const relP=(rel*100).toFixed(0).padStart(5);
    const entP=(ent).toFixed(2).padStart(7);
    const per=(r.momentum_persistence||0).toFixed(3).padStart(7);
    const vrP=(vr).toFixed(1).padStart(5);
    const mv=(r.total_move_pct||0).toFixed(1).padStart(6);
    const htfP=htfT.padEnd(9);
    const st=(r.last_state||'').padEnd(12);
    console.log(' '+(i+1+']').padStart(4)+' '+sym+' '+dirP+' '+mtfP+' '+relP+' '+entP+' '+per+' '+vrP+' '+mv+'  '+htfP+' '+st+priority);
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
