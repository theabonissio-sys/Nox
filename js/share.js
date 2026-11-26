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

  const render = ({ kicker, title, desc, date, iconName, colors }) => {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#070a18'); bg.addColorStop(1, '#121338');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    glow(ctx, W / 2, 520, 560, colors[1] + '55');
    glow(ctx, 80, 80, 480, colors[0] + '30');
    // estrelas fixas
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = `rgba(210,225,255,${0.15 + (i % 5) * 0.09})`;
      ctx.beginPath(); ctx.arc((i * 397 + 61) % W, (i * 631 + 113) % H, 1 + (i % 3), 0, 7); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(190,200,255,.16)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(48, 48, W - 96, H - 96, 56) : ctx.rect(48, 48, W - 96, H - 96); ctx.stroke();

    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff'; ctx.font = `700 54px ${FONT}`;
    ctx.fillText('N O X', W / 2, 160);
    ctx.fillStyle = '#67e8f9'; ctx.font = `600 28px ${FONT}`;
    ctx.fillText(kicker.toUpperCase(), W / 2, 215);

    const cx = W / 2, cy = 520;
    const ring = ctx.createLinearGradient(cx - 220, cy - 220, cx + 220, cy + 220);
    ring.addColorStop(0, colors[0]); ring.addColorStop(1, colors[1]);
    ctx.save(); ctx.shadowColor = colors[1]; ctx.shadowBlur = 90;
    ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(cx, cy, 205, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(8,10,28,.55)'; ctx.beginPath(); ctx.arc(cx, cy, 172, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 188, 0, 7); ctx.stroke();
    ctx.save(); ctx.translate(cx - 108, cy - 108); ctx.scale(9, 9);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.35; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke(new Path2D(ICONS[iconName])); ctx.restore();

    ctx.fillStyle = '#fff'; ctx.font = `700 76px ${FONT}`;
    let y = wrap(ctx, title, 855, 880, 88);
    ctx.fillStyle = '#bcc3e0'; ctx.font = `400 40px ${FONT}`;
    wrap(ctx, desc, y + 80, 820, 56);
    ctx.fillStyle = '#8d95bd'; ctx.font = `500 32px ${FONT}`;
    ctx.fillText(date, W / 2, 1190);
    ctx.fillStyle = '#6b739b'; ctx.font = `400 26px ${FONT}`;
    ctx.fillText('Meu ritmo, minha evolução', W / 2, 1245);
    return c;
  };

  const toBlob = canvas => new Promise((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Falha ao gerar imagem')), 'image/png'));

  return { render, toBlob };
})();
