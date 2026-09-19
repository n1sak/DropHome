/**
 * Tiny SVG "photos" for the sample house, so a fresh install has something to
 * look at without shipping anyone's real pictures. They are rasterized to
 * JPEG when the house is first furnished, so they behave like camera photos.
 */

export type Scene =
  | 'sunset' | 'mountains' | 'beach' | 'cake' | 'snow' | 'campfire' | 'city' | 'picnic'
  | 'campus' | 'kidart' | 'moodboard' | 'headshot' | 'screenshot' | 'poster' | 'graduation' | 'lake' | 'yearbook';

const wrap = (body: string, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

const grad = (id: string, stops: [number, string][], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

function dots(n: number, seed: number, fn: (x: number, y: number, r: number, i: number) => string): string {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  let out = '';
  for (let i = 0; i < n; i++) out += fn(rnd() * 800, rnd() * 600, rnd(), i);
  return out;
}

const pine = (x: number, y: number, s: number, fill: string) =>
  `<polygon points="${x},${y - 90 * s} ${x - 34 * s},${y - 30 * s} ${x - 14 * s},${y - 30 * s} ${x - 44 * s},${y + 20 * s} ${x + 44 * s},${y + 20 * s} ${x + 14 * s},${y - 30 * s} ${x + 34 * s},${y - 30 * s}" fill="${fill}"/><rect x="${x - 5 * s}" y="${y + 20 * s}" width="${10 * s}" height="${22 * s}" fill="#5b4030"/>`;

export const SCENES: Record<Scene, () => string> = {
  sunset: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/><circle cx="400" cy="330" r="92" fill="#ffd27a"/><rect y="360" width="800" height="240" fill="url(#w)"/>` +
        [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${330 - i * 22}" y="${384 + i * 32}" width="${140 + i * 44}" height="9" rx="4" fill="#ffd27a" opacity="${0.75 - i * 0.1}"/>`).join('') +
        `<path d="M0 360 L120 340 L210 360 Z" fill="#3b2a4f"/><rect x="560" y="300" width="240" height="14" fill="#2c2038"/>` +
        [580, 640, 700, 760].map((x) => `<rect x="${x}" y="312" width="9" height="80" fill="#2c2038"/>`).join(''),
      grad('s', [[0, '#3f2b63'], [0.5, '#e0637a'], [1, '#ffb36b']]) + grad('w', [[0, '#c9587a'], [1, '#2e2a5a']]),
    ),
  mountains: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/><circle cx="600" cy="170" r="60" fill="#fff1c9"/>` +
        `<path d="M0 420 L160 220 L300 380 L420 190 L600 400 L700 300 L800 380 L800 600 L0 600 Z" fill="#8fa3c8"/>` +
        `<path d="M420 190 L470 250 L440 245 L420 270 L398 244 L372 250 Z" fill="#ffffff"/><path d="M160 220 L196 266 L170 262 L152 282 L130 258 Z" fill="#ffffff"/>` +
        `<path d="M0 470 L200 360 L380 470 L560 380 L800 480 L800 600 L0 600 Z" fill="#5f7aa6"/><path d="M0 520 L260 450 L520 530 L800 470 L800 600 L0 600 Z" fill="#35507a"/>` +
        pine(120, 520, 0.8, '#1f3a4f') + pine(200, 540, 1, '#1f3a4f') + pine(660, 520, 0.9, '#1f3a4f'),
      grad('s', [[0, '#9cc8ee'], [0.7, '#ffe3c4'], [1, '#ffd0a8']]),
    ),
  beach: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/><rect y="300" width="800" height="110" fill="#3fa7c4"/><rect y="330" width="800" height="8" fill="#ffffff" opacity=".5"/><rect y="372" width="800" height="6" fill="#ffffff" opacity=".4"/>` +
        `<path d="M0 410 Q400 380 800 410 L800 600 L0 600 Z" fill="#f3d9a4"/><circle cx="660" cy="110" r="52" fill="#fff3b8"/>` +
        `<rect x="296" y="300" width="8" height="200" fill="#7a5a3a" transform="rotate(8 300 400)"/><path d="M150 330 Q300 170 460 300 Z" fill="#e2574c"/><path d="M230 264 Q300 170 300 300 Z" fill="#ffffff"/><path d="M380 250 Q320 180 306 300 Z" fill="#ffffff"/>` +
        `<rect x="330" y="490" width="170" height="26" rx="6" fill="#3a7bd5" transform="rotate(-4 400 500)"/><circle cx="590" cy="500" r="30" fill="#ffffff"/><path d="M560 500 A30 30 0 0 1 620 500 Z" fill="#f2b134"/>`,
      grad('s', [[0, '#6ec3f4'], [1, '#d6f1ff']]),
    ),
  cake: () =>
    wrap(
      `<rect width="800" height="600" fill="#3a2440"/>` +
        dots(34, 11, (x, y, r) => `<circle cx="${x}" cy="${y * 0.7}" r="${14 + r * 30}" fill="${['#ffcf7a', '#ff9ec4', '#9ed0ff'][Math.floor(r * 3)]}" opacity="${0.12 + r * 0.2}"/>`) +
        `<ellipse cx="400" cy="520" rx="250" ry="26" fill="#f4ede2"/><rect x="220" y="380" width="360" height="130" rx="14" fill="#f7a7bd"/><rect x="220" y="380" width="360" height="34" rx="14" fill="#fff6ee"/>` +
        [250, 300, 350, 400, 450, 500, 550].map((x) => `<circle cx="${x}" cy="414" r="15" fill="#fff6ee"/>`).join('') +
        `<rect x="280" y="290" width="240" height="96" rx="12" fill="#ffd27a"/><rect x="280" y="290" width="240" height="26" rx="12" fill="#fff6ee"/>` +
        [320, 360, 400, 440, 480].map((x, i) => `<rect x="${x - 4}" y="236" width="8" height="56" fill="${['#7ec8e3', '#ff8fab', '#b8e986', '#ffb86b', '#c9a0ff'][i]}"/><path d="M${x} 206 Q${x + 11} 226 ${x} 238 Q${x - 11} 226 ${x} 206 Z" fill="#ffd34d"/>`).join('') +
        dots(40, 5, (x, y, r, i) => `<rect x="${x}" y="${y}" width="10" height="5" fill="${['#7ec8e3', '#ff8fab', '#b8e986', '#ffd34d'][i % 4]}" transform="rotate(${r * 180} ${x} ${y})"/>`),
    ),
  snow: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/><circle cx="640" cy="130" r="46" fill="#f6f1d8"/><path d="M0 430 Q200 350 420 430 T800 410 L800 600 L0 600 Z" fill="#dfe9f5"/><path d="M0 500 Q260 440 520 510 T800 490 L800 600 L0 600 Z" fill="#ffffff"/>` +
        pine(150, 440, 1.1, '#24485a') + pine(260, 470, 0.8, '#1d3c4c') + pine(610, 450, 1.2, '#24485a') + pine(700, 480, 0.8, '#1d3c4c') +
        `<rect x="372" y="400" width="96" height="76" fill="#8a4f3d"/><polygon points="356,404 420,352 484,404" fill="#f4f7fb"/><rect x="408" y="436" width="24" height="40" fill="#ffd27a"/>` +
        dots(90, 3, (x, y, r) => `<circle cx="${x}" cy="${y}" r="${1.5 + r * 3}" fill="#ffffff" opacity="${0.5 + r * 0.5}"/>`),
      grad('s', [[0, '#15213f'], [1, '#41608f']]),
    ),
  campfire: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/>` +
        dots(70, 9, (x, y, r) => `<circle cx="${x}" cy="${y * 0.6}" r="${0.8 + r * 1.8}" fill="#ffffff" opacity="${0.4 + r * 0.6}"/>`) +
        `<path d="M0 440 Q400 400 800 440 L800 600 L0 600 Z" fill="#1c2a24"/>` + pine(90, 420, 1.3, '#0f1b17') + pine(720, 430, 1.4, '#0f1b17') +
        `<polygon points="520,470 610,330 700,470" fill="#d9773d"/><polygon points="610,330 610,470 650,470" fill="#a8562a"/>` +
        `<circle cx="330" cy="470" r="120" fill="#ff9d3c" opacity=".16"/><path d="M330 370 Q380 440 350 480 Q380 470 372 500 L288 500 Q280 470 310 480 Q280 440 330 370 Z" fill="#ff8a2b"/><path d="M330 420 Q356 460 340 490 L318 490 Q304 460 330 420 Z" fill="#ffd34d"/>` +
        `<rect x="270" y="496" width="120" height="16" rx="8" fill="#4a3324" transform="rotate(-8 330 504)"/><rect x="270" y="496" width="120" height="16" rx="8" fill="#5b4030" transform="rotate(9 330 504)"/>`,
      grad('s', [[0, '#080d1f'], [1, '#1d2b4f']]),
    ),
  city: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/><circle cx="150" cy="130" r="40" fill="#fdf3d0"/>` +
        [[0, 300, 90], [80, 220, 110], [180, 330, 80], [250, 170, 120], [360, 280, 100], [450, 210, 90], [530, 310, 110], [630, 190, 100], [720, 290, 80]]
          .map(([x, y, w], i) => `<rect x="${x}" y="${y}" width="${w}" height="${600 - y}" fill="${i % 2 ? '#1b2440' : '#232e52'}"/>` + dots(16, i + 2, (dx, dy, r) => (r > 0.35 ? `<rect x="${x + 10 + ((dx / 800) * (w - 26))}" y="${y + 14 + (dy / 600) * (560 - y)}" width="9" height="12" fill="#ffd98a" opacity="${0.5 + r * 0.5}"/>` : '')))
          .join('') +
        `<rect y="560" width="800" height="40" fill="#0f1528"/>`,
      grad('s', [[0, '#2a2359'], [0.6, '#b0507a'], [1, '#f2a65a']]),
    ),
  picnic: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/><circle cx="120" cy="110" r="50" fill="#fff3b8"/><path d="M0 330 Q400 280 800 330 L800 600 L0 600 Z" fill="#8cc774"/>` +
        `<rect x="590" y="150" width="26" height="220" fill="#7a5a3a"/><circle cx="600" cy="150" r="110" fill="#5da05a"/><circle cx="680" cy="200" r="70" fill="#6db36a"/>` +
        `<g transform="translate(230 400) skewX(-18)"><rect width="330" height="130" fill="#ffffff"/>` +
        [0, 1, 2, 3, 4, 5].map((i) => [0, 1, 2].map((j) => ((i + j) % 2 ? '' : `<rect x="${i * 55}" y="${j * 43.3}" width="55" height="43.3" fill="#e2574c"/>`)).join('')).join('') +
        `</g><rect x="300" y="370" width="90" height="60" rx="8" fill="#c8965a"/><path d="M300 372 Q345 320 390 372" fill="none" stroke="#a87742" stroke-width="8"/><circle cx="450" cy="440" r="22" fill="#f2b134"/><circle cx="490" cy="455" r="16" fill="#e2574c"/>`,
      grad('s', [[0, '#7fc8f8'], [1, '#e2f4ff']]),
    ),
  campus: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/><rect y="470" width="800" height="130" fill="#86b86c"/><path d="M330 600 L380 470 L420 470 L470 600 Z" fill="#d9cfc0"/>` +
        `<rect x="140" y="260" width="520" height="220" fill="#b89a7a"/><rect x="350" y="120" width="100" height="360" fill="#a88a6a"/><polygon points="340,124 400,40 460,124" fill="#5a6b8c"/>` +
        `<polygon points="130,264 250,190 370,264" fill="#5a6b8c"/><polygon points="430,264 550,190 670,264" fill="#5a6b8c"/>` +
        [170, 230, 290, 480, 540, 600].map((x) => `<path d="M${x} 400 L${x} 330 Q${x + 18} 300 ${x + 36} 330 L${x + 36} 400 Z" fill="#33405c"/>`).join('') +
        `<path d="M376 480 L376 400 Q400 366 424 400 L424 480 Z" fill="#4a3324"/><circle cx="400" cy="200" r="22" fill="#f4ede2"/>` +
        `<circle cx="70" cy="400" r="70" fill="#e08a3c"/><rect x="62" y="440" width="16" height="60" fill="#5b4030"/><circle cx="740" cy="410" r="62" fill="#d9603a"/><rect x="732" y="440" width="16" height="60" fill="#5b4030"/>` +
        `<rect x="250" y="286" width="300" height="40" fill="#1f3a8a"/><text x="400" y="314" font-family="Georgia, serif" font-size="24" fill="#ffffff" text-anchor="middle">WELCOME, CLASS OF 2029</text>`,
      grad('s', [[0, '#8fc4f0'], [1, '#e8f4fb']]),
    ),
  kidart: () =>
    wrap(
      `<rect width="800" height="600" fill="#fdfbf3"/><circle cx="660" cy="120" r="64" fill="none" stroke="#f2b134" stroke-width="16"/>` +
        [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="${660 + Math.cos((a * Math.PI) / 180) * 84}" y1="${120 + Math.sin((a * Math.PI) / 180) * 84}" x2="${660 + Math.cos((a * Math.PI) / 180) * 122}" y2="${120 + Math.sin((a * Math.PI) / 180) * 122}" stroke="#f2b134" stroke-width="12" stroke-linecap="round"/>`).join('') +
        `<path d="M6 500 Q200 470 400 500 T796 490" fill="none" stroke="#5da05a" stroke-width="22" stroke-linecap="round"/>` +
        `<path d="M210 490 L214 300 L430 296 L436 490 Z" fill="none" stroke="#e2574c" stroke-width="14" stroke-linejoin="round"/><path d="M190 306 L322 176 L456 300" fill="none" stroke="#3a7bd5" stroke-width="14" stroke-linejoin="round" stroke-linecap="round"/>` +
        `<path d="M296 490 L298 392 L352 390 L354 490" fill="none" stroke="#7a5a3a" stroke-width="12"/><rect x="238" y="330" width="52" height="48" fill="none" stroke="#3a7bd5" stroke-width="10"/>` +
        [[540, '#8a4fd3'], [610, '#e2574c'], [680, '#3a7bd5']].map(([x, c], i) => `<circle cx="${x}" cy="${390 - i * 14}" r="${24 - i * 3}" fill="none" stroke="${c}" stroke-width="9"/><path d="M${x} ${414 - i * 14} L${x} 470 M${x} 430 L${Number(x) - 26} 450 M${x} 430 L${Number(x) + 26} 450 M${x} 470 L${Number(x) - 20} 500 M${x} 470 L${Number(x) + 20} 500" stroke="${c}" stroke-width="9" stroke-linecap="round" fill="none"/>`).join(''),
    ),
  moodboard: () =>
    wrap(
      `<rect width="800" height="600" fill="#f2efe8"/>` +
        [['#d9a88a', 30, 30, 240, 300], ['#2f4858', 290, 30, 220, 160], ['#a8c3a0', 530, 30, 240, 220], ['#f0d9a7', 290, 210, 220, 120], ['#c46b52', 530, 270, 240, 140], ['#e7e0d2', 30, 350, 360, 220], ['#7a8f7a', 410, 430, 170, 140], ['#ece4d4', 600, 430, 170, 140]]
          .map(([c, x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`).join('') +
        `<path d="M90 300 L90 170 Q150 90 210 170 L210 300 Z" fill="#f6efe4"/><circle cx="640" cy="130" r="56" fill="#f6efe4" opacity=".8"/>` +
        `<path d="M70 540 Q160 380 250 540" fill="none" stroke="#2f4858" stroke-width="5"/><path d="M160 540 L160 430 M160 470 Q130 450 124 420 M160 490 Q196 470 204 440" stroke="#5a7a5a" stroke-width="5" fill="none"/>` +
        [0, 1, 2, 3, 4].map((i) => `<circle cx="${636 + i * 26}" cy="500" r="10" fill="${['#d9a88a', '#2f4858', '#a8c3a0', '#c46b52', '#f0d9a7'][i]}"/>`).join(''),
    ),
  headshot: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/><path d="M180 600 Q200 420 400 400 Q600 420 620 600 Z" fill="#2f4858"/><path d="M340 430 L400 500 L460 430 L440 400 L360 400 Z" fill="#f4ede2"/>` +
        `<rect x="364" y="330" width="72" height="90" rx="30" fill="#c9966b"/><ellipse cx="400" cy="270" rx="92" ry="108" fill="#d9a87c"/><path d="M304 262 Q300 140 400 146 Q506 140 496 270 Q470 200 400 196 Q330 200 304 262 Z" fill="#2a1d1a"/>`,
      grad('s', [[0, '#c9d8e6'], [1, '#8ea6bd']]),
    ),
  screenshot: () =>
    wrap(
      `<rect width="800" height="600" fill="#dfe3ea"/><rect x="40" y="40" width="720" height="520" rx="12" fill="#ffffff"/><rect x="40" y="40" width="720" height="44" rx="12" fill="#eceff4"/>` +
        `<circle cx="70" cy="62" r="8" fill="#ff5f57"/><circle cx="96" cy="62" r="8" fill="#febc2e"/><circle cx="122" cy="62" r="8" fill="#28c840"/><rect x="40" y="84" width="180" height="476" fill="#f5f6f9"/>` +
        [0, 1, 2, 3, 4, 5].map((i) => `<rect x="62" y="${112 + i * 38}" width="${110 + ((i * 37) % 40)}" height="12" rx="6" fill="${i === 1 ? '#3a7bd5' : '#cdd3de'}"/>`).join('') +
        `<rect x="250" y="116" width="300" height="22" rx="6" fill="#2a2f45"/>` +
        [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="250" y="${166 + i * 30}" width="${440 - ((i * 53) % 160)}" height="11" rx="5" fill="#d5dae3"/>`).join('') +
        `<rect x="250" y="400" width="200" height="120" rx="8" fill="#e8f0fe"/><rect x="470" y="400" width="200" height="120" rx="8" fill="#fef3e2"/>`,
    ),
  poster: () =>
    wrap(
      `<rect width="800" height="600" fill="#e9e2d5"/><polygon points="40,90 250,60 250,560 40,530" fill="#ffffff" stroke="#c9c0ae" stroke-width="3"/><rect x="250" y="60" width="300" height="500" fill="#ffffff" stroke="#c9c0ae" stroke-width="3"/><polygon points="550,60 760,90 760,530 550,560" fill="#ffffff" stroke="#c9c0ae" stroke-width="3"/>` +
        `<rect x="270" y="80" width="260" height="56" fill="#2f6f4f"/><text x="400" y="118" font-family="Verdana, sans-serif" font-size="22" fill="#ffffff" text-anchor="middle">DO PLANTS LIKE MUSIC?</text>` +
        [0, 1, 2, 3].map((i) => `<rect x="${292 + i * 56}" y="${400 - [90, 150, 120, 200][i]}" width="36" height="${[90, 150, 120, 200][i]}" fill="${['#8cc774', '#5da05a', '#8cc774', '#2f6f4f'][i]}"/>`).join('') +
        `<line x1="280" y1="400" x2="520" y2="400" stroke="#2a2f45" stroke-width="3"/>` +
        [0, 1, 2, 3, 4].map((i) => `<rect x="70" y="${150 + i * 34}" width="${150 - ((i * 23) % 50)}" height="10" fill="#cfc8b8" transform="skewY(-8)"/>`).join('') +
        `<circle cx="655" cy="250" r="60" fill="#f2b134" opacity=".8"/><path d="M655 400 L655 300 M655 340 Q620 320 612 290 M655 360 Q694 340 700 306" stroke="#2f6f4f" stroke-width="8" fill="none"/><rect x="620" y="400" width="70" height="50" fill="#c8965a"/>`,
    ),
  graduation: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/>` +
        dots(7, 21, (x, y, r, i) => {
          const cx = 90 + i * 100;
          const cy = 120 + r * 260;
          const rot = -30 + r * 60;
          return `<g transform="rotate(${rot} ${cx} ${cy})"><polygon points="${cx},${cy - 26} ${cx + 66},${cy} ${cx},${cy + 26} ${cx - 66},${cy}" fill="#1b2440"/><rect x="${cx - 26}" y="${cy + 6}" width="52" height="26" fill="#232e52"/><path d="M${cx} ${cy} L${cx + 44} ${cy + 18} L${cx + 44} ${cy + 50}" stroke="#f2b134" stroke-width="4" fill="none"/></g>`;
        }) +
        `<path d="M0 600 L0 520 Q400 470 800 520 L800 600 Z" fill="#5da05a"/>`,
      grad('s', [[0, '#3f8fe0'], [1, '#cfe9ff']]),
    ),
  lake: () =>
    wrap(
      `<rect width="800" height="600" fill="url(#s)"/><circle cx="250" cy="190" r="70" fill="#ffe2a8"/><path d="M0 330 L180 250 L340 330 L520 230 L800 330 Z" fill="#6b5b8a"/><rect y="330" width="800" height="270" fill="url(#w)"/>` +
        [0, 1, 2, 3, 4].map((i) => `<rect x="${190 - i * 12}" y="${356 + i * 36}" width="${120 + i * 24}" height="8" rx="4" fill="#ffe2a8" opacity="${0.7 - i * 0.12}"/>`).join('') +
        `<path d="M520 470 Q600 440 690 470 L670 500 L540 500 Z" fill="#7a3f2a"/><line x1="600" y1="470" x2="600" y2="360" stroke="#3b2a1f" stroke-width="5"/><polygon points="604,366 604,450 670,450" fill="#fff6ee"/>`,
      grad('s', [[0, '#f59e7a'], [0.6, '#ffd4a3'], [1, '#ffe9c9']]) + grad('w', [[0, '#e88f7a'], [1, '#4a4a7a']]),
    ),
  yearbook: () =>
    wrap(
      `<rect width="800" height="600" fill="#f4efe3"/><rect x="30" y="30" width="740" height="540" fill="none" stroke="#1f3a8a" stroke-width="6"/><rect x="60" y="56" width="680" height="54" fill="#1f3a8a"/><text x="400" y="94" font-family="Georgia, serif" font-size="28" fill="#ffffff" text-anchor="middle">EIGHTH GRADE · ROOM 12</text>` +
        [0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => {
          const x = 84 + c * 132;
          const y = 140 + r * 104;
          const skin = ['#d9a87c', '#c68a5e', '#f0c8a0', '#a8714a', '#e3b890'][(r + c * 2) % 5];
          const bg = ['#c9d8e6', '#e6d8c9', '#d8e6c9', '#e6c9d8'][(r + c) % 4];
          return `<rect x="${x}" y="${y}" width="100" height="84" fill="${bg}"/><path d="M${x + 18} ${y + 84} Q${x + 50} ${y + 50} ${x + 82} ${y + 84} Z" fill="#33405c"/><circle cx="${x + 50}" cy="${y + 40}" r="20" fill="${skin}"/><path d="M${x + 30} ${y + 38} Q${x + 50} ${y + 8} ${x + 70} ${y + 38} Q${x + 50} ${y + 24} ${x + 30} ${y + 38} Z" fill="#2a1d1a"/>`;
        }).join('')).join(''),
    ),
};
