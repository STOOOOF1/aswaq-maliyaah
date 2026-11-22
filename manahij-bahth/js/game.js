/* مدينة الباحث (مناهج البحث الاقتصادي) — محرك عالم المكعبات وواجهة التعلّم */
(() => {
  'use strict';
  const COURSE = window.COURSE;
  const CH = COURSE.chapters;
  const $ = s => document.querySelector(s);
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const ar = s => String(s).replace(/\d/g, d => AR[d]);
  const fmt = (n, d = 2) => (isFinite(n) ? Number(n).toLocaleString('ar-SA', { maximumFractionDigits: d }) : '—');
  const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  const RANKS = ['مبتدئ', 'قارئ متأمل', 'صائغ مشكلات', 'جامع بيانات', 'محلل نتائج', 'باحث منهجي', 'عالم مناهج'];
  const XP_PER_LEVEL = 250;

  /* ================= الحفظ ================= */
  const SAVE_KEY = 'manahij-voxel-v1';
  let save = { read: {}, quick: {}, quiz: {}, xp: 0, sorterBest: 0, obBest: 0, metGuide: false, name: '' };
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) save = Object.assign(save, s); } catch (e) { }
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { } };

  /* ================= الصوت ================= */
  let actx = null, soundOn = true;
  function sfx(type) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime;
      const tone = (f, d, wave = 'sine', vol = .12, at = 0) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = wave; o.frequency.setValueAtTime(f, t + at);
        g.gain.setValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(.0001, t + at + d);
        o.connect(g).connect(actx.destination); o.start(t + at); o.stop(t + at + d + .02);
      };
      if (type === 'break') { const b = actx.createBuffer(1, 2205, 22050), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = actx.createBufferSource(), g = actx.createGain(); g.gain.value = .18; s.buffer = b; s.connect(g).connect(actx.destination); s.start(); }
      else if (type === 'place') tone(140, .08, 'square', .06);
      else if (type === 'ok') { tone(660, .12); tone(990, .2, 'sine', .12, .1); }
      else if (type === 'bad') tone(180, .22, 'sawtooth', .06);
      else if (type === 'open') tone(520, .1, 'triangle', .08);
      else if (type === 'level') { [523, 659, 784, 1046].forEach((f, i) => tone(f, .18, 'triangle', .1, i * .09)); }
    } catch (e) { }
  }

  /* ================= المكعبات والأطلس ================= */
  const B = { AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, LOG: 4, LEAVES: 5, PLANKS: 6, SAND: 7, WATER: 8, GLASS: 9, GOLD: 10, QUARTZ: 11, BRICK: 12, COBBLE: 13, W_GREEN: 14, W_RED: 15, W_BLUE: 16, W_YELLOW: 17, W_PURPLE: 18, W_ORANGE: 19, LAMP: 20, BOOK: 21, EMERALD: 22, DARK: 23, PATH: 24, BEDROCK: 25, QUIZ: 26, FINAL: 27, PILLAR: 28, SNOW: 29 };
  const BLK = {
    1: { n: 'عشب', t: [0, 1, 2], c: [95, 160, 60] }, 2: { n: 'تراب', t: [2, 2, 2], c: [134, 96, 67] }, 3: { n: 'حجر', t: [3, 3, 3], c: [125, 125, 125] },
    4: { n: 'جذع', t: [5, 4, 5], c: [102, 78, 46] }, 5: { n: 'أوراق', t: [6, 6, 6], c: [55, 120, 45] }, 6: { n: 'ألواح خشب', t: [7, 7, 7], c: [170, 135, 85] },
    7: { n: 'رمل', t: [8, 8, 8], c: [220, 205, 150] }, 8: { n: 'ماء', t: [9, 9, 9], c: [50, 110, 200], tr: 1, ns: 1 }, 9: { n: 'زجاج', t: [10, 10, 10], c: [200, 230, 250], tr: 1 },
    10: { n: 'ذهب', t: [11, 11, 11], c: [245, 200, 60] }, 11: { n: 'رخام', t: [12, 12, 12], c: [236, 230, 220] }, 12: { n: 'طوب', t: [13, 13, 13], c: [160, 70, 55] },
    13: { n: 'حجر مرصوف', t: [14, 14, 14], c: [110, 110, 110] }, 14: { n: 'صوف أخضر', t: [15, 15, 15], c: [40, 160, 95] }, 15: { n: 'صوف أحمر', t: [16, 16, 16], c: [215, 60, 80] },
    16: { n: 'صوف أزرق', t: [17, 17, 17], c: [60, 130, 240] }, 17: { n: 'صوف أصفر', t: [18, 18, 18], c: [235, 175, 45] }, 18: { n: 'صوف بنفسجي', t: [19, 19, 19], c: [150, 85, 235] },
    19: { n: 'صوف برتقالي', t: [20, 20, 20], c: [240, 105, 55] }, 20: { n: 'مصباح', t: [21, 21, 21], c: [255, 220, 130] }, 21: { n: 'لوح درس', t: [7, 22, 7], c: [150, 110, 70] },
    22: { n: 'زمرد', t: [23, 23, 23], c: [40, 190, 110] }, 23: { n: 'سبج', t: [24, 24, 24], c: [30, 22, 45] }, 24: { n: 'حصى', t: [25, 25, 25], c: [140, 130, 120] },
    25: { n: 'صخر الأساس', t: [26, 26, 26], c: [50, 50, 50] }, 26: { n: 'مكعب الاختبار', t: [23, 27, 23], c: [40, 190, 110] }, 27: { n: 'مكعب الخلاصة', t: [11, 28, 11], c: [245, 200, 60] },
    28: { n: 'عمود رخامي', t: [12, 29, 12], c: [236, 230, 220] }, 29: { n: 'ثلج', t: [30, 3, 3], c: [240, 245, 250] }
  };
  const NB = 30;
  const TR = new Uint8Array(NB), SOLID = new Uint8Array(NB);
  for (let i = 1; i < NB; i++) { TR[i] = BLK[i] && BLK[i].tr ? 1 : 0; SOLID[i] = BLK[i] && BLK[i].ns ? 0 : 1; }

  const TS = 16, COLS = 8, ROWS = 4;
  const atlas = document.createElement('canvas'); atlas.width = TS * COLS; atlas.height = TS * ROWS;
  (function paintAtlas() {
    const g = atlas.getContext('2d');
    const img = g.createImageData(atlas.width, atlas.height);
    let seed = 1337;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    const put = (tile, fn) => {
      const ox = (tile % COLS) * TS, oy = Math.floor(tile / COLS) * TS;
      for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
        const c = fn(x, y, rnd());
        const i = ((oy + y) * atlas.width + ox + x) * 4;
        img.data[i] = Math.max(0, Math.min(255, c[0])); img.data[i + 1] = Math.max(0, Math.min(255, c[1])); img.data[i + 2] = Math.max(0, Math.min(255, c[2])); img.data[i + 3] = c[3] === undefined ? 255 : c[3];
      }
    };
    const nz = (c, r, a) => [c[0] + (r - .5) * a, c[1] + (r - .5) * a, c[2] + (r - .5) * a];
    const drip = Array.from({ length: 16 }, () => 3 + Math.floor(rnd() * 3));
    put(0, (x, y, r) => nz([92, 158, 58], r, 34));
    put(1, (x, y, r) => y < drip[x] ? nz([92, 158, 58], r, 30) : nz([134, 96, 67], r, 30));
    put(2, (x, y, r) => nz([134, 96, 67], r, 34));
    put(3, (x, y, r) => r > .9 ? [100, 100, 100] : nz([127, 127, 127], r, 26));
    put(4, (x, y, r) => (x % 4 === 0 || (x % 4 === 2 && r > .6)) ? nz([78, 58, 32], r, 14) : nz([108, 82, 48], r, 18));
    put(5, (x, y, r) => { const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5)); if (d > 6.5) return nz([96, 72, 40], r, 16); return (Math.floor(d) % 2) ? nz([176, 142, 92], r, 12) : nz([150, 118, 72], r, 12); });
    put(6, (x, y, r) => r > .82 ? [36, 84, 30] : nz([58, 128, 46], r, 40));
    put(7, (x, y, r) => { const row = Math.floor(y / 4), seam = (x + row * 5) % 16 === 0; return (y % 4 === 3 || seam) ? nz([118, 88, 52], r, 10) : nz([172, 136, 86], r, 18); });
    put(8, (x, y, r) => nz([222, 207, 152], r, 22));
    put(9, (x, y, r) => [48 + r * 20, 105 + r * 25, 205, 175]);
    put(10, (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15) ? [225, 240, 250, 255] : ((x === y + 3 || x === y + 4) && x < 9 ? [255, 255, 255, 140] : [200, 225, 245, 40]));
    put(11, (x, y, r) => (x === 0 || y === 0) ? [255, 236, 140] : (x === 15 || y === 15) ? [190, 140, 30] : nz([246, 202, 64], r, 18));
    put(12, (x, y, r) => (x === 0 || y === 0 || x === 15 || y === 15) ? [214, 206, 194] : nz([238, 232, 222], r, 8));
    put(13, (x, y, r) => { const row = Math.floor(y / 4), off = row % 2 ? 4 : 0; return (y % 4 === 3 || (x + off) % 8 === 7) ? nz([196, 186, 176], r, 10) : nz([164, 72, 56], r, 26); });
    put(14, (x, y, r) => { const v = Math.sin(x * 1.7 + y * .3) + Math.cos(y * 1.9 - x * .4); return v > 1.2 ? nz([80, 80, 80], r, 10) : nz([122, 122, 122], r, 34); });
    const wool = c => (x, y, r) => nz(c.map(v => v * (((x + y) % 4 === 0) ? .86 : 1)), r, 16);
    put(15, wool([40, 160, 95])); put(16, wool([215, 60, 80])); put(17, wool([60, 130, 240])); put(18, wool([235, 175, 45])); put(19, wool([150, 85, 235])); put(20, wool([240, 105, 55]));
    put(21, (x, y, r) => (x % 5 === 0 || y % 5 === 0) ? [190, 140, 60] : nz([255, 226, 140], r, 30));
    const bookCols = [[150, 40, 40], [40, 80, 150], [40, 120, 70], [170, 130, 40], [110, 50, 130]];
    const spine = Array.from({ length: 16 }, () => bookCols[Math.floor(rnd() * 5)]);
    put(22, (x, y, r) => (y < 2 || y > 13 || y === 7 || y === 8) ? nz([150, 112, 66], r, 14) : (x % 3 === 2 ? [40, 28, 16] : nz(spine[x + (y > 8 ? 8 : 0) & 15], r, 16)));
    put(23, (x, y, r) => { const d = Math.abs(x - 7.5) + Math.abs(y - 7.5); return d < 3 ? [170, 255, 200] : d < 6 ? nz([60, 210, 130], r, 20) : (x === 0 || y === 0 || x === 15 || y === 15) ? [20, 110, 60] : nz([40, 180, 100], r, 20); });
    put(24, (x, y, r) => r > .93 ? [120, 70, 170] : nz([28, 20, 42], r, 14));
    put(25, (x, y, r) => r > .8 ? [95, 88, 82] : nz([150, 140, 130], r, 30));
    put(26, (x, y, r) => nz([55, 55, 55], r, 50));
    const QM = ['................', '................', '.....######.....', '....##....##....', '...........##...', '...........##...', '..........##....', '.........##.....', '........##......', '.......##.......', '.......##.......', '................', '.......##.......', '.......##.......', '................', '................'];
    put(27, (x, y, r) => QM[y][15 - x] === '#' ? [255, 214, 80] : ((x === 0 || y === 0 || x === 15 || y === 15) ? [20, 110, 60] : nz([40, 180, 100], r, 18)));
    put(28, (x, y, r) => { const dx = Math.abs(x - 7.5), dy = Math.abs(y - 7.5); const star = (dx + dy < 7.5 && Math.max(dx, dy) < 5.5) || (Math.max(dx, dy) < 4.5 && dx + dy < 8.5); return star ? nz([255, 240, 170], r, 10) : (x === 0 || y === 0 || x === 15 || y === 15) ? [170, 120, 20] : nz([232, 182, 48], r, 16); });
    put(29, (x, y, r) => (x === 2 || x === 6 || x === 9 || x === 13) ? [208, 200, 188] : nz([238, 232, 222], r, 8));
    put(30, (x, y, r) => nz([242, 246, 252], r, 10));
    put(31, (x, y, r) => [255, 255, 255]);
    g.putImageData(img, 0, 0);
  })();

  /* ================= العالم ================= */
  const W = 112, D = 112, H = 48, CS = 16, NCX = W / CS, NCZ = D / CS, GROUND = 12, SEA = 11;
  const world = new Uint8Array(W * H * D);
  const idx = (x, y, z) => (y * D + z) * W + x;
  const get = (x, y, z) => (y < 0 ? B.BEDROCK : y >= H ? 0 : (x < 0 || z < 0 || x >= W || z >= D) ? B.STONE : world[idx(x, y, z)]);
  const rawSet = (x, y, z, id) => { if (x >= 0 && z >= 0 && x < W && z < D && y >= 0 && y < H) world[idx(x, y, z)] = id; };

  const hash = (x, z) => { let h = (x * 374761393 + z * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const smooth = t => t * t * (3 - 2 * t);
  const vnoise = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), xf = smooth(x - xi), zf = smooth(z - zi); const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1); return a + (b - a) * xf + (c - a) * zf + (a - b - c + d) * xf * zf; };

  const CX = 56, CZ = 56;
  const districts = CH.map((ch, i) => { const a = -Math.PI / 2 + i * Math.PI / 3; return { ch, i, a, ux: Math.cos(a), uz: Math.sin(a), x: Math.round(CX + Math.cos(a) * 34), z: Math.round(CZ + Math.sin(a) * 34) }; });
  const stations = []; const stationAt = new Map(); const protectedSet = new Set();
  const key = (x, y, z) => x + ',' + y + ',' + z;
  const npcs = [];
  const heightMap = new Int16Array(W * D);

  function generate() {
    const zones = [{ x: CX, z: CZ, r: 13 }];
    districts.forEach(d => {
      zones.push({ x: d.x, z: d.z, r: 13 });
      zones.push({ x: d.x + d.ux * 17, z: d.z + d.uz * 17, r: 6 });
      for (let t = 0; t <= 1; t += .04) zones.push({ x: CX + (d.x - CX) * t, z: CZ + (d.z - CZ) * t, r: 3 });
    });
    const lake = { x: CX + 37, z: CZ, r: 7 };
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      let h = GROUND + (vnoise(x / 18, z / 18) - .5) * 7 + (vnoise(x / 7 + 40, z / 7) - .5) * 2.5;
      const ed = Math.hypot(x - CX, z - CZ);
      if (ed > 44) h += (ed - 44) * 1.15 * (.7 + .6 * vnoise(x / 9 + 9, z / 9));
      const ld = Math.hypot(x - lake.x, z - lake.z);
      if (ld < lake.r + 4) h = Math.min(h, 7.5 + Math.max(0, ld - 1) * .55 + (ld > lake.r ? (ld - lake.r) * .8 : 0));
      let w = 0;
      for (const zn of zones) { const d = Math.hypot(x - zn.x, z - zn.z); if (d < zn.r + 5) w = Math.max(w, Math.min(1, 1 - (d - zn.r) / 5)); }
      h = Math.round(h + (GROUND - h) * w);
      heightMap[z * W + x] = Math.max(3, Math.min(H - 6, h));
    }
    const nearWater = (x, z) => {
      for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, zz = z + dz; if (xx < 0 || zz < 0 || xx >= W || zz >= D) continue;
        if (heightMap[zz * W + xx] < SEA) return true;
      }
      return false;
    };
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
      const h = heightMap[z * W + x];
      rawSet(x, 0, z, B.BEDROCK);
      for (let y = 1; y <= h; y++) {
        let id = y < h - 3 ? B.STONE : y < h ? B.DIRT : B.GRASS;
        if (y === h) { if (h >= 27) id = B.SNOW; else if (h >= 23) id = B.STONE; else if (h <= SEA + 1 && nearWater(x, z)) id = B.SAND; }
        rawSet(x, y, z, id);
      }
      for (let y = h + 1; y <= SEA; y++) rawSet(x, y, z, B.WATER);
    }
    const clearAbove = (x, z, from, to) => { for (let y = from; y <= to; y++) rawSet(x, y, z, 0); };

    /* الساحة المركزية وقاعة الخلاصة */
    for (let z = CZ - 12; z <= CZ + 12; z++) for (let x = CX - 12; x <= CX + 12; x++) {
      const d = Math.hypot(x - CX, z - CZ); if (d > 11.5) continue;
      clearAbove(x, z, GROUND + 1, GROUND + 24);
      let id = B.QUARTZ; if (d > 10.4) id = B.COBBLE; else if (d > 9.2) id = B.GOLD; else if ((x + z) % 2 === 0 && d > 6) id = B.PATH;
      rawSet(x, GROUND, z, id);
    }
    for (let z = CZ - 4; z <= CZ + 4; z++) for (let x = CX - 4; x <= CX + 4; x++) {
      rawSet(x, GROUND, z, ((x + z) & 1) ? B.GOLD : B.QUARTZ);
      const edge = Math.abs(x - CX) === 4 || Math.abs(z - CZ) === 4;
      const pillar = edge && (Math.abs(x - CX) === 4 && Math.abs(z - CZ) === 4 || x === CX || z === CZ) && !(z === CZ + 4 && x === CX);
      if (pillar) for (let y = GROUND + 1; y <= GROUND + 5; y++) rawSet(x, y, z, B.PILLAR);
      rawSet(x, GROUND + 6, z, B.QUARTZ);
      if (Math.abs(x - CX) <= 3 && Math.abs(z - CZ) <= 3) rawSet(x, GROUND + 7, z, B.GOLD);
      if (Math.abs(x - CX) <= 2 && Math.abs(z - CZ) <= 2) rawSet(x, GROUND + 8, z, B.QUARTZ);
      if (Math.abs(x - CX) <= 1 && Math.abs(z - CZ) <= 1) rawSet(x, GROUND + 9, z, B.GOLD);
    }
    rawSet(CX, GROUND + 10, CZ, B.LAMP);
    [[-7, -7], [7, -7], [-7, 7], [7, 7]].forEach(([dx, dz]) => { rawSet(CX + dx, GROUND + 1, CZ + dz, B.PILLAR); rawSet(CX + dx, GROUND + 2, CZ + dz, B.PILLAR); rawSet(CX + dx, GROUND + 3, CZ + dz, B.LAMP); });
    addStation({ type: 'summary', x: CX - 3, y: GROUND + 1, z: CZ - 2, block: B.FINAL, title: 'جداول المقارنات الكبرى', color: '#e9b949' });
    addStation({ type: 'sorter', x: CX, y: GROUND + 1, z: CZ - 3, block: B.FINAL, title: 'لعبة ميزان التصنيف', color: '#e9b949' });
    addStation({ type: 'cert', x: CX + 3, y: GROUND + 1, z: CZ - 2, block: B.FINAL, title: 'شهادة الإتمام', color: '#e9b949' });
    npcs.push({ type: 'guide', x: CX + 3.5, z: CZ + 8, y: GROUND + 1, face: [0, 1], color: '#e9b949', name: 'مرشد المدينة' });

    /* الأحياء */
    districts.forEach(d => {
      const wool = d.ch.wool;
      for (let z = d.z - 11; z <= d.z + 11; z++) for (let x = d.x - 11; x <= d.x + 11; x++) {
        clearAbove(x, z, GROUND + 1, GROUND + 26);
        const cheb = Math.max(Math.abs(x - d.x), Math.abs(z - d.z));
        const r = Math.hypot(x - d.x, z - d.z);
        let id = B.QUARTZ;
        if (cheb >= 10) id = wool; else if (r < 2.6) id = B.GOLD; else if (r < 3.6) id = wool; else if ((Math.abs(x - d.x) + Math.abs(z - d.z)) % 6 === 0) id = B.PATH;
        rawSet(x, GROUND, z, id);
        if (cheb === 11) {
          const len = Math.hypot(x - d.x, z - d.z), dot = ((x - d.x) * -d.ux + (z - d.z) * -d.uz) / len;
          if (dot < .9) rawSet(x, GROUND + 1, z, wool);
        }
      }
      [[-10, -10], [10, -10], [-10, 10], [10, 10]].forEach(([dx, dz]) => { for (let y = 1; y <= 4; y++) rawSet(d.x + dx, GROUND + y, d.z + dz, B.PILLAR); rawSet(d.x + dx, GROUND + 5, d.z + dz, B.LAMP); });
      rawSet(d.x, GROUND + 1, d.z, B.DARK);
      addStation({ type: 'quiz', ch: d.ch, x: d.x, y: GROUND + 2, z: d.z, block: B.QUIZ, title: 'اختبار الحيّ ' + ORD[d.i], color: d.ch.color, district: d });
      protectedSet.add(key(d.x, GROUND + 1, d.z));
      const n = d.ch.lessons.length;
      const inA = Math.atan2(-d.uz, -d.ux);
      const used = new Set();
      d.ch.lessons.forEach((L, li) => {
        const ang = inA + .72 + (n === 1 ? 0 : li * (Math.PI * 2 - 1.44) / (n - 1));
        let x = Math.round(d.x + Math.cos(ang) * 7.3), z = Math.round(d.z + Math.sin(ang) * 7.3);
        while (used.has(x + ',' + z)) x += 1;
        used.add(x + ',' + z);
        addStation({ type: 'lesson', ch: d.ch, li, lesson: L, x, y: GROUND + 1, z, block: B.BOOK, title: L.title, color: d.ch.color, district: d });
      });
      npcs.push({ type: 'district', d, x: d.x - d.ux * 9 + .5, z: d.z - d.uz * 9 + .5, y: GROUND + 1, face: [-d.ux, -d.uz], color: d.ch.color, name: 'مرشد الحيّ ' + ORD[d.i] });
      /* برج الحيّ */
      const tx = Math.round(d.x + d.ux * 17), tz = Math.round(d.z + d.uz * 17), th = 13 + (d.i % 3) * 3;
      for (let z = tz - 3; z <= tz + 3; z++) for (let x = tx - 3; x <= tx + 3; x++) {
        clearAbove(x, z, GROUND + 1, GROUND + th + 4); rawSet(x, GROUND, z, B.QUARTZ);
        const shell = Math.abs(x - tx) === 3 || Math.abs(z - tz) === 3, corner = Math.abs(x - tx) === 3 && Math.abs(z - tz) === 3;
        for (let y = GROUND + 1; y <= GROUND + th; y++) {
          if (!shell) { if ((y - GROUND) % 5 === 0) rawSet(x, y, z, B.PLANKS); continue; }
          let id = corner ? B.PILLAR : ((y - GROUND) % 3 === 2 && (x + z) % 2 === 0) ? B.GLASS : wool;
          if ((y - GROUND) % 5 === 0 && !corner) id = B.QUARTZ;
          rawSet(x, y, z, id);
        }
        rawSet(x, GROUND + th + 1, z, shell ? B.GOLD : B.QUARTZ);
        if (corner) rawSet(x, GROUND + th + 2, z, B.LAMP);
      }
      const doorX = Math.round(tx - d.ux * 3), doorZ = Math.round(tz - d.uz * 3);
      rawSet(doorX, GROUND + 1, doorZ, 0); rawSet(doorX, GROUND + 2, doorZ, 0);
      /* الطريق إلى الساحة */
      const sx = CX + d.ux * 11, sz = CZ + d.uz * 11, ex = d.x - d.ux * 11, ez = d.z - d.uz * 11;
      const len = Math.hypot(ex - sx, ez - sz);
      for (let t = 0; t <= len; t += .5) {
        const px = sx + (ex - sx) * t / len, pz = sz + (ez - sz) * t / len;
        for (let o = -1.5; o <= 1.5; o += .5) {
          const x = Math.round(px - d.uz * o), z = Math.round(pz + d.ux * o);
          if (world[idx(x, GROUND, z)] !== B.QUARTZ && world[idx(x, GROUND, z)] !== B.GOLD) rawSet(x, GROUND, z, Math.abs(o) > 1.2 ? B.COBBLE : B.PATH);
          clearAbove(x, z, GROUND + 1, GROUND + 8);
        }
      }
      for (let t = 3; t < len - 2; t += 6) {
        const side = (Math.round(t / 6) % 2) ? 2.6 : -2.6;
        const x = Math.round(sx + (ex - sx) * t / len - d.uz * side), z = Math.round(sz + (ez - sz) * t / len + d.ux * side);
        rawSet(x, GROUND + 1, z, B.LOG); rawSet(x, GROUND + 2, z, B.LOG); rawSet(x, GROUND + 3, z, B.LAMP);
      }
    });

    /* الأشجار */
    let seed = 99; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let tries = 0; tries < 900; tries++) {
      const x = 3 + Math.floor(rnd() * (W - 6)), z = 3 + Math.floor(rnd() * (D - 6));
      const h = heightMap[z * W + x];
      if (world[idx(x, h, z)] !== B.GRASS || h > 22) continue;
      let ok = true;
      for (let dz = -3; dz <= 3 && ok; dz++) for (let dx = -3; dx <= 3 && ok; dx++) { const t = world[idx(x + dx, h + 1, z + dz)]; const g = world[idx(x + dx, h, z + dz)]; if (t !== 0 || (g !== B.GRASS && g !== B.DIRT && g !== B.STONE)) ok = false; }
      if (!ok) continue;
      const th = 4 + Math.floor(rnd() * 3);
      for (let y = 1; y <= th; y++) rawSet(x, h + y, z, B.LOG);
      for (let dy = th - 2; dy <= th + 1; dy++) {
        const rr = dy > th ? 1 : 2;
        for (let dz = -rr; dz <= rr; dz++) for (let dx = -rr; dx <= rr; dx++) {
          if (Math.abs(dx) === rr && Math.abs(dz) === rr && (dy > th - 1 || rnd() > .5)) continue;
          if (get(x + dx, h + dy, z + dz) === 0) rawSet(x + dx, h + dy, z + dz, B.LEAVES);
        }
      }
    }
  }

  function addStation(s) {
    rawSet(s.x, s.y, s.z, s.block);
    rawSet(s.x, s.y + 1, s.z, 0); rawSet(s.x, s.y + 2, s.z, 0);
    stations.push(s); stationAt.set(key(s.x, s.y, s.z), s); protectedSet.add(key(s.x, s.y, s.z));
  }

  /* ================= THREE ================= */
  const canvas = $('#game');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const SKY_HORIZON = 0xbcd6ee;
  scene.fog = new THREE.Fog(SKY_HORIZON, 40, 105);
  (function sky() {
    const c = document.createElement('canvas'); c.width = 2; c.height = 256; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#2f6fd6'); gr.addColorStop(.55, '#7fb2ea'); gr.addColorStop(.8, '#bcd6ee'); gr.addColorStop(1, '#f2dcb4');
    g.fillStyle = gr; g.fillRect(0, 0, 2, 256); scene.background = new THREE.CanvasTexture(c);
  })();
  const camera = new THREE.PerspectiveCamera(72, 1, .08, 300);
  camera.rotation.order = 'YXZ';
  scene.add(new THREE.HemisphereLight(0xffffff, 0x556070, .95));
  const sun = new THREE.DirectionalLight(0xfff2d8, .55); sun.position.set(40, 80, 20); scene.add(sun);

  const atlasTex = new THREE.CanvasTexture(atlas);
  atlasTex.magFilter = THREE.NearestFilter; atlasTex.minFilter = THREE.NearestFilter; atlasTex.generateMipmaps = false;
  const matOpaque = new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true });
  const matTrans = new THREE.MeshBasicMaterial({ map: atlasTex, vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });

  const FACES = [
    { n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], s: .8, tile: 1 },
    { n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], s: .8, tile: 1 },
    { n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], s: 1, tile: 0 },
    { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], s: .5, tile: 2 },
    { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], s: .66, tile: 1 },
    { n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], s: .66, tile: 1 }
  ];
  FACES.forEach(F => {
    const ax = F.n[0] ? 0 : F.n[1] ? 1 : 2; const others = [0, 1, 2].filter(a => a !== ax);
    F.ao = F.c.map(c => {
      const s1 = c[others[0]] ? 1 : -1, s2 = c[others[1]] ? 1 : -1;
      const a = [0, 0, 0], b = [0, 0, 0], d = [0, 0, 0];
      a[others[0]] = s1; b[others[1]] = s2; d[others[0]] = s1; d[others[1]] = s2;
      return [a, b, d];
    });
  });
  const AOL = [.42, .62, .8, 1];
  const UVC = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const opq = (x, y, z) => { const id = get(x, y, z); return id && !TR[id] ? 1 : 0; };
  const EPS = .0008;

  const chunks = [];
  function buildChunk(cx, cz) {
    const A = { p: [], u: [], c: [], i: [] }, T = { p: [], u: [], c: [], i: [] };
    const x0 = cx * CS, z0 = cz * CS;
    for (let y = 0; y < H; y++) for (let z = z0; z < z0 + CS; z++) for (let x = x0; x < x0 + CS; x++) {
      const id = world[idx(x, y, z)]; if (!id) continue;
      const tr = TR[id], def = BLK[id];
      for (let f = 0; f < 6; f++) {
        const F = FACES[f]; const nx = x + F.n[0], ny = y + F.n[1], nz = z + F.n[2];
        const nb = get(nx, ny, nz);
        if (nb && (!TR[nb] || nb === id)) continue;
        if (f === 3 && y === 0) continue;
        const tile = def.t[F.tile], tc = tile % COLS, trow = Math.floor(tile / COLS);
        const u0 = tc / COLS + EPS, u1 = (tc + 1) / COLS - EPS, v0 = 1 - (trow + 1) / ROWS + EPS, v1 = 1 - trow / ROWS - EPS;
        const M = tr ? T : A; const base = M.p.length / 3; const ao = [3, 3, 3, 3];
        for (let k = 0; k < 4; k++) {
          const c = F.c[k];
          let yy = y + c[1]; if (id === B.WATER && c[1] === 1 && get(x, y + 1, z) !== B.WATER) yy -= .12;
          M.p.push(x + c[0], yy, z + c[2]);
          M.u.push(UVC[k][0] ? u1 : u0, UVC[k][1] ? v1 : v0);
          let l = 1;
          if (!tr) {
            const o = F.ao[k];
            const b1 = opq(nx + o[0][0], ny + o[0][1], nz + o[0][2]), b2 = opq(nx + o[1][0], ny + o[1][1], nz + o[1][2]), b3 = opq(nx + o[2][0], ny + o[2][1], nz + o[2][2]);
            const a = (b1 && b2) ? 0 : 3 - (b1 + b2 + b3); ao[k] = a; l = AOL[a];
          }
          let sh = F.s * l; if (id === B.LAMP) sh = Math.max(sh, .95);
          M.c.push(sh, sh, sh);
        }
        if (ao[0] + ao[2] < ao[1] + ao[3]) M.i.push(base + 1, base + 2, base + 3, base + 1, base + 3, base);
        else M.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    const mk = (M, mat) => {
      if (!M.p.length) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(M.p, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(M.u, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(M.c, 3));
      g.setIndex(M.i); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.matrixAutoUpdate = false; scene.add(m); return m;
    };
    const old = chunks[cz * NCX + cx];
    if (old) [old.a, old.t].forEach(m => { if (m) { scene.remove(m); m.geometry.dispose(); } });
    chunks[cz * NCX + cx] = { a: mk(A, matOpaque), t: mk(T, matTrans) };
  }
  const dirty = new Set();
  function setBlock(x, y, z, id) {
    if (x < 0 || z < 0 || x >= W || z >= D || y < 1 || y >= H) return;
    world[idx(x, y, z)] = id;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const nx = Math.floor((x + dx) / CS), nz = Math.floor((z + dz) / CS);
      if (nx >= 0 && nz >= 0 && nx < NCX && nz < NCZ) dirty.add(nz * NCX + nx);
    }
    updateMiniPixel(x, z);
  }

  /* ================= لافتات ومجسّمات ================= */
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function labelCanvas(lines, color, opts = {}) {
    const cv = opts.canvas || document.createElement('canvas');
    cv.width = 512; cv.height = lines.length > 1 ? 168 : 104;
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    g.fillStyle = opts.bg || 'rgba(12,17,30,.84)'; roundRect(g, 6, 6, 500, cv.height - 12, 16); g.fill();
    g.lineWidth = 7; g.strokeStyle = color; g.stroke();
    g.direction = 'rtl'; g.textAlign = 'center'; g.textBaseline = 'middle';
    let y = lines.length > 1 ? 58 : cv.height / 2 + 4;
    lines.forEach((ln, i) => {
      let size = ln.size || (i === 0 ? 50 : 36);
      g.font = size + 'px ' + (ln.font || 'Lalezar, "IBM Plex Sans Arabic", sans-serif');
      while (g.measureText(ln.t).width > 468 && size > 16) { size -= 2; g.font = size + 'px ' + (ln.font || 'Lalezar, "IBM Plex Sans Arabic", sans-serif'); }
      g.fillStyle = ln.col || '#fff'; g.fillText(ln.t, 256, y);
      y += 62;
    });
    return cv;
  }
  function makeLabel(lines, color, w, opts) {
    const cv = labelCanvas(lines, color, opts);
    const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(w, w * cv.height / 512, 1); sp.userData.cv = cv; return sp;
  }
  function refreshLabel(sp, lines, color, opts) { labelCanvas(lines, color, Object.assign({ canvas: sp.userData.cv }, opts)); sp.material.map.needsUpdate = true; }

  const gemGeo = new THREE.OctahedronGeometry(.2);
  function stationLines(s) {
    if (s.type === 'lesson') {
      const done = !!save.read[s.lesson.id];
      return { lines: [{ t: (done ? '✓ ' : '') + ar(s.lesson.id), size: 44, col: done ? '#7ff0b0' : s.color }, { t: s.title, size: 38 }], color: done ? '#2fae6b' : s.color };
    }
    if (s.type === 'quiz') { const sc = save.quiz[s.ch.id] || 0; const pass = sc >= 70; return { lines: [{ t: pass ? '✓ اجتزت الاختبار' : 'اختبار الحيّ', col: pass ? '#7ff0b0' : '#ffd66b' }, { t: pass ? 'أفضل نتيجة ' + ar(sc) + '٪' : s.ch.name, size: 36 }], color: pass ? '#e9b949' : s.color }; }
    return { lines: [{ t: s.title, col: '#ffd66b' }], color: '#e9b949' };
  }
  function buildStationVisuals() {
    stations.forEach(s => {
      const L = stationLines(s);
      s.label = makeLabel(L.lines, L.color, s.type === 'quiz' ? 3.6 : s.district ? 3 : 2.5);
      s.label.position.set(s.x + .5, s.y + (s.type === 'quiz' ? 2.6 : 2.35), s.z + .5); scene.add(s.label);
      s.gem = new THREE.Mesh(gemGeo, new THREE.MeshLambertMaterial({ color: s.color, emissive: s.color, emissiveIntensity: .45 }));
      s.gem.position.set(s.x + .5, s.y + 1.45, s.z + .5); scene.add(s.gem);
      if (s.type === 'quiz') {
        s.beam = new THREE.Mesh(new THREE.CylinderGeometry(.42, .42, 44, 10, 1, true), new THREE.MeshBasicMaterial({ color: s.color, transparent: true, opacity: .22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        s.beam.position.set(s.x + .5, s.y + 23, s.z + .5); scene.add(s.beam);
      }
      refreshStation(s);
    });
    districts.forEach(d => {
      const sign = makeLabel([{ t: 'الحيّ ' + ORD[d.i], col: d.ch.color, size: 46 }, { t: d.ch.name, size: 44 }], d.ch.color, 8);
      sign.position.set(d.x + .5, GROUND + 9, d.z + .5); scene.add(sign); d.sign = sign;
    });
    const hall = makeLabel([{ t: 'قاعة الخلاصة', col: '#ffd66b' }, { t: 'المقارنات، الميزان، الشهادة', size: 34 }], '#e9b949', 6.5);
    hall.position.set(CX + .5, GROUND + 13, CZ + .5); scene.add(hall);
  }
  function refreshStation(s) {
    const L = stationLines(s);
    if (s.label) refreshLabel(s.label, L.lines, L.color);
    if (s.type === 'lesson') {
      const done = !!save.read[s.lesson.id];
      s.gem.material.color.set(done ? '#2fae6b' : s.color); s.gem.material.emissive.set(done ? '#2fae6b' : s.color);
      s.gem.scale.setScalar(done ? .6 : 1);
    }
    if (s.type === 'quiz') {
      const pass = (save.quiz[s.ch.id] || 0) >= 70;
      s.beam.material.color.set(pass ? '#ffcc44' : s.color); s.beam.material.opacity = pass ? .4 : .2;
      s.gem.material.color.set(pass ? '#ffcc44' : s.color); s.gem.material.emissive.set(pass ? '#ffcc44' : s.color); s.gem.scale.setScalar(1.6);
    }
    if (s.type === 'summary' || s.type === 'sorter' || s.type === 'cert') { s.gem.material.color.set('#ffcc44'); s.gem.material.emissive.set('#ffcc44'); }
  }

  /* المرشدون */
  function shemaghTex() {
    const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { g.fillStyle = ((x >> 1) + (y >> 1)) % 2 ? '#c8202f' : '#f4f1ea'; g.fillRect(x, y, 1, 1); }
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t;
  }
  const SHEMAGH = shemaghTex();
  function buildNPC(n) {
    const g = new THREE.Group();
    const box = (w, h, d, color, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || new THREE.MeshLambertMaterial({ color })); m.position.set(x, y, z); g.add(m); return m; };
    box(.52, 1.0, .32, '#f5f3ee', 0, .5, 0);
    box(.54, .62, .34, '#f5f3ee', 0, 1.3, 0);
    box(.6, 1.42, .06, n.color, 0, .95, -.19);
    box(.1, 1.42, .38, n.color, .28, .95, 0); box(.1, 1.42, .38, n.color, -.28, .95, 0);
    const armL = box(.16, .66, .18, n.color, .38, 1.22, 0), armR = box(.16, .66, .18, n.color, -.38, 1.22, 0);
    const head = new THREE.Group(); head.position.set(0, 1.62, 0); g.add(head);
    const hb = (w, h, d, color, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || new THREE.MeshLambertMaterial({ color })); m.position.set(x, y, z); head.add(m); return m; };
    hb(.4, .4, .4, '#c79a6c', 0, .2, 0);
    hb(.06, .05, .02, '#1a1208', .09, .24, .205); hb(.06, .05, .02, '#1a1208', -.09, .24, .205);
    hb(.3, .12, .04, '#2b1d10', 0, .05, .2);
    const sm = new THREE.MeshLambertMaterial({ map: SHEMAGH });
    hb(.46, .14, .46, null, 0, .44, 0, sm); hb(.46, .46, .06, null, 0, .22, -.23, sm); hb(.06, .4, .4, null, .23, .2, -.03, sm); hb(.06, .4, .4, null, -.23, .2, -.03, sm);
    hb(.48, .05, .48, '#111', 0, .5, 0);
    g.position.set(n.x, n.y, n.z);
    g.rotation.y = Math.atan2(n.face[0], n.face[1]);
    n.base = g.rotation.y; n.group = g; n.head = head; n.arms = [armL, armR];
    g.traverse(o => { if (o.isMesh) o.userData.npc = n; });
    scene.add(g);
    n.label = makeLabel([{ t: n.name, col: n.color, size: 46 }], n.color, 2.6); n.label.position.set(n.x, n.y + 2.55, n.z); scene.add(n.label);
  }

  /* السحب */
  const clouds = new THREE.Group(); scene.add(clouds);
  (function makeClouds() {
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .88, fog: false });
    let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 26; i++) {
      const w = 6 + r() * 14, d = 4 + r() * 9;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.4, d), mat);
      m.position.set(-60 + r() * 230, 52 + r() * 6, -60 + r() * 230); clouds.add(m);
    }
  })();

  /* إطار التحديد والجزيئات */
  const hl = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)), new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: .7 }));
  hl.visible = false; scene.add(hl);
  const parts = [];
  const partGeo = new THREE.BoxGeometry(.13, .13, .13);
  function burst(x, y, z, id) {
    const c = BLK[id].c; const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255) });
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(partGeo, mat); m.position.set(x + .2 + Math.random() * .6, y + .2 + Math.random() * .6, z + .2 + Math.random() * .6);
      m.userData.v = new THREE.Vector3((Math.random() - .5) * 4, Math.random() * 4 + 1, (Math.random() - .5) * 4); m.userData.life = .7 + Math.random() * .3;
      scene.add(m); parts.push(m);
    }
  }

  /* ================= الخريطة المصغّرة ================= */
  const mini = $('#minimap'), mg = mini.getContext('2d');
  const miniImg = mg.createImageData(W, D);
  function topAt(x, z) { for (let y = H - 1; y > 0; y--) { const id = world[idx(x, y, z)]; if (id) return [id, y]; } return [B.BEDROCK, 0]; }
  function updateMiniPixel(x, z) {
    const [id, y] = topAt(x, z); const c = BLK[id].c; const s = .72 + Math.min(.45, (y - 6) * .02);
    const i = (z * W + x) * 4; miniImg.data[i] = c[0] * s; miniImg.data[i + 1] = c[1] * s; miniImg.data[i + 2] = c[2] * s; miniImg.data[i + 3] = 255;
  }

  /* ================= اللاعب ================= */
  const P = { pos: new THREE.Vector3(CX + .5, GROUND + 1, CZ + 10.5), vel: new THREE.Vector3(), yaw: 0, pitch: -.05, onGround: false, fly: false };
  const keys = new Set();
  const touchMove = { x: 0, y: 0 };
  let touchUp = false, touchDown = false;
  let paused = true, started = false;
  const solidAt = (x, y, z) => { const id = get(x, y, z); return id && SOLID[id]; };
  function boxHits(px, py, pz) {
    const r = .3;
    for (let x = Math.floor(px - r); x <= Math.floor(px + r); x++) for (let y = Math.floor(py); y <= Math.floor(py + 1.78); y++) for (let z = Math.floor(pz - r); z <= Math.floor(pz + r); z++) if (solidAt(x, y, z)) return true;
    return false;
  }
  function physics(dt) {
    let f = 0, s = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) f += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) f -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) s += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) s -= 1;
    f += -touchMove.y; s += touchMove.x;
    const len = Math.hypot(f, s); if (len > 1) { f /= len; s /= len; }
    const sprint = keys.has('ShiftLeft') && !P.fly;
    const inWater = get(Math.floor(P.pos.x), Math.floor(P.pos.y + .4), Math.floor(P.pos.z)) === B.WATER;
    const speed = P.fly ? 11 : (sprint ? 7.4 : 4.7) * (inWater ? .55 : 1);
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    const mx = (fx * f + rx * s) * speed, mz = (fz * f + rz * s) * speed;
    const jump = keys.has('Space') || touchUp;
    if (P.fly) {
      P.vel.x = mx; P.vel.z = mz;
      P.vel.y = ((jump ? 1 : 0) - ((keys.has('ShiftLeft') || keys.has('KeyC') || touchDown) ? 1 : 0)) * 8;
    } else {
      const k = P.onGround ? 14 : 4;
      P.vel.x += (mx - P.vel.x) * Math.min(1, k * dt); P.vel.z += (mz - P.vel.z) * Math.min(1, k * dt);
      P.vel.y -= (inWater ? 9 : 26) * dt;
      if (inWater) { P.vel.y = Math.max(P.vel.y, -3); if (jump) P.vel.y = 3.4; }
      else if (jump && P.onGround) { P.vel.y = 8.3; P.onGround = false; }
      P.vel.y = Math.max(P.vel.y, -40);
    }
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(P.vel.x), Math.abs(P.vel.y), Math.abs(P.vel.z)) * dt / .3));
    const h = dt / steps; let blocked = false;
    P.onGround = false;
    for (let i = 0; i < steps; i++) {
      P.pos.x += P.vel.x * h; if (boxHits(P.pos.x, P.pos.y, P.pos.z)) { P.pos.x -= P.vel.x * h; blocked = true; }
      P.pos.z += P.vel.z * h; if (boxHits(P.pos.x, P.pos.y, P.pos.z)) { P.pos.z -= P.vel.z * h; blocked = true; }
      const oy = P.pos.y; P.pos.y += P.vel.y * h;
      if (boxHits(P.pos.x, P.pos.y, P.pos.z)) {
        if (P.vel.y < 0) { const cand = Math.floor(P.pos.y) + 1; P.pos.y = (!boxHits(P.pos.x, cand, P.pos.z) && cand <= oy + .001) ? cand : oy; P.onGround = true; }
        else P.pos.y = oy;
        P.vel.y = 0;
      }
    }
    if (blocked && !P.fly && (Math.abs(mx) + Math.abs(mz)) > .1 && (P.onGround || P.vel.y === 0) && !boxHits(P.pos.x + fx * .4 * Math.sign(f || 1), P.pos.y + 1.05, P.pos.z + fz * .4 * Math.sign(f || 1))) P.vel.y = 8.3;
    if (P.pos.y < -8) respawn();
    P.pos.x = Math.max(.4, Math.min(W - .4, P.pos.x)); P.pos.z = Math.max(.4, Math.min(D - .4, P.pos.z));
  }
  function respawn() { P.pos.set(CX + .5, GROUND + 1, CZ + 10.5); P.vel.set(0, 0, 0); P.yaw = 0; P.pitch = -.05; }

  /* ================= التصويب ================= */
  function raycast(o, d, maxD) {
    let x = Math.floor(o.x), y = Math.floor(o.y), z = Math.floor(o.z);
    const sx = d.x > 0 ? 1 : -1, sy = d.y > 0 ? 1 : -1, sz = d.z > 0 ? 1 : -1;
    const tdx = d.x ? Math.abs(1 / d.x) : Infinity, tdy = d.y ? Math.abs(1 / d.y) : Infinity, tdz = d.z ? Math.abs(1 / d.z) : Infinity;
    let tmx = d.x ? (d.x > 0 ? x + 1 - o.x : o.x - x) * tdx : Infinity, tmy = d.y ? (d.y > 0 ? y + 1 - o.y : o.y - y) * tdy : Infinity, tmz = d.z ? (d.z > 0 ? z + 1 - o.z : o.z - z) * tdz : Infinity;
    let nx = 0, ny = 0, nz = 0, t = 0;
    for (let i = 0; i < 64 && t <= maxD; i++) {
      const id = get(x, y, z);
      if (id && id !== B.WATER && !(x < 0 || z < 0 || x >= W || z >= D)) return { x, y, z, id, nx, ny, nz, t };
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }
  const ray = new THREE.Raycaster(); ray.far = 6;
  const npcMeshes = [];
  let target = null, hit = null;
  function updateTarget() {
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    hit = raycast(camera.position, dir, 6);
    target = null;
    if (hit) { const s = stationAt.get(key(hit.x, hit.y, hit.z)); if (s) target = { kind: 'station', s }; }
    ray.set(camera.position, dir);
    const ih = ray.intersectObjects(npcMeshes, false);
    if (ih.length && (!hit || ih[0].distance < hit.t + .3)) target = { kind: 'npc', n: ih[0].object.userData.npc };
    if (!target) {
      let best = null, bd = 2.6;
      for (const s of stations) {
        const dx = s.x + .5 - P.pos.x, dz = s.z + .5 - P.pos.z, d = Math.hypot(dx, dz);
        if (d < bd && Math.abs(s.y - P.pos.y) < 2.5 && (dx * -Math.sin(P.yaw) + dz * -Math.cos(P.yaw)) / (d || 1) > .35) { bd = d; best = s; }
      }
      for (const n of npcs) { const dx = n.x - P.pos.x, dz = n.z - P.pos.z, d = Math.hypot(dx, dz); if (d < bd && (dx * -Math.sin(P.yaw) + dz * -Math.cos(P.yaw)) / (d || 1) > .35) { bd = d; best = null; target = { kind: 'npc', n }; } }
      if (best) target = { kind: 'station', s: best };
    }
    const pr = $('#prompt');
    if (target && !paused) {
      let t = '';
      if (target.kind === 'npc') t = 'تحدّث إلى ' + target.n.name;
      else { const s = target.s; t = s.type === 'lesson' ? 'اقرأ الدرس ' + ar(s.lesson.id) + ': ' + s.title : s.title; }
      pr.innerHTML = ''; pr.append(t); const k = document.createElement('kbd'); k.textContent = isTouch ? 'اقرأ' : 'E'; pr.append(k);
      pr.hidden = false;
    } else pr.hidden = true;
    const showHl = hit && !(target && target.kind === 'station' && hit && stationAt.get(key(hit.x, hit.y, hit.z)));
    hl.visible = !!showHl && !paused;
    if (hit) hl.position.set(hit.x + .5, hit.y + .5, hit.z + .5);
  }
  function interact() {
    if (!target) return false;
    if (target.kind === 'npc') { openNPC(target.n); return true; }
    const s = target.s;
    if (s.type === 'lesson') openLesson(s.ch, s.li);
    else if (s.type === 'quiz') openQuiz(s.ch);
    else if (s.type === 'summary') openSummary();
    else if (s.type === 'sorter') openSorter();
    else if (s.type === 'cert') openCert();
    return true;
  }
  function breakBlock() {
    if (!hit) return;
    if (hit.y <= 0 || protectedSet.has(key(hit.x, hit.y, hit.z))) { toast('هذا المكعب محميّ؛ فهو جزء من المنهج'); sfx('bad'); return; }
    burst(hit.x, hit.y, hit.z, hit.id); setBlock(hit.x, hit.y, hit.z, 0); sfx('break');
  }
  function placeBlock() {
    if (!hit) return;
    const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
    if (x < 0 || z < 0 || x >= W || z >= D || y < 1 || y >= H - 1) return;
    const cur = get(x, y, z); if (cur && cur !== B.WATER) return;
    if (protectedSet.has(key(x, y - 1, z)) || protectedSet.has(key(x, y - 2, z))) return;
    if (x + 1 > P.pos.x - .3 && x < P.pos.x + .3 && z + 1 > P.pos.z - .3 && z < P.pos.z + .3 && y + 1 > P.pos.y && y < P.pos.y + 1.8) return;
    setBlock(x, y, z, HOT[hotSel]); sfx('place');
  }

  /* ================= شريط المكعبات ================= */
  const HOT = [B.GRASS, B.PLANKS, B.BRICK, B.QUARTZ, B.GLASS, B.GOLD, B.LAMP, B.W_BLUE, B.W_GREEN];
  let hotSel = 0;
  function blockIcon(id) {
    const c = document.createElement('canvas'); c.width = c.height = 48; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const t = BLK[id].t; const tile = i => [(i % COLS) * TS, Math.floor(i / COLS) * TS];
    const face = (ti, m, shade) => { g.setTransform(...m); const [sx, sy] = tile(ti); g.drawImage(atlas, sx, sy, TS, TS, 0, 0, TS, TS); if (shade) { g.fillStyle = 'rgba(0,0,0,' + shade + ')'; g.fillRect(0, 0, TS, TS); } };
    face(t[0], [1.25, .625, -1.25, .625, 24, 4], 0);
    face(t[1], [1.25, .625, 0, 1.25, 4, 14], .22);
    face(t[1], [1.25, -.625, 0, 1.25, 24, 24], .38);
    return c;
  }
  function renderHotbar() {
    const hb = $('#hotbar'); hb.innerHTML = '';
    HOT.forEach((id, i) => {
      const s = document.createElement('div'); s.className = 'slot' + (i === hotSel ? ' sel' : ''); s.title = BLK[id].n;
      s.append(blockIcon(id)); const n = document.createElement('span'); n.textContent = ar(i + 1); s.append(n);
      s.addEventListener('click', e => { e.stopPropagation(); hotSel = i; renderHotbar(); toast(BLK[id].n, 1); });
      hb.append(s);
    });
  }

  /* ================= واجهة: التقدّم والهدف ================= */
  const lessonDone = ch => ch.lessons.filter(l => save.read[l.id]).length;
  const quizPassed = ch => (save.quiz[ch.id] || 0) >= 70;
  function renderChips() {
    const el = $('#chips'); el.innerHTML = '';
    CH.forEach(ch => {
      const c = document.createElement('button'); c.className = 'chip' + (quizPassed(ch) ? ' done' : ''); c.style.setProperty('--c', ch.color);
      c.title = 'الحيّ ' + ORD[ch.id - 1] + ': ' + ch.name;
      const pct = Math.round(lessonDone(ch) / ch.lessons.length * 100);
      c.innerHTML = '<span>' + ar(ch.id) + '<em> ' + ch.short + '</em></span><span class="bar"><i style="width:' + pct + '%"></i></span>';
      c.addEventListener('click', e => { e.stopPropagation(); openMap(); });
      el.append(c);
    });
    const lvl = Math.floor(save.xp / XP_PER_LEVEL) + 1;
    $('#lvl').textContent = ar(lvl); $('#rank').textContent = RANKS[Math.min(RANKS.length - 1, lvl - 1)];
    $('#xpbar i').style.width = (save.xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100 + '%';
    $('#xpbox').title = ar(save.xp) + ' نقطة خبرة';
  }
  function addXP(n, why) {
    const before = Math.floor(save.xp / XP_PER_LEVEL);
    save.xp += n; persist();
    const after = Math.floor(save.xp / XP_PER_LEVEL);
    toast('<b>+' + ar(n) + '</b> خبرة، ' + why);
    if (after > before) { setTimeout(() => { toast('ارتقيت إلى رتبة <b>' + RANKS[Math.min(RANKS.length - 1, after)] + '</b>'); sfx('level'); }, 500); }
    renderChips();
  }
  function objective() {
    if (!save.metGuide) return { label: 'ابدأ من هنا', text: 'تحدّث إلى مرشد المدينة', x: npcs[0].x, z: npcs[0].z };
    for (const ch of CH) {
      const L = ch.lessons.find(l => !save.read[l.id]);
      const d = districts[ch.id - 1];
      if (L) { const s = stations.find(s => s.type === 'lesson' && s.lesson === L); return { label: 'الحيّ ' + ORD[ch.id - 1], text: ar(L.id) + ' ' + L.title, x: s.x + .5, z: s.z + .5 }; }
      if (!quizPassed(ch)) return { label: 'الحيّ ' + ORD[ch.id - 1], text: 'اجتز اختبار الحيّ', x: d.x + .5, z: d.z + .5 };
    }
    return { label: 'أتممت الأحياء الستة', text: 'استلم شهادتك في قاعة الخلاصة', x: CX + 3.5, z: CZ - 1.5 };
  }
  let lastObj = '';
  function updateObjective() {
    const o = objective();
    const dx = o.x - P.pos.x, dz = o.z - P.pos.z, dist = Math.hypot(dx, dz);
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    const ang = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);
    $('#objArrow').style.transform = 'rotate(' + ang + 'rad)';
    const txt = o.label + '|' + o.text + '|' + Math.round(dist);
    if (txt !== lastObj) { lastObj = txt; $('#objLabel').textContent = o.label; $('#objText').textContent = o.text + '، ' + ar(Math.round(dist)) + ' م'; }
    return o;
  }
  function drawMinimap(o) {
    mg.putImageData(miniImg, 0, 0);
    districts.forEach(d => { mg.fillStyle = d.ch.color; mg.fillRect(d.x - 1, d.z - 1, 3, 3); });
    if (o) { mg.strokeStyle = '#fff'; mg.lineWidth = 1.5; mg.beginPath(); mg.arc(o.x, o.z, 3 + Math.sin(performance.now() / 200), 0, 7); mg.stroke(); }
    mg.save(); mg.translate(P.pos.x, P.pos.z); mg.rotate(-P.yaw);
    mg.fillStyle = '#ffde59'; mg.strokeStyle = '#000'; mg.lineWidth = 1;
    mg.beginPath(); mg.moveTo(0, -5); mg.lineTo(3.5, 4); mg.lineTo(0, 2); mg.lineTo(-3.5, 4); mg.closePath(); mg.fill(); mg.stroke(); mg.restore();
  }
  function toast(html, short) {
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; if (short) t.style.animationDuration = '.25s, .3s';
    $('#toast').append(t); setTimeout(() => t.remove(), short ? 1300 : 3100);
    while ($('#toast').children.length > 3) $('#toast').firstChild.remove();
  }

  /* ================= النوافذ ================= */
  const modal = $('#modal'), sheet = $('#sheet');
  let modalOpen = false;
  function openSheet({ color, num, title, sub, body, foot }) {
    releasePointer(); paused = true; modalOpen = true; keys.clear(); touchMove.x = touchMove.y = 0; touchUp = touchDown = false;
    sheet.style.setProperty('--c', color || '#3b7dd8');
    sheet.innerHTML = '<div class="sheet-head">' + (num ? '<span class="num">' + num + '</span>' : '') + '<h2>' + title + (sub ? '<small>' + sub + '</small>' : '') + '</h2><button class="xbtn" id="xclose" aria-label="إغلاق">✕</button></div><div class="sheet-body" id="sbody"></div>' + (foot ? '<div class="sheet-foot" id="sfoot"></div>' : '');
    const b = $('#sbody'); if (typeof body === 'string') b.innerHTML = body; else if (body) b.append(body);
    if (foot) foot($('#sfoot'));
    $('#xclose').onclick = closeSheet;
    modal.hidden = false; b.scrollTop = 0; sfx('open');
    return b;
  }
  function closeSheet() {
    modal.hidden = true; modalOpen = false; sheet.innerHTML = '';
    paused = false; renderChips();
    if (!isTouch) { $('#clickhint').hidden = false; }
  }
  modal.addEventListener('pointerdown', e => { if (e.target === modal) closeSheet(); });
  const btn = (label, cls, fn) => { const b = document.createElement('button'); b.className = 'pbtn ' + (cls || ''); b.textContent = label; b.onclick = fn; return b; };

  function shuffleIdx(n) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function renderQuestion(host, item, onAnswer) {
    host.innerHTML = '';
    const opts = document.createElement('div'); opts.className = 'qopts';
    shuffleIdx(item.o.length).forEach(oi => {
      const b = document.createElement('button'); b.className = 'qopt'; b.textContent = item.o[oi]; b.dataset.i = oi;
      b.onclick = () => {
        const right = oi === item.a;
        opts.querySelectorAll('.qopt').forEach(x => { x.disabled = true; if (+x.dataset.i === item.a) x.classList.add('right'); });
        if (!right) b.classList.add('wrong');
        sfx(right ? 'ok' : 'bad'); onAnswer(right);
      };
      opts.append(b);
    });
    host.append(opts);
  }

  /* ----- الدرس ----- */
  function openLesson(ch, li) {
    const L = ch.lessons[li];
    const body = document.createElement('div');
    body.innerHTML = L.html;
    let wEl = null;
    if (L.widget && WIDGETS[L.widget]) { wEl = document.createElement('div'); wEl.className = 'widget'; body.append(wEl); }
    if (L.q) {
      const q = document.createElement('div'); q.className = 'qbox';
      q.innerHTML = '<h5>سؤال سريع' + (save.quick[L.id] ? ' ✓' : '') + '</h5><p class="qq" style="font-size:16px">' + L.q.q + '</p><div></div>';
      renderQuestion(q.lastChild, L.q, right => { if (right && !save.quick[L.id]) { save.quick[L.id] = 1; persist(); addXP(10, 'إجابة صحيحة'); } });
      body.append(q);
    }
    openSheet({
      color: ch.color, num: ar(L.id), title: L.title, sub: 'الحيّ ' + ORD[ch.id - 1] + ': ' + ch.name, body,
      foot: f => {
        const meta = document.createElement('span'); meta.className = 'meta'; meta.textContent = 'الدرس ' + ar(li + 1) + ' من ' + ar(ch.lessons.length) + (save.read[L.id] ? '، مقروء ✓' : '');
        const nav = document.createElement('div'); nav.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
        if (li > 0) nav.append(btn('السابق', '', () => openLesson(ch, li - 1)));
        nav.append(btn(save.read[L.id] ? (li < ch.lessons.length - 1 ? 'الدرس التالي' : 'إلى الاختبار') : 'أتممت الدرس ✓', 'gold', () => {
          if (!save.read[L.id]) { save.read[L.id] = 1; persist(); addXP(20, 'أتممت ' + L.title); stations.forEach(s => s.lesson === L && refreshStation(s)); }
          if (li < ch.lessons.length - 1) openLesson(ch, li + 1);
          else if (!quizPassed(ch)) openQuiz(ch);
          else closeSheet();
        }));
        f.append(meta, nav);
      }
    });
    if (wEl) WIDGETS[L.widget](wEl, L);
  }

  /* ----- الاختبار ----- */
  function openQuiz(ch) {
    const order = shuffleIdx(ch.quiz.length);
    let i = 0, correct = 0; const res = []; const wrong = [];
    const body = document.createElement('div');
    const bar = document.createElement('div'); bar.className = 'quiz-progress'; bar.innerHTML = order.map(() => '<i></i>').join('');
    const qq = document.createElement('p'); qq.className = 'qq';
    const host = document.createElement('div');
    const nextWrap = document.createElement('div'); nextWrap.style.cssText = 'margin-top:12px;display:flex;justify-content:flex-start';
    body.append(bar, qq, host, nextWrap);
    const done = lessonDone(ch), total = ch.lessons.length;
    if (done < total) { const n = document.createElement('div'); n.className = 'rule rule-note'; n.innerHTML = '<span class="rule-tag">تنبيه</span><div>قرأت ' + ar(done) + ' من ' + ar(total) + ' دروس هذا الحيّ. يمكنك المحاولة الآن، أو إكمال الألواح أولًا.</div>'; body.prepend(n); }
    function show() {
      const item = ch.quiz[order[i]];
      bar.children[i].classList.add('c');
      qq.textContent = ar(i + 1) + '. ' + item.q; nextWrap.innerHTML = '';
      renderQuestion(host, item, right => {
        if (right) correct++; else wrong.push(item);
        res.push(right); bar.children[i].className = right ? 'r' : 'w';
        nextWrap.append(btn(i < order.length - 1 ? 'السؤال التالي' : 'النتيجة', 'gold', () => { i++; if (i < order.length) show(); else finish(); }));
      });
    }
    function finish() {
      const pct = Math.round(correct / order.length * 100);
      const prev = save.quiz[ch.id] || 0; const firstPass = pct >= 70 && prev < 70;
      save.quiz[ch.id] = Math.max(prev, pct); persist();
      body.innerHTML = '<div class="result"><div class="big">' + ar(pct) + '٪</div><p>' + ar(correct) + ' إجابات صحيحة من ' + ar(order.length) + '</p><p>' + (pct >= 70 ? '<b>أحسنت!</b> اجتزت اختبار الحيّ ' + ORD[ch.id - 1] + ' وأضاء منار الحيّ بالذهب.' : 'تحتاج إلى ٧٠٪ للاجتياز. راجع الدروس ثم أعد المحاولة.') + '</p></div>';
      if (wrong.length) {
        const rv = document.createElement('div'); rv.innerHTML = '<h4>راجع هذه الأسئلة</h4>' + wrong.map(w => '<div class="rule rule-note"><span class="rule-tag">الصواب</span><div>' + w.q + '<br><b>' + w.o[w.a] + '</b></div></div>').join('');
        body.append(rv);
      }
      const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap';
      row.append(btn('أعد المحاولة', '', () => openQuiz(ch)), btn('عودة إلى المدينة', 'gold', closeSheet)); body.append(row);
      if (firstPass) { sfx('level'); addXP(100, 'اجتياز اختبار الحيّ ' + ORD[ch.id - 1]); stations.forEach(s => s.type === 'quiz' && s.ch === ch && refreshStation(s)); if (CH.every(quizPassed)) setTimeout(() => toast('اجتزت الأحياء الستة! توجّه إلى <b>قاعة الخلاصة</b> لاستلام الشهادة'), 900); }
    }
    openSheet({ color: ch.color, num: ar(ch.id), title: 'اختبار الحيّ ' + ORD[ch.id - 1], sub: ch.name + '، ' + ar(ch.quiz.length) + ' أسئلة، النجاح ٧٠٪', body });
    show();
  }

  /* ----- المرشدون ----- */
  function openNPC(n) {
    if (n.type === 'guide') {
      if (!save.metGuide) { save.metGuide = true; persist(); addXP(10, 'لقاء مرشد المدينة'); }
      const body = '<p>أهلًا بك في <b>مدينة الباحث</b>. بُنيت هذه المدينة على <b>مذكرة مناهج البحث الاقتصادي</b> لبرنامج ماجستير الاقتصاد الإسلامي (د. عبد السلام أحمد سومر)، صفحةً صفحة؛ وتجد بجانب كل فكرة رقم صفحتها في المذكرة، وما زِدناه للتوضيح موسوم بـ«إضافة توضيحية».</p>' +
        '<h4>كيف تتعلم هنا؟</h4><ol><li>حول الساحة ستة أحياء، لكل محور من المذكرة حيّ بلونه، يصل إليه طريق مضاء بالمصابيح.</li><li>في كل حيّ <b>ألواح دروس</b> (مكعبات الكتب) مرتبة حول المركز؛ اقترب منها واضغط <b>E</b>. فوق كل لوح جوهرة تتحول إلى الأخضر حين تتم الدرس، وفي آخره سؤال سريع.</li><li>في كثير من الدروس <b>محاكيات</b>: اختيار المنهج، والتجربة والضابطة، وسحب العينات، وحجم العينة، وألفا كرونباخ، ومقاييس الإحصاء، والارتباط والانحدار، وترتيب الخطوات.</li><li>في وسط كل حيّ <b>مكعب الاختبار</b> ومناره. اجتز الاختبار بنسبة ٧٠٪ ليضيء المنار بالذهب.</li><li>في هذه القاعة: <b>جداول المقارنات الكبرى</b>، ولعبة <b>ميزان التصنيف</b> بست مجموعات، و<b>الشهادة</b> بعد اجتياز الأحياء الستة.</li></ol>' +
        '<h4>الأحياء</h4>' + T2() + '<p>السهم الذهبي أعلى الشاشة يدلّك دائمًا على الهدف التالي، و«خريطة المنهج» (M) تنقلك إلى أي لوح مباشرة. ويمكنك أيضًا البناء والهدم بحرية، فالمكعبات الخاصة بالمنهج محمية.</p>';
      openSheet({ color: '#b98516', title: 'مرشد المدينة', sub: 'مقدمة المذكرة وطريقة اللعب', body, foot: f => { f.append(document.createElement('span'), btn('ابدأ بالحيّ الأول', 'gold', closeSheet)); } });
      return;
    }
    const ch = n.d.ch;
    const rows = ch.lessons.map((l, i) => '<div class="maprow"><span class="st">' + (save.read[l.id] ? '✅' : '◻️') + '</span><span class="tt">' + ar(l.id) + ' ' + l.title + '</span><button data-li="' + i + '">اقرأ</button></div>').join('');
    const body = document.createElement('div');
    body.innerHTML = '<p>' + ch.intro + '</p><h4>ألواح هذا الحيّ</h4><div class="mapch" style="--c:' + ch.color + '">' + rows + '</div><p style="margin-top:10px">التقدّم: ' + ar(lessonDone(ch)) + ' من ' + ar(ch.lessons.length) + ' دروس، الاختبار: ' + (quizPassed(ch) ? 'مجتاز ✓ (' + ar(save.quiz[ch.id]) + '٪)' : (save.quiz[ch.id] ? 'آخر نتيجة ' + ar(save.quiz[ch.id]) + '٪' : 'لم تختبر بعد')) + '</p>';
    body.querySelectorAll('button[data-li]').forEach(b => b.onclick = () => openLesson(ch, +b.dataset.li));
    openSheet({
      color: ch.color, num: ar(ch.id), title: n.name, sub: ch.name, body,
      foot: f => {
        const first = ch.lessons.findIndex(l => !save.read[l.id]);
        f.append(btn('اختبار الحيّ', '', () => openQuiz(ch)), btn(first >= 0 ? 'ابدأ من أول درس لم تقرأه' : 'راجع الدرس الأول', 'gold', () => openLesson(ch, Math.max(0, first))));
      }
    });
  }
  function T2() { return '<div class="districts" style="margin:6px 0 12px">' + CH.map(c => '<div class="district" style="--c:' + c.color + ';background:#fff8e6"><b>الحيّ ' + ORD[c.id - 1] + '</b><small style="color:#6b5a3a">' + c.name + '</small></div>').join('') + '</div>'; }

  /* ----- القاعة: الخلاصة والميزان والشهادة ----- */
  function openSummary() {
    const body = '<p>جداول جامعة للمقارنات التي تتكرر في الاختبارات، مستخلصة من الأحياء الستة. استعملها للمراجعة السريعة.</p>' +
      COURSE.summary.map(t => '<h4>' + t.title + '</h4><div class="tbl"><table><thead><tr>' + t.head.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
        t.rows.map(r => '<tr>' + r.map((c, i) => (i ? '<td>' : '<th>') + c + (i ? '</td>' : '</th>')).join('') + '</tr>').join('') + '</tbody></table></div>').join('');
    openSheet({ color: '#b98516', title: 'جداول المقارنات الكبرى', sub: 'قاعة الخلاصة', body });
  }
  function openSorter() {
    const body = document.createElement('div');
    body.innerHTML = '<p>ست مجموعات تصنيف. اختر مجموعة، ثم ضع كل بطاقة في كفّتها الصحيحة. تُحفظ أفضل نتيجة لكل مجموعة.</p>';
    const grid = document.createElement('div'); grid.className = 'deckgrid';
    save.sorterBestBy = save.sorterBestBy || {};
    COURSE.sorters.forEach(d => {
      const b = document.createElement('button'); b.className = 'deck';
      const best = save.sorterBestBy[d.id];
      b.innerHTML = '<b>' + d.title + '</b><small>' + d.bins.map(x => x[1]).join(' · ') + '</small><em>' + (best !== undefined ? 'أفضل نتيجة ' + ar(best) + '/' + ar(Math.min(8, d.cards.length)) : 'لم تُلعب بعد') + '</em>';
      b.onclick = () => playDeck(d); grid.append(b);
    });
    body.append(grid);
    openSheet({ color: '#b98516', title: 'لعبة ميزان التصنيف', sub: 'اختر مجموعة', body });
  }
  function playDeck(d) {
    const N = Math.min(8, d.cards.length);
    const deck = shuffleIdx(d.cards.length).slice(0, N).map(i => d.cards[i]);
    const lab = Object.fromEntries(d.bins.map(x => [x[0], x[1]]));
    let i = 0, score = 0;
    const body = document.createElement('div');
    function show() {
      const c = deck[i];
      body.innerHTML = '<div class="quiz-progress">' + deck.map((_, k) => '<i class="' + (k < i ? 'r' : k === i ? 'c' : '') + '"></i>').join('') + '</div><p style="text-align:center;margin:0 0 8px">البطاقة ' + ar(i + 1) + ' من ' + ar(N) + '، النقاط ' + ar(score) + '</p><div class="sorter-card">' + c.t + '</div>';
      const row = document.createElement('div'); row.className = 'sorter-btns'; row.style.gridTemplateColumns = 'repeat(' + Math.min(d.bins.length, 4) + ', minmax(0,1fr))';
      d.bins.forEach(([k, l, col]) => {
        const b = document.createElement('button'); b.textContent = l; b.style.background = col;
        b.onclick = () => {
          const right = k === c.a; if (right) score++;
          sfx(right ? 'ok' : 'bad');
          row.querySelectorAll('button').forEach(x => x.disabled = true);
          const w = document.createElement('div'); w.className = 'why rule ' + (right ? 'rule-ok' : 'rule-no');
          w.innerHTML = '<span class="rule-tag">' + (right ? 'أصبت' : 'الصواب: ' + lab[c.a]) + '</span><div>' + c.why + '</div>';
          const nx = document.createElement('div'); nx.style.cssText = 'margin-top:10px;display:flex'; nx.append(btn(i < N - 1 ? 'البطاقة التالية' : 'النتيجة', 'gold', () => { i++; i < N ? show() : end(); }));
          body.append(w, nx);
        };
        row.append(b);
      });
      body.append(row);
    }
    function end() {
      save.sorterBestBy = save.sorterBestBy || {};
      const best = save.sorterBestBy[d.id] || 0; save.sorterBestBy[d.id] = Math.max(best, score); persist();
      body.innerHTML = '<div class="result"><div class="big">' + ar(score) + ' / ' + ar(N) + '</div><p>' + (score >= N - 1 ? 'ميزانك دقيق!' : 'راجع «جداول المقارنات» ثم جرّب مرة أخرى.') + ' أفضل نتيجة: ' + ar(save.sorterBestBy[d.id]) + '</p></div>';
      const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap'; row.append(btn('جولة جديدة', '', () => playDeck(d)), btn('مجموعة أخرى', '', openSorter), btn('عودة', 'gold', closeSheet)); body.append(row);
      if (score > best) addXP((score - best) * 5, 'ميزان التصنيف: ' + d.title);
    }
    openSheet({ color: '#b98516', title: d.title, sub: 'ميزان التصنيف، ' + ar(N) + ' بطاقات', body });
    show();
  }
  function openCert() {
    const passed = CH.filter(quizPassed).length;
    const body = document.createElement('div');
    if (passed < CH.length) {
      body.innerHTML = '<p>تُمنح الشهادة بعد اجتياز اختبارات الأحياء الستة بنسبة ٧٠٪ فأكثر. أنجزت حتى الآن <b>' + ar(passed) + ' من ٦</b>.</p>' +
        '<div class="mapgrid">' + CH.map(c => '<div class="mapch" style="--c:' + c.color + '"><h6><span>الحيّ ' + ORD[c.id - 1] + '</span><span>' + (quizPassed(c) ? '✓ ' + ar(save.quiz[c.id]) + '٪' : (save.quiz[c.id] ? ar(save.quiz[c.id]) + '٪' : '—')) + '</span></h6><div style="font-size:14px">' + c.name + '، ' + ar(lessonDone(c)) + '/' + ar(c.lessons.length) + ' دروس</div></div>').join('') + '</div>';
      openSheet({ color: '#b98516', title: 'شهادة الإتمام', sub: 'لم تكتمل بعد', body });
      return;
    }
    const avg = Math.round(CH.reduce((a, c) => a + save.quiz[c.id], 0) / CH.length);
    let hijri = ''; try { hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()); } catch (e) { }
    body.innerHTML = '<div class="cert"><p style="margin:0">مدينة الباحث تشهد بأن</p><div class="nm" id="certName">' + (save.name ? escapeHtml(save.name) : 'اكتب اسمك') + '</div><p>أتمّ جولة مذكرة <b>مناهج البحث الاقتصادي</b> بأحيائها الستة، واجتاز اختباراتها بمتوسط <b>' + ar(avg) + '٪</b>، وجمع <b>' + ar(save.xp) + '</b> نقطة خبرة، فنال رتبة <b>' + RANKS[Math.min(RANKS.length - 1, Math.floor(save.xp / XP_PER_LEVEL))] + '</b>.</p><p style="color:#6b5a3a">' + hijri + '</p><label for="nameIn" style="display:block;font-size:13px;margin-bottom:4px">الاسم على الشهادة</label><input id="nameIn" maxlength="40" value="' + escapeHtml(save.name || '') + '" placeholder="اكتب اسمك"></div>';
    openSheet({ color: '#b98516', title: 'شهادة الإتمام', sub: 'مبارك! أتممت الأحياء الستة', body });
    const inp = $('#nameIn'); inp.addEventListener('input', () => { save.name = inp.value; persist(); $('#certName').textContent = inp.value || 'اكتب اسمك'; });
    inp.addEventListener('keydown', e => e.stopPropagation());
  }
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ----- خريطة المنهج ----- */
  function openMap() {
    const body = document.createElement('div');
    const total = CH.reduce((a, c) => a + c.lessons.length, 0), read = CH.reduce((a, c) => a + lessonDone(c), 0);
    body.innerHTML = '<p>أنجزت <b>' + ar(read) + '</b> من <b>' + ar(total) + '</b> درسًا، و<b>' + ar(CH.filter(quizPassed).length) + '</b> من ٦ اختبارات. «اقرأ» يفتح اللوح مباشرة، و«انتقل» يأخذك إليه في المدينة.</p>';
    const grid = document.createElement('div'); grid.className = 'mapgrid';
    CH.forEach(ch => {
      const box = document.createElement('div'); box.className = 'mapch'; box.style.setProperty('--c', ch.color);
      box.innerHTML = '<h6><span>الحيّ ' + ORD[ch.id - 1] + ': ' + ch.name + '</span><span>' + ar(lessonDone(ch)) + '/' + ar(ch.lessons.length) + '</span></h6>';
      ch.lessons.forEach((l, i) => {
        const r = document.createElement('div'); r.className = 'maprow';
        r.innerHTML = '<span class="st">' + (save.read[l.id] ? '✅' : '◻️') + '</span><span class="tt">' + ar(l.id) + ' ' + l.title + '</span>';
        r.append(mbtn('اقرأ', () => openLesson(ch, i)), mbtn('انتقل', () => { teleportTo(stations.find(s => s.lesson === l)); }));
        box.append(r);
      });
      const r = document.createElement('div'); r.className = 'maprow';
      r.innerHTML = '<span class="st">' + (quizPassed(ch) ? '🏅' : '❔') + '</span><span class="tt"><b>اختبار الحيّ</b>' + (save.quiz[ch.id] ? '، ' + ar(save.quiz[ch.id]) + '٪' : '') + '</span>';
      r.append(mbtn('اختبر', () => openQuiz(ch)), mbtn('انتقل', () => teleportTo(stations.find(s => s.type === 'quiz' && s.ch === ch))));
      box.append(r); grid.append(box);
    });
    const fin = document.createElement('div'); fin.className = 'mapch'; fin.style.setProperty('--c', '#b98516');
    fin.innerHTML = '<h6><span>قاعة الخلاصة (وسط المدينة)</span></h6>';
    [['جداول المقارنات الكبرى', openSummary, 'summary'], ['لعبة ميزان التصنيف', openSorter, 'sorter'], ['شهادة الإتمام', openCert, 'cert']].forEach(([t, fn, ty]) => {
      const r = document.createElement('div'); r.className = 'maprow'; r.innerHTML = '<span class="st">⭐</span><span class="tt">' + t + '</span>';
      r.append(mbtn('افتح', fn), mbtn('انتقل', () => teleportTo(stations.find(s => s.type === ty)))); fin.append(r);
    });
    grid.append(fin); body.append(grid);
    openSheet({ color: '#24304d', title: 'خريطة المنهج', sub: 'الأحياء الستة وألواحها', body });
  }
  const mbtn = (t, fn) => { const b = document.createElement('button'); b.textContent = t; b.onclick = fn; return b; };
  function teleportTo(s) {
    if (!s) return;
    const cx = s.district ? s.district.x + .5 : CX + .5, cz = s.district ? s.district.z + .5 : CZ + 4.5;
    let dx = cx - (s.x + .5), dz = cz - (s.z + .5); const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    if (s.type === 'quiz') { dx = -s.district.ux; dz = -s.district.uz; }
    const dist = s.type === 'quiz' ? 3.4 : 3.2;
    P.pos.set(s.x + .5 + dx * dist, GROUND + 1, s.z + .5 + dz * dist);
    while (boxHits(P.pos.x, P.pos.y, P.pos.z) && P.pos.y < H) P.pos.y += 1;
    P.vel.set(0, 0, 0);
    const lx = s.x + .5 - P.pos.x, lz = s.z + .5 - P.pos.z; P.yaw = Math.atan2(-lx, -lz); P.pitch = -.12;
    closeSheet(); sfx('open');
  }

  /* ================= المحاكيات ================= */
  const field = (id, label, val, step, min, max) => '<label class="wfield" for="' + id + '">' + label + '<input type="number" id="' + id + '" value="' + val + '" step="' + (step || 1) + '"' + (min !== undefined ? ' min="' + min + '"' : '') + (max !== undefined ? ' max="' + max + '"' : '') + '></label>';
  const range = (id, label, val, min, max, step) => '<label class="wfield" for="' + id + '">' + label + ' <b id="' + id + '_v" style="color:#fff"></b><input type="range" id="' + id + '" value="' + val + '" min="' + min + '" max="' + max + '" step="' + (step || 1) + '"></label>';
  const num = id => parseFloat(document.getElementById(id).value);
  const stat = (label, val, cls) => '<div class="stat"><small>' + label + '</small><b class="' + (cls || '') + '">' + val + '</b></div>';
  const sign = n => n > 0 ? 'pos' : n < 0 ? 'neg' : '';
  const money = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n)) + ' ﷼';
  function live(el, fn) { el.querySelectorAll('input').forEach(i => { i.addEventListener('input', fn); i.addEventListener('keydown', e => e.stopPropagation()); }); fn(); }
  function chart(cv, x0, x1, series, mark, xl) {
    const dpr = Math.min(2, window.devicePixelRatio || 1); const w = cv.clientWidth || 600, h = cv.clientHeight || 170;
    cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = { l: 46, r: 12, t: 12, b: 24 };
    let y0 = Infinity, y1 = -Infinity; const N = 60;
    series.forEach(s => { for (let i = 0; i <= N; i++) { const v = s.fn(x0 + (x1 - x0) * i / N); y0 = Math.min(y0, v); y1 = Math.max(y1, v); } });
    y0 = Math.min(y0, 0); y1 = Math.max(y1, 0); const sp = (y1 - y0) || 1; y0 -= sp * .08; y1 += sp * .08;
    const X = x => pad.l + (x - x0) / (x1 - x0) * (w - pad.l - pad.r), Y = y => pad.t + (1 - (y - y0) / (y1 - y0)) * (h - pad.t - pad.b);
    g.font = '11px "IBM Plex Sans Arabic", sans-serif'; g.fillStyle = '#9aa6c2'; g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1;
    for (let k = 0; k <= 4; k++) { const v = y0 + (y1 - y0) * k / 4; g.beginPath(); g.moveTo(pad.l, Y(v)); g.lineTo(w - pad.r, Y(v)); g.stroke(); g.textAlign = 'right'; g.fillText(fmt(v, 0), pad.l - 6, Y(v) + 4); }
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(pad.l, Y(0)); g.lineTo(w - pad.r, Y(0)); g.stroke();
    g.textAlign = 'center'; for (let k = 0; k <= 4; k++) { const v = x0 + (x1 - x0) * k / 4; g.fillText(fmt(v, 1), X(v), h - 6); }
    if (xl) { g.textAlign = 'left'; g.fillText(xl, pad.l + 2, h - 6 - 12); }
    series.forEach(s => {
      g.strokeStyle = s.color; g.lineWidth = 2.5; g.beginPath();
      for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N; const y = Y(s.fn(x)); i ? g.lineTo(X(x), y) : g.moveTo(X(x), y); } g.stroke();
      if (mark !== undefined) { g.fillStyle = s.color; g.beginPath(); g.arc(X(mark), Y(s.fn(mark)), 4.5, 0, 7); g.fill(); }
    });
    if (mark !== undefined) { g.strokeStyle = 'rgba(233,185,73,.6)'; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(X(mark), pad.t); g.lineTo(X(mark), h - pad.b); g.stroke(); g.setLineDash([]); }
    g.textAlign = 'right'; let ly = pad.t + 10; series.forEach(s => { g.fillStyle = s.color; g.fillRect(w - pad.r - 10, ly - 7, 10, 4); g.fillStyle = '#dfe6f5'; g.fillText(s.label, w - pad.r - 16, ly); ly += 15; });
  }

  const WIDGETS = {
    /* ترتيب خطوات (عام): يقرأ L.wdata */
    order(el, L) {
      const items = L.wdata.items; let pick = [], order = shuffleIdx(items.length);
      if (order.every((v, i) => v === i)) order.reverse();
      function render(done) {
        el.innerHTML = '<h5>' + L.wdata.title + '</h5><p class="wnote" style="margin-top:0">انقر الخطوات بترتيبها الصحيح.</p>';
        const box = document.createElement('div'); box.className = 'ordbox';
        order.forEach(k => {
          const b = document.createElement('button'); b.className = 'ordit';
          const pos = pick.indexOf(k);
          b.innerHTML = (pos >= 0 ? '<span>' + ar(pos + 1) + '</span>' : '<span>·</span>') + items[k];
          if (pos >= 0) { b.disabled = true; b.classList.add(pos === k ? 'right' : 'wrong'); }
          b.onclick = () => { pick.push(k); sfx(k === pick.length - 1 ? 'ok' : 'bad'); render(pick.length === items.length); };
          box.append(b);
        });
        el.append(box);
        if (done) {
          const ok = pick.every((v, i) => v === i);
          const r = document.createElement('div'); r.className = 'wres ' + (ok ? 'pos' : 'neg');
          r.innerHTML = ok ? 'ترتيب صحيح ✓' : 'الترتيب الصحيح: ' + items.map((t, i) => ar(i + 1) + '. ' + t).join(' ← ');
          el.append(r);
          if (ok && !save.quick['ord' + L.id]) { save.quick['ord' + L.id] = 1; persist(); addXP(10, 'ترتيب صحيح'); }
        }
        const again = document.createElement('button'); again.className = 'wbtn'; again.textContent = 'أعد الترتيب';
        again.onclick = () => { pick = []; order = shuffleIdx(items.length); render(false); }; el.append(again);
      }
      render(false);
    },

    /* تصاميم البحث المختلط */
    mixed(el) {
      const D = { exp: ['الاستكشافي', [['كيفي', 'مقابلات/ملاحظة لاستكشاف الظاهرة'], ['كمي', 'اختبار العلاقات التي ظهرت وتأكيدها']]], tri: ['المثلّث (المتزامن)', [['كيفي + كمي', 'في الوقت نفسه'], ['دمج', 'استخدام النتائج معًا لفهم المشكلة وحلها']]], exl: ['التفسيري', [['كمي', 'جمع البيانات الكمية وتحليل نتائجها'], ['كيفي', 'للمساعدة في فهم النتائج وتفسيرها']]] };
      el.innerHTML = '<h5>مختبر تصاميم البحث المختلط</h5><div class="seg" id="mx_s">' + Object.entries(D).map(([k, v]) => '<button data-k="' + k + '">' + v[0] + '</button>').join('') + '</div><div id="mx_o"></div>';
      const go = k => { el.querySelectorAll('#mx_s button').forEach(b => b.classList.toggle('on', b.dataset.k === k)); $('#mx_o').innerHTML = '<div class="pipe">' + D[k][1].map((s, i) => (i ? '<i>←</i>' : '') + '<div class="' + (s[0].includes('كمي') && !s[0].includes('كيفي') ? 'qn' : s[0] === 'دمج' ? 'mg' : s[0].includes('+') ? 'mg' : 'ql') + '"><b>' + s[0] + '</b><small>' + s[1] + '</small></div>').join('') + '</div>'; };
      el.querySelectorAll('#mx_s button').forEach(b => b.onclick = () => go(b.dataset.k)); go('exp');
    },

    /* اختيار المنهج بثلاثة أسئلة */
    method(el) {
      const Q = [['الزمن الذي تتعلق به المشكلة', [['past', 'الماضي'], ['now', 'الحاضر'], ['fut', 'المستقبل (أثر تغيير)']]], ['مكان البحث', [['lib', 'المكتبة والوثائق'], ['field', 'الميدان (مسح/معايشة)'], ['lab', 'تجربة مضبوطة']]], ['الهدف', [['desc', 'الوصف'], ['why', 'التفسير ومعرفة الأسباب'], ['pred', 'التنبؤ بأثر التدخل']]]];
      const st = ['now', 'field', 'desc'];
      el.innerHTML = '<h5>مرشد اختيار المنهج</h5>' + Q.map((q, i) => '<div class="wfield">' + q[0] + '<div class="seg" data-i="' + i + '">' + q[1].map(o => '<button data-k="' + o[0] + '">' + o[1] + '</button>').join('') + '</div></div>').join('') + '<div id="me_o" class="wres"></div><p class="wnote">مبني على أسئلة المذكرة في ص٢٠. ويمكن الجمع بين أكثر من منهج في الظاهرة الواحدة.</p>';
      function upd() {
        el.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === st[+sg.dataset.i])));
        const sc = { desc: 0, hist: 0, exp: 0 };
        sc[{ past: 'hist', now: 'desc', fut: 'exp' }[st[0]]] += 2; sc[{ lib: 'hist', field: 'desc', lab: 'exp' }[st[1]]] += 1; sc[{ desc: 'desc', why: 'desc', pred: 'exp' }[st[2]]] += 1;
        if (st[2] === 'why' && st[0] === 'past') sc.hist += 1;
        const best = Object.entries(sc).sort((a, b) => b[1] - a[1])[0][0];
        const T = { desc: ['المنهج الوصفي', 'لظاهرة معاصرة تريد وصفها وتفسيرها كما هي دون تدخل' + (st[2] === 'why' ? '، ويمكن أن يتجاوز الوصف إلى التفسير (البحث الارتباطي أو التفسيري).' : '.')], hist: ['المنهج التاريخي', 'لما يرتبط بالماضي؛ يحلل السجلات والوثائق لتفسير الماضي وفهم الحاضر.'], exp: ['المنهج التجريبي/شبه التجريبي', 'لإدخال متغير وضبط غيره ومعرفة الأسباب والتنبؤ بمستقبل الظاهرة.'] };
        $('#me_o').innerHTML = 'الأنسب: <b style="color:var(--gold)">' + T[best][0] + '</b><br><small>' + T[best][1] + '</small>';
      }
      el.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => { st[+sg.dataset.i] = b.dataset.k; upd(); }));
      upd();
    },

    /* التجربة والضابطة: الحد الأدنى للأجور */
    experiment(el) {
      el.innerHTML = '<h5>محاكي التجربة: الحد الأدنى للأجور والبطالة</h5><div class="wgrid">' + field('ex_e0', 'البطالة قبل — التجريبية (٪)', 6, .1, 0) + field('ex_e1', 'البطالة بعد — التجريبية (٪)', 7.5, .1, 0) + field('ex_c0', 'البطالة قبل — الضابطة (٪)', 6.2, .1, 0) + field('ex_c1', 'البطالة بعد — الضابطة (٪)', 6.7, .1, 0) + '</div><div class="wout" id="ex_o"></div><canvas class="wcanvas" id="ex_cv"></canvas><p class="wnote">الأرقام افتراضية للتدريب. الضابطة تكشف ما كان سيحدث بدون المتغير؛ فالأثر المنسوب للأجور = تغير التجريبية − تغير الضابطة (إضافة توضيحية: «الفرق في الفروق»).</p>';
      live(el, () => {
        const e0 = num('ex_e0'), e1 = num('ex_e1'), c0 = num('ex_c0'), c1 = num('ex_c1');
        const de = e1 - e0, dc = c1 - c0, eff = de - dc;
        const pp = n => (n > 0 ? '+' : n < 0 ? '−' : '') + fmt(Math.abs(n)) + ' نقطة';
        $('#ex_o').innerHTML = stat('تغير التجريبية', pp(de)) + stat('تغير الضابطة', pp(dc)) + stat('الأثر المنسوب للمتغير المستقل', pp(eff), eff > 0 ? 'neg' : eff < 0 ? 'pos' : '') + stat('القراءة', Math.abs(eff) < .2 ? 'لا أثر يُذكر' : eff > 0 ? 'رفع الأجور زاد البطالة' : 'رفع الأجور خفّض البطالة');
        const cv = $('#ex_cv'); const dpr = Math.min(2, devicePixelRatio || 1); const w = cv.clientWidth || 600, h = cv.clientHeight || 170; cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const lo0 = Math.min(e0, e1, c0, c1, e0 + dc), hi0 = Math.max(e0, e1, c0, c1, e0 + dc), pad = Math.max(.5, (hi0 - lo0) * .25); const Y = v => h - 26 - (v - lo0 + pad) / (hi0 - lo0 + 2 * pad) * (h - 44);
        g.font = '12px "IBM Plex Sans Arabic"'; g.fillStyle = '#9aa6c2'; g.textAlign = 'center'; g.fillText('قبل', w * .3, h - 8); g.fillText('بعد', w * .7, h - 8);
        [[e0, e1, '#ff7a86', 'التجريبية'], [c0, c1, '#7fb2ff', 'الضابطة']].forEach(([a, b, col, lb], k) => { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(w * .3, Y(a)); g.lineTo(w * .7, Y(b)); g.stroke(); g.fillStyle = col; [[w * .3, a], [w * .7, b]].forEach(([x, v]) => { g.beginPath(); g.arc(x, Y(v), 5, 0, 7); g.fill(); }); g.textAlign = 'right'; g.fillText(lb + ' ' + fmt(b) + '٪', w - 10, 18 + k * 16); });
        g.setLineDash([5, 4]); g.strokeStyle = 'rgba(255,122,134,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(w * .3, Y(e0)); g.lineTo(w * .7, Y(e0 + dc)); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#9aa6c2'; g.textAlign = 'left'; g.fillText('المتقطع: مسار التجريبية لو لم تُرفع الأجور', 8, 18);
      });
    },

    /* تحليل العنوان */
    title(el) {
      const parts = [['تأثير', 'rel', 'صفة العلاقة'], ['المستوى التعليمي', 'iv', 'المتغير المستقل'], ['على', 'rel', 'صفة العلاقة'], ['قرار الاستثمار', 'dv', 'المتغير التابع'], [':', '', ''], ['دراسة قياسية تحليلية', 'm', 'نوع الدراسة/المنهجية'], ['على موظفي القطاع العام', 'pop', 'المجتمع'], ['في المملكة العربية السعودية', 'geo', 'الحد المكاني']];
      const ask = [['iv', 'المتغير المستقل'], ['dv', 'المتغير التابع'], ['m', 'نوع الدراسة/المنهجية'], ['pop', 'المجتمع'], ['geo', 'الحد المكاني']];
      let step = 0, score = 0;
      function render() {
        el.innerHTML = '<h5>مشرّح العنوان</h5>' + (step < ask.length ? '<p style="margin:0 0 8px">انقر الجزء الذي يمثل: <b style="color:var(--gold)">' + ask[step][1] + '</b></p>' : '<div class="wres pos">أحسنت! ' + ar(score) + ' من ' + ar(ask.length) + '. العنوان دقيق وواضح وموجز، ويتضمن المتغيرات ونوع الدراسة.</div>');
        const t = document.createElement('div'); t.className = 'tparts';
        parts.forEach(([txt, k, lab]) => {
          const b = document.createElement('button'); b.textContent = txt; const doneIdx = ask.findIndex(a => a[0] === k);
          if (k && doneIdx > -1 && doneIdx < step) { b.className = 'tp k-' + k; b.title = lab; b.innerHTML = txt + '<small>' + lab + '</small>'; } else b.className = 'tp';
          if (!k) b.disabled = true;
          b.onclick = () => { if (step >= ask.length) return; const right = k === ask[step][0]; sfx(right ? 'ok' : 'bad'); if (right) { score++; step++; render(); } else { b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); } };
          t.append(b);
        });
        el.append(t);
        if (step >= ask.length) { const a = document.createElement('button'); a.className = 'wbtn'; a.textContent = 'أعد'; a.onclick = () => { step = 0; score = 0; render(); }; el.append(a); }
      }
      render();
    },

    /* المستقل والتابع */
    vars(el) {
      const H = [['الدخل', 'الاستثمار', 'تأثير الدخل على الاستثمار'], ['التضخم', 'الادخار', 'تأثير التضخم على الادخار'], ['المستوى التعليمي', 'قرار الاستثمار', 'تأثير المستوى التعليمي على قرار الاستثمار'], ['الحد الأدنى للأجور', 'البطالة', 'تأثير الحد الأدنى للأجور على البطالة'], ['جودة الخدمات', 'حجم المبيعات', 'أثر جودة خدمات الشركة على حجم مبيعاتها'], ['التجارة الإلكترونية', 'مبيعات المتاجر الصغيرة', 'التوسع في التجارة الإلكترونية يؤثر سلبًا على مبيعات المتاجر الصغيرة']];
      let i = 0, sc = 0;
      function render() {
        if (i >= H.length) { el.innerHTML = '<h5>من المستقل؟</h5><div class="wres pos">' + ar(sc) + ' من ' + ar(H.length) + '. تذكّر: المستقل يسبق التابع ويؤثر فيه، والتابع هو الظاهرة المدروسة.</div>'; const a = document.createElement('button'); a.className = 'wbtn'; a.textContent = 'أعد'; a.onclick = () => { i = 0; sc = 0; render(); }; el.append(a); return; }
        const [iv, dv, s] = H[i];
        el.innerHTML = '<h5>من المستقل؟ ' + ar(i + 1) + '/' + ar(H.length) + '</h5><p style="margin:0 0 8px">«' + s + '»</p><p class="wnote" style="margin:0 0 8px">أيّ المتغيرين هو <b style="color:var(--gold)">المستقل</b> (السبب/التفسيري)؟</p>';
        const row = document.createElement('div'); row.className = 'seg';
        (Math.random() < .5 ? [iv, dv] : [dv, iv]).forEach(v => { const b = document.createElement('button'); b.textContent = v; b.onclick = () => { const ok = v === iv; if (ok) sc++; sfx(ok ? 'ok' : 'bad'); row.querySelectorAll('button').forEach(x => { x.disabled = true; x.classList.add(x.textContent === iv ? 'good' : 'bad'); }); const r = document.createElement('div'); r.className = 'wres'; r.innerHTML = 'المستقل: <b>' + iv + '</b>، والتابع: <b>' + dv + '</b>'; const n = document.createElement('button'); n.className = 'wbtn'; n.textContent = 'التالي'; n.onclick = () => { i++; render(); }; el.append(r, n); }; row.append(b); });
        el.append(row);
      }
      render();
    },

    /* العلاقة بين الأدلة */
    sources(el) {
      const st = ['q', 'z'];
      el.innerHTML = '<h5>ميزان التعارض الظاهر</h5><div class="wgrid"><div class="wfield">الدليل الأول<div class="seg" data-i="0"><button data-k="q">قطعي</button><button data-k="z">ظني</button></div></div><div class="wfield">الدليل الثاني<div class="seg" data-i="1"><button data-k="q">قطعي</button><button data-k="z">ظني</button></div></div></div><div class="wres" id="so_o"></div><p class="wnote">سواء كان الدليل عقليًا أو نقليًا. «صريح المعقول لا يعارض صحيح المنقول» (ص٥٢).</p>';
      const upd = () => {
        el.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === st[+sg.dataset.i])));
        const k = st.slice().sort().join('');
        $('#so_o').innerHTML = { qq: '<b>قطعي مع قطعي</b>: يمتنع التعارض بينهما أصلًا؛ فإن ظهر فلخلل في الفهم.', qz: '<b>قطعي مع ظني</b>: يُقدَّم القطعي، عقليًا كان أو نقليًا.', zz: '<b>ظني مع ظني</b>: يُصار إلى طلب الترجيح.' }[k];
      };
      el.querySelectorAll('.seg').forEach(sg => sg.querySelectorAll('button').forEach(b => b.onclick = () => { st[+sg.dataset.i] = b.dataset.k; upd(); }));
      upd();
    },

    /* ألفا كرونباخ */
    alpha(el) {
      el.innerHTML = '<h5>مقياس ألفا كرونباخ</h5>' + range('al_a', 'قيمة معامل ألفا', .72, 0, 1, .01) + '<div class="gauge"><i style="right:0;width:60%;background:#d9434f"></i><i style="right:60%;width:10%;background:#e58a1f"></i><i style="right:70%;width:10%;background:#3b7dd8"></i><i style="right:80%;width:20%;background:#2fae6b"></i><b id="al_p"></b></div><div class="gauge-l">' + [[0, '٠'], [60, '٠٫٦'], [70, '٠٫٧'], [80, '٠٫٨'], [100, '١']].map(([r, t]) => '<span style="right:' + r + '%">' + t + '</span>').join('') + '</div><div class="wout" id="al_o"></div><details class="wmore"><summary>إضافة توضيحية: من أين تأتي قيمة ألفا؟</summary>' + '<div class="wgrid" style="margin-top:8px">' + field('al_k', 'عدد العبارات k', 10, 1, 2) + field('al_r', 'متوسط الارتباط بين العبارات r̄', .25, .01, 0, 1) + '</div><div class="wout" id="al_o2"></div><p class="wnote">ألفا المعيارية = k·r̄ ÷ (١ + (k−١)·r̄). زيادة العبارات المتجانسة ترفع الثبات.</p></details>';
      const lab = a => a < .6 ? ['ضعيف', 'neg'] : a < .7 ? ['مقبول', ''] : a < .8 ? ['جيد', 'pos'] : ['ممتاز', 'pos'];
      live(el, () => {
        const a = num('al_a'); $('#al_a_v').textContent = fmt(a); $('#al_p').style.right = (a * 100) + '%';
        const [l, c] = lab(a); $('#al_o').innerHTML = stat('درجة الثبات', l, c) + stat('القرار', a < .6 ? 'راجع العبارات قبل التوزيع' : 'صالح للتطبيق');
        const k = num('al_k'), r = num('al_r'); const s = k * r / (1 + (k - 1) * r); const [l2, c2] = lab(s);
        $('#al_o2').innerHTML = stat('ألفا المعيارية', isFinite(s) ? fmt(s) : '—') + stat('التقدير', isFinite(s) ? l2 : '—', c2);
      });
    },

    /* سحب العينات */
    sampling(el) {
      const N = 60, COLS = 12; const strata = i => i < 24 ? 0 : i < 45 ? 1 : 2; const SC = ['#7fb2ff', '#ffb36b', '#c79bff'];
      const cl = i => Math.floor((i % COLS) / 3) + 4 * Math.floor(Math.floor(i / COLS) / 3);
      let sel = new Set(), mode = 'srs', n = 12;
      el.innerHTML = '<h5>مختبر سحب العينات (مجتمع من ٦٠ فردًا)</h5><div class="seg" id="sp_m"><button data-k="srs">عشوائية بسيطة</button><button data-k="sys">منتظمة</button><button data-k="str">طبقية</button><button data-k="clu">عنقودية</button></div><div class="pop" id="sp_g"></div><div class="wres" id="sp_o"></div><button class="wbtn" id="sp_d">اسحب العينة</button><p class="wnote">الألوان الثلاثة طبقات (مثل فئات الدخل: ٢٤، ٢١، ١٥ فردًا). والمربعات المحددة عناقيد (أحياء).</p>';
      function draw() {
        const g = $('#sp_g'); g.innerHTML = '';
        for (let i = 0; i < N; i++) { const d = document.createElement('i'); d.style.background = SC[strata(i)]; if (mode === 'clu') d.style.outline = '2px solid ' + (cl(i) % 2 ? '#ffffff22' : '#ffffff55'); if (sel.has(i)) d.className = 'on'; d.textContent = ar(i + 1); g.append(d); }
        const cnt = [0, 0, 0]; sel.forEach(i => cnt[strata(i)]++);
        $('#sp_o').innerHTML = sel.size ? 'حجم العينة ' + ar(sel.size) + ' — من الطبقات: <span style="color:' + SC[0] + '">' + ar(cnt[0]) + '</span> / <span style="color:' + SC[1] + '">' + ar(cnt[1]) + '</span> / <span style="color:' + SC[2] + '">' + ar(cnt[2]) + '</span><br><small>' + ({ srs: 'كل فرد له الفرصة نفسها؛ وقد لا تأتي الطبقات بنسبها — «العشوائية لا تضمن التمثيل».', sys: 'بداية عشوائية ثم مسافة ثابتة = ٦٠ ÷ ١٢ = ٥.', str: 'سحب عشوائي من كل طبقة بنسبة حجمها، فتُمثَّل الطبقات كلها.', clu: 'اختيرت عناقيد كاملة بكل أفرادها؛ تناسب المجتمع المتفرق جغرافيًا.' }[mode]) + '</small>' : 'اختر الطريقة ثم «اسحب العينة».';
        el.querySelectorAll('#sp_m button').forEach(b => b.classList.toggle('on', b.dataset.k === mode));
      }
      function doDraw() {
        sel = new Set();
        if (mode === 'srs') shuffleIdx(N).slice(0, n).forEach(i => sel.add(i));
        else if (mode === 'sys') { const k = N / n, s = Math.floor(Math.random() * k); for (let i = s; i < N; i += k) sel.add(i); }
        else if (mode === 'str') { const groups = [[], [], []]; for (let i = 0; i < N; i++) groups[strata(i)].push(i); const q = groups.map(gr => Math.round(gr.length / N * n)); groups.forEach((gr, gi) => shuffleIdx(gr.length).slice(0, q[gi]).forEach(j => sel.add(gr[j]))); }
        else { const ids = shuffleIdx(8).slice(0, 1); for (let i = 0; i < N; i++) if (ids.includes(cl(i))) sel.add(i); }
        sfx('ok'); draw();
      }
      el.querySelectorAll('#sp_m button').forEach(b => b.onclick = () => { mode = b.dataset.k; sel = new Set(); draw(); });
      $('#sp_d').onclick = doDraw; draw();
    },

    /* حجم العينة */
    size(el) {
      el.innerHTML = '<h5>حاسبة حجم العينة بقواعد الخبراء</h5><div class="wgrid">' + field('sz_n', 'حجم المجتمع', 4000, 10, 1) + field('sz_v', 'عدد المتغيرات', 5, 1, 1) + field('sz_s', 'عدد الطبقات (للطبقية)', 3, 1, 0) + range('sz_r', 'زيادة لتفادي نقص الاستجابة', 45, 0, 50, 5) + '</div><div class="wout" id="sz_o"></div><p class="wnote">القواعد من ص٨٠–٨١. والقرار النهائي يتأثر أيضًا بالتجانس ومستوى الثقة والموارد.</p>';
      live(el, () => {
        const N = num('sz_n'), v = num('sz_v'), s = num('sz_s'), r = num('sz_r'); $('#sz_r_v').textContent = ar(r) + '٪';
        const up = x => Math.ceil(x * (1 + r / 100));
        const sv = Math.ceil(N * .05), co = 30 * v, rg = 10 * v, st = 30 * s;
        $('#sz_o').innerHTML = stat('مسحي (٥٪)', ar(sv) + ' ← توزّع ' + ar(up(sv))) + stat('ارتباطي (٣٠×متغير)', ar(co) + ' ← توزّع ' + ar(up(co))) + stat('انحدار (١٠×متغير)', ar(rg) + ' ← توزّع ' + ar(up(rg))) + stat('طبقية (٣٠×طبقة)', s > 0 ? ar(st) + ' حدًا أدنى' : '—');
      });
    },

    /* مقاييس النزعة والتشتت */
    stats(el) {
      el.innerHTML = '<h5>مختبر المقاييس الإحصائية</h5><label class="wfield" for="st_x">القيم (افصل بفاصلة أو مسافة)<input type="text" id="st_x" value="12, 15, 15, 18, 20, 22, 25" style="font:500 16px var(--body);background:#0f1626;color:#fff;border:2px solid #34405f;border-radius:4px;padding:6px 8px;direction:ltr"></label><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="wbtn" id="st_out">أضف قيمة شاذة (٢٠٠)</button><button class="wbtn" id="st_rst">أعد القيم</button></div><div class="wout" id="st_o"></div><canvas class="wcanvas" id="st_cv" style="height:90px"></canvas>';
      const inp = $('#st_x'); inp.addEventListener('keydown', e => e.stopPropagation());
      const calc = () => {
        const a = inp.value.replace(/[٠-٩]/g, d => AR.indexOf(d)).split(/[\s,،]+/).filter(t => t.trim() !== '').map(Number).filter(v => isFinite(v));
        if (!a.length) { $('#st_o').innerHTML = stat('أدخل قيمًا', '—'); return; }
        const n = a.length, srt = [...a].sort((p, q) => p - q), mean = a.reduce((p, q) => p + q, 0) / n;
        const med = n % 2 ? srt[(n - 1) / 2] : (srt[n / 2 - 1] + srt[n / 2]) / 2;
        const fq = {}; a.forEach(v => fq[v] = (fq[v] || 0) + 1); const mx = Math.max(...Object.values(fq)); const modes = Object.keys(fq).filter(k => fq[k] === mx);
        const vr = a.reduce((p, q) => p + (q - mean) ** 2, 0) / n, sd = Math.sqrt(vr);
        $('#st_o').innerHTML = stat('العدد', ar(n)) + stat('الوسط الحسابي', fmt(mean)) + stat('الوسيط', fmt(med)) + stat('المنوال', mx > 1 ? modes.map(m => fmt(+m)).join('، ') : 'لا منوال') + stat('المدى', fmt(srt[n - 1] - srt[0])) + stat('التباين', fmt(vr)) + stat('الانحراف المعياري', fmt(sd)) + stat('معامل الاختلاف', mean ? fmt(sd / mean * 100, 1) + '٪' : '—');
        const cv = $('#st_cv'); const dpr = Math.min(2, devicePixelRatio || 1); const w = cv.clientWidth || 600, h = cv.clientHeight || 90; cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const lo = srt[0], hi = srt[n - 1] === lo ? lo + 1 : srt[n - 1]; const X = v => 20 + (v - lo) / (hi - lo) * (w - 40);
        g.strokeStyle = '#34405f'; g.lineWidth = 2; g.beginPath(); g.moveTo(20, 50); g.lineTo(w - 20, 50); g.stroke();
        a.forEach(v => { g.fillStyle = '#dfe6f5'; g.beginPath(); g.arc(X(v), 50, 4, 0, 7); g.fill(); });
        [[mean, '#e9b949', 'الوسط', 22], [med, '#5ee39a', 'الوسيط', 80]].forEach(([v, c, l, y]) => { g.strokeStyle = c; g.beginPath(); g.moveTo(X(v), 36); g.lineTo(X(v), 64); g.stroke(); g.fillStyle = c; g.font = '12px "IBM Plex Sans Arabic"'; g.textAlign = 'center'; g.fillText(l, X(v), y); });
      };
      inp.addEventListener('input', calc);
      $('#st_out').onclick = () => { inp.value = inp.value.replace(/\s*$/, '') + ', 200'; calc(); };
      $('#st_rst').onclick = () => { inp.value = '12, 15, 15, 18, 20, 22, 25'; calc(); };
      calc();
    },

    /* الارتباط والانحدار */
    corr(el) {
      el.innerHTML = '<h5>مختبر الارتباط والانحدار</h5><div class="wgrid">' + range('co_r', 'معامل الارتباط المستهدف r', .7, -1, 1, .05) + range('co_x', 'قيمة المتغير المستقل للتنبؤ', 60, 0, 100, 1) + '</div><canvas class="wcanvas" id="co_cv" style="height:220px"></canvas><div class="wout" id="co_o"></div><p class="wnote">البيانات مولّدة للتدريب. والانحدار يفترض علاقة سببية يسوّغها الإطار النظري؛ فالارتباط وحده لا يثبتها.</p>';
      let seed = 7; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296; const gauss = () => { let u = rnd() || 1e-9, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
      const base = Array.from({ length: 50 }, () => [gauss(), gauss()]);
      live(el, () => {
        const r = num('co_r'), xq = num('co_x'); $('#co_r_v').textContent = fmt(r); $('#co_x_v').textContent = ar(xq);
        const pts = base.map(([a, b]) => [50 + a * 15, 50 + (r * a + Math.sqrt(Math.max(0, 1 - r * r)) * b) * 15]);
        const n = pts.length, mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
        let sxy = 0, sxx = 0, syy = 0; pts.forEach(([x, y]) => { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; });
        const rr = sxy / Math.sqrt(sxx * syy), b1 = sxy / sxx, b0 = my - b1 * mx, yq = b0 + b1 * xq;
        const cv = $('#co_cv'); const dpr = Math.min(2, devicePixelRatio || 1); const w = cv.clientWidth || 600, h = cv.clientHeight || 220; cv.width = w * dpr; cv.height = h * dpr; const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
        const X = x => 30 + x / 100 * (w - 40), Y = y => h - 20 - y / 100 * (h - 30);
        g.strokeStyle = '#34405f'; g.beginPath(); g.moveTo(30, 10); g.lineTo(30, h - 20); g.lineTo(w - 10, h - 20); g.stroke();
        g.fillStyle = '#9aa6c2'; g.font = '11px "IBM Plex Sans Arabic"'; g.textAlign = 'left'; g.fillText('المستقل س', w - 80, h - 6); g.save(); g.translate(12, 70); g.rotate(-Math.PI / 2); g.fillText('التابع ص', 0, 0); g.restore();
        pts.forEach(([x, y]) => { g.fillStyle = '#7fb2ff'; g.beginPath(); g.arc(X(x), Y(y), 3.2, 0, 7); g.fill(); });
        g.strokeStyle = '#e9b949'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(X(0), Y(b0)); g.lineTo(X(100), Y(b0 + b1 * 100)); g.stroke();
        g.fillStyle = '#5ee39a'; g.beginPath(); g.arc(X(xq), Y(yq), 6, 0, 7); g.fill();
        const a = Math.abs(rr); const strength = a >= .7 ? 'قوية' : a >= .4 ? 'متوسطة' : a >= .1 ? 'ضعيفة' : 'منعدمة تقريبًا';
        $('#co_o').innerHTML = stat('معامل بيرسون المحسوب', fmt(rr)) + stat('الاتجاه', Math.abs(rr) < .1 ? '—' : rr > 0 ? 'طردية' : 'عكسية', rr > 0 ? 'pos' : 'neg') + stat('القوة', strength) + stat('معادلة الانحدار', 'ص = ' + fmt(b0, 1) + (b1 < 0 ? ' − ' : ' + ') + fmt(Math.abs(b1)) + ' س') + stat('التنبؤ عند س = ' + ar(xq), fmt(yq, 1));
      });
    },

    /* الاقتباس */
    quote(el) {
      el.innerHTML = '<h5>فاحص شكل الاقتباس النصي</h5><label class="wfield" for="qu_t">الصق النص المقتبس<textarea id="qu_t" rows="4" style="font:15px var(--body);background:#0f1626;color:#fff;border:2px solid #34405f;border-radius:4px;padding:6px 8px;resize:vertical">البحث العلمي عملية منظمة لجمع البيانات والمعلومات وتحليلها للوصول إلى إجابات أو حلول للأسئلة أو المشكلات التي تواجه الأفراد والمجتمعات، واكتساب معارف جديدة وموثقة.</textarea></label><div class="wout" id="qu_o"></div><div id="qu_p"></div>';
      const t = $('#qu_t'); t.addEventListener('keydown', e => e.stopPropagation());
      const upd = () => {
        const words = t.value.trim().split(/\s+/).filter(Boolean).length, long = words > 40;
        $('#qu_o').innerHTML = stat('عدد الكلمات', ar(words)) + stat('النوع', long ? 'اقتباس طويل (أكثر من ٤٠)' : 'اقتباس قصير (٤٠ فأقل)', long ? '' : 'pos') + stat('الشكل', long ? 'بلا تنصيص، خط أصغر، هوامش' : 'بين علامات تنصيص');
        const safe = escapeHtml(t.value.trim());
        $('#qu_p').innerHTML = '<div class="qprev">' + (long ? '<p>...ويقول المؤلف:</p><blockquote>' + safe + '</blockquote>' : '<p>ويُعرَّف بأنه: «' + safe + '»<sup>(١)</sup>.</p>') + '</div>';
      };
      t.addEventListener('input', upd); upd();
    },

    /* ترتيب قائمة المراجع */
    refs(el) {
      const R = [['ابن تيمية', 'ابن تيمية، أحمد بن عبد الحليم. الحسبة في الإسلام.', 'تيمية'], ['ابن خلدون', 'ابن خلدون، عبد الرحمن بن محمد. المقدمة.', 'خلدون'], ['الشيباني', 'الشيباني، محمد بن الحسن. الاكتساب في الرزق المستطاب.', 'شيباني'], ['الغزالي', 'الغزالي، محمد بن محمد أبو حامد. إحياء علوم الدين.', 'غزالي'], ['ابن القيم', 'ابن القيم، محمد بن أبي بكر. الطرق الحكمية.', 'قيم'], ['الماوردي', 'الماوردي، علي بن محمد. الأحكام السلطانية والولايات الدينية.', 'ماوردي']];
      const keyAr = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
      const kv = s => [...s].map(c => String.fromCharCode(65 + Math.max(0, keyAr.indexOf(c)))).join('');
      const correct = R.map((r, i) => i).sort((a, b) => kv(R[a][2]) < kv(R[b][2]) ? -1 : 1);
      let pick = [], order = shuffleIdx(R.length);
      function render() {
        el.innerHTML = '<h5>رتّب قائمة المراجع العربية هجائيًا</h5><p class="wnote" style="margin-top:0">انقر المراجع بالترتيب. تذكّر: «أل» و«ابن» لا تدخلان في الترتيب. (أسماء توضيحية مأخوذة من مراجع ذكرتها المذكرة)</p>';
        const box = document.createElement('div'); box.className = 'ordbox';
        order.forEach(k => { const b = document.createElement('button'); b.className = 'ordit'; const pos = pick.indexOf(k); b.innerHTML = (pos >= 0 ? '<span>' + ar(pos + 1) + '</span>' : '<span>·</span>') + R[k][1]; if (pos >= 0) { b.disabled = true; b.classList.add(correct[pos] === k ? 'right' : 'wrong'); } b.onclick = () => { pick.push(k); sfx(correct[pick.length - 1] === k ? 'ok' : 'bad'); render(); }; box.append(b); });
        el.append(box);
        if (pick.length === R.length) { const ok = pick.every((v, i) => v === correct[i]); const r = document.createElement('div'); r.className = 'wres ' + (ok ? 'pos' : 'neg'); r.innerHTML = ok ? 'ترتيب صحيح ✓' : 'الصحيح: ' + correct.map(i => R[i][0] + ' (' + R[i][2][0] + ')').join(' ← '); el.append(r); }
        const a = document.createElement('button'); a.className = 'wbtn'; a.textContent = 'أعد'; a.onclick = () => { pick = []; order = shuffleIdx(R.length); render(); }; el.append(a);
      }
      render();
    }
  };

  /* ================= الإدخال ================= */
  const isTouch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  let locked = false, dragMode = false, lockFailed = false;
  function requestLock() {
    if (isTouch || lockFailed) { dragMode = true; return; }
    try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { lockFailed = true; dragMode = true; $('#clickhint').textContent = 'اسحب بالفأرة للنظر، وانقر للهدم أو القراءة'; }); } catch (e) { lockFailed = true; dragMode = true; }
  }
  function releasePointer() { if (document.pointerLockElement) { try { document.exitPointerLock(); } catch (e) { } } }
  document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; if (locked) { $('#clickhint').hidden = true; dragMode = false; } else if (!modalOpen && started) { $('#clickhint').hidden = false; } });
  document.addEventListener('pointerlockerror', () => { lockFailed = true; dragMode = true; $('#clickhint').textContent = 'اسحب بالفأرة للنظر، وانقر للهدم أو القراءة'; });
  const look = (dx, dy, k) => { P.yaw -= dx * k; P.pitch = Math.max(-1.55, Math.min(1.55, P.pitch - dy * k)); };
  document.addEventListener('mousemove', e => { if (locked) look(e.movementX, e.movementY, .0023); });

  let drag = null;
  canvas.addEventListener('mousedown', e => {
    if (!started || modalOpen || isTouch) return;
    if (!locked && !dragMode) { requestLock(); $('#clickhint').hidden = true; if (!lockFailed) return; }
    if (locked) { act(e.button); return; }
    drag = { x: e.clientX, y: e.clientY, moved: 0, button: e.button };
  });
  window.addEventListener('mousemove', e => { if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY; look(dx, dy, .005); } });
  window.addEventListener('mouseup', () => { if (drag && drag.moved < 5) act(drag.button); drag = null; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  function act(button) {
    if (paused) return;
    if (button === 0) { if (!interact()) breakBlock(); }
    else if (button === 2) placeBlock();
  }
  window.addEventListener('wheel', e => { if (!started || modalOpen) return; hotSel = (hotSel + (e.deltaY > 0 ? 1 : -1) + HOT.length) % HOT.length; renderHotbar(); }, { passive: true });
  window.addEventListener('keydown', e => {
    if (!started) return;
    if (modalOpen) { if (e.code === 'Escape') closeSheet(); return; }
    if (e.code === 'KeyE') { interact(); return; }
    if (e.code === 'KeyM') { openMap(); return; }
    if (e.code === 'KeyF') { P.fly = !P.fly; P.vel.y = 0; toast(P.fly ? 'وضع الطيران: Space للصعود وShift للنزول' : 'عدت إلى المشي', 1); return; }
    if (e.code === 'KeyR' && e.shiftKey) { respawn(); return; }
    if (/^Digit[1-9]$/.test(e.code)) { hotSel = +e.code.slice(5) - 1; renderHotbar(); return; }
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    keys.add(e.code);
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  /* لمس */
  function setupTouch() {
    $('#touch').hidden = false; $('#crosshair').hidden = false;
    const joy = $('#joy'), knob = joy.firstElementChild; let jid = null;
    const jr = () => joy.getBoundingClientRect();
    joy.addEventListener('touchstart', e => { e.preventDefault(); jid = e.changedTouches[0].identifier; moveJoy(e.changedTouches[0]); }, { passive: false });
    joy.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === jid) moveJoy(t); }, { passive: false });
    const endJoy = e => { for (const t of e.changedTouches) if (t.identifier === jid) { jid = null; touchMove.x = touchMove.y = 0; knob.style.transform = ''; } };
    joy.addEventListener('touchend', endJoy); joy.addEventListener('touchcancel', endJoy);
    function moveJoy(t) { const r = jr(); let dx = (t.clientX - r.left - r.width / 2) / (r.width / 2), dy = (t.clientY - r.top - r.height / 2) / (r.height / 2); const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } touchMove.x = dx; touchMove.y = dy; knob.style.transform = 'translate(' + dx * 34 + 'px,' + dy * 34 + 'px)'; }
    const looks = new Map();
    canvas.addEventListener('touchstart', e => { for (const t of e.changedTouches) looks.set(t.identifier, { x: t.clientX, y: t.clientY, m: 0, t: performance.now() }); }, { passive: true });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) { const l = looks.get(t.identifier); if (!l) continue; const dx = t.clientX - l.x, dy = t.clientY - l.y; l.m += Math.abs(dx) + Math.abs(dy); l.x = t.clientX; l.y = t.clientY; look(dx, dy, .006); } }, { passive: false });
    canvas.addEventListener('touchend', e => { for (const t of e.changedTouches) { const l = looks.get(t.identifier); looks.delete(t.identifier); if (l && l.m < 8 && performance.now() - l.t < 300 && !paused) interact(); } });
    const hold = (id, on, off) => { const b = $(id); b.addEventListener('touchstart', e => { e.preventDefault(); on(); }, { passive: false }); b.addEventListener('touchend', e => { e.preventDefault(); off && off(); }); };
    hold('#tJump', () => touchUp = true, () => touchUp = false);
    hold('#tDown', () => touchDown = true, () => touchDown = false);
    hold('#tE', () => { if (!interact()) toast('اقترب من لوح أو مرشد', 1); });
    hold('#tBreak', breakBlock); hold('#tPlace', placeBlock);
    hold('#tFly', () => { P.fly = !P.fly; P.vel.y = 0; $('#tFly').classList.toggle('hot', P.fly); });
  }

  $('#btnMap').onclick = e => { e.stopPropagation(); openMap(); };
  $('#btnSound').onclick = e => { e.stopPropagation(); soundOn = !soundOn; e.target.textContent = 'الصوت: ' + (soundOn ? 'يعمل' : 'مكتوم'); };

  /* ================= الحلقة ================= */
  function resize() { const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', resize); resize();
  let last = performance.now(), frame = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(.05, (now - last) / 1000); last = now; frame++;
    if (!paused) physics(dt);
    camera.position.set(P.pos.x, P.pos.y + 1.62, P.pos.z);
    camera.rotation.y = P.yaw; camera.rotation.x = P.pitch;
    let n = 0; for (const c of dirty) { dirty.delete(c); buildChunk(c % NCX, Math.floor(c / NCX)); if (++n >= 3) break; }
    const t = now / 1000;
    stations.forEach((s, i) => { s.gem.rotation.y = t * 1.6 + i; s.gem.position.y = s.y + 1.45 + Math.sin(t * 2 + i) * .08 + (s.type === 'quiz' ? .25 : 0); });
    npcs.forEach((nn, i) => {
      if (!nn.group) return;
      const dx = P.pos.x - nn.x, dz = P.pos.z - nn.z, d = Math.hypot(dx, dz);
      const want = d < 7 ? Math.atan2(dx, dz) : nn.base + Math.sin(t * .5 + i) * .4;
      let diff = want - nn.group.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); nn.group.rotation.y += diff * Math.min(1, dt * 3);
      nn.head.rotation.x = Math.sin(t * 1.3 + i) * .05; nn.arms[0].rotation.x = Math.sin(t * 1.7 + i) * .08; nn.arms[1].rotation.x = -Math.sin(t * 1.7 + i) * .08;
    });
    clouds.position.x = (t * .8) % 120 - 30;
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.userData.life -= dt; p.userData.v.y -= 14 * dt; p.position.addScaledVector(p.userData.v, dt); p.rotation.x += dt * 5; if (p.userData.life <= 0) { scene.remove(p); parts.splice(i, 1); } }
    if (started) {
      updateTarget();
      const o = updateObjective();
      if (frame % 6 === 0) drawMinimap(o);
    }
    renderer.render(scene, camera);
  }

  /* ================= الإقلاع ================= */
  $('#startDistricts').innerHTML = CH.map(c => '<div class="district" style="--c:' + c.color + '"><b>الحيّ ' + ORD[c.id - 1] + '</b><small>' + c.name + '، ' + ar(c.lessons.length) + ' دروس</small></div>').join('');
  async function boot() {
    try { await Promise.race([Promise.all([document.fonts.load('48px Lalezar'), document.fonts.load('16px "IBM Plex Sans Arabic"')]), new Promise(r => setTimeout(r, 2500))]); } catch (e) { }
    await new Promise(r => setTimeout(r, 30));
    generate();
    for (let cz = 0; cz < NCZ; cz++) for (let cx = 0; cx < NCX; cx++) buildChunk(cx, cz);
    for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) updateMiniPixel(x, z);
    buildStationVisuals();
    npcs.forEach(buildNPC);
    npcs.forEach(n => n.group.traverse(o => { if (o.isMesh) npcMeshes.push(o); }));
    renderHotbar(); renderChips();
    camera.position.set(CX + .5, GROUND + 6, CZ + 22); camera.rotation.set(-.12, 0, 0);
    requestAnimationFrame(loop);
    const total = CH.reduce((a, c) => a + c.lessons.length, 0), read = Object.keys(save.read).length;
    $('#loading').textContent = read ? 'مرحبًا بعودتك. أنجزت ' + ar(read) + ' من ' + ar(total) + ' درسًا.' : ar(total) + ' درسًا و٦ اختبارات بانتظارك.';
    const sb = $('#btnStart'); sb.hidden = false; sb.textContent = read ? 'أكمل الرحلة' : 'ابدأ الرحلة';
    sb.onclick = () => {
      $('#start').hidden = true; $('#hud').hidden = false; started = true; paused = false;
      if (!isTouch) { $('#crosshair').hidden = false; requestLock(); } else setupTouch();
      sfx('open');
      if (!save.metGuide) setTimeout(() => toast('أمامك <b>مرشد المدينة</b>؛ اقترب منه واضغط ' + (isTouch ? '«اقرأ»' : 'E')), 600);
    };
  }
  boot();
})();
