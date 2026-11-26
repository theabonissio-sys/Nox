/* NOX: barra de navegação. A aba atual cresce e o ícone gira; arrastar passa só para a vizinha. */
const Wheel = ({ nav, items, onPick, onStep }) => {
  const n = items.length, MIN = 10, NEXT = 42; // px para começar a arrastar e para trocar de aba
  nav.innerHTML = items.map(([id, label, ic]) => `<button data-act="tab" data-v="${id}" aria-label="${label}"><span class="orbit"><i class="halo"></i>${icon(ic)}</span><span class="label">${label}</span></button>`).join('');
  const buttons = [...nav.children];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  /* focus[i] vai de 0 (normal) a 1 (destacado) */
  let focus = items.map(() => 0), current = -1, side = 1, frame = 0, drag = null, swallow = false;

  const paint = () => {
    // a aba destacada ganha mais espaço; a soma sempre cabe dentro da barra
    const weights = focus.map(f => 1 + clamp(f, 0, 1) * .35);
    const unit = (nav.clientWidth - 12) / weights.reduce((a, b) => a + b, 0);
    let left = 6;
    buttons.forEach((b, i) => {
      const width = weights[i] * unit;
      b.style.width = `${width}px`;
      b.style.transform = `translate3d(${left.toFixed(1)}px, 0, 0)`;
      b.style.zIndex = focus[i] > .5 ? 2 : 1;
      b.style.setProperty('--f', focus[i].toFixed(3));
      b.style.setProperty('--spin', `${(focus[i] * 360 * side).toFixed(1)}deg`);
      left += width;
    });
  };

  const stop = () => { cancelAnimationFrame(frame); frame = 0; };
  const land = () => {
    const b = buttons[current];
    b.classList.remove('land'); void b.offsetWidth; b.classList.add('land');
  };
  /* a atual encolhe e a nova cresce, passando um pouco do ponto e voltando */
  const animate = () => {
    stop();
    const from = focus.slice(), to = items.map((_, i) => i === current ? 1 : 0);
    if (from.every((f, i) => f === to[i])) return paint();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { focus = to; return paint(); }
    let begin = null;
    const step = now => {
      begin = begin ?? now;
      const t = Math.min(1, (now - begin) / 420), u = t - 1, e = 1 + 2.4 * u * u * u + 1.4 * u * u;
      focus = from.map((f, i) => f + (to[i] - f) * e);
      paint();
      if (t < 1) frame = requestAnimationFrame(step);
      else { focus = to; frame = 0; paint(); land(); }
    };
    frame = requestAnimationFrame(step);
  };

  const mark = index => buttons.forEach((b, i) => {
    b.classList.toggle('on', i === index);
    b.setAttribute('aria-current', i === index ? 'page' : 'false');
  });

  const select = index => {
    mark(index);
    if (current < 0) { current = index; focus = items.map((_, i) => i === index ? 1 : 0); return paint(); }
    if (index === current) return;
    side = index > current ? 1 : -1;
    current = index;
    if (!drag?.moved) animate();
  };

  nav.addEventListener('pointerdown', e => {
    if (drag || e.button > 0) return;
    swallow = false;
    drag = { id: e.pointerId, x: e.clientX, dx: 0, moved: false, armed: false };
  });
  nav.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(drag.dx) < MIN) return;
      drag.moved = true;
      stop();
      try { nav.setPointerCapture(e.pointerId); } catch { /* segue sem captura */ }
      nav.classList.add('dragging');
    }
    // arrastar para a esquerda vai para a aba da direita (como virar a página); nas pontas não passa
    const dir = -Math.sign(drag.dx), next = current + dir;
    const reach = Math.min(1, Math.abs(drag.dx) / (NEXT * 1.8));
    focus = items.map(() => 0);
    if (dir && next >= 0 && next < n) {
      side = dir;
      focus[current] = 1 - reach; focus[next] = reach;
      const armed = Math.abs(drag.dx) >= NEXT;
      if (armed && !drag.armed) onStep();
      drag.armed = armed;
    } else {
      focus[current] = 1;
      drag.armed = false;
    }
    paint();
  });
  const release = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.moved) return;
    nav.classList.remove('dragging');
    swallow = true;
    setTimeout(() => { swallow = false; }, 50);
    const next = current - Math.sign(d.dx);
    if (e.type === 'pointerup' && d.armed && next >= 0 && next < n) {
      side = -Math.sign(d.dx);
      current = next;
      mark(next);
      animate();
      onPick(items[next][0]);
    } else animate();
  };
  nav.addEventListener('pointerup', release);
  nav.addEventListener('pointercancel', release);
  /* o fim de um arrasto não conta como toque em um botão */
  nav.addEventListener('click', e => { if (swallow) { e.preventDefault(); e.stopPropagation(); } }, true);
  window.addEventListener('resize', paint);

  return { select };
};
