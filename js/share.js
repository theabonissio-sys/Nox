/* NOX: cartão digital de conquista desenhado em canvas (1080x1350). */
const Share = (() => {
  'use strict';
  const W = 1080, H = 1350;
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  const wrap = (ctx, text, y, max, lh) => {
    let line = '';
    text.split(' ').forEach(w => {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > max && line) { ctx.fillText(line, W / 2, y); y += lh; line = w; }
      else line = t;
    });
    ctx.fillText(line, W / 2, y);
    return y;
  };

  const glow = (ctx, x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  /* Minimalista: preto, um clarão de cor, um anel fino e muito respiro. */
  const render = ({ kicker, title, desc, date, iconName, colors }) => {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    glow(ctx, W / 2, 470, 620, colors[1] + '59');
    glow(ctx, W * .95, H, 760, colors[0] + '33');
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff'; ctx.font = `600 30px ${FONT}`;
    ctx.fillText('N  O  X', W / 2, 130);

    const cx = W / 2, cy = 470;
    const ring = ctx.createLinearGradient(cx - 190, cy - 190, cx + 190, cy + 190);
    ring.addColorStop(0, colors[0]); ring.addColorStop(1, colors[1]);
    ctx.save(); ctx.shadowColor = colors[1]; ctx.shadowBlur = 60;
    ctx.strokeStyle = ring; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, 180, 0, 7); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.translate(cx - 108, cy - 108); ctx.scale(9, 9);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke(new Path2D(ICONS[iconName])); ctx.restore();

    ctx.fillStyle = ring; ctx.font = `600 28px ${FONT}`;
    ctx.fillText(kicker.toUpperCase().split('').join('\u200a'), W / 2, 790);
    ctx.fillStyle = '#fff'; ctx.font = `700 84px ${FONT}`;
    const y = wrap(ctx, title, 890, 900, 96);
    ctx.fillStyle = '#9a9caf'; ctx.font = `400 38px ${FONT}`;
    wrap(ctx, desc, y + 76, 760, 54);
    ctx.fillStyle = ring; ctx.fillRect(W / 2 - 30, 1190, 60, 4);
    ctx.fillStyle = '#6d6f82'; ctx.font = `400 28px ${FONT}`;
    ctx.fillText(date, W / 2, 1250);
    return c;
  };

  const toBlob = canvas => new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Falha ao gerar imagem')), 'image/png'));

  return { render, toBlob };
})();
