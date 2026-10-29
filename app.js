(function () {
  'use strict';

  const D = window.BAN_DATA;
  const KEY = 'banlaojia.v1';
  const SCALE_LABELS = ['標準', '大', '特大'];
  const LEVELS = {
    high: { label: '優先處理', order: 0 },
    mid: { label: '盡快改善', order: 1 },
    low: { label: '可以留意', order: 2 }
  };

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
      textScale: keepPrefs ? state.textScale : 0,
      contrast: keepPrefs ? state.contrast : false
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? Object.assign(fresh(), JSON.parse(raw)) : null;
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
    toast.t = setTimeout(() => { toastEl.hidden = true; }, 2600);
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

  // 「優先處理」最多 5 件，避免高風險長輩的清單全部變成優先、反而不知道從哪開始
  const MAX_HIGH = 5;

  function levelOf(score, highSoFar) {
    if (score >= 4 && highSoFar < MAX_HIGH) return 'high';
    if (score >= 3) return 'mid';
    return 'low';
  }

  function principleNames(nums) {
    return nums.map(n => `${'①②③④⑤⑥⑦'[n - 1]}${D.principles[n]}`);
  }

  // ── 設定（字體、對比） ──

  function applyPrefs() {
    const root = document.documentElement;
    root.dataset.scale = String(state.textScale);
    root.dataset.contrast = state.contrast ? 'high' : 'normal';
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
    return `
      <section class="hero">
        <h1 tabindex="-1" data-focus>陪爸媽走一圈家裡</h1>
        <p class="lead">約 15 分鐘，一起找出家裡容易跌倒的地方，並知道下一步該怎麼改。</p>
      </section>
      <ol class="points">
        <li><span class="num" aria-hidden="true">1</span><span>從最容易跌倒的<strong>浴室</strong>開始，一題一題帶你看，不需要專業知識。</span></li>
        <li><span class="num" aria-hidden="true">2</span><span>每一題都附一句<strong>「問問爸媽」</strong>，讓檢查變成聊天，改不改由爸媽一起決定。</span></li>
        <li><span class="num" aria-hidden="true">3</span><span>最後得到一張清單：<strong>馬上能做的、週末自己來的、可以申請長照補助的</strong>。</span></li>
        <li><span class="num" aria-hidden="true">4</span><span>不用下載、不用登入，資料只存在這支手機。</span></li>
      </ol>
      <div class="stack">
        ${hasProgress ? `
          <button class="btn btn-primary btn-block" type="button" data-action="resume">繼續上次的檢查</button>
          <button class="btn btn-block" type="button" data-action="results">看上次的結果</button>
          <button class="btn btn-ghost btn-block" type="button" data-action="restart">重新開始一次新的檢查</button>
        ` : `
          <button class="btn btn-primary btn-block" type="button" data-action="start">開始陪伴檢查</button>
        `}
      </div>`;
  }

  function viewProfile() {
    const p = state.profile;
    const fields = D.profile.map(f => {
      if (f.type === 'who') {
        const custom = f.options.indexOf(p.who) === -1 ? p.who : '';
        return `
          <fieldset>
            <legend>${esc(f.label)}</legend>
            <div class="choices">
              ${f.options.map(o => `
                <label class="choice">
                  <input type="radio" name="who" value="${esc(o)}" ${p.who === o ? 'checked' : ''}>
                  <span>${esc(o)}</span>
                </label>`).join('')}
            </div>
            <label class="small muted" for="who-custom" style="display:block;margin-top:10px">或輸入其他稱呼</label>
            <input id="who-custom" class="text-input" type="text" maxlength="8" placeholder="例如：外婆" value="${esc(custom || '')}">
          </fieldset>`;
      }
      return `
        <fieldset>
          <legend data-tpl="${esc(f.label)}">${esc(fill(f.label))}</legend>
          <div class="choices">
            ${f.options.map((o, i) => `
              <label class="choice">
                <input type="radio" name="${f.key}" value="${i}" ${p[f.key] === o.value ? 'checked' : ''}>
                <span>${esc(o.label)}</span>
              </label>`).join('')}
          </div>
        </fieldset>`;
    }).join('');

    return `
      <h1 tabindex="-1" data-focus data-tpl="先認識一下{who}">先認識一下${esc(who())}</h1>
      <p class="muted">這些回答會用來排出改善的優先順序。不確定的可以跳過。</p>
      <form data-form="profile">
        ${fields}
        <button class="btn btn-primary btn-block" type="submit">開始檢查</button>
      </form>`;
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
    const pct = Math.round((i / list.length) * 100);
    const isLast = i === list.length - 1;

    let optionsHtml;
    if (it.type === 'measure') {
      const v = ans && ans.kind === 'measure' ? ans.value : '';
      optionsHtml = `
        <div class="measure">
          <input id="measure-input" class="text-input" type="number" inputmode="decimal" min="0" max="100" step="0.5"
                 placeholder="例如 2" value="${esc(v)}" aria-label="高度，單位${esc(it.unit)}">
          <span class="unit">${esc(it.unit)}</span>
          <button class="btn btn-primary" type="button" data-action="measure">記錄</button>
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
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="整體進度">
        <div style="width:${pct}%"></div>
      </div>
      <div class="crumb">
        <span class="room-tag">${esc(room.name)}</span>
        <span>這一區第 ${idxInRoom + 1} / ${inRoom.length} 題　·　全部 ${i + 1} / ${list.length}</span>
      </div>
      ${idxInRoom === 0 ? `<p class="room-intro">${esc(fill(room.intro))}</p>` : ''}

      <h1 class="question" tabindex="-1" data-focus>${esc(fill(it.q))}</h1>
      ${it.tip ? `<p class="tip">${esc(it.tip)}</p>` : ''}
      <button class="btn btn-ghost speak" type="button" data-action="speak">唸出這一題</button>

      ${optionsHtml}
      <p class="recorded" aria-live="polite">${recordedText(it, ans)}</p>

      <section class="ask" aria-labelledby="ask-q">
        <div class="ask-label">陪伴提問</div>
        <p class="ask-q" id="ask-q">${esc(fill(it.ask))}</p>
        <div class="chips" role="group" aria-label="${esc(who())}的感受">
          ${D.reactions.map(r => `
            <button class="chip" type="button" data-action="react" data-r="${esc(r)}"
                    aria-pressed="${reaction === r}">${esc(r)}</button>`).join('')}
        </div>
        <label class="small muted" for="note">${esc(who())}怎麼說？（可不填）</label>
        <textarea id="note" class="text-input" data-note="${it.id}" maxlength="200">${esc(note)}</textarea>
        <div class="photo-row">
          <label class="btn">
            <input type="file" accept="image/*" capture="environment" data-photo="${it.id}">
            ${photo ? '重拍照片' : '拍照記錄（選填）'}
          </label>
          ${photo ? `<img class="thumb" src="${photo}" alt="${esc(it.name)}的照片">` : ''}
        </div>
      </section>

      <div class="nav">
        <button class="btn" type="button" data-action="prev">${i === 0 ? '回到基本資料' : '上一題'}</button>
        <button class="btn btn-primary" type="button" data-action="next">${isLast ? '看結果' : '下一題'}</button>
      </div>
      ${!isLast ? `<button class="btn btn-ghost skip-room" type="button" data-action="skip-room">這一區先跳過</button>` : ''}`;
  }

  function recordedText(it, ans) {
    if (!ans) return '';
    if (ans.unsure) return '已記錄為「待確認」，結果頁會提醒你。';
    if (ans.ok) return '已記錄：這裡目前沒問題。';
    return '已記錄：結果頁會告訴你怎麼改善。';
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

  function viewResults() {
    const { list, problems, unsure, answered } = computeFindings();
    const high = problems.filter(p => p.level === 'high').length;
    const nowActions = [];
    problems.forEach(p => p.item.actions.forEach((a, k) => {
      if (a.tier === 'now') nowActions.push({ p, a, key: `${p.item.id}:${k}` });
    }));
    const needPro = problems.some(p => p.item.actions.some(a => a.tier === 'pro' || a.subsidy));

    const cards = problems.map(p => {
      const it = p.item;
      const r = state.reactions[it.id];
      const note = state.notes[it.id];
      const photo = state.photos[it.id];
      const optNote = p.ans.kind === 'opt' && it.options[p.ans.index].note;
      const measured = p.ans.kind === 'measure' ? `（量到 ${p.ans.value} ${it.unit}）` : '';
      return `
        <article class="card ${p.level}">
          <div class="card-head">
            <span class="badge ${p.level}">${LEVELS[p.level].label}</span>
            <span class="small muted">${esc(roomOf(it).name)}</span>
          </div>
          <h3>${esc(it.name)}${esc(measured)}</h3>
          <p>${esc(it.why)}${optNote ? ` <strong>${esc(optNote)}。</strong>` : ''}</p>
          ${r || note ? `
            <div class="voice">
              <b>${esc(who())}怎麼說：</b>${r ? esc(r) : ''}${r && note ? '。' : ''}${note ? `「${esc(note)}」` : ''}
              ${r === '目前不想改' ? `<br><span class="small">尊重${esc(who())}的決定。可以先從不改變生活習慣的小地方開始，或過一陣子再聊。</span>` : ''}
            </div>` : ''}
          ${photo ? `<img class="thumb" src="${photo}" alt="${esc(it.name)}的照片">` : ''}
          <ul class="acts">
            ${it.actions.map(a => `
              <li>
                <span class="tier ${a.tier}">${D.tiers[a.tier].label}</span>${esc(a.text)}
                <span class="cost">費用約 ${esc(a.cost)}</span>
                ${a.subsidy ? `<span class="sub">${esc(D.subsidy[a.subsidy])}</span>` : ''}
              </li>`).join('')}
          </ul>
          <div class="ud" aria-label="對應通用設計原則">
            ${principleNames(it.principles).map(n => `<span>${esc(n)}</span>`).join('')}
          </div>
        </article>`;
    }).join('');

    return `
      <h1 tabindex="-1" data-focus>${esc(who())}家的健檢結果</h1>
      <div class="summary">
        <p>${problems.length === 0
          ? `目前檢查的地方都沒有發現明顯風險，很棒！`
          : `找到 <strong>${problems.length}</strong> 個可以讓${esc(who())}更安心的地方，其中 <strong>${nowActions.length}</strong> 件事今晚就能動手。`}</p>
        <div class="stats">
          <div class="stat"><b>${answered}<small>/${list.length}</small></b><span>已檢查</span></div>
          <div class="stat"><b>${high}</b><span>優先處理</span></div>
          <div class="stat"><b>${unsure.length}</b><span>待確認</span></div>
        </div>
      </div>

      ${nowActions.length ? `
      <section class="section" aria-labelledby="h-now">
        <h2 id="h-now">今晚就能一起做的事</h2>
        <p class="muted small">做完可以勾起來，下次打開還會記得。</p>
        <ul class="todo">
          ${nowActions.map(x => `
            <li><label>
              <input type="checkbox" data-done="${esc(x.key)}" ${state.done[x.key] ? 'checked' : ''}>
              <span>${esc(x.a.text)}<span class="where">${esc(roomOf(x.p.item).name)}・${esc(x.p.item.name)}</span></span>
            </label></li>`).join('')}
        </ul>
      </section>` : ''}

      ${problems.length ? `
      <section class="section" aria-labelledby="h-all">
        <h2 id="h-all">所有發現（依優先順序）</h2>
        ${cards}
      </section>` : `<div class="empty"><p>記得半年後再陪${esc(who())}檢查一次，身體會變，家也要跟著調整。</p></div>`}

      ${unsure.length ? `
      <section class="section" aria-labelledby="h-unsure">
        <h2 id="h-unsure">還需要確認的地方</h2>
        <ul>
          ${unsure.map(it => `<li>${esc(roomOf(it).name)}：${esc(fill(it.q))}</li>`).join('')}
        </ul>
      </section>` : ''}

      ${needPro ? `
      <section class="section" aria-labelledby="h-sub">
        <h2 id="h-sub">需要施工？先申請長照補助</h2>
        <div class="callout">
          <p><strong>先評估、核定後再施工</strong>，自己先做完再申請，可能拿不到補助。</p>
        </div>
        <ol class="steps">
          <li>撥打 <strong>1966 長照專線</strong>，申請長照需要評估。</li>
          <li>照管專員到家評估，長照需要等級 <strong>第 2 級以上</strong>才能使用補助。</li>
          <li>輔具評估人員確認要改善的項目，核定補助內容。</li>
          <li>核定後由特約廠商施工，再附上施工前後照片與發票核銷。</li>
        </ol>
        <p class="small muted">居家無障礙改善與輔具共用<strong>每 3 年 4 萬元</strong>額度；一般戶補助 7 成、中低收入戶 9 成、低收入戶全額。各縣市規定可能不同，以照管專員說明為準。有身心障礙證明者，也可以詢問各縣市輔具資源中心。</p>
      </section>` : ''}

      <section class="section no-print" aria-labelledby="h-next">
        <h2 id="h-next">陪伴，不是一次就結束</h2>
        <p>${esc(who())}的身體會慢慢改變，家也要跟著調整。約好半年後，再陪${esc(who())}走一次。</p>
        <div class="stack">
          <button class="btn btn-primary btn-block" type="button" data-action="ics">把「半年後再檢查」加到行事曆</button>
          <div class="row">
            <button class="btn" type="button" data-action="share">分享給家人</button>
            <button class="btn" type="button" data-action="print">列印／存成 PDF</button>
          </div>
          <button class="btn btn-ghost btn-block" type="button" data-action="back-to-items">回去修改答案</button>
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
    const pressed = app.querySelector('[aria-pressed="true"].opt') || app.querySelector('.recorded');
    if (pressed) pressed.focus({ preventScroll: true });
  }

  function shareText() {
    const { problems } = computeFindings();
    const lines = [`【伴老家】${who()}家的居家健檢`];
    if (!problems.length) {
      lines.push('目前沒有發現明顯風險。');
    } else {
      problems.forEach(p => {
        const first = p.item.actions[0];
        lines.push(`・[${LEVELS[p.level].label}] ${roomOf(p.item).name}：${p.item.name} → ${first.text}`);
      });
    }
    lines.push('半年後再一起檢查一次！');
    return lines.join('\n');
  }

  function downloadIcs() {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
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
      `SUMMARY:再陪${who()}做一次居家健檢`,
      `DESCRIPTION:身體會變，家也要跟著調整。打開「伴老家」，再陪${who()}走一圈。`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = '伴老家-半年後健檢.ics';
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
        if (confirm('要清除這次的紀錄，重新開始嗎？')) { state = fresh(true); go('profile'); }
        break;
      case 'speak': {
        const it = currentItem();
        speak([fill(it.q), it.tip || '', fill(it.ask)].join('。'));
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
      case 'next':
        if (state.pos >= list.length - 1) go('results'); else go('item', state.pos + 1);
        break;
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
          navigator.share({ title: '伴老家健檢結果', text }).catch(() => {});
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => toast('已複製，可以貼到 LINE 家族群組'), () => toast('複製失敗'));
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

  function refreshWho() {
    app.querySelectorAll('[data-tpl]').forEach(el => { el.textContent = fill(el.dataset.tpl); });
  }

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
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.id === 'measure-input') {
      e.preventDefault();
      document.querySelector('[data-action="measure"]').click();
    }
  });

  render();
})();
