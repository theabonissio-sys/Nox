/* NOX: desenho do avatar em SVG, com formas próprias. As opções e travas ficam em logic.js. */
const Avatar = (() => {
  'use strict';
  const INK = '#1d1b2e', MOUTH = '#5b1e2d', GOLD = '#fbbf24';
  const shade = (hex, k) => `#${[1, 3, 5].map(i => Math.round(Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('')}`;
  const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const line = (d, color, width = 4) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const circle = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const star = (x, y, r, fill, extra = '') => `<polygon points="${Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI * i / 5 - Math.PI / 2, d = i % 2 ? r * .45 : r;
    return `${(x + Math.cos(a) * d).toFixed(1)},${(y + Math.sin(a) * d).toFixed(1)}`;
  }).join(' ')}" fill="${fill}" ${extra}/>`;
  const stars = list => list.map(([x, y, r]) => circle(x, y, r, '#fff')).join('');

  /* ---------- fundo ---------- */
  const flat = color => () => `<rect width="200" height="200" fill="${color}"/>${circle(100, 100, 84, '#fff', 'opacity=".12"')}`;
  const BG = {
    roxo: flat('#7c5cf6'), azul: flat('#3b82f6'), ciano: flat('#22c3e0'), rosa: flat('#f06aad'), verde: flat('#2fbf8f'), laranja: flat('#fb8c3a'),
    lua: () => `<rect width="200" height="200" fill="#1e1b4b"/>${circle(158, 44, 26, '#fde68a')}${circle(170, 36, 22, '#1e1b4b')}${stars([[28, 40, 2.5], [52, 18, 1.8], [18, 98, 2], [176, 112, 2.4], [40, 140, 1.6], [112, 14, 1.8]])}`,
    aurora: () => `<rect width="200" height="200" fill="#062a33"/>${line('M-10 78C40 30 80 110 130 62S200 40 215 58', '#34d399', 24).replace('/>', ' opacity=".6"/>')}${line('M-10 112C50 70 90 140 140 96S200 88 215 100', '#a78bfa', 20).replace('/>', ' opacity=".55"/>')}${line('M-10 46C40 6 90 66 140 28S200 8 215 22', '#22d3ee', 12).replace('/>', ' opacity=".5"/>')}${stars([[30, 24, 2], [172, 140, 2], [22, 150, 1.6]])}`,
    galaxia: () => `<rect width="200" height="200" fill="#150a2e"/><ellipse cx="100" cy="90" rx="130" ry="46" fill="#7c3aed" opacity=".35" transform="rotate(-28 100 90)"/><ellipse cx="100" cy="90" rx="100" ry="22" fill="#ec4899" opacity=".35" transform="rotate(-28 100 90)"/>${stars([[24, 30, 2.4], [60, 16, 1.4], [150, 22, 2], [182, 64, 1.5], [18, 82, 1.5], [170, 150, 2.4], [34, 148, 1.8], [128, 12, 1.2], [190, 110, 1.2], [12, 128, 1.2]])}${star(164, 42, 9, '#fde047')}${star(30, 58, 6, '#67e8f9')}`,
  };

  /* ---------- cabeça ---------- */
  const HEAD = {
    redondo: [48, f => `<ellipse cx="100" cy="94" rx="48" ry="49" fill="${f}"/>`],
    oval: [44, f => `<ellipse cx="100" cy="94" rx="44" ry="53" fill="${f}"/>`],
    quadrado: [47, f => `<rect x="53" y="45" width="94" height="98" rx="30" fill="${f}"/>`],
    queixo: [47, f => path('M53 82C53 58 74 45 100 45S147 58 147 82C147 114 122 136 100 146C78 136 53 114 53 82Z', f)],
  };

  /* ---------- cabelo: [atrás da cabeça, na frente] ---------- */
  const CAP = 'M52 90C48 54 72 40 100 40S152 54 148 90C138 66 122 58 100 58S62 66 52 90Z';
  const SHORT = 'M51 92C45 52 70 34 100 34S155 52 149 92C143 76 134 66 122 62C110 68 90 68 78 62C66 66 57 76 51 92Z';
  const HAIR = {
    curto: c => ['', path(SHORT, c)],
    topete: c => ['', path(SHORT, c) + path('M76 46C70 22 90 10 100 10C110 10 130 22 124 46C112 40 88 40 76 46Z', c)],
    cacheado: c => ['', path(CAP, c) + [[56, 80], [55, 63], [66, 50], [81, 41], [100, 38], [119, 41], [134, 50], [145, 63], [144, 80]].map(([x, y]) => circle(x, y, 13, c)).join('')],
    afro: c => [circle(100, 78, 66, c), path(CAP, c)],
    longo: c => [path('M47 94C42 44 70 28 100 28S158 44 153 94C155 130 162 152 168 168C152 180 128 172 126 156H74C72 172 48 180 32 168C38 152 45 130 47 94Z', c), path('M51 90C48 52 72 35 100 35S152 52 149 90C132 84 116 68 100 52C84 68 68 84 51 90Z', c)],
    chanel: c => [path('M46 96C40 44 70 28 100 28S160 44 154 96V132C154 144 138 146 128 136H72C62 146 46 144 46 132Z', c), path('M52 82C54 50 76 36 100 36S146 50 148 82C128 70 72 70 52 82Z', c)],
    coque: c => [circle(100, 30, 21, c), path(CAP, c)],
    rabo: c => [path('M134 52C176 44 190 92 170 136C170 112 158 100 140 96Z', c) + path('M66 52C24 44 10 92 30 136C30 112 42 100 60 96Z', c), path(SHORT, c) + circle(143, 58, 7, '#f472b6') + circle(57, 58, 7, '#f472b6')],
    trancas: c => [[104, 119, 134, 149, 163].map((y, i) => circle(48 - i, y, 11 - i * .6, c) + circle(152 + i, y, 11 - i * .6, c)).join('') + circle(43, 175, 5, '#f472b6') + circle(157, 175, 5, '#f472b6'), path(CAP, c)],
    espetado: c => ['', path('M52 88L45 58L64 63L62 34L83 49L100 18L117 49L138 34L136 63L155 58L148 88C136 66 120 61 100 61S64 66 52 88Z', c)],
    moicano: c => [path(CAP, c).replace('/>', ' opacity=".22"/>'), path('M87 62C79 40 87 18 100 8C113 18 121 40 113 62C106 57 94 57 87 62Z', c)],
    careca: () => ['', ''],
  };
  const TALL = ['topete', 'coque', 'espetado', 'moicano', 'cacheado'];

  /* ---------- rosto ---------- */
  const eye = x => circle(x, 93, 6.5, INK) + circle(x + 2.2, 90.5, 2.2, '#fff');
  const happy = x => line(`M${x - 9} 96Q${x} 83 ${x + 9} 96`, INK);
  const closed = x => line(`M${x - 9} 91Q${x} 101 ${x + 9} 91`, INK);
  const EYES = {
    normal: () => eye(81) + eye(119),
    grandes: () => [81, 119].map(x => `<ellipse cx="${x}" cy="92" rx="11" ry="13" fill="#fff"/>${circle(x, 94, 7, INK)}${circle(x + 2.5, 91, 2.6, '#fff')}`).join(''),
    felizes: () => happy(81) + happy(119),
    piscando: () => [81, 119].map(x => eye(x) + line(`M${x - 8} 86L${x - 12} 83M${x} 84L${x} 80M${x + 8} 86L${x + 12} 83`, INK, 2.6)).join(''),
    sono: () => [81, 119].map(x => path(`M${x - 8} 92A8 8 0 00${x + 8} 92Z`, INK) + line(`M${x - 10} 91H${x + 10}`, INK, 3.5)).join(''),
    fechados: () => closed(81) + closed(119),
    estrela: () => [81, 119].map(x => star(x, 93, 12, GOLD, 'stroke="#92400e" stroke-width="2" stroke-linejoin="round"')).join(''),
  };
  const MOUTHS = {
    sorriso: () => line('M85 117Q100 133 115 117', MOUTH),
    risada: () => path('M82 115Q100 148 118 115Z', MOUTH) + path('M90 128Q100 121 110 128Q100 138 90 128Z', '#fb7185'),
    dentes: () => path('M82 115H118Q115 133 100 133T82 115Z', '#fff', `stroke="${MOUTH}" stroke-width="3" stroke-linejoin="round"`),
    neutro: () => line('M89 121H111', MOUTH),
    uau: () => `<ellipse cx="100" cy="122" rx="8" ry="10" fill="${MOUTH}"/>`,
    lingua: () => path('M91 121Q91 139 100 139T109 121Z', '#fb7185') + line('M100 124V132', '#e11d48', 2) + line('M85 117Q100 129 115 117', MOUTH),
    gatinho: () => line('M86 118Q93 128 100 118Q107 128 114 118', MOUTH),
  };
  const EXTRA = {
    nada: () => ['', ''],
    bochechas: () => [circle(68, 110, 8, '#fb7185', 'opacity=".5"') + circle(132, 110, 8, '#fb7185', 'opacity=".5"'), ''],
    sardas: skin => [[[66, 106], [74, 110], [68, 114], [134, 106], [126, 110], [132, 114]].map(([x, y]) => circle(x, y, 1.8, shade(skin, .68))).join(''), ''],
    pinta: () => [circle(74, 124, 2.6, INK) + circle(126, 124, 2.6, INK), ''],
    bigode: (_, c) => ['', path('M100 111C92 105 82 108 77 118C86 119 94 118 100 114C106 118 114 119 123 118C118 108 108 105 100 111Z', c)],
    barba: (_, c) => [path('M55 100C56 140 80 154 100 154S144 140 145 100C136 117 126 109 116 109Q100 104 84 109C74 109 64 117 55 100Z', c), ''],
  };

  /* ---------- roupa: [atrás de tudo, corpo] ---------- */
  const BODY = 'M34 200C36 168 62 153 100 153S164 168 166 200Z';
  const OUTFIT = {
    camiseta: c => ['', path(BODY, c) + line('M82 155Q100 172 118 155', shade(c, .75), 5)],
    moletom: c => ['', path(BODY, c) + path('M68 158C72 143 84 150 100 150S128 143 132 158C124 172 112 177 100 177S76 172 68 158Z', shade(c, .75)) + line('M90 174V190M110 174V190', '#fff', 3)],
    listras: c => ['', path(BODY, c) + line('M44 178H156M37 192H163', '#fff', 5).replace('/>', ' opacity=".75"/>') + line('M82 155Q100 172 118 155', shade(c, .75), 5)],
    regata: (c, skin) => ['', path(BODY, skin) + path('M62 200V170C66 160 74 157 82 156Q100 184 118 156C126 157 134 160 138 170V200Z', c)],
    social: c => ['', path(BODY, c) + path('M82 154L100 168L88 178L76 160ZM118 154L100 168L112 178L124 160Z', '#fff') + [178, 188].map(y => circle(100, y, 2.6, '#fff')).join('')],
    gola: c => ['', path(BODY, c) + `<rect x="80" y="141" width="40" height="20" rx="9" fill="${shade(c, .82)}"/>`],
    pijama: c => ['', path(BODY, '#312e81') + line('M54 168V200M76 157V200M124 157V200M146 168V200', c, 6) + path('M82 154L100 172L118 154', 'none', 'stroke="#fff" stroke-width="5" stroke-linejoin="round"') + star(100, 188, 8, '#fde68a')],
    capa: c => [path('M52 150C30 170 22 188 18 200H182C178 188 170 170 148 150Z', '#dc2626'), path(BODY.replace('M34 200C36 168 62 153 100 153S164 168 166 200Z', 'M48 200C50 170 68 155 100 155S150 170 152 200Z'), c) + circle(70, 163, 6, GOLD) + circle(130, 163, 6, GOLD) + star(100, 185, 13, GOLD)],
    terno: c => ['', path(BODY, '#263148') + path('M80 154L100 196L120 154Z', '#fff') + path('M100 164L86 157V173ZM100 164L114 157V173Z', c) + circle(100, 165, 4, shade(c, .7)) + line('M84 158Q88 186 100 187Q112 186 116 158', GOLD, 2) + circle(100, 189, 7, GOLD) + circle(100, 189, 4.8, '#fff') + line('M100 186V189H103', INK, 1.5)],
  };

  /* ---------- óculos ---------- */
  const frame = (shape, color, width = 3.5) => shape.replace('/>', ` stroke="${color}" stroke-width="${width}"/>`);
  const lens = (x, r) => circle(x, 93, r, 'rgba(255,255,255,.18)');
  const heart = x => path(`M${x} 108C${x - 24} 92 ${x - 18} 74 ${x - 7} 77C${x - 3} 78 ${x} 82 ${x} 84C${x} 82 ${x + 3} 78 ${x + 7} 77C${x + 18} 74 ${x + 24} 92 ${x} 108Z`, 'rgba(244,114,182,.38)', 'stroke="#db2777" stroke-width="4" stroke-linejoin="round"');
  const GLASSES = {
    nada: () => '',
    redondos: () => frame(lens(80, 15), INK) + frame(lens(120, 15), INK) + line('M95 91Q100 86 105 91', INK, 3.5),
    quadrados: () => [64, 104].map(x => `<rect x="${x}" y="79" width="32" height="27" rx="7" fill="rgba(255,255,255,.18)" stroke="${INK}" stroke-width="3.5"/>`).join('') + line('M96 89H104', INK, 3.5),
    escuros: () => path('M62 82H96V94C96 112 64 112 62 94ZM138 82H104V94C104 112 136 112 138 94Z', '#111827') + line('M94 85H106M70 88L80 86M120 88L130 86', '#fff', 2.5).replace('/>', ' opacity=".7"/>'),
    coracao: () => heart(79) + heart(121) + line('M97 88Q100 85 103 88', '#db2777', 3.5),
    monoculo: () => frame(lens(80, 15), '#d4a017', 3.5) + frame(lens(120, 15), '#d4a017', 3.5) + line('M95 91Q100 86 105 91', '#d4a017', 3.5) + line('M65 91L52 95M135 91L148 95', '#d4a017', 2.5),
    coruja: () => frame(lens(79, 20), '#f59e0b', 6) + frame(lens(121, 20), '#f59e0b', 6) + line('M99 90H101', '#f59e0b', 6) + path('M62 78L54 60L76 72ZM138 78L146 60L124 72Z', '#f59e0b'),
    estrelas: () => [78, 122].map(x => star(x, 93, 24, 'rgba(250,204,21,.42)', 'stroke="#f59e0b" stroke-width="4" stroke-linejoin="round"')).join('') + line('M98 92H102', '#f59e0b'),
  };

  /* ---------- chapéus e enfeites ---------- */
  const HAT = {
    nada: () => '',
    bone: () => path('M52 74C50 40 74 26 100 26S150 40 148 74C132 64 68 64 52 74Z', '#3b6ef6') + line('M100 28V64', '#2749b8', 2) + path('M52 74C76 62 124 62 148 74C150 82 138 84 126 80C112 76 88 76 74 80C62 84 50 82 52 74Z', '#2749b8') + circle(100, 27, 5, '#2749b8'),
    laco: () => path('M100 40L74 28V54ZM100 40L126 28V54Z', '#f43f82', 'stroke="#be185d" stroke-width="2.5" stroke-linejoin="round"') + circle(100, 41, 7.5, '#be185d'),
    faixa: () => line('M54 70Q100 48 146 70', '#22d3ee', 10) + star(100, 59, 8, '#fff'),
    touca: () => path('M52 72C50 38 74 22 100 22S150 38 148 72Z', '#6366f1') + line('M74 36Q100 26 126 36', '#a5b4fc', 5) + line('M51 72Q100 48 149 72', '#eef2ff', 12) + circle(100, 20, 11, '#eef2ff'),
    fone: () => line('M50 92C46 16 154 16 150 92', '#374151', 9) + [38, 140].map(x => `<rect x="${x}" y="76" width="22" height="40" rx="11" fill="#22d3ee"/><rect x="${x + 6}" y="84" width="10" height="24" rx="5" fill="#0e7490"/>`).join(''),
    explorador: () => path('M62 58C62 30 78 20 100 20S138 30 138 58Z', '#c89b5c') + `<ellipse cx="100" cy="60" rx="66" ry="11" fill="#b58648"/>` + line('M64 49Q100 58 136 49', '#6b4a24', 7) + circle(100, 54, 6, GOLD),
    coroa: () => path('M64 56L58 16L80 34L100 8L120 34L142 16L136 56Z', GOLD, 'stroke="#b45309" stroke-width="3" stroke-linejoin="round"') + circle(100, 40, 6, '#ec4899') + circle(80, 45, 4, '#22d3ee') + circle(120, 45, 4, '#22d3ee'),
    aureola: () => `<ellipse cx="100" cy="21" rx="38" ry="11" fill="none" stroke="#fde68a" stroke-width="14" opacity=".35"/><ellipse cx="100" cy="21" rx="38" ry="11" fill="none" stroke="${GOLD}" stroke-width="6"/>` + star(154, 22, 6, '#fff') + star(46, 22, 6, '#fff'),
  };
  const COVERS = ['bone', 'touca', 'explorador'];

  /* view: recorte (para miniaturas); sleep: de olhos fechados */
  const svg = (a, { cls = '', view = '0 0 200 200', sleep = false, label = 'Avatar' } = {}) => {
    const C = Logic.AVATAR_COLORS, skin = C.skin[a.skin], hairColor = C.hairColor[a.hairColor], cloth = C.outfitColor[a.outfitColor];
    const [ear, head] = HEAD[a.head];
    const style = COVERS.includes(a.hat) && TALL.includes(a.hair) ? 'curto' : a.hair;
    const [hairBack, hairFront] = HAIR[style](hairColor);
    const [clothBack, body] = OUTFIT[a.outfit](cloth, skin);
    const [under, over] = EXTRA[a.extra](skin, hairColor);
    const brow = a.hair === 'careca' ? shade(skin, .6) : shade(hairColor, .8);
    const pillow = sleep ? '<ellipse cx="100" cy="156" rx="82" ry="30" fill="#e8eaff"/><ellipse cx="100" cy="150" rx="70" ry="22" fill="#fff" opacity=".7"/>' : '';
    const blanket = sleep ? `${path('M6 200V166Q52 150 100 160Q148 150 194 166V200Z', shade(cloth, .62))}${path('M6 200V166Q52 150 100 160Q148 150 194 166V176Q148 164 100 174Q52 164 6 176Z', shade(cloth, .85))}${line('M6 176Q52 164 100 174Q148 164 194 176', '#fff', 3).replace('/>', ' opacity=".35"/>')}${[40, 100, 160].map(x => star(x, 190, 6, '#fde68a', 'opacity=".8"')).join('')}` : '';
    return `<svg class="avatar ${cls}" viewBox="${view}" role="img" aria-label="${label}">${BG[sleep ? 'lua' : a.bg]()}<g class="av-me">${pillow}${clothBack}${hairBack}
      <rect x="85" y="126" width="30" height="36" rx="12" fill="${shade(skin, .86)}"/>${body}${blanket}
      ${circle(100 - ear, 99, 10, skin)}${circle(100 + ear, 99, 10, skin)}${head(skin)}${under}
      ${line('M70 76Q80 71 91 75M109 75Q120 71 130 76', brow, 3.5)}<g class="av-eyes">${EYES[sleep ? 'fechados' : a.eyes]()}</g>
      ${line('M97 105Q101 110 105 105', shade(skin, .74), 3)}${sleep ? line('M91 120Q100 127 109 120', MOUTH) : MOUTHS[a.mouth]()}${over}
      ${GLASSES[a.glasses]()}${hairFront}${HAT[a.hat]()}</g>
      ${sleep ? '<g class="av-zzz" fill="#fff" font-weight="800" font-family="system-ui, sans-serif"><text x="148" y="66" font-size="22">z</text><text x="164" y="46" font-size="28">z</text><text x="180" y="24" font-size="20">z</text></g>' : ''}</svg>`;
  };

  return { svg };
})();
