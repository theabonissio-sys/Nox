/* NOX: interface */
(() => {
  'use strict';
  const L = Logic;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (s, o = { day: 'numeric', month: 'long', year: 'numeric' }) => L.parse(s).toLocaleDateString('pt-BR', o);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const num = n => n.toLocaleString('pt-BR');
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const QUALITY = ['Muito ruim', 'Ruim', 'Regular', 'Boa', 'Ótima'];
  const TABS = [['inicio', 'Início', 'home'], ['calendario', 'Calendário', 'calendar'], ['progresso', 'Progresso', 'chart'], ['conquistas', 'Conquistas', 'trophy'], ['config', 'Ajustes', 'gear']];

  const S = {
    records: [], rewards: [], settings: L.cleanSettings(), session: null, tab: 'inicio', day: L.today(),
    calMonth: L.monthKey(L.today()), progMonth: L.monthKey(L.today()), period: '7', achTab: 'missoes', installEvt: null,
  };

  const record = date => S.records.find(r => r.date === date);
  const reward = id => S.rewards.find(r => r.id === id);
  const level = () => L.levelInfo(L.totalXp(S.rewards));

  /* ---------- componentes ---------- */
  const bar = (pct, cls = '') => `<div class="bar ${cls}" role="progressbar" aria-valuenow="${Math.round(pct * 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.min(100, pct * 100)}%"></i></div>`;
  const seg = (name, opts, cur) => `<div class="seg" role="tablist">${opts.map(([v, t]) => `<button role="tab" aria-selected="${v === cur}" class="${v === cur ? 'on' : ''}" data-act="${name}" data-v="${v}">${t}</button>`).join('')}</div>`;
  const header = (title, sub) => `<header class="top"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div></header>`;
  const empty = (ic, title, text, btn = true) => `<div class="card empty">${icon(ic)}<h3>${title}</h3><p>${text}</p>${btn ? '<button class="btn primary" data-act="register">Registrar sono</button>' : ''}</div>`;

  const ring = (pct, inner) => {
    const C = 2 * Math.PI * 88, off = C * (1 - Math.min(1, pct));
    return `<div class="ring"><svg viewBox="0 0 200 200" aria-hidden="true"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#5b7cfa"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
      <circle class="track" cx="100" cy="100" r="88"/>${pct > 0 ? `<circle class="fill" cx="100" cy="100" r="88" stroke="url(#rg)" stroke-dasharray="${C}" stroke-dashoffset="${off}" style="--c:${C}"/>` : ''}</svg><div class="ring-in">${inner}</div></div>`;
  };

  const levelCard = () => {
    const l = level(), xp = L.totalXp(S.rewards);
    return `<section class="card level"><div class="lvl-badge"><small>NÍVEL</small><b>${l.level}</b></div><div class="grow">
      <div class="row between"><h3>${l.name}</h3><span class="xp">${num(xp)} XP</span></div>${bar(l.pct, 'xpbar')}
      <p class="muted">Faltam ${num(l.remaining)} XP para o nível ${l.level + 1} (${num(l.next)} XP)</p></div></section>`;
  };

  const message = (rec, isRecent) => {
    if (!rec) return 'Cada noite anotada ajuda você a se conhecer melhor.';
    if (!isRecent) return 'Que bom ter você aqui. Quando quiser, anote sua noite mais recente.';
    const p = rec.minutes / rec.goal;
    if (p >= 1) return 'Meta alcançada. Seu descanso agradece.';
    if (p >= .85) return 'Você chegou bem perto da meta. Siga no seu ritmo.';
    if (p >= .6) return 'Noite anotada. Observar o padrão é o primeiro passo.';
    return 'Noites curtas acontecem. Se puder, reserve um tempo a mais para descansar hoje.';
  };

  /* ---------- telas ---------- */
  const views = {
    inicio() {
      const t = L.today(), h = new Date().getHours();
      const hello = h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
      const last = [...S.records].sort((a, b) => b.date.localeCompare(a.date))[0];
      const pct = last ? last.minutes / last.goal : 0;
      const when = !last ? '' : last.date === t ? 'Noite de hoje' : last.date === L.addDays(t, -1) ? 'Noite de ontem' : fmtDate(last.date, { day: 'numeric', month: 'long' });
      const week = L.weekDays(t), wr = week.map(record).filter(Boolean);
      const scale = Math.max(S.settings.goal, ...wr.map(r => r.minutes));
      const daily = L.missionsFor(S.records, 'daily', t);
      return `
      <header class="top"><div><p class="date">${cap(fmtDate(t, { weekday: 'long', day: 'numeric', month: 'long' }))}</p>
        <h1>${hello}${S.settings.name ? `, ${esc(S.settings.name)}` : ''}</h1></div><span class="brand">NOX</span></header>
      ${sleepCard()}
      <section class="card hero">
        <p class="eyebrow">SEU SONO${when ? ` · ${when}` : ''}</p>
        ${ring(pct, last ? `<strong>${L.fmtDur(last.minutes)}</strong><span>Meta: ${L.fmtDur(last.goal)}</span><em>${Math.round(pct * 100)}%</em>`
          : `<strong>—</strong><span>Meta: ${L.fmtDur(S.settings.goal)}</span><em>Sem registros</em>`)}
        <p class="msg">${message(last, last && last.date >= L.addDays(t, -1))}</p>
        <button class="btn primary block" data-act="register">${icon('plus')} REGISTRAR SONO</button>
        ${S.session ? '' : `<button class="btn ghost block" data-act="sleep-start">${icon('moon')} Vou dormir</button>`}
      </section>
      ${levelCard()}
      <section class="card"><div class="row between"><h3>Sua semana</h3><span class="muted">${wr.length ? `Média ${L.fmtDur(L.stats(wr).avg)}` : 'Sem registros'}</span></div>
        <div class="week">${week.map(d => {
          const r = record(d);
          return `<button data-act="day" data-v="${d}" ${d > t ? 'disabled' : ''} class="${d === t ? 'is-today' : ''}" aria-label="${fmtDate(d)}: ${r ? L.fmtDur(r.minutes) : 'sem registro'}">
            <span class="col"><i class="${r ? (L.met(r) ? 'met' : 'low') : ''}" style="height:${r ? Math.max(8, r.minutes / scale * 100) : 6}%"></i></span><small>${'DSTQQSS'[L.parse(d).getDay()]}</small></button>`;
        }).join('')}</div></section>
      <section class="card"><div class="row between"><h3>Missões de hoje</h3><button class="link" data-act="goto-missions">Ver todas</button></div>
        ${daily.map(m => {
          const done = m.done || !!reward(m.rewardId);
          return `<div class="mini ${done ? 'done' : ''}"><span class="check">${done ? icon('check') : ''}</span><div class="grow"><b>${m.name}</b><small>${m.desc}</small></div><span class="xp">+${m.xp} XP</span></div>`;
        }).join('')}</section>`;
    },

    calendario() {
      const k = S.calMonth, t = L.today(), days = L.monthDays(k);
      const mr = days.map(record).filter(Boolean);
      return `${header('Calendário', 'Toque em um dia para ver ou registrar')}
      <section class="card">
        <div class="month-nav"><button class="icon-btn" data-act="cal-prev" aria-label="Mês anterior">${icon('left')}</button>
          <h3>${cap(fmtDate(`${k}-01`, { month: 'long', year: 'numeric' }))}</h3>
          <button class="icon-btn" data-act="cal-next" aria-label="Próximo mês" ${k >= L.monthKey(t) ? 'disabled' : ''}>${icon('right')}</button></div>
        <div class="grid cal-head">${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => `<span>${d}</span>`).join('')}</div>
        <div class="grid cal">${'<span></span>'.repeat(L.parse(days[0]).getDay())}${days.map(d => {
          const r = record(d), st = r ? (L.met(r) ? 'met' : 'low') : 'none';
          const label = { met: 'meta atingida', low: 'abaixo da meta', none: 'sem registro' }[st];
          return `<button class="${st} ${d === t ? 'is-today' : ''}" data-act="day" data-v="${d}" ${d > t ? 'disabled' : ''} aria-label="${fmtDate(d)}, ${label}"><b>${Number(d.slice(8))}</b><i></i></button>`;
        }).join('')}</div>
        <div class="legend"><span><i class="met"></i>Meta atingida</span><span><i class="low"></i>Abaixo da meta</span><span><i></i>Sem registro</span></div>
      </section>
      <section class="stats">${stat('Noites no mês', mr.length)}${stat('Na meta', mr.filter(L.met).length)}${stat('Média do mês', mr.length ? L.fmtDur(L.stats(mr).avg) : '—')}${stat('Meta atual', L.fmtDur(S.settings.goal))}</section>`;
    },

    progresso() {
      const t = L.today();
      const days = S.period === 'mes' ? L.monthDays(S.progMonth) : Array.from({ length: Number(S.period) }, (_, i) => L.addDays(t, i - Number(S.period) + 1));
      const pr = days.map(record).filter(Boolean), ps = L.stats(pr), g = L.stats(S.records);
      const label = S.period === 'mes' ? cap(fmtDate(`${S.progMonth}-01`, { month: 'long', year: 'numeric' })) : `Últimos ${S.period} dias`;
      return `${header('Progresso', 'Sua evolução ao longo do tempo')}
      ${seg('period', [['7', '7 dias'], ['30', '30 dias'], ['mes', 'Mensal']], S.period)}
      <section class="card">
        ${S.period === 'mes' ? `<div class="month-nav"><button class="icon-btn" data-act="prog-prev" aria-label="Mês anterior">${icon('left')}</button><h3>${label}</h3><button class="icon-btn" data-act="prog-next" aria-label="Próximo mês" ${S.progMonth >= L.monthKey(t) ? 'disabled' : ''}>${icon('right')}</button></div>`
          : `<h3>${label}</h3>`}
        ${pr.length ? `<div class="row between period"><div><small>Média</small><b>${L.fmtDur(ps.avg)}</b></div><div><small>Noites</small><b>${ps.count}</b></div><div><small>Na meta</small><b>${ps.metCount} de ${ps.count}</b></div></div>
          ${chart(days)}<p class="readout" id="readout" aria-live="polite">Toque em uma barra para ver os detalhes</p>
          <div class="legend"><span><i class="met"></i>Meta atingida</span><span><i class="low"></i>Abaixo</span><span><i class="line"></i>Meta atual</span></div>`
          : '<div class="empty small"><p>Nenhum registro neste período.</p><button class="btn ghost" data-act="register">Registrar sono</button></div>'}
      </section>
      <h2>Estatísticas gerais</h2>
      ${g.count ? `<section class="stats">${stat('Média de sono', L.fmtDur(g.avg))}${stat('Maior duração', L.fmtDur(g.max.minutes), fmtDate(g.max.date, { day: '2-digit', month: 'short' }))}
        ${stat('Total dormido', L.fmtDur(g.total))}${stat('Noites registradas', g.count)}${stat('Dias na meta', `${g.metPct}%`, `${g.metCount} de ${plural(g.count, 'noite', 'noites')}`)}${stat('Maior sequência', plural(g.streak, 'dia', 'dias'))}</section>
        ${g.count < 7 ? '<p class="note">Com poucos registros, estes números ainda mudam bastante. Depois de 7 noites o retrato fica mais fiel.</p>' : ''}`
        : empty('chart', 'Ainda sem estatísticas', 'Elas aparecem assim que você registrar sua primeira noite.', false)}`;
    },

    conquistas() {
      let body = '';
      if (S.achTab === 'missoes') {
        const t = L.today(), left = n => n === 0 ? 'Renova amanhã' : `Renova em ${n + 1} dias`;
        const ends = { daily: 0, weekly: 6 - L.parse(t).getDay(), monthly: L.daysInMonth(L.monthKey(t)) - Number(t.slice(8)) };
        body = [['daily', 'Diárias'], ['weekly', 'Semanais'], ['monthly', 'Mensais']].map(([type, title]) => `
          <div class="row between group"><h2>${title}</h2><span class="muted">${left(ends[type])}</span></div>
          ${L.missionsFor(S.records, type, t).map(m => {
            const done = m.done || !!reward(m.rewardId), p = done ? m.target : m.progress;
            return `<article class="card mission ${done ? 'done' : ''}"><div class="row between"><h3>${m.name}</h3><span class="xp">+${m.xp} XP</span></div>
              <p class="muted">${m.desc}</p>${bar(p / m.target)}<div class="row between"><span class="state">${done ? `${icon('check')} Concluída` : 'Em andamento'}</span><span class="muted">${p}/${m.target}</span></div>
              ${done ? `<button class="btn ghost small" data-act="share-mission" data-v="${m.rewardId}">${icon('share')} Compartilhar</button>` : ''}</article>`;
          }).join('')}`).join('') + '<p class="note">Dormir além da meta não rende pontos extras, e noites abaixo dela nunca tiram XP.</p>';
      } else if (S.achTab === 'medalhas') {
        const n = L.MEDALS.filter(m => reward(`a:${m.id}`)).length;
        body = `<p class="muted center">${n} de ${L.MEDALS.length} medalhas desbloqueadas</p><div class="medals">${L.MEDALS.map(m => {
          const r = reward(`a:${m.id}`), p = Math.min(m.target, m.count(S.records));
          return `<article class="card medal-card ${r ? '' : 'locked'}"><button class="medal-open" data-act="medal" data-v="${m.id}">${medal(m, !!r)}<h3>${m.name}</h3><p>${m.desc}</p>
            <small>${r ? `Desbloqueada em ${fmtDate(r.date, { day: '2-digit', month: '2-digit', year: 'numeric' })}` : `Bloqueada · ${p}/${m.target}`}</small></button>
            ${r ? `<button class="btn ghost small" data-act="share-medal" data-v="${m.id}">${icon('share')} Compartilhar</button>` : bar(p / m.target)}</article>`;
        }).join('')}</div>`;
      } else {
        const list = personalRecords();
        body = list.length ? list.map((r, i) => `<article class="card record-row"><span class="stat-ico">${icon(r.iconName)}</span><div class="grow"><small>${r.title}</small><b>${r.value}</b><small>${r.sub}</small></div>
          <button class="icon-btn" data-act="share-record" data-v="${i}" aria-label="Compartilhar ${r.title}">${icon('share')}</button></article>`).join('')
          : empty('star', 'Seus recordes vão aparecer aqui', 'Registre sua primeira noite para começar.');
      }
      return `${header('Conquistas', 'Sua evolução pessoal')}${levelCard()}${seg('ach', [['missoes', 'Missões'], ['medalhas', 'Medalhas'], ['recordes', 'Recordes']], S.achTab)}${body}`;
    },

    config() {
      const s = S.settings;
      return `${header('Configurações')}
      <section class="card form"><h3>Perfil e meta</h3>
        <label>Como quer ser chamado?<input id="set-name" maxlength="30" value="${esc(s.name)}" placeholder="Seu nome (opcional)" autocomplete="off"></label>
        ${ageField(s.age)}${goalField(s.goal, s.age)}
        <p class="note">A nova meta vale para os próximos registros. Noites já salvas mantêm a meta da época.</p></section>
      <section class="card form"><h3>Modo Vou dormir</h3>
        <div class="goal"><span>Tempo para pegar no sono</span><div class="stepper">
          <button type="button" class="icon-btn" data-act="latency" data-v="-5" aria-label="Diminuir 5 minutos">${icon('minus')}</button><b>${s.latency} min</b>
          <button type="button" class="icon-btn" data-act="latency" data-v="5" aria-label="Aumentar 5 minutos">${icon('plus')}</button></div><small>Esse tempo é descontado do cronômetro.</small></div>
        ${notifyState()}</section>
      <section class="card"><h3>Aparência</h3>${seg('theme', [['dark', 'Escuro'], ['light', 'Claro']], s.theme)}</section>
      ${S.installEvt ? `<section class="card"><h3>Instalar</h3><p class="muted">Coloque o NOX na tela inicial e use offline.</p><button class="btn primary block" data-act="install">${icon('download')} Instalar aplicativo</button></section>` : ''}
      <section class="card"><h3>Backup</h3><p class="muted">Seus dados ficam só neste aparelho. Exporte um arquivo de vez em quando para não perdê-los.</p>
        <button class="btn ghost block" data-act="export">${icon('download')} Exportar registros</button>
        <button class="btn ghost block" data-act="import">${icon('upload')} Importar backup</button>
        <input type="file" id="file" accept=".json,application/json" hidden></section>
      <section class="card about"><h3>Sobre o NOX</h3><p class="muted">Rastreador pessoal de sono, progresso e conquistas. Versão 1.0.</p>
        <p class="muted">${icon('shield')} Sem conta, sem servidor e sem rastreamento. Funciona offline depois de instalado.</p>
        <p class="muted">As sugestões de meta seguem as faixas da National Sleep Foundation. O NOX não é um dispositivo médico; se o sono estiver preocupando você, converse com um profissional de saúde.</p></section>
      <button class="btn danger block" data-act="wipe">${icon('trash')} Apagar todos os dados</button>`;
    },
  };

  /* ---------- modo "Vou dormir" ---------- */
  const timerText = ms => { const t = Math.floor(ms / 1000), p = n => String(n).padStart(2, '0'); return `${p(Math.floor(t / 3600))}:${p(Math.floor(t / 60) % 60)}:${p(t % 60)}`; };
  const canNotify = () => 'Notification' in window && 'serviceWorker' in navigator && !!document.querySelector('link[rel=manifest]');

  const sleepCard = () => {
    const s = S.session;
    if (!s) return '';
    const sum = L.sessionSummary(s);
    if (s.status === 'ended') return `<section class="card sleep"><p class="eyebrow">NOITE PRONTA PARA SALVAR</p><h2>${L.fmtDur(sum.minutes)} de sono</h2><p class="muted">Das ${sum.bed} às ${sum.wake}</p>
      <button class="btn primary block" data-act="sleep-review">Conferir e salvar</button><button class="btn ghost block" data-act="sleep-undo">Continuar o cronômetro</button><button class="link" data-act="sleep-cancel">Descartar</button></section>`;
    const awake = s.status === 'awake';
    return `<section class="card sleep"><p class="eyebrow">${awake ? 'ACORDADO NO MEIO DA NOITE' : 'CRONÔMETRO DE SONO'}</p>
      <strong class="timer" id="timer" role="timer">${timerText(sum.elapsed)}</strong>
      <p class="muted">Começou às ${sum.bed}${sum.awake ? ` · ${sum.awake} min acordado` : ''}</p>
      <button class="btn primary block" data-act="sleep-wake">${awake ? 'Levantei' : 'Acordei'}</button>
      <button class="btn ghost block" data-act="${awake ? 'sleep-resume' : 'sleep-pause'}">${awake ? 'Voltei a dormir' : 'Acordei no meio da noite'}</button>
      <button class="link" data-act="sleep-cancel">Cancelar cronômetro</button>
      ${canNotify() && Notification.permission === 'granted' ? '' : '<p class="note">Sem notificação nesta tela. O cronômetro continua contando; abra o NOX quando acordar.</p>'}</section>`;
  };

  const notifyState = () => {
    if (!canNotify()) return '<p class="note">As notificações funcionam no app instalado pelo site.</p>';
    if (Notification.permission === 'granted') return '<p class="note">Notificações ativadas.</p>';
    if (Notification.permission === 'denied') return '<p class="note warn">Notificações bloqueadas. Libere nas configurações do site no navegador.</p>';
    return '<button class="btn ghost block" data-act="notify">Ativar notificações</button>';
  };

  /* mostra, atualiza ou remove a notificação conforme a sessão */
  const syncNotice = async () => {
    if (!canNotify() || Notification.permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker.ready;
      if (S.session && S.session.status !== 'ended') {
        const n = L.sessionNotice(S.session);
        await reg.showNotification(n.title, n.options);
      } else (await reg.getNotifications({ tag: 'nox-sleep' })).forEach(x => x.close());
    } catch { /* o cronômetro funciona mesmo sem notificação */ }
  };

  const changeSession = async fn => {
    try { S.session = await DB.updateSession(fn); }
    catch { toast('Não foi possível salvar o cronômetro.', 'bad'); return false; }
    render(); syncNotice(); return true;
  };

  const startSleep = async () => {
    // o pedido de permissão precisa sair direto do toque
    if (canNotify() && Notification.permission === 'default') await Notification.requestPermission();
    if (await changeSession(cur => cur || L.startSession(S.settings.latency))) {
      toast(canNotify() && Notification.permission === 'granted' ? 'Cronômetro ligado. Boa noite!' : 'Cronômetro ligado sem notificação. Abra o NOX ao acordar.', 'ok');
    }
  };

  const reviewSleep = () => {
    const s = S.session;
    if (!s || s.status !== 'ended') return;
    const sum = L.sessionSummary(s);
    if (sum.total < 30) {
      openSheet(`<h2>Foi bem rápido</h2><p class="muted">O cronômetro marcou ${sum.total} min. Quer descartar?</p>
        <button class="btn primary block" data-act="sleep-undo">Continuar dormindo</button>
        <button class="btn ghost block" data-act="sleep-form">Registrar mesmo assim</button>
        <button class="btn danger block" data-act="sleep-discard">Descartar cronômetro</button>`);
    } else openForm(sum.date, 'new', sum, sum);
  };

  const askAwake = () => {
    const s = S.session;
    if (!s || s.status !== 'sleeping' || L.sessionSummary(s).total < 30) return;
    openSheet(`<h2>Você acordou?</h2><p class="muted">O cronômetro está ligado desde ${L.clock(s.start)}.</p>
      <button class="btn primary block" data-act="sleep-wake">Acordei</button>
      <button class="btn ghost block" data-act="close">Só olhei o celular</button>
      <button class="btn ghost block" data-act="sleep-pause">Fiquei acordado no meio da noite</button>`);
  };

  const attend = () => {
    if (!S.settings.onboarded || !$('#sheet').hidden || !$('#party').hidden) return;
    if (S.session?.status === 'ended') reviewSleep(); else askAwake();
  };

  const stat = (label, value, sub = '') => `<div class="card stat"><small>${label}</small><b>${value}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;

  const chart = days => {
    const W = 340, H = 200, x0 = 26, y0 = 8, ph = 164, pw = W - x0 - 2;
    const goal = S.settings.goal;
    const top = Math.ceil(Math.max(goal + 60, ...days.map(d => record(d)?.minutes || 0)) / 180) * 180;
    const y = m => y0 + ph - m / top * ph, step = pw / days.length, bw = Math.min(26, step * .66);
    let out = '';
    for (let m = 0; m <= top; m += 180) out += `<line class="gridline" x1="${x0}" x2="${W}" y1="${y(m)}" y2="${y(m)}"/><text x="0" y="${y(m) + 3}">${m / 60}h</text>`;
    days.forEach((d, i) => {
      const r = record(d), cx = x0 + step * i + step / 2;
      if (r) out += `<rect class="b ${L.met(r) ? 'met' : 'low'}" x="${cx - bw / 2}" y="${y(r.minutes)}" width="${bw}" height="${y(0) - y(r.minutes)}" rx="${Math.min(5, bw / 2)}" style="animation-delay:${i * (days.length > 7 ? 12 : 50)}ms"/>`;
      const show = days.length <= 7 || (S.period === 'mes' ? i % 5 === 0 : (days.length - 1 - i) % 5 === 0);
      if (show) out += `<text text-anchor="middle" x="${cx}" y="${H - 6}">${days.length <= 7 ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][L.parse(d).getDay()] : Number(d.slice(8))}</text>`;
      const tip = `${fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' })}: ${r ? `${L.fmtDur(r.minutes)} (meta ${L.fmtDur(r.goal)})` : 'sem registro'}`;
      out += `<rect class="hit" data-tip="${tip}" x="${x0 + step * i}" y="${y0}" width="${step}" height="${ph}"/>`;
    });
    out += `<line class="goal" x1="${x0}" x2="${W}" y1="${y(goal)}" y2="${y(goal)}"/><text class="goal-t" text-anchor="end" x="${W}" y="${y(goal) - 5}">Meta ${L.fmtDur(goal)}</text>`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de horas dormidas por dia, com linha da meta"><defs>
      <linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#3b82f6"/></linearGradient>
      <linearGradient id="gl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#6d28d9"/></linearGradient></defs>${out}</svg>`;
  };

  const medal = (m, on) => `<span class="medal ${on ? 'on' : ''}" style="--a:${m.colors[0]};--b:${m.colors[1]}">${icon(m.icon)}${on ? '' : `<span class="lock">${icon('lock')}</span>`}</span>`;

  const personalRecords = () => {
    const g = L.stats(S.records);
    if (!g.count) return [];
    return [
      { title: 'Noite mais longa', value: L.fmtDur(g.max.minutes), sub: fmtDate(g.max.date), iconName: 'moon', date: g.max.date },
      { title: 'Maior sequência de registros', value: plural(g.streak, 'dia', 'dias'), sub: 'seguidos', iconName: 'bolt', date: L.today() },
      { title: 'Noites registradas', value: plural(g.count, 'noite', 'noites'), sub: `${L.fmtDur(g.total)} de sono no total`, iconName: 'star', date: L.today() },
    ];
  };

  const ageField = cur => `<label>Faixa etária<select id="set-age">${L.AGES.map(a => `<option value="${a.id}" ${a.id === cur ? 'selected' : ''}>${a.label}</option>`).join('')}</select></label>`;
  const goalNote = (goal, ageId) => {
    const a = L.age(ageId), range = `${a.min / 60} a ${a.max / 60} horas`;
    if (goal < a.min) return `<span class="warn">Abaixo do recomendado para sua faixa (${range}).</span>`;
    if (goal > a.max) return `Acima da faixa usual de ${range}.`;
    return `Dentro do recomendado: ${range}.`;
  };
  const goalField = (goal, ageId) => `<div class="goal"><span>Meta diária de sono</span><div class="stepper">
    <button type="button" class="icon-btn" data-act="goal" data-v="-15" aria-label="Diminuir 15 minutos">${icon('minus')}</button><b id="goal-val" data-goal="${goal}">${L.fmtDur(goal)}</b>
    <button type="button" class="icon-btn" data-act="goal" data-v="15" aria-label="Aumentar 15 minutos">${icon('plus')}</button></div><small id="goal-note">${goalNote(goal, ageId)}</small></div>`;

  /* ---------- renderização ---------- */
  const render = (animate = false) => {
    const view = $('#view'), y = window.scrollY;
    view.classList.toggle('enter', animate);
    view.classList.toggle('still', !animate);
    view.innerHTML = views[S.tab]();
    $$('#nav button').forEach(b => { const on = b.dataset.v === S.tab; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    $('#nav').style.setProperty('--i', TABS.findIndex(t => t[0] === S.tab));
    window.scrollTo(0, animate ? 0 : y);
    const f = $('#file');
    if (f) f.onchange = () => { if (f.files[0]) importFile(f.files[0]); f.value = ''; };
  };
  const remember = url => { try { history.replaceState(history.state, '', url); } catch { /* visualização sem histórico */ } };
  const go = tab => { if (tab === S.tab) return window.scrollTo({ top: 0, behavior: 'smooth' }); S.tab = tab; remember(`#${tab}`); render(true); };

  const applyTheme = () => {
    document.documentElement.dataset.theme = S.settings.theme;
    const meta = $('meta[name=theme-color]');
    if (meta) meta.content = S.settings.theme === 'light' ? '#eef0fa' : '#070a18';
  };

  /* ---------- folhas (modais) e avisos ---------- */
  let sheetClose = null;
  const openSheet = (html, onClose) => {
    const had = !!sheetClose;
    if (had) { const f = sheetClose; sheetClose = null; f(); }
    const el = $('#sheet');
    el.innerHTML = `<div class="scrim" data-act="close"></div><div class="panel" role="dialog" aria-modal="true" tabindex="-1"><button class="icon-btn x" data-act="close" aria-label="Fechar">${icon('close')}</button>${html}</div>`;
    el.hidden = false;
    document.body.classList.add('locked');
    sheetClose = onClose || (() => {});
    // botão voltar do Android fecha a folha
    try { if (!history.state?.sheet) history.pushState({ sheet: true }, ''); } catch { /* sem histórico */ }
    $('.panel', el).focus({ preventScroll: true });
    return el;
  };
  const hideSheet = () => {
    if (!sheetClose) return;
    const f = sheetClose; sheetClose = null;
    $('#sheet').hidden = true; $('#sheet').innerHTML = '';
    document.body.classList.remove('locked');
    f();
  };
  const closeSheet = () => { const had = !!sheetClose; hideSheet(); if (had && history.state?.sheet) history.back(); };
  window.addEventListener('popstate', () => { if (!history.state?.sheet) hideSheet(); });

  const ask = ({ title, text, ok = 'Confirmar', cancel = 'Cancelar', danger, word }) => new Promise(resolve => {
    let answer = false;
    const el = openSheet(`<h2>${title}</h2><p class="muted">${text}</p>
      ${word ? `<label>Digite ${word} para confirmar<input id="word" autocomplete="off" autocapitalize="characters"></label>` : ''}
      <button class="btn ${danger ? 'danger' : 'primary'} block" id="ok" ${word ? 'disabled' : ''}>${ok}</button><button class="btn ghost block" data-act="close">${cancel}</button>`,
      () => resolve(answer));
    if (word) $('#word', el).oninput = e => { $('#ok', el).disabled = e.target.value.trim().toUpperCase() !== word; };
    $('#ok', el).onclick = () => { answer = true; closeSheet(); };
  });
  /* espera o histórico voltar antes de abrir outra folha */
  const settle = () => new Promise(r => setTimeout(r, 120));

  let toastTimer;
  const toast = (text, type = '') => {
    const t = $('#toast');
    t.textContent = text; t.className = `show ${type}`;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.className = ''; }, 3600);
  };

  const celebrations = [];
  const nextCelebration = () => {
    const el = $('#party'), c = celebrations[0];
    if (!c) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = `<div class="confetti">${Array.from({ length: 36 }, (_, i) => `<i style="--x:${(i * 53) % 100}%;--d:${(i % 12) * 90}ms;--h:${[190, 225, 262, 290][i % 4]}"></i>`).join('')}</div>
      <div class="party-box" role="alertdialog" aria-label="${c.title}"><p class="eyebrow">${c.kicker}</p>${c.art}<h2>${c.title}</h2><p>${c.text}</p>
      ${c.medalId ? `<button class="btn ghost block" data-act="share-medal" data-v="${c.medalId}">${icon('share')} Compartilhar</button>` : ''}
      <button class="btn primary block" data-act="party-next">Continuar</button></div>`;
  };

  /* ---------- gravação ---------- */
  const saveRecord = async (rec, oldDate, endSession = false) => {
    const records = S.records.filter(r => r.date !== rec.date && r.date !== oldDate).concat(rec);
    const fresh = L.evaluate(records, S.rewards);
    const before = level().level;
    await DB.commit({ put: [rec], remove: oldDate && oldDate !== rec.date ? oldDate : null, rewards: fresh, endSession });
    S.records = records; S.rewards = S.rewards.concat(fresh);
    if (endSession) { S.session = null; syncNotice(); }
    render();
    const gained = L.totalXp(fresh), done = fresh.filter(r => r.kind === 'mission');
    toast(gained ? `Registro salvo · +${gained} XP${done.length ? ` · ${plural(done.length, 'missão concluída', 'missões concluídas')}` : ''}` : 'Registro salvo', 'ok');
    const after = level();
    if (after.level > before) celebrations.push({ kicker: 'VOCÊ SUBIU DE NÍVEL', art: `<span class="lvl-badge big"><small>NÍVEL</small><b>${after.level}</b></span>`, title: after.name, text: `Você acumulou ${num(L.totalXp(S.rewards))} XP.` });
    fresh.filter(r => r.kind === 'medal').forEach(r => {
      const m = L.MEDALS.find(x => x.id === r.ref);
      celebrations.push({ kicker: 'CONQUISTA DESBLOQUEADA', art: medal(m, true), title: m.name, text: `${m.desc} +${m.xp} XP`, medalId: m.id });
    });
    if (celebrations.length) setTimeout(nextCelebration, 450);
  };

  const openForm = (date = L.today(), mode = 'new', draft = null, timer = null) => {
    const found = record(date);
    // vindo do cronômetro, os valores medidos valem; a qualidade já anotada é mantida
    const r = timer ? { ...draft, minutes: timer.total > 960 ? null : timer.minutes, quality: found?.quality } : found || draft || {};
    const replaceText = d => record(d) ? `Já existe um registro nesta data (${L.fmtDur(record(d).minutes)}). Salvar vai substituí-lo.` : '';
    const editing = mode === 'edit';
    const original = editing ? date : null;
    const el = openSheet(`<h2>${timer ? 'Confira sua noite' : found ? 'Editar noite' : 'Registrar sono'}</h2>
      ${timer ? `<p class="banner">Cronômetro: ${L.fmtDur(timer.total)}, menos ${timer.latency} min para pegar no sono${timer.awake ? ` e ${timer.awake} min acordado` : ''}. Ajuste se precisar.</p>
        ${timer.total > 960 ? '<p class="banner">O cronômetro passou de 16 horas. Corrija o horário em que você acordou.</p>' : ''}<p class="banner" id="replace" ${found ? '' : 'hidden'}>${replaceText(date)}</p>`
        : found && !editing ? '<p class="banner">Já existe um registro nesta data. Você está editando esse registro.</p>' : ''}
      <form class="form" novalidate>
        <label>Data em que você acordou<input type="date" name="date" value="${date}" max="${L.today()}" required></label>
        <div class="two"><label>Horas dormidas<input type="number" name="h" inputmode="numeric" min="0" max="24" placeholder="7" value="${r.minutes != null ? Math.floor(r.minutes / 60) : ''}"></label>
        <label>Minutos adicionais<input type="number" name="m" inputmode="numeric" min="0" max="59" placeholder="30" value="${r.minutes != null ? r.minutes % 60 : ''}"></label></div>
        <div class="two"><label>Fui dormir <em>opcional</em><input type="time" name="bed" value="${r.bed || ''}"></label>
        <label>Acordei <em>opcional</em><input type="time" name="wake" value="${r.wake || ''}"></label></div>
        <button type="button" class="link" id="calc" hidden></button>
        <fieldset><legend>Qualidade do sono <em>opcional</em></legend><div class="quality">${QUALITY.map((q, i) => `<button type="button" data-q="${i + 1}" class="${r.quality === i + 1 ? 'on' : ''}" aria-pressed="${r.quality === i + 1}"><b>${i + 1}</b><small>${q}</small></button>`).join('')}</div></fieldset>
        <p class="error" role="alert"></p>
        <button class="btn primary block" type="submit">SALVAR REGISTRO</button>
        ${timer ? '<button class="btn ghost block" type="button" data-act="sleep-undo">Ainda não acordei</button><button class="btn danger block" type="button" data-act="sleep-discard">Descartar cronômetro</button>'
          : found ? `<button class="btn danger block" type="button" id="del">${icon('trash')} Excluir registro</button>` : ''}
      </form>`);
    const form = $('form', el), f = form.elements;
    let quality = r.quality || 0;
    $$('[data-q]', el).forEach(b => b.onclick = () => {
      quality = quality === Number(b.dataset.q) ? 0 : Number(b.dataset.q);
      $$('[data-q]', el).forEach(x => { const on = Number(x.dataset.q) === quality; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
    });
    const typed = () => ({ minutes: f.h.value === '' && f.m.value === '' ? null : Number(f.h.value) * 60 + Number(f.m.value), bed: f.bed.value, wake: f.wake.value, quality });
    const calc = $('#calc', el);
    const suggest = auto => {
      const d = L.between(f.bed.value, f.wake.value);
      if (d && auto && f.h.value === '' && f.m.value === '') { f.h.value = Math.floor(d / 60); f.m.value = d % 60; }
      calc.hidden = !d || d === typed().minutes;
      if (d) { calc.textContent = `Pelos horários: ${L.fmtDur(d)}. Usar este valor`; calc.dataset.min = d; }
    };
    const recount = () => {
      const d = L.between(f.bed.value, f.wake.value);
      if (!d) return;
      const m = Math.max(0, d - timer.latency - timer.awake);
      f.h.value = Math.floor(m / 60); f.m.value = m % 60;
    };
    f.bed.onchange = f.wake.onchange = timer ? recount : () => suggest(true);
    f.h.oninput = f.m.oninput = timer ? null : () => suggest(false);
    calc.onclick = () => { const d = Number(calc.dataset.min); f.h.value = Math.floor(d / 60); f.m.value = d % 60; calc.hidden = true; };
    f.date.onchange = () => {
      const d = f.date.value;
      if (timer) { const n = $('#replace', el); n.textContent = replaceText(d); n.hidden = !record(d); return; }
      if (!L.validDate(d) || d > L.today() || d === original) return;
      if (record(d)) openForm(d, mode);                 // nunca duplica: abre o que já existe
      else if (!editing && found) openForm(d, 'new');   // data livre: formulário limpo
      else if (!editing) draft = typed();
    };
    let busy = false;
    form.onsubmit = async e => {
      e.preventDefault();
      if (busy) return;
      const err = $('.error', el);
      try {
        const h = Number(f.h.value), m = Number(f.m.value);
        if (f.h.validity.badInput || f.m.validity.badInput || !Number.isInteger(h) || !Number.isInteger(m) || h < 0 || m < 0 || m > 59) throw new Error('Use horas inteiras e minutos de 0 a 59.');
        const d = f.date.value;
        if (!timer && d !== original && record(d) && d !== date) return openForm(d, mode);
        const base = record(original || d);
        const rec = L.cleanRecord({ date: d, minutes: h * 60 + m, goal: base ? base.goal : S.settings.goal, bed: f.bed.value, wake: f.wake.value, quality });
        busy = true;
        closeSheet(); await settle();
        try { await saveRecord(rec, original, !!timer); }
        catch { toast('Não foi possível salvar. Verifique o espaço do aparelho e tente de novo.', 'bad'); }
      } catch (x) { err.textContent = x.message; }
    };
    const del = $('#del', el);
    if (del) del.onclick = async () => {
      closeSheet(); await settle();
      if (!await ask({ title: 'Excluir registro?', text: `A noite de ${fmtDate(date)} sairá do calendário, dos gráficos e das médias. O XP e as medalhas já conquistados continuam com você, e registrar a data de novo não paga duas vezes.`, ok: 'Excluir', danger: true })) return;
      try {
        await DB.commit({ remove: date });
        S.records = S.records.filter(x => x.date !== date);
        render(); toast('Registro excluído', 'ok');
      } catch { toast('Não foi possível excluir.', 'bad'); }
    };
  };

  const openDay = date => {
    const r = record(date);
    const row = (a, b) => `<div class="row between line"><span class="muted">${a}</span><b>${b}</b></div>`;
    openSheet(`<p class="eyebrow">${fmtDate(date, { weekday: 'long' }).toUpperCase()}</p><h2>${fmtDate(date)}</h2>
      ${r ? `<span class="chip ${L.met(r) ? 'met' : 'low'}">${L.met(r) ? 'Meta atingida' : 'Abaixo da meta'}</span>
        ${row('Horas dormidas', L.fmtDur(r.minutes))}${row('Meta diária', L.fmtDur(r.goal))}${bar(r.minutes / r.goal)}
        ${r.quality ? row('Qualidade', QUALITY[r.quality - 1]) : ''}${r.bed ? row('Foi dormir', r.bed) : ''}${r.wake ? row('Acordou', r.wake) : ''}
        <button class="btn primary block" data-act="edit" data-v="${date}">${icon('edit')} Editar registro</button>`
        : `<span class="chip">Sem registro</span>${row('Meta diária', L.fmtDur(S.settings.goal))}<button class="btn primary block" data-act="edit-new" data-v="${date}">${icon('plus')} Registrar esta noite</button>`}`);
  };

  /* ---------- compartilhamento ---------- */
  /* dentro de um visualizador (prévia online) o arquivo é salvo pela API dele */
  const saver = window.claude?.use?.('downloads');
  const download = async (blob, name, okText) => {
    if (saver) {
      try { const d = await saver; if (!d) throw new Error(); await d.save({ filename: name, data: blob }); toast(okText, 'ok'); }
      catch (e) { if (e?.code !== 'declined') toast('Não foi possível baixar nesta visualização.', 'bad'); }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 30000);
    toast(okText, 'ok');
  };
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const t = document.createElement('textarea');
      t.value = text; document.body.append(t); t.select();
      const ok = document.execCommand('copy'); t.remove();
      if (!ok) return toast('Não foi possível copiar.', 'bad');
    }
    toast('Mensagem copiada', 'ok');
  };
  const openShare = async (card, text) => {
    try {
      const canvas = Share.render(card), blob = await Share.toBlob(canvas);
      const file = new File([blob], 'nox-conquista.png', { type: 'image/png' });
      const el = openSheet(`<h2>Compartilhar</h2><img class="share-img" alt="Cartão: ${esc(card.title)}" src="${canvas.toDataURL('image/png')}">
        <button class="btn primary block" id="sh">${icon('share')} Compartilhar</button>
        <div class="two"><button class="btn ghost" id="dl">${icon('download')} Baixar</button><button class="btn ghost" id="cp">${icon('copy')} Copiar texto</button></div>`);
      $('#sh', el).onclick = async () => {
        if (!navigator.canShare?.({ files: [file] })) return toast('Este navegador não compartilha imagens direto. Use "Baixar".', 'bad');
        try { await navigator.share({ files: [file], text }); }
        catch (e) { if (e.name !== 'AbortError') toast('Não deu para compartilhar. Use "Baixar".', 'bad'); }
      };
      $('#dl', el).onclick = () => download(blob, file.name, 'Download iniciado');
      $('#cp', el).onclick = () => copy(text);
    } catch { toast('Não foi possível gerar a imagem.', 'bad'); }
  };
  const shareMedal = id => {
    const m = L.MEDALS.find(x => x.id === id), r = reward(`a:${id}`);
    if (!r) return;
    openShare({ kicker: 'Conquista desbloqueada', title: m.name, desc: m.desc, date: fmtDate(r.date), iconName: m.icon, colors: m.colors },
      `Desbloqueei a medalha "${m.name}" no NOX: ${m.desc}`);
  };

  /* ---------- backup ---------- */
  const exportData = () => {
    const data = { app: 'NOX', version: 1, exportedAt: new Date().toISOString(), settings: S.settings, records: [...S.records].sort((a, b) => a.date.localeCompare(b.date)), rewards: S.rewards };
    download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `nox-backup-${L.today()}.json`, `Backup com ${plural(S.records.length, 'noite', 'noites')} gerado`);
  };
  const importFile = async file => {
    try {
      if (file.size > 5e6) throw new Error('Arquivo grande demais para um backup do NOX.');
      const data = L.parseBackup(await file.text());
      if (!await ask({ title: 'Importar backup?', text: `O arquivo tem ${plural(data.records.length, 'noite', 'noites')}. Os dados atuais deste aparelho (${plural(S.records.length, 'noite', 'noites')}) serão substituídos.`, ok: 'Substituir pelos do arquivo', danger: S.records.length > 0 })) return;
      const rewards = data.rewards.concat(L.evaluate(data.records, data.rewards));
      const settings = { ...data.settings, onboarded: true };
      await DB.commit({ replace: true, put: data.records, rewards, settings });
      Object.assign(S, { records: data.records, rewards, settings });
      applyTheme(); render(); toast('Backup restaurado', 'ok');
    } catch (e) { toast(e.message || 'Não foi possível importar.', 'bad'); }
  };

  /* ---------- configurações ---------- */
  const saveSettings = async patch => {
    const settings = L.cleanSettings({ ...S.settings, ...patch });
    try { await DB.commit({ settings }); S.settings = settings; applyTheme(); return true; }
    catch { toast('Não foi possível salvar a configuração.', 'bad'); return false; }
  };

  /* ---------- primeiro acesso ---------- */
  const SLIDES = [
    ['moon', 'Conheça seu ritmo', 'O NOX acompanha o seu sono e ajuda você a entender os próprios hábitos.'],
    ['calendar', 'Registre suas noites', 'Anote todo dia quantas horas dormiu. Leva poucos segundos.'],
    ['trophy', 'Evolua com o tempo', 'Ganhe XP, cumpra missões, conquiste medalhas e veja sua evolução em gráficos.'],
  ];
  let step = 0, setup = { name: '', age: 'a', goal: 480 };
  const onboard = () => {
    const el = $('#intro');
    el.hidden = false;
    if (step < 3) {
      const [ic, title, text] = SLIDES[step];
      const art = [
        `<div class="orb"><span>${icon(ic)}</span></div>`,
        `<div class="art-card"><small>Esta noite</small><b>7h 30min</b><div class="week">${[60, 78, 52, 90, 70, 96, 82].map((h, i) => `<span class="col"><i class="${h > 75 ? 'met' : 'low'}" style="height:${h}%;animation-delay:${i * 70}ms"></i></span>`).join('')}</div></div>`,
        `<div class="art-medals">${[L.MEDALS[3], L.MEDALS[0], L.MEDALS[4]].map(m => medal(m, true)).join('')}</div>`,
      ][step];
      el.innerHTML = `<div class="intro-top"><span class="brand">NOX</span><button class="link" data-act="skip">Pular</button></div>
        <div class="slide">${art}<h1>${title}</h1><p>${text}</p></div>
        <div class="dots">${SLIDES.map((_, i) => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>
        <button class="btn primary block" data-act="next">${step === 2 ? 'COMEÇAR' : 'Continuar'}</button>`;
    } else {
      el.innerHTML = `<div class="intro-top"><span class="brand">NOX</span></div><div class="slide form left"><h1>Sua meta de sono</h1><p>Sugerimos um valor pela sua idade. Ajuste como preferir.</p>
        <label>Como quer ser chamado?<input id="set-name" maxlength="30" placeholder="Seu nome (opcional)" value="${esc(setup.name)}" autocomplete="off"></label>
        ${ageField(setup.age)}${goalField(setup.goal, setup.age)}</div>
        <button class="btn primary block" data-act="finish">SALVAR E ENTRAR</button>`;
    }
  };

  /* ---------- eventos ---------- */
  const shiftMonth = (k, n) => { const d = L.parse(`${k}-01`); d.setMonth(d.getMonth() + n); return L.monthKey(L.iso(d)); };
  const actions = {
    tab: v => go(v), register: () => openForm(), close: () => closeSheet(),
    day: v => openDay(v), edit: v => openForm(v, 'edit'), 'edit-new': v => openForm(v, 'new'),
    'goto-missions': () => { S.achTab = 'missoes'; go('conquistas'); },
    'cal-prev': () => { S.calMonth = shiftMonth(S.calMonth, -1); render(); },
    'cal-next': () => { S.calMonth = shiftMonth(S.calMonth, 1); render(); },
    'prog-prev': () => { S.progMonth = shiftMonth(S.progMonth, -1); render(); },
    'prog-next': () => { S.progMonth = shiftMonth(S.progMonth, 1); render(); },
    period: v => { S.period = v; render(); }, ach: v => { S.achTab = v; render(); },
    medal: v => {
      const m = L.MEDALS.find(x => x.id === v), r = reward(`a:${v}`), p = Math.min(m.target, m.count(S.records));
      openSheet(`<div class="center ${r ? '' : 'locked'}">${medal(m, !!r)}<h2>${m.name}</h2><p class="muted">${m.desc}</p><p class="xp">+${m.xp} XP</p>
        ${r ? `<p class="muted">Desbloqueada em ${fmtDate(r.date)}</p><button class="btn primary block" data-act="share-medal" data-v="${v}">${icon('share')} Compartilhar</button>` : `${bar(p / m.target)}<p class="muted">Bloqueada · ${p} de ${m.target}</p>`}</div>`);
    },
    'share-medal': v => { celebrations.length = 0; nextCelebration(); shareMedal(v); },
    'share-mission': v => {
      let r = reward(v);
      if (!r) return;
      const m = L.MISSIONS[r.type].find(x => x.id === r.ref);
      openShare({ kicker: 'Missão concluída', title: m.name, desc: m.desc, date: fmtDate(r.date), iconName: 'target', colors: ['#22d3ee', '#6366f1'] }, `Concluí a missão "${m.name}" no NOX: ${m.desc}`);
    },
    'share-record': v => {
      const r = personalRecords()[Number(v)];
      openShare({ kicker: 'Recorde pessoal', title: r.value, desc: r.title, date: fmtDate(r.date), iconName: r.iconName, colors: ['#8b5cf6', '#d946ef'] }, `Meu recorde no NOX. ${r.title}: ${r.value}.`);
    },
    'party-next': () => { celebrations.shift(); nextCelebration(); },
    'sleep-start': startSleep,
    'sleep-wake': async () => { if (await changeSession(s => L.sessionAction(s, 'wake'))) reviewSleep(); },
    'sleep-pause': async () => { closeSheet(); await changeSession(s => L.sessionAction(s, 'pause')); },
    'sleep-resume': () => changeSession(s => L.sessionAction(s, 'resume')),
    'sleep-undo': async () => { closeSheet(); await changeSession(s => L.sessionAction(s, 'undo')); },
    'sleep-review': () => reviewSleep(),
    'sleep-form': () => { const sum = L.sessionSummary(S.session); openForm(sum.date, 'new', sum, sum); },
    'sleep-discard': async () => { closeSheet(); if (await changeSession(() => null)) toast('Cronômetro descartado', 'ok'); },
    'sleep-cancel': async () => {
      if (await ask({ title: 'Descartar o cronômetro?', text: 'Nada será registrado.', ok: 'Descartar', cancel: 'Voltar', danger: true }) && await changeSession(() => null)) toast('Cronômetro descartado', 'ok');
    },
    notify: async () => { await Notification.requestPermission(); render(); syncNotice(); },
    latency: async v => { if (await saveSettings({ latency: S.settings.latency + Number(v) })) render(); },
    theme: async v => { if (await saveSettings({ theme: v })) render(); },
    goal: async v => {
      const el = $('#goal-val'), ageId = $('#set-age').value, lim = L.goalLimits(ageId);
      const g = Math.min(lim.max, Math.max(lim.min, Number(el.dataset.goal) + Number(v)));
      el.dataset.goal = g; el.textContent = L.fmtDur(g); $('#goal-note').innerHTML = goalNote(g, ageId);
      if ($('#intro').hidden) await saveSettings({ goal: g }); else setup.goal = g;
    },
    next: () => { step++; onboard(); }, skip: () => { step = 3; onboard(); },
    finish: async () => {
      if (!await saveSettings({ ...setup, name: $('#set-name').value, onboarded: true })) return;
      $('#intro').hidden = true; render(true);
      navigator.storage?.persist?.().catch(() => {});
    },
    export: exportData, import: () => $('#file').click(),
    install: async () => { const e = S.installEvt; if (!e) return; S.installEvt = null; e.prompt(); await e.userChoice; render(); },
    wipe: async () => {
      if (!await ask({ title: 'Apagar todos os dados?', text: 'Registros, XP, medalhas e configurações serão removidos deste aparelho. Não há como desfazer. Exporte um backup antes, se quiser guardá-los.', ok: 'Apagar tudo', danger: true, word: 'APAGAR' })) return;
      try {
        await DB.wipe();
        Object.assign(S, { records: [], rewards: [], settings: L.cleanSettings(), session: null, tab: 'inicio' });
        syncNotice();
        step = 0; setup = { name: '', age: 'a', goal: 480 };
        applyTheme(); render(); onboard();
      } catch { toast('Não foi possível apagar os dados.', 'bad'); }
    },
  };

  document.addEventListener('click', e => {
    const hit = e.target.closest('[data-tip]');
    if (hit) {
      $('#readout').textContent = hit.dataset.tip;
      $$('.chart .hit').forEach(h => h.classList.toggle('on', h === hit));
      return;
    }
    const el = e.target.closest('[data-act]');
    if (el && !el.disabled) actions[el.dataset.act]?.(el.dataset.v);
  });
  document.addEventListener('change', async e => {
    const { id, value } = e.target, intro = !$('#intro').hidden;
    if (id === 'set-age') {
      const goal = L.age(value).sug;
      if (intro) { setup = { name: $('#set-name').value, age: value, goal }; onboard(); }
      else if (await saveSettings({ age: value, goal })) { render(); toast(`Meta sugerida: ${L.fmtDur(goal)}`, 'ok'); }
    }
    if (id === 'set-name') { if (intro) setup.name = value; else if (await saveSettings({ name: value })) toast('Nome salvo', 'ok'); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.installEvt = e; if (S.tab === 'config') render(); });

  /* recarrega ao voltar para o app: o dia pode ter mudado ou outra aba gravou */
  const refresh = async () => {
    try {
      const data = await DB.load();
      S.records = data.records; S.rewards = data.rewards; S.session = data.session;
      if (S.day !== L.today()) { S.day = L.today(); S.calMonth = S.progMonth = L.monthKey(S.day); }
      render();
    } catch { /* mantém o que está na tela */ }
  };
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden || !$('#sheet').hidden || !S.settings.onboarded) return;
    await refresh(); syncNotice(); attend();
  });
  /* um botão da notificação mudou o cronômetro */
  if (canNotify()) navigator.serviceWorker.addEventListener('message', async e => {
    if (e.data !== 'nox-session') return;
    await refresh();
    if (S.session?.status === 'ended') reviewSleep();
  });
  setInterval(() => {
    const t = $('#timer');
    if (t && S.session && !document.hidden) t.textContent = timerText(L.sessionSummary(S.session).elapsed);
  }, 1000);
  setInterval(() => { if (S.day !== L.today() && $('#sheet').hidden) refresh(); }, 60000);

  const start = async () => {
    $('#nav').innerHTML = `<span class="pill"></span>${TABS.map(([id, label, ic]) => `<button data-act="tab" data-v="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}`;
    try {
      await DB.open();
      const data = await DB.load();
      S.records = data.records; S.rewards = data.rewards; S.settings = L.cleanSettings(data.settings); S.session = data.session;
      // completa recompensas que faltem (sem duplicar)
      const fresh = L.evaluate(S.records, S.rewards);
      if (fresh.length) { await DB.commit({ rewards: fresh }); S.rewards = S.rewards.concat(fresh); }
    } catch {
      $('#view').innerHTML = '<div class="card empty"><h3>Não foi possível abrir seus dados</h3><p>O armazenamento do navegador está bloqueado. Saia do modo anônimo ou libere o armazenamento e abra o NOX novamente.</p></div>';
      $('#nav').hidden = true; $('#splash').remove();
      return;
    }
    const hash = location.hash.slice(1);
    if (TABS.some(t => t[0] === hash)) S.tab = hash;
    try { history.replaceState(null, '', location.href); } catch { /* sem histórico */ }
    applyTheme(); render(true);
    if (!S.settings.onboarded) onboard();
    setTimeout(() => { const s = $('#splash'); s.classList.add('bye'); setTimeout(() => s.remove(), 500); }, 700);
    if ('serviceWorker' in navigator && document.querySelector('link[rel=manifest]')) navigator.serviceWorker.register('sw.js').then(syncNotice).catch(() => {});
    setTimeout(attend, 1300);
  };
  start();
})();
