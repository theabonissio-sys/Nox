/* NOX: regras puras (datas, XP, missões, medalhas, estatísticas). Sem DOM. */
(function (root) {
  'use strict';

  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  // meio-dia evita problemas com horário de verão
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
  const validDate = s => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && iso(parse(s)) === s;
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const today = () => iso(new Date());
  const weekStart = s => addDays(s, -parse(s).getDay()); // domingo
  const weekDays = s => Array.from({ length: 7 }, (_, i) => addDays(weekStart(s), i));
  const monthKey = s => s.slice(0, 7);
  const daysInMonth = k => { const [y, m] = k.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const monthDays = k => Array.from({ length: daysInMonth(k) }, (_, i) => `${k}-${pad(i + 1)}`);

  const fmtDur = min => {
    const t = Math.round(min), h = Math.floor(t / 60), m = t % 60;
    return m ? `${h}h ${pad(m)}min` : `${h}h`;
  };

  const AGES = [
    { id: 'c', label: '6 a 13 anos', min: 540, max: 660, sug: 600 },
    { id: 't', label: '14 a 17 anos', min: 480, max: 600, sug: 540 },
    { id: 'a', label: '18 a 64 anos', min: 420, max: 540, sug: 480 },
    { id: 's', label: '65 anos ou mais', min: 420, max: 480, sug: 450 },
  ];
  const age = id => AGES.find(a => a.id === id) || AGES[2];
  const goalLimits = id => ({ min: age(id).min - 60, max: 720 });

  const met = r => r.minutes >= r.goal;
  const hasDetails = r => !!(r.bed || r.wake || r.quality);

  const longestStreak = dates => {
    let best = 0, run = 0, prev = null;
    [...dates].sort().forEach(d => {
      run = prev && addDays(prev, 1) === d ? run + 1 : 1;
      best = Math.max(best, run); prev = d;
    });
    return best;
  };

  const MISSIONS = {
    daily: [
      { id: 'reg', name: 'Noite anotada', desc: 'Registre sua noite de sono.', xp: 10, target: () => 1, count: rs => rs.length },
      { id: 'goal', name: 'Descanso completo', desc: 'Alcance sua meta diária.', xp: 15, target: () => 1, count: rs => rs.filter(met).length },
      { id: 'det', name: 'Registro detalhado', desc: 'Informe um horário ou a qualidade do sono.', xp: 5, target: () => 1, count: rs => rs.filter(hasDetails).length },
    ],
    weekly: [
      { id: 'goal5', name: 'Semana descansada', desc: 'Alcance a meta em 5 noites da semana.', xp: 50, target: () => 5, count: rs => rs.filter(met).length },
      { id: 'reg7', name: 'Semana completa', desc: 'Registre as 7 noites da semana.', xp: 40, target: () => 7, count: rs => rs.length },
      { id: 'rot', name: 'Rotina de registros', desc: 'Registre 3 dias seguidos na semana.', xp: 30, target: () => 3, count: rs => longestStreak(rs.map(r => r.date)) },
    ],
    monthly: [
      { id: 'goal8', name: 'Bom começo de mês', desc: 'Alcance a meta em 8 noites do mês.', xp: 80, target: () => 8, count: rs => rs.filter(met).length },
      { id: 'reg15', name: 'Metade do caminho', desc: 'Registre 15 noites no mês.', xp: 60, target: () => 15, count: rs => rs.length },
      { id: 'reg30', name: 'Mês presente', desc: 'Registre 30 noites no mês (em fevereiro, todas).', xp: 100, target: k => Math.min(30, daysInMonth(k)), count: rs => rs.length },
      { id: 'goal20', name: 'Mês restaurador', desc: 'Complete 20 noites dentro da meta.', xp: 120, target: () => 20, count: rs => rs.filter(met).length },
    ],
  };

  const maxIn = (records, keyFn, filter) => {
    const c = {};
    records.filter(filter).forEach(r => { const k = keyFn(r.date); c[k] = (c[k] || 0) + 1; });
    return Math.max(0, ...Object.values(c));
  };

  const MAX_DAY = 840;     // 14h por dia, somando sonecas
  const TIMER_MAX = 600;   // o cronômetro desliga sozinho em 10h

  const streakOf = (rs, pred) => longestStreak(rs.filter(pred).map(r => r.date));
  const goodWeekends = rs => {
    const ok = new Set(rs.filter(met).map(r => r.date));
    return [...ok].filter(d => parse(d).getDay() === 6 && ok.has(addDays(d, 1))).length;
  };
  /* maior sequência de noites seguidas indo dormir com até 30 min de diferença */
  const steadyRun = rs => {
    const list = rs.filter(r => r.bed).sort((a, b) => a.date.localeCompare(b.date));
    let best = 0;
    list.forEach((first, i) => {
      let min = fromNoon(first.bed), max = min, n = 1;
      for (let j = i + 1; j < list.length && list[j].date === addDays(list[j - 1].date, 1); j++) {
        const t = fromNoon(list[j].bed);
        min = Math.min(min, t); max = Math.max(max, t);
        if (max - min > 30) break;
        n++;
      }
      best = Math.max(best, n);
    });
    return best;
  };

  const MEDALS = [
    { id: 'first', name: 'Primeira Noite', desc: 'Registrou o primeiro sono.', icon: 'moon', xp: 25, target: 1, count: rs => rs.length, colors: ['#4f7cff', '#8b5cf6'] },
    { id: 'week', name: 'Primeira Semana', desc: 'Completou 7 registros.', icon: 'calendar', xp: 50, target: 7, count: rs => rs.length, colors: ['#22d3ee', '#4f7cff'] },
    { id: 'streak', name: 'Sete em Sequência', desc: 'Registrou 7 dias seguidos.', icon: 'bolt', xp: 60, target: 7, count: rs => longestStreak(rs.map(r => r.date)), colors: ['#a78bfa', '#ec8bf4'] },
    { id: 'consist', name: 'Consistência', desc: 'Atingiu a meta em 5 noites de uma semana.', icon: 'target', xp: 50, target: 5, count: rs => maxIn(rs, weekStart, met), colors: ['#2dd4bf', '#22d3ee'] },
    { id: 'month', name: 'Evolução Mensal', desc: 'Atingiu a meta em 8 noites de um mês.', icon: 'chart', xp: 75, target: 8, count: rs => maxIn(rs, monthKey, met), colors: ['#6366f1', '#22d3ee'] },
    { id: 'detail', name: 'Olhar Atento', desc: 'Avaliou a qualidade de 10 noites.', icon: 'eye', xp: 40, target: 10, count: rs => rs.filter(r => r.quality).length, colors: ['#8b5cf6', '#4f7cff'] },
    { id: 'explorer', name: 'Explorador', desc: 'Registrou 30 noites.', icon: 'compass', xp: 150, target: 30, count: rs => rs.length, colors: ['#c084fc', '#6366f1'] },
    { id: 'hundred', name: 'Centenário', desc: 'Registrou 100 noites.', icon: 'crown', xp: 300, target: 100, count: rs => rs.length, colors: ['#67e8f9', '#c084fc'] },
    { id: 'moon3', name: 'Trilogia da Lua', desc: 'Alcançou a meta 3 noites seguidas.', icon: 'sparkle', xp: 40, target: 3, count: rs => streakOf(rs, met), colors: ['#f9a8d4', '#8b5cf6'] },
    { id: 'guardian', name: 'Guardião dos Sonhos', desc: 'Mediu 7 noites com o modo Vou dormir.', icon: 'shield', xp: 80, target: 7, count: rs => rs.filter(r => r.tm).length, colors: ['#34d399', '#22d3ee'] },
    { id: 'early', name: 'Coruja Aposentada', desc: 'Foi dormir antes das 23h em 5 noites.', icon: 'moon', xp: 70, target: 5, count: rs => rs.filter(r => r.bed >= '18:00' && r.bed < '23:00').length, colors: ['#fbbf24', '#f472b6'] },
    { id: 'swiss', name: 'Relógio Suíço', desc: '5 noites seguidas indo dormir quase no mesmo horário.', icon: 'clock', xp: 90, target: 5, count: steadyRun, colors: ['#f87171', '#fbbf24'] },
    { id: 'weekend', name: 'Fim de Semana Zen', desc: 'Alcançou a meta no sábado e no domingo.', icon: 'sun', xp: 60, target: 1, count: goodWeekends, colors: ['#fb923c', '#facc15'] },
    { id: 'fresh', name: 'Acordei Renovado', desc: 'Avaliou 5 noites como ótimas.', icon: 'star', xp: 50, target: 5, count: rs => rs.filter(r => r.quality === 5).length, colors: ['#a3e635', '#2dd4bf'] },
    { id: 'perfect', name: 'Semana Lendária', desc: 'Alcançou a meta 7 noites seguidas.', icon: 'trophy', xp: 120, target: 7, count: rs => streakOf(rs, met), colors: ['#fde047', '#f97316'] },
    { id: 'galaxy', name: 'Constelação', desc: 'Registrou 30 dias seguidos.', icon: 'bolt', xp: 200, target: 30, count: rs => streakOf(rs, () => true), colors: ['#60a5fa', '#e879f9'] },
  ];

  const LEVELS = [
    { name: 'Iniciante', xp: 0 }, { name: 'Explorador', xp: 200 }, { name: 'Consistente', xp: 700 },
    { name: 'Disciplinado', xp: 1800 }, { name: 'Mestre do Descanso', xp: 4000 },
  ];
  // depois do nível 5, um novo nível a cada 2000 XP
  const levelInfo = xp => {
    let level, start, next;
    if (xp >= 4000) {
      const extra = Math.floor((xp - 4000) / 2000);
      level = 5 + extra; start = 4000 + extra * 2000; next = start + 2000;
    } else {
      let i = 0; while (xp >= LEVELS[i + 1].xp) i++;
      level = i + 1; start = LEVELS[i].xp; next = LEVELS[i + 1].xp;
    }
    return { level, name: LEVELS[Math.min(level, 5) - 1].name, start, next, remaining: next - xp, pct: (xp - start) / (next - start) };
  };

  const periodKey = (type, date) => type === 'daily' ? date : type === 'weekly' ? weekStart(date) : monthKey(date);

  /* Noites anotadas com mais de 3 dias de atraso entram no histórico, mas não valem XP. */
  const isLate = (date, now = today()) => date < addDays(now, -3);
  const eligible = records => records.filter(r => !r.late);
  const medalProgress = (m, records) => Math.min(m.target, m.count(eligible(records)));

  const missionsFor = (records, type, date) => {
    const key = periodKey(type, date);
    const rs = eligible(records).filter(r => periodKey(type, r.date) === key);
    return MISSIONS[type].map(m => {
      const target = m.target(key), count = Math.min(m.count(rs), target);
      return { ...m, type, key, rewardId: `m:${type}:${key}:${m.id}`, target, progress: count, done: count >= target };
    });
  };

  /* Devolve só as recompensas NOVAS. Cada uma tem um id único por missão+período,
     então editar, salvar de novo ou recarregar nunca paga duas vezes. */
  const evaluate = (records, rewards, now = today()) => {
    const have = new Set(rewards.map(r => r.id));
    const out = [];
    const add = r => { if (!have.has(r.id)) { have.add(r.id); out.push(r); } };
    ['daily', 'weekly', 'monthly'].forEach(type => {
      new Set(eligible(records).map(r => periodKey(type, r.date))).forEach(key => {
        const date = type === 'monthly' ? `${key}-01` : key;
        missionsFor(records, type, date).filter(m => m.done).forEach(m =>
          add({ id: m.rewardId, kind: 'mission', type, ref: m.id, period: key, name: m.name, xp: m.xp, date: now }));
      });
    });
    MEDALS.filter(m => medalProgress(m, records) >= m.target).forEach(m =>
      add({ id: `a:${m.id}`, kind: 'medal', ref: m.id, name: m.name, xp: m.xp, date: now }));
    return out;
  };

  /* Correção no mesmo dia: prêmios ganhos hoje que os registros já não sustentam. */
  const revocable = (records, rewards, now = today()) => {
    const ok = new Set(evaluate(records, [], now).map(r => r.id));
    return rewards.filter(r => r.date === now && !ok.has(r.id)).map(r => r.id);
  };

  /* Regras para o que a pessoa digita: limite humano e só o dia certo. */
  const checkEntry = (rec, now = today(), timerDate = null) => {
    if (rec.minutes > MAX_DAY) throw new Error('O máximo é de 14 horas de sono em um dia.');
    if (rec.date !== now && rec.date !== timerDate) throw new Error('Só dá para registrar a noite no próprio dia.');
    return rec;
  };

  const addNap = (rec, minutes) => {
    if (!Number.isInteger(minutes) || minutes <= 0) throw new Error('Informe quanto durou a soneca.');
    if (rec.minutes + minutes > MAX_DAY) throw new Error('A soma do dia não pode passar de 14 horas.');
    return { ...rec, minutes: rec.minutes + minutes, nap: (rec.nap || 0) + minutes };
  };

  /* Horários típicos. A conta parte do meio-dia para a meia-noite não atrapalhar a média. */
  const fromNoon = t => (Number(t.slice(0, 2)) * 60 + Number(t.slice(3)) + 720) % 1440;
  const toClock = m => { const t = (Math.round(m) + 720) % 1440; return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`; };
  const timing = records => {
    const nights = records.filter(r => r.bed && r.wake && r.bed !== r.wake).map(r => {
      const from = fromNoon(r.bed);
      return { date: r.date, from, to: from + (fromNoon(r.wake) - from + 1440) % 1440 };
    });
    if (!nights.length) return { nights, count: 0 };
    const mean = k => nights.reduce((s, n) => s + n[k], 0) / nights.length;
    const from = mean('from');
    return {
      nights, count: nights.length, bed: toClock(from), wake: toClock(mean('to')),
      spread: Math.round(nights.reduce((s, n) => s + Math.abs(n.from - from), 0) / nights.length),
    };
  };

  /* noites seguidas na meta até hoje (ou até ontem, se hoje ainda não foi anotado) */
  const metStreak = (records, now = today()) => {
    const by = new Map(records.map(r => [r.date, r]));
    let d = by.has(now) ? now : addDays(now, -1), n = 0;
    while (by.has(d) && met(by.get(d))) { n++; d = addDays(d, -1); }
    return n;
  };

  const totalXp = rewards => rewards.reduce((s, r) => s + r.xp, 0);

  const stats = records => {
    const n = records.length;
    if (!n) return { count: 0, total: 0, avg: null, max: null, metCount: 0, metPct: null, streak: 0 };
    const total = records.reduce((s, r) => s + r.minutes, 0);
    const metCount = records.filter(met).length;
    return {
      count: n, total, avg: total / n,
      max: records.reduce((a, b) => b.minutes > a.minutes ? b : a),
      metCount, metPct: Math.round(metCount / n * 100),
      streak: longestStreak(records.map(r => r.date)),
    };
  };

  const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;
  /* Valida e limpa um registro; lança Error com mensagem para o usuário. */
  const cleanRecord = (r, now = today()) => {
    if (!r || !validDate(r.date)) throw new Error('Escolha uma data válida.');
    if (r.date > now) throw new Error('Não dá para registrar uma noite no futuro.');
    if (!Number.isInteger(r.minutes) || r.minutes <= 0) throw new Error('Informe quanto tempo você dormiu.');
    if (r.minutes > 1440) throw new Error('A duração não pode passar de 24 horas.');
    if (!Number.isInteger(r.goal) || r.goal < 240 || r.goal > 900) throw new Error('Meta inválida no registro.');
    return {
      date: r.date, minutes: r.minutes, goal: r.goal,
      bed: timeRe.test(r.bed) ? r.bed : '', wake: timeRe.test(r.wake) ? r.wake : '',
      quality: Number.isInteger(r.quality) && r.quality >= 1 && r.quality <= 5 ? r.quality : 0,
      ...(Number.isInteger(r.nap) && r.nap > 0 ? { nap: Math.min(r.nap, r.minutes) } : {}),
      ...(r.late ? { late: true } : {}),
      ...(Number.isInteger(r.tm) && r.tm > 0 ? { tm: Math.min(r.tm, TIMER_MAX) } : {}),
    };
  };

  const between = (bed, wake) => {
    if (!timeRe.test(bed) || !timeRe.test(wake)) return null;
    const m = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
    return (m(wake) - m(bed) + 1440) % 1440 || null;
  };

  /* ---------- avatar ---------- */
  /* [id, nome, medalha que libera]. A primeira opção de cada parte é a padrão. */
  const AVATAR_PARTS = {
    head: [['redondo', 'Redondo'], ['oval', 'Oval'], ['quadrado', 'Quadrado'], ['queixo', 'Queixo fino']],
    hair: [['curto', 'Curto'], ['topete', 'Topete'], ['cacheado', 'Cacheado'], ['afro', 'Black power'], ['longo', 'Longo'], ['chanel', 'Chanel'], ['coque', 'Coque'], ['rabo', 'Rabo de cavalo'], ['trancas', 'Tranças'], ['espetado', 'Espetado'], ['moicano', 'Moicano'], ['careca', 'Sem cabelo']],
    eyes: [['normal', 'Normais'], ['grandes', 'Grandes'], ['felizes', 'Felizes'], ['piscando', 'Piscadinha'], ['sono', 'Com sono'], ['fechados', 'Fechados'], ['estrela', 'Estrelas', 'fresh']],
    mouth: [['sorriso', 'Sorriso'], ['risada', 'Risada'], ['dentes', 'Dentes'], ['neutro', 'Tranquila'], ['uau', 'Uau'], ['lingua', 'Língua'], ['gatinho', 'Gatinho']],
    extra: [['nada', 'Nada'], ['bochechas', 'Bochechas'], ['sardas', 'Sardas'], ['pinta', 'Pintinha'], ['bigode', 'Bigode'], ['barba', 'Barba']],
    outfit: [['camiseta', 'Camiseta'], ['moletom', 'Moletom'], ['listras', 'Listrada'], ['regata', 'Regata'], ['social', 'Camisa'], ['gola', 'Gola alta'], ['pijama', 'Pijama', 'week'], ['capa', 'Capa de herói', 'guardian'], ['terno', 'Terno e relógio', 'swiss']],
    glasses: [['nada', 'Nenhum'], ['redondos', 'Redondos'], ['quadrados', 'Quadrados'], ['escuros', 'Escuros'], ['coracao', 'Corações', 'consist'], ['monoculo', 'Monóculo', 'detail'], ['coruja', 'Coruja', 'early'], ['estrelas', 'Estrelas', 'weekend']],
    hat: [['nada', 'Nenhum'], ['bone', 'Boné'], ['laco', 'Laço'], ['faixa', 'Faixa'], ['touca', 'Touca de dormir', 'first'], ['fone', 'Fones', 'streak'], ['explorador', 'Explorador', 'explorer'], ['coroa', 'Coroa', 'hundred'], ['aureola', 'Auréola', 'perfect']],
    bg: [['roxo', 'Roxo'], ['azul', 'Azul'], ['ciano', 'Ciano'], ['rosa', 'Rosa'], ['verde', 'Verde'], ['laranja', 'Laranja'], ['lua', 'Noite de lua', 'moon3'], ['aurora', 'Aurora', 'month'], ['galaxia', 'Galáxia', 'galaxy']],
  };
  const AVATAR_COLORS = {
    skin: ['#ffe0c7', '#f5c6a0', '#e2a876', '#c4844f', '#9c603a', '#6e422a'],
    hairColor: ['#2a1f1b', '#5b3a24', '#a5652e', '#e9c46a', '#c2452d', '#9ca3af', '#7c5cf6', '#22b8d4', '#ec5fa8'],
    outfitColor: ['#6366f1', '#22c3e0', '#ec4899', '#22c55e', '#f97316', '#ef4444', '#facc15', '#475569'],
  };
  const COLOR_DEFAULT = { skin: 1, hairColor: 1, outfitColor: 0 };

  const cleanAvatar = a => {
    if (!a || typeof a !== 'object') return null;
    const out = {};
    Object.entries(AVATAR_PARTS).forEach(([k, list]) => { out[k] = list.some(i => i[0] === a[k]) ? a[k] : list[0][0]; });
    Object.entries(AVATAR_COLORS).forEach(([k, list]) => { out[k] = Number.isInteger(a[k]) && a[k] >= 0 && a[k] < list.length ? a[k] : COLOR_DEFAULT[k]; });
    return out;
  };
  /* o que a medalha libera */
  const avatarReward = medalId => {
    for (const [part, list] of Object.entries(AVATAR_PARTS)) {
      const item = list.find(i => i[2] === medalId);
      if (item) return { part, id: item[0], name: item[1] };
    }
    return null;
  };
  const unlockedBy = rewards => new Set(rewards.filter(r => r.kind === 'medal').map(r => r.ref));
  /* o que dá para vestir agora: item ainda travado volta para o padrão */
  const wearable = (a, unlocked) => {
    const out = cleanAvatar(a || {});
    Object.entries(AVATAR_PARTS).forEach(([k, list]) => {
      const need = list.find(i => i[0] === out[k])[2];
      if (need && !unlocked.has(need)) out[k] = list[0][0];
    });
    return out;
  };
  const randomAvatar = (unlocked, rand = Math.random) => {
    const pick = list => list[Math.floor(rand() * list.length)];
    const out = {};
    Object.entries(AVATAR_PARTS).forEach(([k, list]) => { out[k] = pick(list.filter(i => !i[2] || unlocked.has(i[2])))[0]; });
    Object.entries(AVATAR_COLORS).forEach(([k, list]) => { out[k] = Math.floor(rand() * list.length); });
    // enfeites aparecem de vez em quando, para o rosto não ficar escondido
    ['extra', 'glasses', 'hat'].forEach(k => { if (rand() < .5) out[k] = AVATAR_PARTS[k][0][0]; });
    return out;
  };

  const idRe = /^[a-z0-9]{8,24}$/;
  const cleanSettings = s => {
    s = s || {};
    const a = age(s.age).id, lim = goalLimits(a);
    return {
      name: String(s.name || '').trim().slice(0, 30), age: a,
      goal: Number.isInteger(s.goal) ? Math.min(lim.max, Math.max(lim.min, s.goal)) : age(a).sug,
      theme: s.theme === 'light' ? 'light' : 'dark', onboarded: !!s.onboarded, tour: !!s.tour,
      latency: Number.isInteger(s.latency) ? Math.min(60, Math.max(0, s.latency)) : 15,
      lastBackup: validDate(s.lastBackup) ? s.lastBackup : '', backupSnooze: validDate(s.backupSnooze) ? s.backupSnooze : '',
      reminders: s.reminders !== false, autoBackup: s.autoBackup !== false, sounds: s.sounds !== false,
      friendId: idRe.test(s.friendId) ? s.friendId : '', avatar: cleanAvatar(s.avatar),
    };
  };

  /* ---------- modo "Vou dormir" ---------- */
  const clock = ms => { const d = new Date(ms); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const startSession = (latency, now = Date.now()) => ({ start: now, latency, status: 'sleeping', pauses: [] });
  /* Passou de 10h: o cronômetro é encerrado no limite. */
  const closePauses = (s, at) => s.pauses.filter(p => p.from < at).map(p => p.to && p.to <= at ? p : { ...p, to: at });
  const expire = (s, now = Date.now()) => {
    if (!s || s.status === 'ended' || now - s.start < TIMER_MAX * 60000) return s;
    const end = s.start + TIMER_MAX * 60000;
    return { ...s, status: 'ended', end, auto: true, wasAwake: s.status === 'awake', pauses: closePauses(s, end) };
  };
  /* Transições inválidas (ex.: botão antigo de uma notificação) não mudam nada. */
  const sessionAction = (s, action, now = Date.now()) => {
    if (!s) return s;
    const x = expire(s, now);
    if (x !== s) return x;
    if (action === 'pause' && s.status === 'sleeping') return { ...s, status: 'awake', pauses: s.pauses.concat({ from: now, to: null }) };
    if (action === 'resume' && s.status === 'awake') return { ...s, status: 'sleeping', pauses: closePauses(s, now) };
    if (action === 'wake' && s.status !== 'ended') return { ...s, status: 'ended', end: now, wasAwake: s.status === 'awake', pauses: closePauses(s, now) };
    if (action === 'undo' && s.status === 'ended' && now - s.start < TIMER_MAX * 60000) {
      const { end, wasAwake, auto, ...rest } = s;
      return { ...rest, status: wasAwake ? 'awake' : 'sleeping', pauses: s.pauses.map((p, i) => wasAwake && i === s.pauses.length - 1 ? { ...p, to: null } : p) };
    }
    return s;
  };
  const sessionSummary = (s, now = Date.now()) => {
    const end = s.end || Math.min(now, s.start + TIMER_MAX * 60000);
    const elapsed = Math.max(0, end - s.start);
    const awake = Math.round(s.pauses.reduce((t, p) => t + Math.max(0, (p.to || end) - p.from), 0) / 60000);
    const total = Math.round(elapsed / 60000);
    const minutes = Math.max(0, total - awake - s.latency);
    return {
      elapsed, total, awake, latency: s.latency, minutes, auto: !!s.auto,
      tm: s.auto ? 0 : minutes, // noite esquecida no limite não conta na Bolha de Sonhos
      date: iso(new Date(end)), bed: clock(s.start), wake: clock(end),
    };
  };
  const sessionNotice = (s, now = Date.now()) => {
    const base = { tag: 'nox-sleep', icon: 'icons/icon-192.png', badge: 'icons/badge.png', silent: true };
    if (s.status === 'ended') {
      return {
        title: s.auto ? 'Cronômetro desligado após 10h' : 'Cronômetro parado ☀️',
        options: {
          ...base, body: `${fmtDur(sessionSummary(s).minutes)} de sono. Toque para conferir e salvar.`, timestamp: s.end,
          actions: s.auto ? [{ action: 'review', title: 'Conferir e salvar' }]
            : [{ action: 'review', title: 'Conferir e salvar' }, { action: 'undo', title: 'Continuar' }],
        },
      };
    }
    const awake = s.status === 'awake';
    const since = awake ? s.pauses[s.pauses.length - 1].from : s.start;
    const passed = Math.max(0, Math.floor((now - s.start) / 60000));
    return {
      title: passed < 1 ? (awake ? 'Acordado no meio da noite' : 'Cronômetro de sono ligado 🌙') : `${awake ? '⏸️' : '🌙'} ${passed < 60 ? `${passed} min` : fmtDur(passed)} no cronômetro`,
      options: {
        ...base, timestamp: since, requireInteraction: true,
        body: `${awake ? `Pausado às ${clock(since)}` : `Começou às ${clock(s.start)}`} · visto às ${clock(now)}. Toque para atualizar o tempo.`,
        actions: awake ? [{ action: 'resume', title: 'Voltei a dormir' }, { action: 'wake', title: 'Levantei' }]
          : [{ action: 'wake', title: 'Acordei' }, { action: 'pause', title: 'Acordei de noite' }],
      },
    };
  };

  /* ---------- lembretes diários ---------- */
  const REMINDERS = {
    morning: ['Bom dia! Como foi sua noite? Anote no NOX.', 'Sua noite de hoje ainda pode virar XP. ☀️', 'Antes que o dia corra: registre seu sono.'],
    evening: ['Seu travesseiro mandou lembrar: hora de desacelerar. 🌙', 'Que tal largar a tela um pouco antes de deitar?', 'Descansar também é conquista. Boa noite!',
      'Amanhã agradece o sono de hoje.', 'Prepare o quarto: luz baixa, corpo tranquilo.', 'Vai deitar? Toque em Vou dormir no NOX.', 'Seu corpo trabalha enquanto você dorme. Dê esse tempo a ele.'],
  };
  const reminderFor = (hour, n) => {
    if (hour < 7 || hour >= 24) return null;
    const list = hour >= 18 ? REMINDERS.evening : hour < 12 ? REMINDERS.morning : REMINDERS.evening;
    return list[n % list.length];
  };

  /* ---------- Bolha de Sonhos: troca de convites, sem servidor ---------- */
  const cleanFriend = (f, now = today()) => {
    if (!f || !idRe.test(f.id) || !Array.isArray(f.nights)) return null;
    const nights = new Map();
    f.nights.slice(0, 14).forEach(n => {
      if (Array.isArray(n) && validDate(n[0]) && n[0] <= addDays(now, 1) && Number.isInteger(n[1]) && n[1] > 0 && n[1] <= TIMER_MAX && Number.isInteger(n[2]) && n[2] >= 240 && n[2] <= 900) nights.set(n[0], [n[0], n[1], n[2]]);
    });
    const avatar = cleanAvatar(f.avatar);
    return { id: f.id, name: String(f.name || '').trim().slice(0, 30) || 'Amigo', nights: [...nights.values()], at: validDate(f.at) ? f.at : now, ...(avatar ? { avatar } : {}) };
  };
  const makeInvite = (settings, records, now = today()) => {
    const nights = records.filter(r => r.tm && r.date > addDays(now, -14) && r.date <= now).map(r => [r.date, r.tm, r.goal]);
    const avatar = cleanAvatar(settings.avatar);
    const json = JSON.stringify({ v: 1, id: settings.friendId, name: settings.name, nights, at: now, ...(avatar ? { avatar } : {}) });
    return btoa(String.fromCharCode(...new TextEncoder().encode(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const parseInvite = (text, now = today()) => {
    try {
      const raw = String(text).trim();
      const code = (raw.match(/amigo=([\w-]+)/) || [null, raw])[1];
      if (!/^[\w-]{10,4000}$/.test(code)) throw 0;
      const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
      const d = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
      const f = d.v === 1 && cleanFriend(d, now);
      if (!f) throw 0;
      return f;
    } catch { throw new Error('Esse convite não é válido. Peça para a pessoa enviar de novo.'); }
  };
  const weekStats = (nights, now = today()) => {
    const w = nights.filter(n => n[0] > addDays(now, -7) && n[0] <= now);
    return { count: w.length, met: w.filter(n => n[1] >= n[2]).length, avg: w.length ? w.reduce((s, n) => s + n[1], 0) / w.length : null };
  };

  /* Lê um arquivo de backup. Nomes e XP das recompensas vêm das regras, nunca do arquivo. */
  const parseBackup = (text, now = today()) => {
    let d;
    try { d = JSON.parse(text); } catch { throw new Error('O arquivo não é um JSON válido.'); }
    if (!d || d.app !== 'NOX' || !Array.isArray(d.records) || !Array.isArray(d.rewards)) throw new Error('Este arquivo não é um backup do NOX.');
    if (d.version !== 1) throw new Error('Versão de backup não suportada.');
    const records = new Map();
    d.records.forEach((r, i) => {
      try { const c = cleanRecord(r, '9999-12-31'); records.set(c.date, c); }
      catch (e) { throw new Error(`Registro ${i + 1} do backup está inválido. Nada foi alterado.`); }
    });
    const rewards = new Map();
    d.rewards.forEach(r => {
      if (!r || typeof r.id !== 'string') return;
      const date = validDate(r.date) ? r.date : now;
      const [k, a, b, c] = r.id.split(':');
      if (k === 'a') {
        const m = MEDALS.find(x => x.id === a);
        if (m) rewards.set(r.id, { id: r.id, kind: 'medal', ref: m.id, name: m.name, xp: m.xp, date });
      } else if (k === 'm' && Object.prototype.hasOwnProperty.call(MISSIONS, a)) {
        const m = MISSIONS[a].find(x => x.id === c);
        const okKey = a === 'monthly' ? /^\d{4}-(0[1-9]|1[0-2])$/.test(b) : validDate(b);
        if (m && okKey) rewards.set(r.id, { id: r.id, kind: 'mission', type: a, ref: m.id, period: b, name: m.name, xp: m.xp, date });
      }
    });
    const friends = (Array.isArray(d.friends) ? d.friends : []).slice(0, 50).map(f => cleanFriend(f, now)).filter(Boolean);
    return { records: [...records.values()], rewards: [...rewards.values()], settings: cleanSettings(d.settings), friends };
  };

  const api = {
    iso, parse, validDate, addDays, today, weekStart, weekDays, monthKey, daysInMonth, monthDays, fmtDur,
    AGES, age, goalLimits, met, hasDetails, longestStreak, MISSIONS, MEDALS, LEVELS, levelInfo,
    missionsFor, evaluate, totalXp, stats, cleanRecord, cleanSettings, between, parseBackup,
    AVATAR_PARTS, AVATAR_COLORS, cleanAvatar, avatarReward, unlockedBy, wearable, randomAvatar, metStreak, MAX_DAY, TIMER_MAX, checkEntry, expire, reminderFor, makeInvite, parseInvite, cleanFriend, weekStats, isLate, eligible, medalProgress, revocable, addNap, timing, toClock, clock, startSession, sessionAction, sessionSummary, sessionNotice,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Logic = api;
})(this);
