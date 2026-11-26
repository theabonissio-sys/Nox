/* NOX: desenho do avatar em SVG, com formas próprias. As opções e travas ficam em logic.js. */
const Avatar = (() => {
  'use strict';
  const INK = '#1d1b2e', MOUTH = '#5b1e2d', GOLD = '#fbbf24';
  let uid = 0;
  const shade = (hex, k) => `#${[1, 3, 5].map(i => Math.round(Math.max(0, Math.min(255, parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, '0')).join('')}`;
  const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  const line = (d, color, width = 4, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const circle = (x, y, r, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const starPts = (x, y, r) => Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI * i / 5 - Math.PI / 2, d = i % 2 ? r * .45 : r;
    return `${(x + Math.cos(a) * d).toFixed(1)},${(y + Math.sin(a) * d).toFixed(1)}`;
  }).join(' ');
  const star = (x, y, r, fill, extra = '') => `<polygon points="${starPts(x, y, r)}" fill="${fill}" stroke-linejoin="round" ${extra}/>`;
  const sparkles = list => list.map(([x, y, r]) => star(x, y, r, '#fff', 'opacity=".85"')).join('');
  const dots = list => list.map(([x, y, r]) => circle(x, y, r, '#fff', 'opacity=".8"')).join('');

  /* ---------- fundo ---------- */
  const tone = (a, b) => n => `<defs><linearGradient id="bg${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="200" height="200" fill="url(#bg${n})"/>${circle(100, 104, 86, '#fff', 'opacity=".13"')}${circle(100, 104, 62, '#fff', 'opacity=".08"')}${circle(34, 36, 5, '#fff', 'opacity=".4"')}${circle(168, 58, 3.5, '#fff', 'opacity=".4"')}${circle(26, 140, 3, '#fff', 'opacity=".3"')}`;
  const BG = {
    roxo: tone('#9a7bff', '#5b3fd6'), azul: tone('#5aa0ff', '#2a56d8'), ciano: tone('#4fe0f0', '#1796b8'), rosa: tone('#ff8cc4', '#d6338f'),
    verde: tone('#58e0b0', '#1a9a6c'), laranja: tone('#ffb25a', '#e5601f'),
    lua: n => `<defs><linearGradient id="bg${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14123f"/><stop offset="1" stop-color="#3b2f86"/></linearGradient></defs><rect width="200" height="200" fill="url(#bg${n})"/>
      ${circle(158, 46, 28, '#fef3c7', 'opacity=".18"')}${circle(158, 46, 22, '#fde68a')}${circle(168, 40, 19, '#2a2466')}${circle(150, 54, 3, '#f5d46a', 'opacity=".7"')}${sparkles([[30, 40, 5], [58, 18, 3.5], [18, 100, 4], [178, 118, 4.5], [40, 142, 3.5], [112, 14, 3.5]])}${dots([[84, 30, 1.5], [136, 22, 1.5], [20, 66, 1.5], [186, 90, 1.5], [60, 168, 1.5]])}`,
    aurora: n => `<defs><linearGradient id="bg${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04182b"/><stop offset="1" stop-color="#0b4a52"/></linearGradient></defs><rect width="200" height="200" fill="url(#bg${n})"/>
      ${line('M-10 84C40 30 84 116 130 66S196 40 215 60', '#34d399', 26, 'opacity=".5"')}${line('M-10 116C50 72 94 140 142 98S198 90 215 102', '#a78bfa', 22, 'opacity=".5"')}${line('M-10 50C40 8 92 68 140 30S198 10 215 24', '#22d3ee', 14, 'opacity=".55"')}${sparkles([[30, 24, 4], [172, 140, 4], [22, 152, 3]])}${dots([[90, 14, 1.4], [150, 90, 1.4], [60, 170, 1.4], [186, 40, 1.4]])}`,
    galaxia: n => `<defs><radialGradient id="bg${n}" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#4c1d95"/><stop offset="1" stop-color="#0d0524"/></radialGradient></defs><rect width="200" height="200" fill="url(#bg${n})"/>
      <ellipse cx="100" cy="92" rx="130" ry="44" fill="#a855f7" opacity=".3" transform="rotate(-28 100 92)"/><ellipse cx="100" cy="92" rx="100" ry="20" fill="#f472b6" opacity=".35" transform="rotate(-28 100 92)"/>${circle(168, 150, 11, '#38bdf8', 'opacity=".9"')}${circle(165, 147, 4, '#e0f2fe', 'opacity=".7"')}${circle(30, 154, 6, '#fb923c', 'opacity=".9"')}
      ${sparkles([[24, 30, 5], [160, 38, 7], [182, 74, 3.5], [18, 84, 3.5], [60, 14, 3], [124, 12, 3]])}${dots([[44, 60, 1.4], [190, 118, 1.4], [14, 124, 1.4], [92, 20, 1.4], [150, 176, 1.4]])}`,
  };

  /* ---------- cabeça ---------- */
  const HEAD = {
    redondo: [48, f => `<ellipse cx="100" cy="94" rx="48" ry="49" fill="${f}"/>`],
    oval: [44, f => `<ellipse cx="100" cy="94" rx="44" ry="53" fill="${f}"/>`],
    quadrado: [47, f => `<rect x="53" y="45" width="94" height="98" rx="30" fill="${f}"/>`],
    queixo: [47, f => path('M53 82C53 58 74 45 100 45S147 58 147 82C147 114 122 136 100 146C78 136 53 114 53 82Z', f)],
  };

  /* ---------- cabelo: [atrás da cabeça, na frente]. A cor chega como gradiente ---------- */
  const CAP = 'M52 90C48 54 72 40 100 40S152 54 148 90C138 66 122 58 100 58S62 66 52 90Z';
  const SHORT = 'M51 92C45 52 70 34 100 34S155 52 149 92C145 80 141 72 134 67C116 74 86 72 70 59C65 70 56 78 51 92Z';
  const HAIR = {
    curto: c => ['', path(SHORT, c)],
    topete: c => ['', path('M52 90C46 56 60 44 78 42C80 22 112 12 138 30C128 29 122 33 122 37C142 44 153 62 148 90C143 74 134 66 126 62C106 69 78 69 64 63C58 71 54 78 52 90Z', c)],
    cacheado: c => ['', path(CAP, c) + [[56, 80], [55, 63], [66, 50], [81, 41], [100, 38], [119, 41], [134, 50], [145, 63], [144, 80]].map(([x, y]) => circle(x, y, 13, c)).join('')],
    afro: c => [circle(100, 78, 66, c), path(CAP, c)],
    longo: c => [path('M47 94C42 44 70 28 100 28S158 44 153 94C155 130 162 152 168 168C152 180 128 172 126 156H74C72 172 48 180 32 168C38 152 45 130 47 94Z', c), path('M51 90C48 52 72 35 100 35S152 52 149 90C135 83 122 68 117 52C106 72 79 84 51 90Z', c)],
    chanel: c => [path('M46 96C40 44 70 28 100 28S160 44 154 96V132C154 144 138 146 128 136H72C62 146 46 144 46 132Z', c), path('M52 82C54 50 76 36 100 36S146 50 148 82C128 70 72 70 52 82Z', c)],
    coque: c => [circle(100, 30, 21, c), path(CAP, c)],
    rabo: c => [path('M134 52C176 44 190 92 170 136C170 112 158 100 140 96Z', c), path(SHORT, c) + circle(143, 58, 7, '#f472b6') + circle(141, 56, 2.4, '#fff', 'opacity=".6"')],
    trancas: c => [[104, 119, 134, 149, 163].map((y, i) => circle(48 - i, y, 11 - i * .6, c) + circle(152 + i, y, 11 - i * .6, c)).join('') + circle(43, 175, 5, '#f472b6') + circle(157, 175, 5, '#f472b6'), path(CAP, c)],
    espetado: c => ['', path('M52 88L45 58L63 62L60 34L81 47L91 20L104 43L123 22L124 47L147 36L138 61L157 62L148 90C136 66 120 61 100 61S64 66 52 88Z', c)],
    moicano: c => [path(CAP, c, 'opacity=".22"'), path('M87 62C79 40 87 18 101 8C117 20 121 40 113 62C104 57 96 57 87 62Z', c)],
    careca: () => ['', ''],
  };
  const TALL = ['topete', 'coque', 'espetado', 'moicano', 'cacheado'];
  // brilho dos fios, no alto do cabelo de cada estilo
  const SHINE = {
    curto: 'M66 56Q88 42 114 46', topete: 'M66 58Q84 48 104 44', cacheado: 'M70 48Q90 38 112 42', afro: 'M56 62Q64 34 98 26', longo: 'M62 52Q86 36 112 42',
    chanel: 'M62 50Q86 34 112 40', coque: 'M66 56Q88 44 114 46', rabo: 'M66 56Q88 42 114 46', trancas: 'M66 56Q88 42 114 46', espetado: 'M72 56Q92 46 112 52', moicano: 'M95 36Q94 24 100 16',
  };

  /* ---------- rosto ---------- */
  const eyeball = (x, rx, ry, ir, n) => `<ellipse cx="${x}" cy="93" rx="${rx}" ry="${ry}" fill="#fff"/>${circle(x, 94, ir, `url(#ir${n})`)}${circle(x, 94, ir * .48, '#120d0a')}${circle(x + ir * .38, 91, ir * .34, '#fff')}${circle(x - ir * .35, 97.5, ir * .15, '#fff', 'opacity=".7"')}${line(`M${x - rx - .5} 90Q${x} ${93 - ry - 4} ${x + rx + .5} 90`, INK, 2.8)}`;
  const happy = x => line(`M${x - 9} 96Q${x} 82 ${x + 9} 96`, INK, 4) + line(`M${x - 10} 94L${x - 13} 91`, INK, 2.4);
  const closed = x => line(`M${x - 9} 91Q${x} 101 ${x + 9} 91`, INK, 4) + line(`M${x - 9} 92L${x - 12} 95M${x + 9} 92L${x + 12} 95`, INK, 2.2);
  const EYES = {
    normal: (_, n) => eyeball(81, 9, 10, 6.4, n) + eyeball(119, 9, 10, 6.4, n),
    grandes: (_, n) => eyeball(81, 11.5, 13, 8.4, n) + eyeball(119, 11.5, 13, 8.4, n),
    felizes: () => happy(81) + happy(119),
    piscando: (_, n) => eyeball(81, 9, 10, 6.4, n) + happy(119),
    sono: (skin, n) => [81, 119].map(x => eyeball(x, 9, 10, 6.4, n) + path(`M${x - 10.5} 93.5A10.5 10.5 0 0 1 ${x + 10.5} 93.5Z`, shade(skin, .95)) + line(`M${x - 10.5} 93.5H${x + 10.5}`, INK, 3)).join(''),
    fechados: () => closed(81) + closed(119),
    estrela: () => [81, 119].map(x => star(x, 93, 13, GOLD, 'stroke="#b45309" stroke-width="2.2"') + star(x - 1.5, 91, 5, '#fff7cc')).join(''),
  };
  const MOUTHS = {
    sorriso: () => line('M85 117Q100 133 115 117', MOUTH, 4) + line('M83 116L81 113M117 116L119 113', MOUTH, 2),
    risada: () => path('M81 114Q100 150 119 114Z', MOUTH) + path('M90 129Q100 121 110 129Q100 139 90 129Z', '#fb7185') + path('M83 115H117Q114 121 100 121T83 115Z', '#fff'),
    dentes: () => path('M82 115H118Q115 134 100 134T82 115Z', '#fff', `stroke="${MOUTH}" stroke-width="3.2" stroke-linejoin="round"`) + line('M100 116V133M91 116.5Q92 130 94 133M109 116.5Q108 130 106 133', '#d6d3e0', 1.3),
    neutro: () => line('M89 122H111', MOUTH, 4),
    uau: () => `<ellipse cx="100" cy="123" rx="8" ry="10" fill="${MOUTH}"/><ellipse cx="100" cy="129" rx="5" ry="4" fill="#fb7185"/>`,
    lingua: () => path('M92 121Q92 140 102 140T112 121Z', '#fb7185') + line('M102 124V132', '#e11d48', 2) + line('M85 117Q100 129 115 117', MOUTH, 4),
    gatinho: () => line('M85 118Q92.5 129 100 118Q107.5 129 115 118', MOUTH, 3.6) + line('M100 111V118', MOUTH, 3),
  };
  const EXTRA = {
    nada: () => ['', ''],
    bochechas: () => [circle(66, 111, 10, '#fb7185', 'opacity=".45"') + circle(134, 111, 10, '#fb7185', 'opacity=".45"') + circle(63, 108, 2.6, '#fff', 'opacity=".5"') + circle(131, 108, 2.6, '#fff', 'opacity=".5"'), ''],
    sardas: skin => [[[64, 104], [72, 108], [66, 113], [74, 115], [126, 115], [134, 113], [128, 108], [136, 104]].map(([x, y]) => circle(x, y, 1.9, shade(skin, .62))).join(''), ''],
    pinta: skin => [circle(124, 124, 3, shade(skin, .45)) + circle(123.2, 123.2, .9, '#fff', 'opacity=".5"'), ''],
    bigode: (_, c) => ['', path('M100 111C93 104 82 107 76 119C86 120 94 118 100 114C106 118 114 120 124 119C118 107 107 104 100 111Z', c) + line('M80 115Q90 110 99 113', '#fff', 1.6, 'opacity=".25"')],
    barba: (_, c) => [path('M54 98C54 142 78 158 100 158S146 142 146 98C140 110 134 114 128 112Q100 104 72 112C66 114 60 110 54 98ZM78 118Q100 111 122 118Q118 137 100 141Q82 137 78 118Z', c, 'fill-rule="evenodd"') + line('M62 124Q66 142 80 150', '#fff', 2, 'opacity=".18"'), ''],
  };

  /* ---------- roupa: [atrás de tudo, corpo]; g = gradiente da cor, k = clip do corpo ---------- */
  const BODY = 'M16 200C16 168 52 149 100 149S184 168 184 200Z';
  const fold = (d, k = 'opacity=".14"') => line(d, '#000', 3, k);
  const OUTFIT = {
    camiseta: (c, skin, g) => ['', path(BODY, g) + fold('M34 196Q40 176 56 166') + fold('M166 196Q160 176 144 166') + path('M80 151Q100 180 120 151Z', shade(skin, .9)) + line('M80 151Q100 180 120 151', shade(c, .72), 5)],
    moletom: (c, skin, g) => ['', path(BODY, g) + fold('M30 192Q38 172 58 164') + fold('M170 192Q162 172 142 164') + path('M80 151Q100 178 120 151Z', shade(skin, .86)) + path('M60 156C62 140 80 146 100 146S138 140 140 156C134 180 116 186 100 186S66 180 60 156ZM82 153Q100 176 118 153Z', shade(c, .78), 'fill-rule="evenodd"') + line('M91 176V194M109 176V194', '#fff', 3) + circle(91, 196, 3, '#fff') + circle(109, 196, 3, '#fff') + path('M70 200V186Q100 178 130 186V200Z', shade(c, .85))],
    listras: (c, skin, g, k) => ['', path(BODY, g) + `<g clip-path="url(#${k})">${[164, 178, 192].map(y => `<rect x="0" y="${y}" width="200" height="7" fill="#fff" opacity=".85"/>`).join('')}</g>` + path('M80 151Q100 180 120 151Z', shade(skin, .9)) + line('M80 151Q100 180 120 151', shade(c, .7), 5)],
    regata: (c, skin, g) => ['', path(BODY, skin) + path('M62 200V176C62 164 72 156 82 152Q100 184 118 152C128 156 138 164 138 176V200Z', g) + line('M82 152Q100 184 118 152', shade(c, .7), 4) + fold('M70 196Q70 178 78 168', 'opacity=".16"')],
    social: (c, skin, g) => ['', path(BODY, g) + path('M82 151L100 170L86 182L72 160ZM118 151L100 170L114 182L128 160Z', '#fff') + line('M100 172V200', shade(c, .7), 2.5) + [180, 190].map(y => circle(100, y, 2.6, '#fff')).join('') + path('M84 151Q100 166 116 151Z', shade(skin, .88)) + fold('M32 196Q40 176 58 166')],
    gola: (c, skin, g) => ['', path(BODY, g) + fold('M32 196Q40 176 58 166') + `<rect x="78" y="136" width="44" height="26" rx="12" fill="${shade(c, .86)}"/>` + [146, 152, 158].map(y => line(`M82 ${y}Q100 ${y + 3} 118 ${y}`, shade(c, .66), 1.6, 'opacity=".7"')).join('')],
    pijama: (c, skin, g, k) => ['', path(BODY, '#3730a3') + `<g clip-path="url(#${k})">${[40, 62, 138, 160].map(x => `<rect x="${x}" y="140" width="9" height="60" fill="${c}" opacity=".85"/>`).join('')}</g>` + path('M82 151L100 176L118 151', 'none', 'stroke="#fff" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"') + path('M84 151Q100 168 116 151Z', shade(skin, .88)) + path('M126 178a10 10 0 1 0 12 14a9 9 0 0 1-12-14Z', '#fde68a') + star(143, 172, 4, '#fde68a')],
    capa: (c, skin, g) => [path('M46 150C22 170 10 188 6 200H194C190 188 178 170 154 150Z', '#b91c1c') + path('M46 150C30 168 22 184 18 200H60C60 176 54 162 46 150Z', '#dc2626'), path('M30 200C32 168 60 152 100 152S168 168 170 200Z', g) + path('M80 153Q100 178 120 153Z', shade(skin, .9)) + line('M80 153Q100 178 120 153', shade(c, .7), 4) + circle(66, 160, 7, GOLD) + circle(134, 160, 7, GOLD) + circle(64, 158, 2.4, '#fff7cc') + line('M66 160Q100 178 134 160', GOLD, 3) + star(100, 187, 14, GOLD, 'stroke="#b45309" stroke-width="2"')],
    terno: (c, skin, g) => ['', path(BODY, '#2b3650') + path('M80 151L100 200L120 151Z', '#fff') + path('M80 151L70 200H86L92 172ZM120 151L130 200H114L108 172Z', '#1e2638') + path('M84 151Q100 168 116 151Z', shade(skin, .88)) + path('M100 164L84 156V172ZM100 164L116 156V172Z', c) + circle(100, 164, 4.4, shade(c, .7)) + path('M124 174H138V180H124Z', '#fff', 'opacity=".9"') + line('M118 178Q126 196 140 192', GOLD, 2) + circle(141, 192, 6.5, GOLD) + circle(141, 192, 4.6, '#fff') + line('M141 189.5V192H143.5', INK, 1.3)],
  };

  /* ---------- óculos: armação com hastes até as orelhas ---------- */
  const arms = (color, w = 3) => line('M66 92L52 96M134 92L148 96', color, w);
  const lensFill = '#bfe9ff';
  const GLASSES = {
    nada: () => '',
    redondos: () => arms(INK) + [80, 120].map(x => circle(x, 93, 15.5, lensFill, 'opacity=".22"') + circle(x, 93, 15.5, 'none', `stroke="${INK}" stroke-width="3.6"`) + line(`M${x - 9} 86Q${x - 5} 82 ${x} 81.5`, '#fff', 2.4, 'opacity=".8"')).join('') + line('M95 91Q100 86 105 91', INK, 3.4),
    quadrados: () => arms(INK) + [64, 104].map(x => `<rect x="${x}" y="79" width="32" height="27" rx="8" fill="${lensFill}" fill-opacity=".22" stroke="${INK}" stroke-width="3.6"/>` + line(`M${x + 6} 86L${x + 14} 84`, '#fff', 2.4, 'opacity=".8"')).join('') + line('M96 88Q100 85 104 88', INK, 3.4),
    escuros: () => arms('#0f172a') + path('M61 82H97Q98 108 82 110Q64 110 61 82ZM103 82H139Q136 110 118 110Q102 108 103 82Z', '#0f172a') + line('M96 86H104', '#0f172a', 3.4) + path('M66 86H80L72 104Q67 100 66 86ZM108 86H122L114 104Q109 100 108 86Z', '#fff', 'opacity=".16"') + line('M67 84H93', '#fff', 2, 'opacity=".5"'),
    coracao: () => arms('#be185d') + [79, 121].map(x => path(`M${x} 108C${x - 24} 94 ${x - 20} 75 ${x - 8} 77C${x - 3} 78 ${x} 82 ${x} 85C${x} 82 ${x + 3} 78 ${x + 8} 77C${x + 20} 75 ${x + 24} 94 ${x} 108Z`, 'rgba(251,113,160,.35)', 'stroke="#be185d" stroke-width="4" stroke-linejoin="round"') + line(`M${x - 13} 83Q${x - 10} 80 ${x - 6} 80`, '#fff', 2.2, 'opacity=".8"')).join('') + line('M98 86Q100 84 102 86', '#be185d', 3.4),
    monoculo: () => circle(120, 93, 16, lensFill, 'opacity=".2"') + circle(120, 93, 16, 'none', 'stroke="#d4a017" stroke-width="4"') + circle(120, 93, 16, 'none', 'stroke="#fde68a" stroke-width="1.2" opacity=".7"') + line('M112 85Q116 81 121 81', '#fff', 2.4, 'opacity=".85"') + circle(120, 109.6, 2.6, '#d4a017'),
    coruja: () => arms('#f59e0b', 4) + [79, 121].map(x => circle(x, 93, 18, lensFill, 'opacity=".22"') + circle(x, 93, 18, 'none', 'stroke="#f59e0b" stroke-width="5.5"') + circle(x, 93, 18, 'none', 'stroke="#fde68a" stroke-width="1.4" opacity=".7"') + line(`M${x - 11} 85Q${x - 7} 80 ${x - 1} 79`, '#fff', 2.4, 'opacity=".8"')).join('') + line('M96 91Q100 86 104 91', '#f59e0b', 5),
    estrelas: () => arms('#f59e0b', 3.4) + [79, 121].map(x => star(x, 94, 20, 'rgba(250,204,21,.34)', 'stroke="#f59e0b" stroke-width="4"') + star(x - 3, 91, 5, '#fff', 'opacity=".55"')).join('') + line('M96 91Q100 88 104 91', '#f59e0b', 3.4),
  };

  /* ---------- chapéus e enfeites ---------- */
  const HAT = {
    nada: () => '',
    bone: n => `<defs><linearGradient id="hb${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ea2ff"/><stop offset="1" stop-color="#2f62e0"/></linearGradient></defs>`
      + path('M52 76C48 40 76 22 100 22S152 40 148 76C132 66 70 66 52 76Z', `url(#hb${n})`) + line('M100 24C96 40 96 56 99 68M76 32C70 44 68 58 70 70M124 32C130 44 132 58 130 70', '#1e40af', 1.6, 'opacity=".5"')
      + circle(100, 24, 5, '#2f62e0') + path('M52 76C74 62 126 62 148 76C152 86 138 88 126 83C112 79 88 79 74 83C62 88 48 86 52 76Z', '#1e40af') + line('M62 76Q100 66 138 76', '#93b8ff', 2, 'opacity=".6"') + star(100, 50, 8, '#fff', 'opacity=".9"'),
    laco: () => path('M133 50L108 36V64Z', '#f43f82', 'stroke="#be185d" stroke-width="2.5" stroke-linejoin="round"') + path('M133 50L158 36V64Z', '#f43f82', 'stroke="#be185d" stroke-width="2.5" stroke-linejoin="round"') + line('M114 44L124 49M152 44L142 49', '#fff', 2, 'opacity=".5"') + path('M130 54L122 74L130 70L134 78L137 56Z', '#e11d6a') + circle(133, 50, 8, '#be185d') + circle(131, 48, 2.6, '#fda4c8'),
    faixa: () => line('M54 72Q100 46 146 72', '#0aa5c6', 12) + line('M54 70Q100 44 146 70', '#22d3ee', 9) + line('M64 62Q82 54 98 53', '#fff', 2.2, 'opacity=".6"') + star(122, 57, 9, '#fff', 'stroke="#0aa5c6" stroke-width="1.5"') + star(86, 55, 5, '#fff', 'opacity=".85"'),
    touca: n => `<defs><linearGradient id="ht${n}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b9bff"/><stop offset="1" stop-color="#4338ca"/></linearGradient></defs>`
      + path('M49 80C44 38 78 16 106 18C140 22 158 54 160 96C150 92 142 86 138 80Z', `url(#ht${n})`) + star(78, 42, 5, '#fde68a') + star(120, 38, 4, '#fde68a') + star(104, 58, 3, '#fde68a') + circle(88, 30, 1.8, '#fff')
      + path('M46 78C70 58 128 58 154 78L152 96C126 76 74 76 48 96Z', '#f1f5ff') + [60, 74, 88, 102, 116, 130, 144].map(x => line(`M${x} ${74 + Math.abs(x - 100) / 8}V${86 + Math.abs(x - 100) / 8}`, '#c7d2fe', 1.6, 'opacity=".9"')).join('')
      + path('M154 90C166 98 170 110 166 124', 'none', 'stroke="#4338ca" stroke-width="12" stroke-linecap="round"') + circle(166, 128, 10, '#fff') + circle(163, 125, 3, '#e0e7ff'),
    fone: () => line('M52 98C48 20 152 20 148 98', '#1f2937', 9) + line('M58 74C70 36 130 36 142 74', '#4b5563', 2, 'opacity=".7"')
      + [[44, 1], [156, -1]].map(([x, s]) => `<ellipse cx="${x}" cy="102" rx="12" ry="18" fill="#22d3ee"/><ellipse cx="${x}" cy="102" rx="12" ry="18" fill="none" stroke="#0e7490" stroke-width="2.5"/><ellipse cx="${x}" cy="102" rx="6" ry="11" fill="#0e7490"/>${line(`M${x - 4 * s} 90Q${x - 6 * s} 96 ${x - 5 * s} 100`, '#fff', 2.2, 'opacity=".6"')}`).join('') + line('M44 120Q48 138 70 142', '#1f2937', 3),
    explorador: () => path('M62 62C60 30 78 18 100 18S140 30 138 62Z', '#c89b5c') + path('M62 62C60 40 70 26 84 22C76 34 74 50 76 62Z', '#e1b87a', 'opacity=".5"') + '<ellipse cx="100" cy="62" rx="68" ry="12" fill="#b58648"/><ellipse cx="100" cy="60" rx="68" ry="11" fill="none" stroke="#e1b87a" stroke-width="1.6" opacity=".7"/>' + line('M63 52Q100 62 137 52', '#6b4a24', 8) + circle(100, 56, 6, GOLD) + circle(98.5, 54.5, 2, '#fff7cc') + path('M118 56C132 40 146 34 156 36C148 44 138 52 126 58Z', '#ef4444') + line('M124 54C136 44 146 40 152 38', '#fca5a5', 1.4),
    coroa: () => path('M62 58L56 14L80 34L100 6L120 34L144 14L138 58Z', GOLD, 'stroke="#b45309" stroke-width="3" stroke-linejoin="round"') + path('M66 50H134V58H66Z', '#f59e0b') + path('M68 20L78 36L74 50Z', '#fff7cc', 'opacity=".55"') + circle(100, 36, 7, '#ec4899') + circle(98.4, 34.4, 2.2, '#fff', 'opacity=".8"') + circle(80, 44, 4.4, '#22d3ee') + circle(120, 44, 4.4, '#22d3ee') + circle(56, 14, 3.4, '#fff7cc') + circle(144, 14, 3.4, '#fff7cc') + circle(100, 6, 3.4, '#fff7cc'),
    aureola: () => '<ellipse cx="100" cy="22" rx="42" ry="12" fill="#fde68a" opacity=".28"/>' + '<ellipse cx="100" cy="22" rx="38" ry="10.5" fill="none" stroke="#f59e0b" stroke-width="8"/><ellipse cx="100" cy="22" rx="38" ry="10.5" fill="none" stroke="#fde047" stroke-width="5"/><path d="M68 19Q80 13 96 12" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>' + star(156, 34, 7, '#fff') + star(46, 18, 5, '#fff') + star(166, 12, 3.5, '#fff', 'opacity=".8"'),
  };
  const COVERS = ['bone', 'touca', 'explorador'];

  /* view: recorte (para miniaturas); sleep: de olhos fechados */
  const svg = (a, { cls = '', view = '0 0 200 200', sleep = false, label = 'Avatar' } = {}) => {
    const n = ++uid, C = Logic.AVATAR_COLORS, skin = C.skin[a.skin], hairColor = C.hairColor[a.hairColor], cloth = C.outfitColor[a.outfitColor];
    const [ear, head] = HEAD[a.head];
    const style = COVERS.includes(a.hat) && TALL.includes(a.hair) ? 'curto' : a.hair;
    const [hairBack, hairFront] = HAIR[style](`url(#hg${n})`);
    const [clothBack, body] = OUTFIT[a.outfit](cloth, skin, `url(#cl${n})`, `bc${n}`);
    const [under, over] = EXTRA[a.extra](skin, `url(#hg${n})`);
    const brow = a.hair === 'careca' ? shade(skin, .6) : shade(hairColor, .78);
    const shine = style !== 'careca' && SHINE[style] ? line(SHINE[style], '#fff', 3.6, 'opacity=".28"') : '';
    return `<svg class="avatar ${cls}" viewBox="${view}" role="img" aria-label="${label}"><defs>
      <radialGradient id="sk${n}" cx=".4" cy=".3" r=".85"><stop offset="0" stop-color="${shade(skin, 1.07)}"/><stop offset="1" stop-color="${shade(skin, .9)}"/></radialGradient>
      <linearGradient id="hg${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hairColor, 1.22)}"/><stop offset="1" stop-color="${shade(hairColor, .8)}"/></linearGradient>
      <linearGradient id="cl${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(cloth, 1.14)}"/><stop offset="1" stop-color="${shade(cloth, .84)}"/></linearGradient>
      <radialGradient id="ir${n}" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#9a6a42"/><stop offset="1" stop-color="#3a2415"/></radialGradient>
      <clipPath id="hc${n}">${head('#000')}</clipPath><clipPath id="bc${n}"><path d="${BODY}"/></clipPath></defs>
      ${BG[a.bg](n)}<g class="av-me">${clothBack}${hairBack}
      <rect x="85" y="124" width="30" height="40" rx="12" fill="${shade(skin, .86)}"/><ellipse cx="100" cy="143" rx="22" ry="9" fill="${shade(skin, .66)}" opacity=".5"/>${body}
      ${circle(100 - ear, 99, 10, shade(skin, .96))}${circle(100 + ear, 99, 10, shade(skin, .96))}${circle(100 - ear, 99, 5, shade(skin, .82))}${circle(100 + ear, 99, 5, shade(skin, .82))}${head(`url(#sk${n})`)}
      <g clip-path="url(#hc${n})"><ellipse cx="100" cy="150" rx="44" ry="14" fill="#000" opacity=".07"/>${circle(66, 111, 9, '#fb7185', 'opacity=".22"')}${circle(134, 111, 9, '#fb7185', 'opacity=".22"')}</g>${under}
      ${line('M70 77Q80 71 91 75M109 75Q120 71 130 77', brow, 4)}<g class="av-eyes">${EYES[sleep ? 'fechados' : a.eyes](skin, n)}</g>
      ${line('M96 104Q101 110 106 104', shade(skin, .7), 3.2)}${circle(101, 102, 2.2, '#fff', 'opacity=".28"')}${sleep ? MOUTHS.uau().replace('rx="8" ry="10"', 'rx="5" ry="6"').replace(/<ellipse cx="100" cy="129"[^>]*>/, '') : MOUTHS[a.mouth]()}${over}
      ${GLASSES[a.glasses]()}${hairFront}${shine}${HAT[a.hat](n)}</g>
      ${sleep ? '<g class="av-zzz" fill="#fff" font-weight="800" font-family="system-ui, sans-serif"><text x="148" y="66" font-size="22">z</text><text x="164" y="46" font-size="28">z</text><text x="180" y="24" font-size="20">z</text></g>' : ''}</svg>`;
  };

  return { svg };
})();
