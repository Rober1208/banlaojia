(function () {
  'use strict';

  const D = window.BAN_DATA;
  const KEY = 'banlaojia.v1';
  const SCALE_LABELS = ['標準', '大', '特大'];
  const LEVELS = {
    high: { title: '先從這幾件開始', tag: '先做' },
    mid: { title: '接下來，可以慢慢改', tag: '接著做' },
    low: { title: '有空再留意', tag: '留意' }
  };
  // 「先從這幾件開始」最多 5 件，避免高風險長輩的清單全部變成優先、反而不知道從哪開始
  const MAX_HIGH = 5;

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');

  let state = load() || fresh();

  // ── 狀態 ──

  function fresh(keepPrefs) {
    return {
      screen: 'welcome',
      pos: 0,
      profile: { who: '爸媽' },
      answers: {},
      reactions: {},
      notes: {},
      photos: {},
      done: {},
      pledge: '',
      textScale: keepPrefs ? state.textScale : 0,
      contrast: keepPrefs ? state.contrast : false
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const s = Object.assign(fresh(), JSON.parse(raw));
      // 舊版的感受選項文字已改，對應過來避免顯示不到
      const legacy = { '覺得還好': '還好啦', '很困擾': '真的很困擾', '目前不想改': '先不想改' };
      Object.keys(s.reactions).forEach(k => { if (legacy[s.reactions[k]]) s.reactions[k] = legacy[s.reactions[k]]; });
      return s;
    } catch (e) {
      return null;
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      // 照片太大時可能超過容量，改成不存照片
      try {
        localStorage.setItem(KEY, JSON.stringify(Object.assign({}, state, { photos: {} })));
      } catch (e2) { /* 無痕模式等情況，直接放棄儲存 */ }
    }
  }

  // ── 小工具 ──

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function who() {
    return (state.profile.who || '長輩').trim() || '長輩';
  }

  function fill(text) {
    return String(text).replace(/\{who\}/g, who());
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { toastEl.hidden = true; }, 2800);
  }

  function activeItems() {
    return D.items.filter(it => !it.when ||
      Object.keys(it.when).every(k => state.profile[k] === it.when[k]));
  }

  function roomOf(item) {
    return D.rooms.find(r => r.id === item.room);
  }

  function tags() {
    const p = state.profile;
    const t = new Set();
    if (p.mobility >= 1) t.add('mobility');
    if (p.mobility === 3) t.add('wheelchair');
    if (p.fall === 'yes') t.add('fall');
    if (p.night >= 1) t.add('night');
    if (p.vision === 'weak') t.add('vision');
    if (p.hand === 'weak') t.add('hand');
    if (p.alone === 'yes') t.add('alone');
    return t;
  }

  function scoreOf(item, ans) {
    const t = tags();
    const boosts = (item.boost || []).filter(b => t.has(b)).length;
    return ans.sev + Math.min(boosts, 2);
  }

  function levelOf(score, highSoFar) {
    if (score >= 4 && highSoFar < MAX_HIGH) return 'high';
    if (score >= 3) return 'mid';
    return 'low';
  }

  function principleNames(nums) {
    return nums.map(n => `${'①②③④⑤⑥⑦'[n - 1]}${D.principles[n]}`);
  }

  function nextCheckDate() {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d;
  }

  function formatDate(d) {
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  }

  // ── 插畫 ──

  const ICONS = {
    bath: '<path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3z"/><path d="M6 12V6.5a2.5 2.5 0 0 1 5 0"/><path d="M7 19l-1 2M17 19l1 2"/>',
    bedroom: '<path d="M3 19V7"/><path d="M3 14h18v5"/><path d="M21 14v-1a3 3 0 0 0-3-3h-7v4"/><path d="M6 11.5h2.5"/>',
    living: '<path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M3 12.5a1.8 1.8 0 0 1 3.6 0V15h10.8v-2.5a1.8 1.8 0 0 1 3.6 0V18H3z"/><path d="M5 18v2M19 18v2"/>',
    entry: '<path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21"/><path d="M3 21h18"/><circle cx="14.5" cy="12.5" r="1"/>',
    kitchen: '<path d="M4 10h16v4.5A5.5 5.5 0 0 1 14.5 20h-5A5.5 5.5 0 0 1 4 14.5z"/><path d="M2 10h2M20 10h2"/><path d="M9 7c0-1.2 1.2-1.2 1.2-2.4M13.8 7c0-1.2 1.2-1.2 1.2-2.4"/>',
    stairs: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.3 1 2.1V16h6v-.4c0-.8.4-1.5 1-2.1A6 6 0 0 0 12 3z"/>',
    speaker: '<path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="M18 7a7 7 0 0 1 0 10"/>',
    camera: '<path d="M4 8h3l1.8-2.5h6.4L17 8h3v11H4z"/><circle cx="12" cy="13.2" r="3.4"/>',
    ruler: '<path d="M3 16.5L16.5 3 21 7.5 7.5 21z"/><path d="M7 12.5l2 2M10 9.5l2 2M13 6.5l2 2"/>',
    talk: '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9.5h8M8 12h5"/>',
    note: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 15.5h7"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'
  };

  function icon(name, cls) {
    return `<svg class="icon ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
  }

  // 每個空間對應房子上的一扇窗：二樓是臥室、浴室、樓梯，一樓是客廳、大門（玄關）、廚房
  function houseSVG(opts) {
    const lit = opts.lit || new Set();
    const cur = opts.current;
    const uid = opts.id || 'h';
    const win = (room, x, y, w, h) => {
      const on = lit.has(room) || room === cur;
      const cls = `win${on ? ' on' : ''}${room === cur ? ' cur' : ''}`;
      const delay = opts.stagger ? ` style="animation-delay:${opts.stagger[room] || 0}ms"` : '';
      return `
        <g class="${cls}"${delay}>
          <rect class="glow" x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" rx="8" filter="url(#${uid}-blur)"/>
          <rect class="pane" x="${x}" y="${y}" width="${w}" height="${h}" rx="3"/>
          ${room === 'entry' ? `<circle class="knob" cx="${x + w - 7}" cy="${y + h / 2 + 2}" r="1.8"/>` : `<path class="frame" d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}"/>`}
        </g>`;
    };
    const stars = opts.stars ? [[30, 30], [70, 18], [118, 36], [228, 22], [300, 58], [20, 80], [292, 100]]
      .map(([x, y], i) => `<circle class="star" cx="${x}" cy="${y}" r="${i % 3 ? 1.2 : 1.8}" style="animation-delay:${i * 0.6}s"/>`).join('') : '';
    const figures = opts.figures ? `
      <g class="people">
        <circle cx="34" cy="160" r="7"/>
        <path d="M25 199v-22a9 9 0 0 1 18 0v22z"/>
        <circle cx="56" cy="168" r="6.2"/>
        <path d="M48 199v-17a8 8 0 0 1 16 0v17z"/>
        <path class="hand" d="M42 182q4 3 7 0"/>
        <path class="cane" d="M66 180l4 19"/>
      </g>` : '';
    return `
      <svg class="house" viewBox="0 0 320 220" role="img" aria-label="${esc(opts.label || '夜晚的房子')}">
        <defs>
          <linearGradient id="${uid}-sky" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="220">
            <stop offset="0" stop-color="#1B2340"/><stop offset="1" stop-color="#3A4A7C"/>
          </linearGradient>
          <filter id="${uid}-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
          <mask id="${uid}-moon"><rect width="320" height="220" fill="#fff"/><circle cx="271" cy="39" r="13" fill="#000"/></mask>
        </defs>
        <rect class="sky" width="320" height="220" fill="url(#${uid}-sky)"/>
        ${stars}
        <circle class="moon" cx="264" cy="44" r="15" mask="url(#${uid}-moon)"/>
        <path class="hill" d="M0 204Q90 188 160 196T320 192V220H0z"/>
        <rect class="chimney" x="206" y="58" width="16" height="30" rx="2"/>
        <path class="roof" d="M58 106L160 46l102 60z"/>
        <rect class="wall" x="72" y="100" width="176" height="100" rx="4"/>
        ${win('bedroom', 90, 114, 30, 28)}
        ${win('bath', 145, 114, 30, 28)}
        ${win('stairs', 200, 114, 30, 28)}
        ${win('living', 90, 160, 30, 28)}
        ${win('entry', 146, 152, 28, 48)}
        ${win('kitchen', 200, 160, 30, 28)}
        <g class="lamp-post">
          <path d="M290 202V138"/>
          <path d="M283 138h14"/>
          <circle class="lamp-light" cx="290" cy="132" r="5"/>
          <circle class="lamp-halo" cx="290" cy="132" r="16" filter="url(#${uid}-blur)"/>
        </g>
        ${figures}
      </svg>`;
  }

  function roomsLitBefore(pos) {
    const list = activeItems();
    const lit = new Set();
    D.rooms.forEach(r => {
      const idx = list.map((it, i) => (it.room === r.id ? i : -1)).filter(i => i >= 0);
      if (idx.length && idx[idx.length - 1] < pos) lit.add(r.id);
    });
    return lit;
  }

  function roomsVisited() {
    const lit = new Set();
    activeItems().forEach(it => { if (state.answers[it.id]) lit.add(it.room); });
    return lit;
  }

  // ── 設定（字體、對比） ──

  function applyPrefs() {
    const root = document.documentElement;
    root.dataset.scale = String(state.textScale);
    root.dataset.contrast = state.contrast ? 'high' : 'normal';
    root.dataset.screen = state.screen;
    document.querySelector('[data-scale-label]').textContent = SCALE_LABELS[state.textScale];
    document.querySelector('[data-action="contrast"]').setAttribute('aria-pressed', String(state.contrast));
  }

  // ── 朗讀 ──

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      toast('這個瀏覽器不支援朗讀');
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-TW';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }

  // ── 畫面 ──

  function go(screen, pos) {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    state.screen = screen;
    if (pos !== undefined) state.pos = pos;
    save();
    render();
    window.scrollTo(0, 0);
    const target = app.querySelector('[data-focus]') || app;
    target.focus({ preventScroll: true });
  }

  function render() {
    applyPrefs();
    if (state.screen === 'profile') app.innerHTML = viewProfile();
    else if (state.screen === 'item') app.innerHTML = viewItem();
    else if (state.screen === 'results') app.innerHTML = viewResults();
    else app.innerHTML = viewWelcome();
  }

  function viewWelcome() {
    const hasProgress = Object.keys(state.answers).length > 0;
    const story = [
      '半夜三點，媽媽起身去上廁所。',
      '走廊很暗，浴室門口有一道小小的門檻。',
      '這段路，她每天都在走，',
      '而你，已經很久沒有陪她走過了。'
    ];
    return `
      <section class="night hero${hasProgress ? ' no-anim' : ''}">
        <div class="wrap">
          <div class="hero-art">${houseSVG({ id: 'hero', lit: new Set(['bedroom']), stars: true, figures: true, label: '深夜裡只亮著一盞燈的房子，門外一對家人牽著手' })}</div>
          <div class="story">
            ${story.map((s, i) => `<p class="story-line" style="--i:${i}">${esc(s)}</p>`).join('')}
          </div>
          <h1 class="hero-title" tabindex="-1" data-focus>今晚，陪她走一次。</h1>
          <p class="hero-sub">花 15 分鐘，和爸媽一起看看家裡哪裡容易跌倒。<br>一邊走，一邊聊。</p>
          <div class="stack hero-cta">
            ${hasProgress ? `
              <button class="btn btn-lamp btn-block" type="button" data-action="resume">繼續上次沒走完的路</button>
              <button class="btn btn-night btn-block" type="button" data-action="results">看上次的小筆記</button>
              <button class="btn btn-link-night btn-block" type="button" data-action="restart">重新陪一次</button>
            ` : `
              <button class="btn btn-lamp btn-block" type="button" data-action="start">開始陪伴</button>
            `}
          </div>
        </div>
      </section>

      <section class="paper">
        <div class="wrap">
          <h2 class="section-title">怎麼陪？很簡單</h2>
          <ol class="how">
            <li>
              <span class="how-icon">${icon('bulb')}</span>
              <div><h3>一間一間走</h3><p>從最容易跌倒的浴室開始。每一題都很簡單，不需要專業知識。每走完一個地方，就為家點亮一盞燈。</p></div>
            </li>
            <li>
              <span class="how-icon">${icon('talk')}</span>
              <div><h3>一邊走，一邊聊</h3><p>每一題都附一句可以問爸媽的話。要不要改、怎麼改，由爸媽一起決定。</p></div>
            </li>
            <li>
              <span class="how-icon">${icon('note')}</span>
              <div><h3>帶走一張小筆記</h3><p>今晚就能做的事、週末可以做的事、需要師傅的事，還有長照補助怎麼申請。</p></div>
            </li>
          </ol>
          <p class="promise">${icon('heart')}不用下載，也不用登入。所有紀錄只留在你的手機裡。</p>
        </div>
      </section>`;
  }

  function viewProfile() {
    const p = state.profile;
    const whoField = D.profile[0];
    const custom = whoField.options.indexOf(p.who) === -1 ? p.who : '';
    const rest = D.profile.slice(1).map(f => `
      <fieldset class="q">
        <legend data-tpl="${esc(f.label)}">${esc(fill(f.label))}</legend>
        <div class="choices">
          ${f.options.map((o, i) => `
            <label class="choice">
              <input type="radio" name="${f.key}" value="${i}" ${p[f.key] === o.value ? 'checked' : ''}>
              <span>${esc(o.label)}</span>
            </label>`).join('')}
        </div>
      </fieldset>`).join('');

    return `
      <section class="paper">
        <div class="wrap">
          <p class="eyebrow">出發之前</p>
          <h1 class="page-title" tabindex="-1" data-focus>${esc(whoField.label)}</h1>
          <form data-form="profile">
            <fieldset class="q">
              <legend class="visually-hidden">${esc(whoField.label)}</legend>
              <div class="choices who-choices">
                ${whoField.options.map(o => `
                  <label class="choice">
                    <input type="radio" name="who" value="${esc(o)}" ${p.who === o ? 'checked' : ''}>
                    <span>${esc(o)}</span>
                  </label>`).join('')}
              </div>
              <label class="field-label" for="who-custom">還是，你平常都怎麼叫他／她？</label>
              <input id="who-custom" class="text-input" type="text" maxlength="8" placeholder="例如：外婆、阿娘" value="${esc(custom || '')}">
            </fieldset>

            <div class="card soft">
              <h2 class="card-title" data-tpl="{who}最近好嗎？">${esc(who())}最近好嗎？</h2>
              <p class="muted small">這些回答只用來幫你排出先後順序。不確定的，可以先跳過。</p>
              ${rest}
            </div>

            <button class="btn btn-lamp btn-block" type="submit">好了，我們出發吧</button>
          </form>
        </div>
      </section>`;
  }

  function viewItem() {
    const list = activeItems();
    const i = Math.min(state.pos, list.length - 1);
    state.pos = i;
    const it = list[i];
    const room = roomOf(it);
    const inRoom = list.filter(x => x.room === it.room);
    const idxInRoom = inRoom.indexOf(it);
    const ans = state.answers[it.id];
    const reaction = state.reactions[it.id];
    const note = state.notes[it.id] || '';
    const photo = state.photos[it.id];
    const isLast = i === list.length - 1;
    const litCount = roomsLitBefore(i).size;
    const roomCount = new Set(list.map(x => x.room)).size;

    let optionsHtml;
    if (it.type === 'measure') {
      const v = ans && ans.kind === 'measure' ? ans.value : '';
      optionsHtml = `
        <div class="measure">
          <input id="measure-input" class="text-input" type="number" inputmode="decimal" min="0" max="100" step="0.5"
                 placeholder="例如 2" value="${esc(v)}" aria-label="高度，單位${esc(it.unit)}">
          <span class="unit">${esc(it.unit)}</span>
          <button class="btn btn-lamp" type="button" data-action="measure">記下來</button>
        </div>
        <div class="options">
          ${it.alt.map((o, k) => `
            <button class="opt" type="button" data-action="alt" data-k="${k}"
                    aria-pressed="${!!ans && ans.kind === 'alt' && ans.index === k}">${esc(o.label)}</button>`).join('')}
        </div>`;
    } else {
      optionsHtml = `
        <div class="options">
          ${it.options.map((o, k) => `
            <button class="opt" type="button" data-action="opt" data-k="${k}"
                    aria-pressed="${!!ans && ans.kind === 'opt' && ans.index === k}">${esc(o.label)}</button>`).join('')}
        </div>`;
    }

    return `
      <section class="night walk-head">
        <div class="wrap walk-head-inner">
          <div class="mini-house">${houseSVG({ id: 'mini', lit: roomsLitBefore(i), current: it.room, stars: true, label: `已經點亮 ${litCount} 盞燈，現在在${room.name}` })}</div>
          <div class="walk-meta">
            <p class="walk-room">${icon(it.room)}${esc(room.name)}</p>
            <p class="walk-count">這裡第 ${idxInRoom + 1} / ${inRoom.length} 題</p>
            <p class="walk-lit">已點亮 ${litCount} / ${roomCount} 盞燈</p>
          </div>
        </div>
      </section>

      <section class="paper">
        <div class="wrap">
          ${idxInRoom === 0 ? `<p class="room-intro">${esc(fill(room.intro))}</p>` : ''}

          <div class="card q-card">
            <h1 class="question" tabindex="-1" data-focus>${esc(fill(it.q))}</h1>
            ${it.tip ? `<p class="tip">${icon('ruler')}<span>${esc(it.tip)}</span></p>` : ''}
            <button class="btn-text" type="button" data-action="speak">${icon('speaker')}唸給我聽</button>
            ${optionsHtml}
            <p class="recorded" aria-live="polite">${recordedText(ans)}</p>
          </div>

          <section class="letter" aria-labelledby="ask-q">
            <p class="letter-label">轉身和${esc(who())}聊聊</p>
            <p class="letter-q" id="ask-q">${esc(askText(it))}</p>
            <div class="chips" role="group" aria-label="${esc(who())}怎麼說">
              ${D.reactions.map(r => `
                <button class="chip" type="button" data-action="react" data-r="${esc(r)}"
                        aria-pressed="${reaction === r}">${esc(r)}</button>`).join('')}
            </div>
            <label class="field-label" for="note">${esc(who())}還說了什麼？記下來（可不填）</label>
            <textarea id="note" class="text-input" data-note="${it.id}" maxlength="200">${esc(note)}</textarea>
            <div class="photo-row">
              <label class="btn btn-soft">
                <input type="file" accept="image/*" capture="environment" data-photo="${it.id}">
                ${icon('camera')}${photo ? '重拍一張' : '拍一張照片留著'}
              </label>
              ${photo ? `<img class="thumb" src="${photo}" alt="${esc(it.name)}的照片">` : ''}
            </div>
          </section>

          <div class="nav">
            <button class="btn btn-soft" type="button" data-action="prev">${i === 0 ? '回上一步' : '上一題'}</button>
            <button class="btn btn-lamp" type="button" data-action="next">${isLast ? '點亮最後一盞燈' : '下一題'}</button>
          </div>
          ${!isLast ? `<button class="btn-text skip-room" type="button" data-action="skip-room">這個地方先跳過</button>` : ''}
        </div>
      </section>`;
  }

  // 便條標題已經寫了「轉身和{who}聊聊」，題目開頭的「問問{who}：」就不用再重複
  function askText(it) {
    const w = who();
    return fill(it.ask).replace(`問問${w}：`, '').replace(`和${w}聊聊：`, '');
  }

  function recordedText(ans) {
    if (!ans) return '';
    if (ans.unsure) return '沒關係，先記著，之後再確認。';
    if (ans.ok) return '太好了，這裡很安心。';
    return '記下來了，等一下告訴你怎麼改。';
  }

  // ── 結果 ──

  function computeFindings() {
    const list = activeItems();
    const problems = [];
    const unsure = [];
    let answered = 0;
    list.forEach(it => {
      const ans = state.answers[it.id];
      if (!ans) return;
      answered++;
      if (ans.unsure) { unsure.push(it); return; }
      if (ans.ok) return;
      problems.push({ item: it, ans, score: scoreOf(it, ans) });
    });
    problems.sort((a, b) => b.score - a.score || b.ans.sev - a.ans.sev);
    let highs = 0;
    problems.forEach(p => {
      p.level = levelOf(p.score, highs);
      if (p.level === 'high') highs++;
    });
    return { list, problems, unsure, answered };
  }

  function nowActionsOf(problems) {
    const out = [];
    problems.forEach(p => p.item.actions.forEach((a, k) => {
      if (a.tier === 'now') out.push({ p, a, key: `${p.item.id}:${k}` });
    }));
    return out;
  }

  function cardHtml(p) {
    const it = p.item;
    const r = state.reactions[it.id];
    const note = state.notes[it.id];
    const photo = state.photos[it.id];
    const optNote = p.ans.kind === 'opt' && it.options[p.ans.index].note;
    const measured = p.ans.kind === 'measure' ? `（量到 ${p.ans.value} ${it.unit}）` : '';
    return `
      <article class="card finding ${p.level}">
        <p class="finding-room">${icon(it.room)}${esc(roomOf(it).name)}</p>
        <h3>${esc(it.name)}${esc(measured)}</h3>
        <p>${esc(it.why)}${optNote ? ` <strong>${esc(optNote)}。</strong>` : ''}</p>
        ${r || note ? `
          <blockquote class="voice">
            <p><span class="voice-who">${esc(who())}說：</span>${note ? `「${esc(note)}」` : `「${esc(r)}」`}</p>
            ${r === '先不想改' ? `<p class="small">那就先尊重${esc(who())}的決定。可以從不改變生活習慣的小地方開始，或過一陣子再聊聊。</p>` : ''}
          </blockquote>` : ''}
        ${photo ? `<img class="thumb" src="${photo}" alt="${esc(it.name)}的照片">` : ''}
        <ul class="acts">
          ${it.actions.map(a => `
            <li>
              <span class="tier ${a.tier}">${D.tiers[a.tier].label}</span>
              <span class="act-text">${esc(a.text)}</span>
              <span class="cost">費用約 ${esc(a.cost)}</span>
              ${a.subsidy ? `<span class="sub">${esc(D.subsidy[a.subsidy])}</span>` : ''}
            </li>`).join('')}
        </ul>
        <div class="ud" aria-label="對應通用設計原則">
          ${principleNames(it.principles).map(n => `<span>${esc(n)}</span>`).join('')}
        </div>
      </article>`;
  }

  function viewResults() {
    const { list, problems, unsure, answered } = computeFindings();
    const nowActions = nowActionsOf(problems);
    const needPro = problems.some(p => p.item.actions.some(a => a.tier === 'pro' || a.subsidy));
    const visited = roomsVisited();
    const roomCount = new Set(list.map(x => x.room)).size;
    const allLit = visited.size === roomCount;
    const order = ['bath', 'bedroom', 'living', 'entry', 'kitchen', 'stairs'];
    const stagger = {};
    order.filter(r => visited.has(r)).forEach((r, k) => { stagger[r] = 300 + k * 350; });
    const groups = ['high', 'mid', 'low'].map(lv => ({ lv, items: problems.filter(p => p.level === lv) })).filter(g => g.items.length);

    return `
      <section class="night hero results-hero">
        <div class="wrap">
          <div class="hero-art">${houseSVG({ id: 'done', lit: visited, stars: true, stagger, label: `點亮了 ${visited.size} 盞燈的房子` })}</div>
          <p class="eyebrow light">給${esc(who())}家的小筆記</p>
          <h1 class="hero-title" tabindex="-1" data-focus>${allLit ? '全部的燈，<br>都亮了。' : `你們一起<br>點亮了 ${visited.size} 盞燈。`}</h1>
          <p class="hero-sub">謝謝你，今天陪${esc(who())}走了這一圈。</p>
        </div>
      </section>

      <section class="paper">
        <div class="wrap">
          <div class="card summary">
            <p class="summary-lead">${problems.length === 0
              ? `走過的地方都很安心。記得半年後，再陪${esc(who())}走一次。`
              : `這次找到 <strong>${problems.length}</strong> 個可以讓${esc(who())}更安心的地方。<br>別擔心，很多事今晚就能開始。`}</p>
            <div class="stats">
              <div class="stat"><b>${answered}</b><span>已檢查</span></div>
              <div class="stat"><b>${nowActions.length}</b><span>今晚能做</span></div>
              <div class="stat"><b>${unsure.length}</b><span>待確認</span></div>
            </div>
          </div>

          ${nowActions.length ? `
          <section class="block" aria-labelledby="h-now">
            <h2 class="section-title" id="h-now">今晚，就可以為${esc(who())}做的事</h2>
            <p class="muted small">做完一件，就點亮一顆燈泡。下次打開還會記得。</p>
            <ul class="todo">
              ${nowActions.map(x => `
                <li><label>
                  <input type="checkbox" data-done="${esc(x.key)}" ${state.done[x.key] ? 'checked' : ''}>
                  <span class="todo-bulb">${icon('bulb')}</span>
                  <span class="todo-text">${esc(x.a.text)}<span class="where">${esc(roomOf(x.p.item).name)}・${esc(x.p.item.name)}</span></span>
                </label></li>`).join('')}
            </ul>
          </section>` : ''}

          ${groups.map(g => `
          <section class="block" aria-labelledby="h-${g.lv}">
            <h2 class="section-title lv-${g.lv}" id="h-${g.lv}">${LEVELS[g.lv].title}</h2>
            ${g.items.map(cardHtml).join('')}
          </section>`).join('')}

          ${unsure.length ? `
          <section class="block" aria-labelledby="h-unsure">
            <h2 class="section-title" id="h-unsure">下次回家，再確認一下</h2>
            <ul class="unsure">
              ${unsure.map(it => `<li>${icon(it.room)}<span>${esc(fill(it.q))}</span></li>`).join('')}
            </ul>
          </section>` : ''}

          ${needPro ? `
          <section class="block" aria-labelledby="h-sub">
            <h2 class="section-title" id="h-sub">需要請師傅？長照可以幫忙出錢</h2>
            <div class="card callout">
              <p><strong>記得：先評估、核定後再施工。</strong>自己先做完再申請，可能拿不到補助。</p>
            </div>
            <ol class="steps">
              <li>撥打 <strong>1966 長照專線</strong>，申請長照需要評估。</li>
              <li>照管專員到家裡評估，長照需要等級<strong>第 2 級以上</strong>才能使用補助。</li>
              <li>輔具評估人員確認要改善的項目，核定補助內容。</li>
              <li>核定後由特約廠商施工，再附上施工前後照片與發票核銷。</li>
            </ol>
            <p class="small muted">居家無障礙改善與輔具共用<strong>每 3 年 4 萬元</strong>額度；一般戶補助 7 成、中低收入戶 9 成、低收入戶全額。各縣市規定可能不同，以照管專員說明為準。有身心障礙證明的話，也可以問問各縣市的輔具資源中心。</p>
          </section>` : ''}

          <section class="block" aria-labelledby="h-pledge">
            <div class="postcard">
              <div class="stamp" aria-hidden="true">${icon('heart')}</div>
              <p class="postcard-label">我們的約定</p>
              <h2 class="postcard-title" id="h-pledge">家會跟著${esc(who())}一起慢慢變老。</h2>
              <label class="field-label" for="pledge">想對${esc(who())}說的一句話</label>
              <textarea id="pledge" class="text-input hand" data-pledge maxlength="80" placeholder="例如：媽，下個月我回家幫妳裝扶手。">${esc(state.pledge || '')}</textarea>
              <p class="postcard-date">下一次，再陪${esc(who())}走一圈：<br><strong>${formatDate(nextCheckDate())}</strong></p>
              <div class="stack no-print">
                <button class="btn btn-lamp btn-block" type="button" data-action="ics">把這一天放進行事曆</button>
                <div class="row">
                  <button class="btn btn-soft" type="button" data-action="share">傳給家人</button>
                  <button class="btn btn-soft" type="button" data-action="print">印出這張筆記</button>
                </div>
              </div>
            </div>
          </section>

          <button class="btn-text back-link no-print" type="button" data-action="back-to-items">回去修改答案</button>
        </div>
      </section>`;
  }

  // ── 動作 ──

  function currentItem() {
    const list = activeItems();
    return list[Math.min(state.pos, list.length - 1)];
  }

  function record(it, ans) {
    state.answers[it.id] = ans;
    save();
    render();
    const pressed = app.querySelector('.opt[aria-pressed="true"]') || app.querySelector('.recorded');
    if (pressed) pressed.focus({ preventScroll: true });
  }

  function shareText() {
    const { problems } = computeFindings();
    const lines = [`【伴老家】給${who()}家的小筆記`];
    if (!problems.length) {
      lines.push('走過的地方都很安心。');
    } else {
      problems.forEach(p => {
        const first = p.item.actions[0];
        lines.push(`・${roomOf(p.item).name}｜${p.item.name}：${first.text}`);
      });
    }
    if (state.pledge) lines.push('', `想對${who()}說：${state.pledge}`);
    lines.push('', `下一次一起走一圈：${formatDate(nextCheckDate())}`);
    return lines.join('\n');
  }

  function downloadIcs() {
    const d = nextCheckDate();
    const ymd = x => `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, '0')}${String(x.getDate()).padStart(2, '0')}`;
    const end = new Date(d); end.setDate(end.getDate() + 1);
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//banlaojia//TW', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@banlaojia`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(d)}`,
      `DTEND;VALUE=DATE:${ymd(end)}`,
      `SUMMARY:再陪${who()}走一圈家裡`,
      `DESCRIPTION:家會跟著${who()}一起慢慢變老。打開「伴老家」，再陪${who()}走一次。`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = '伴老家-下一次陪伴.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('已下載行事曆檔，打開就能加入');
  }

  function resizePhoto(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 480;
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function refreshWho() {
    app.querySelectorAll('[data-tpl]').forEach(el => { el.textContent = fill(el.dataset.tpl); });
  }

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const list = activeItems();

    switch (action) {
      case 'home': go('welcome'); break;
      case 'scale':
        state.textScale = (state.textScale + 1) % SCALE_LABELS.length;
        save(); applyPrefs();
        break;
      case 'contrast':
        state.contrast = !state.contrast;
        save(); applyPrefs();
        break;
      case 'start': go('profile'); break;
      case 'resume': go('item'); break;
      case 'results': go('results'); break;
      case 'restart':
        if (confirm('要清除這次的紀錄，重新陪一次嗎？')) { state = fresh(true); go('profile'); }
        break;
      case 'speak': {
        const it = currentItem();
        speak([fill(it.q), it.tip || '', `轉身和${who()}聊聊：${askText(it)}`].join('。'));
        break;
      }
      case 'opt': {
        const it = currentItem();
        const o = it.options[+el.dataset.k];
        record(it, { kind: 'opt', index: +el.dataset.k, ok: !!o.ok, unsure: !!o.unsure, sev: o.sev || 0 });
        break;
      }
      case 'alt': {
        const it = currentItem();
        const o = it.alt[+el.dataset.k];
        record(it, { kind: 'alt', index: +el.dataset.k, ok: !!o.ok, unsure: !!o.unsure, sev: 0 });
        break;
      }
      case 'measure': {
        const it = currentItem();
        const input = document.getElementById('measure-input');
        const v = parseFloat(input.value);
        if (isNaN(v) || v < 0) { toast('請輸入量到的高度'); input.focus(); return; }
        const m = it.measure;
        if (v <= m.okMax) record(it, { kind: 'measure', value: v, ok: true, sev: 0 });
        else record(it, { kind: 'measure', value: v, ok: false, sev: v > m.highOver ? 3 : 2 });
        break;
      }
      case 'react': {
        const it = currentItem();
        const r = el.dataset.r;
        state.reactions[it.id] = state.reactions[it.id] === r ? undefined : r;
        save();
        app.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.r === state.reactions[it.id])));
        break;
      }
      case 'prev':
        if (state.pos === 0) go('profile'); else go('item', state.pos - 1);
        break;
      case 'next': {
        const cur = list[state.pos];
        if (state.pos >= list.length - 1) { go('results'); break; }
        go('item', state.pos + 1);
        if (list[state.pos].room !== cur.room) toast(`${roomOf(cur).name}的燈，亮了。`);
        break;
      }
      case 'skip-room': {
        const room = currentItem().room;
        let n = state.pos;
        while (n < list.length && list[n].room === room) n++;
        if (n >= list.length) go('results'); else go('item', n);
        break;
      }
      case 'back-to-items': go('item', 0); break;
      case 'ics': downloadIcs(); break;
      case 'print': window.print(); break;
      case 'share': {
        const text = shareText();
        if (navigator.share) {
          navigator.share({ title: '伴老家的小筆記', text }).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => toast('已複製，可以貼到家族的 LINE 群組'), () => toast('複製失敗'));
        } else {
          toast('這個瀏覽器不支援分享');
        }
        break;
      }
    }
  });

  document.addEventListener('submit', e => {
    if (e.target.dataset.form !== 'profile') return;
    e.preventDefault();
    const form = e.target;
    const custom = form.querySelector('#who-custom').value.trim();
    const picked = form.querySelector('input[name="who"]:checked');
    state.profile.who = custom || (picked ? picked.value : '爸媽');
    D.profile.forEach(f => {
      if (f.type === 'who') return;
      const r = form.querySelector(`input[name="${f.key}"]:checked`);
      if (r) state.profile[f.key] = f.options[+r.value].value;
    });
    go('item', 0);
  });

  document.addEventListener('change', e => {
    const t = e.target;
    if (t.name === 'who') {
      // 選了預設稱呼就清掉自訂欄位，並即時更新頁面上的稱呼
      document.getElementById('who-custom').value = '';
      state.profile.who = t.value;
      refreshWho();
    }
    if (t.dataset.done !== undefined) {
      state.done[t.dataset.done] = t.checked;
      save();
      const boxes = app.querySelectorAll('[data-done]');
      if (t.checked && [...boxes].every(b => b.checked)) toast('每一盞燈，都是你的心意。');
    }
    if (t.dataset.photo && t.files && t.files[0]) {
      resizePhoto(t.files[0], url => {
        state.photos[t.dataset.photo] = url;
        save();
        render();
        toast('照片只存在這支手機');
      });
    }
  });

  document.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'who-custom') {
      const picked = app.querySelector('input[name="who"]:checked');
      if (t.value.trim()) {
        if (picked) picked.checked = false;
        state.profile.who = t.value.trim();
      }
      refreshWho();
    }
    if (t.dataset.note) {
      state.notes[t.dataset.note] = t.value;
      save();
    }
    if (t.dataset.pledge !== undefined) {
      state.pledge = t.value;
      save();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'measure-input') {
      e.preventDefault();
      document.querySelector('[data-action="measure"]').click();
    }
  });

  render();
})();
