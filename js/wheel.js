/* NOX: barra de navegação giratória. A aba atual fica no centro, maior; arrastar ou tocar gira a roda. */
const Wheel = ({ nav, items, onPick, onStep }) => {
  const n = items.length, half = n / 2;
  const mod = i => ((i % n) + n) % n;
  /* distância circular de cada item até o centro, entre -2,5 e 2,5 */
  const offset = (i, pos) => mod(i - pos + half) - half;
  let pos = 0, goal = 0, frame = 0, drag = null, swallow = false, started = false;

  nav.innerHTML = items.map(([id, label, ic]) => `<button data-act="tab" data-v="${id}" aria-label="${label}"><span class="orbit"><i class="halo"></i>${icon(ic)}</span><span class="label">${label}</span></button>`).join('');
  const buttons = [...nav.children];
  const space = () => (nav.clientWidth - 12) / (n + .2);

  const paint = () => {
    const s = space();
    buttons.forEach((b, i) => {
      const d = offset(i, pos), far = Math.abs(d), f = Math.max(0, 1 - far);
      // o item central empurra os vizinhos; os das pontas descem, como numa roda
      const x = d * s + Math.max(-1, Math.min(1, d)) * s * .1;
      b.style.width = `${s}px`;
      b.style.transform = `translate3d(${(x - s / 2).toFixed(1)}px, ${(d * d * 1.3).toFixed(1)}px, 0) rotate(${(d * 4).toFixed(2)}deg)`;
      b.style.opacity = far > 2 ? Math.max(0, 1 - (far - 2) * 2).toFixed(2) : 1;
      b.style.zIndex = Math.round(10 - far * 2);
      b.style.setProperty('--f', f.toFixed(3));
      b.style.setProperty('--spin', `${(f * (d < 0 ? -360 : 360)).toFixed(1)}deg`);
    });
  };

  const stop = () => { cancelAnimationFrame(frame); frame = 0; };
  const land = () => {
    const b = buttons[mod(Math.round(pos))];
    b.classList.remove('land'); void b.offsetWidth; b.classList.add('land');
  };
  /* gira até a posição pedida, passando um pouco do ponto e voltando */
  const spin = to => {
    stop();
    goal = to;
    const from = pos, dist = to - from;
    if (!dist) return paint();
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { pos = to; return paint(); }
    const duration = 380 + Math.min(3, Math.abs(dist)) * 80;
    let begin = null;
    const step = now => {
      begin = begin ?? now;
      const t = Math.min(1, (now - begin) / duration), u = t - 1, e = 1 + 2.1 * u * u * u + 1.1 * u * u;
      pos = from + dist * e;
      paint();
      if (t < 1) frame = requestAnimationFrame(step);
      else { pos = to; frame = 0; paint(); land(); }
    };
    frame = requestAnimationFrame(step);
  };

  const mark = index => buttons.forEach((b, i) => {
    b.classList.toggle('on', i === index);
    b.setAttribute('aria-current', i === index ? 'page' : 'false');
  });

  /* escolhe uma aba pelo caminho mais curto da roda */
  const select = index => {
    mark(index);
    if (!started) { started = true; pos = goal = index; return paint(); }
    if (drag?.moved || mod(goal) === index) return;
    spin(pos + offset(index, pos));
  };

  nav.addEventListener('pointerdown', e => {
    if (drag || e.button > 0) return;
    swallow = false;
    drag = { id: e.pointerId, x: e.clientX, from: pos, moved: false, last: pos, time: e.timeStamp, speed: 0, step: Math.round(pos) };
  });
  nav.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 8) return;
      drag.moved = true;
      stop();
      drag.from = pos + dx / space();
      try { nav.setPointerCapture(e.pointerId); } catch { /* segue sem captura */ }
      nav.classList.add('dragging');
    }
    pos = drag.from - dx / space();
    const dt = e.timeStamp - drag.time;
    if (dt > 0) drag.speed = (pos - drag.last) / dt;
    drag.last = pos; drag.time = e.timeStamp;
    if (Math.round(pos) !== drag.step) { drag.step = Math.round(pos); onStep(); }
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
    // um empurrão rápido leva a roda um pouco mais longe
    const fling = e.type === 'pointerup' && e.timeStamp - d.time < 80 ? Math.max(-1.5, Math.min(1.5, d.speed * 140)) : 0;
    const to = Math.round(pos + fling);
    spin(to);
    mark(mod(to));
    onPick(items[mod(to)][0]);
  };
  nav.addEventListener('pointerup', release);
  nav.addEventListener('pointercancel', release);
  /* o fim de um arrasto não conta como toque em um botão */
  nav.addEventListener('click', e => { if (swallow) { e.preventDefault(); e.stopPropagation(); } }, true);
  window.addEventListener('resize', paint);

  return { select };
};
