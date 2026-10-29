// 伴老家：居家健檢題庫
// {who} 會被替換成使用者選的稱呼（爸爸、媽媽、阿嬤…）
// sev：基本嚴重度 1–3；boost：符合長輩狀況時加分的標籤
// actions.tier：now 馬上能做／diy 週末自己來／pro 請專業施工

window.BAN_DATA = {
  principles: {
    1: '公平使用',
    2: '使用彈性',
    3: '簡單直覺',
    4: '易於感知',
    5: '容錯設計',
    6: '節省力氣',
    7: '空間可用性'
  },

  tiers: {
    now: { label: '今晚就能做', hint: '免費或幾百元' },
    diy: { label: '週末動手做', hint: '買得到、不用施工' },
    pro: { label: '請師傅幫忙', hint: '可以先問長照補助' }
  },

  subsidy: {
    rail: '長照補助參考：固定式扶手每 10 公分上限 150 元；可動式扶手每支上限 3,600 元',
    nonslip: '長照補助參考：防滑措施每處上限 3,000 元',
    ramp: '長照補助參考：非固定式斜坡板 3,500～10,000 元（依款式）；固定式斜坡道上限 10,000 元',
    device: '屬於輔具項目，可在長照評估時一併詢問是否補助',
    ask: '可在長照評估時詢問是否列入居家無障礙改善項目'
  },

  profile: [
    {
      key: 'who', label: '你要陪誰走這一圈？', type: 'who',
      options: ['爸爸', '媽媽', '爸媽', '阿公', '阿嬤', '自己']
    },
    {
      key: 'mobility', label: '{who}平常走路的樣子', options: [
        { label: '走得很穩', value: 0 },
        { label: '偶爾要扶東西', value: 1 },
        { label: '用拐杖或助行器', value: 2 },
        { label: '使用輪椅', value: 3 }
      ]
    },
    {
      key: 'fall', label: '這一年，{who}有沒有跌倒，或差點跌倒？', options: [
        { label: '有', value: 'yes' },
        { label: '沒有', value: 'no' },
        { label: '不確定', value: 'unsure' }
      ]
    },
    {
      key: 'night', label: '{who}晚上會起來上廁所嗎？', options: [
        { label: '幾乎不會', value: 0 },
        { label: '大約 1 次', value: 1 },
        { label: '2 次以上', value: 2 }
      ]
    },
    {
      key: 'vision', label: '{who}在暗的地方，看得清楚嗎？', options: [
        { label: '還看得清楚', value: 'ok' },
        { label: '怕暗、看不太清楚', value: 'weak' }
      ]
    },
    {
      key: 'hand', label: '{who}轉開瓶蓋、門把，會吃力嗎？', options: [
        { label: '不會', value: 'ok' },
        { label: '會吃力，或關節會痛', value: 'weak' }
      ]
    },
    {
      key: 'alone', label: '{who}常常一個人在家嗎？', options: [
        { label: '常常會', value: 'yes' },
        { label: '很少', value: 'no' }
      ]
    },
    {
      key: 'stairs', label: '家裡或回家的路上，需要爬樓梯嗎？', options: [
        { label: '需要', value: 'yes' },
        { label: '不需要（有電梯或平面）', value: 'no' }
      ]
    }
  ],

  // 從風險最高的浴室開始，避免使用者中途離開時漏掉最重要的地方
  rooms: [
    { id: 'bath', name: '浴室與廁所', intro: '浴室又濕又窄，是長輩最常跌倒的地方。我們從這裡開始。' },
    { id: 'bedroom', name: '臥室', intro: '半夜醒來的那幾步路，是最需要有人陪的時候。' },
    { id: 'living', name: '客廳與走道', intro: '請{who}帶著你，走一次每天最常走的那條路。' },
    { id: 'entry', name: '門口與玄關', intro: '每天出門、回家都會經過這裡，小小的高低差也會絆倒人。' },
    { id: 'kitchen', name: '廚房', intro: '請{who}煮一道拿手菜給你看，順便看看哪個動作最吃力。' },
    { id: 'stairs', name: '樓梯與陽台', intro: '最後，看看上下樓梯和晾衣服的地方。' }
  ],

  items: [
    // ── 浴室與廁所 ──
    {
      id: 'bath-threshold', room: 'bath', name: '浴室門口高低差',
      q: '浴室門口有門檻或高低差嗎？量量看有多高。',
      tip: '量門檻最高處到外側地面的高度。手邊沒有尺，可以用悠遊卡的長邊比對（約 8.5 公分）。',
      type: 'measure', unit: '公分',
      measure: { okMax: 0.5, highOver: 3 },
      alt: [{ label: '沒有高低差，是平的', ok: true }, { label: '量不到／不確定', unsure: true }],
      ask: '問問{who}：進出浴室時，會不會需要扶著門框？',
      boost: ['mobility', 'fall', 'night', 'wheelchair'],
      principles: [5, 7],
      why: '浴室門口是乾濕交界，又有高低差，最容易絆倒或滑倒，也會擋住輪椅和助行器。臺北市無障礙住宅設計基準建議浴廁出入口不設高差，改用截水溝擋水。',
      actions: [
        { tier: 'now', text: '在高低差邊緣貼上顏色明顯的止滑條，讓它「看得見」', cost: '數百元' },
        { tier: 'diy', text: '放置浴室用的斜坡墊，把高低差變成緩坡', cost: '數百～數千元', subsidy: 'ramp' },
        { tier: 'pro', text: '請師傅改成無高差地面，以截水溝擋水', cost: '上萬元', subsidy: 'ask' }
      ]
    },
    {
      id: 'bath-slip', room: 'bath', name: '浴室地面濕滑',
      q: '浴室地板濕的時候，踩起來會滑嗎？',
      options: [
        { label: '不會滑，有止滑處理', ok: true },
        { label: '會滑', sev: 3 },
        { label: '不確定', unsure: true }
      ],
      ask: '問問{who}：洗澡時有沒有滑倒或差點滑倒過？',
      boost: ['fall', 'mobility'],
      principles: [5],
      why: '濕滑的磁磚地是浴室跌倒的主因之一。長輩跌倒常造成髖部骨折，後續可能長期臥床。',
      actions: [
        { tier: 'now', text: '淋浴區鋪上止滑墊，洗完澡隨手把地面刮乾', cost: '數百元' },
        { tier: 'pro', text: '地面做止滑施工或更換止滑磁磚', cost: '數千～上萬元', subsidy: 'nonslip' }
      ]
    },
    {
      id: 'bath-toilet-rail', room: 'bath', name: '馬桶旁沒有扶手',
      q: '馬桶旁邊有扶手嗎？',
      options: [
        { label: '有，固定在牆上', ok: true },
        { label: '沒有', sev: 2 },
        { label: '只有毛巾架或吸盤式扶手', sev: 3, note: '毛巾架和吸盤扶手撐不住人的重量' }
      ],
      ask: '問問{who}：從馬桶站起來時，會不會想抓旁邊的東西？平常抓哪裡？',
      boost: ['mobility', 'fall'],
      principles: [5, 6],
      why: '從馬桶站起來是浴室裡最費力的動作之一。毛巾架、洗手台邊緣和吸盤式扶手都承受不了人的重量，突然鬆脫反而更危險。',
      actions: [
        { tier: 'pro', text: '請師傅在馬桶旁牆面鎖上 L 型扶手，要鎖進牆體結構', cost: '數千元', subsidy: 'rail' }
      ]
    },
    {
      id: 'bath-shower', room: 'bath', name: '洗澡處沒有支撐',
      q: '洗澡的地方有扶手嗎？可以坐著洗嗎？',
      options: [
        { label: '有扶手，也有洗澡椅', ok: true },
        { label: '只有其中一樣', sev: 1 },
        { label: '都沒有，站著洗', sev: 2 }
      ],
      ask: '問問{who}：洗頭、洗腳的時候，會不會站不穩？',
      boost: ['mobility', 'fall'],
      principles: [5, 6],
      why: '閉眼洗頭、單腳抬起洗腳時最容易失去平衡。坐著洗澡省力，也能大幅降低滑倒風險。',
      actions: [
        { tier: 'diy', text: '準備一張有靠背、椅腳止滑的洗澡椅', cost: '數百～數千元', subsidy: 'device' },
        { tier: 'pro', text: '在淋浴區加裝扶手', cost: '數千元', subsidy: 'rail' }
      ]
    },
    {
      id: 'bath-door', room: 'bath', name: '浴室門往內開',
      q: '浴室的門是往裡面推開的嗎？',
      options: [
        { label: '往內開', sev: 2 },
        { label: '往外開或是拉門', ok: true }
      ],
      ask: '和{who}聊聊：如果在浴室裡跌倒，家人要怎麼進來？',
      boost: ['fall', 'alone'],
      principles: [5, 7],
      why: '如果有人在浴室跌倒、身體擋在門後，往內開的門會推不開，延誤救援。',
      actions: [
        { tier: 'pro', text: '改成往外開的門或橫拉門', cost: '上萬元', subsidy: 'ask' }
      ]
    },
    {
      id: 'bath-lock', room: 'bath', name: '浴室門鎖無法從外面開',
      q: '浴室門鎖，可以從外面用硬幣或鑰匙打開嗎？',
      options: [
        { label: '可以', ok: true },
        { label: '不行', sev: 2 },
        { label: '不確定', unsure: true }
      ],
      ask: '問問{who}：洗澡時習慣鎖門嗎？',
      boost: ['alone', 'fall'],
      principles: [5],
      why: '長輩在浴室裡昏倒或跌倒時，家人必須能從外面開門。',
      actions: [
        { tier: 'diy', text: '換成外側可以用硬幣緊急開啟的浴室鎖', cost: '數百元' }
      ]
    },
    {
      id: 'bath-water', room: 'bath', name: '冷熱水不易分辨',
      q: '洗手台和淋浴的冷熱水，看得出哪邊是熱水嗎？水溫會突然變燙嗎？',
      options: [
        { label: '看得清楚，水溫穩定', ok: true },
        { label: '不好分辨，或會突然變燙', sev: 1 }
      ],
      ask: '問問{who}：有沒有被熱水燙到過？',
      boost: ['vision', 'hand'],
      principles: [4, 5],
      why: '年紀大了對溫度的感覺會變遲鈍，反應也較慢，容易被熱水燙傷。',
      actions: [
        { tier: 'now', text: '在龍頭貼上紅、藍大色塊標示冷熱', cost: '免費' },
        { tier: 'pro', text: '換成恆溫龍頭，或把熱水器溫度調低', cost: '數千元' }
      ]
    },
    {
      id: 'bath-call', room: 'bath', name: '浴室裡無法求救',
      q: '如果{who}在浴室跌倒，有辦法叫人嗎？',
      options: [
        { label: '有呼叫鈴，或手機放得到', ok: true },
        { label: '沒辦法', sev: 2 }
      ],
      ask: '和{who}約好：在浴室裡如果需要幫忙，要怎麼讓家人知道？',
      boost: ['alone', 'fall'],
      principles: [4, 5],
      why: '跌倒後能不能馬上被發現，會大大影響傷勢與復原。獨居或常一個人在家時更重要。',
      actions: [
        { tier: 'now', text: '洗澡時把手機放在伸手拿得到、又不會淋濕的地方', cost: '免費' },
        { tier: 'diy', text: '裝無線呼叫鈴，按鈕放在馬桶和淋浴旁的低處（跌坐在地上也按得到）', cost: '數百元' }
      ]
    },

    // ── 臥室 ──
    {
      id: 'bed-light', room: 'bedroom', name: '躺在床上開不到燈',
      q: '躺在床上，伸手就能開燈嗎？',
      options: [
        { label: '可以', ok: true },
        { label: '要下床才能開', sev: 2 }
      ],
      ask: '問問{who}：半夜醒來，第一件事是做什麼？',
      boost: ['night', 'vision'],
      principles: [4, 5],
      why: '摸黑下床找開關，是夜間跌倒的開始。',
      actions: [
        { tier: 'now', text: '床頭放一盞觸控式或拍拍燈', cost: '數百元' }
      ]
    },
    {
      id: 'bed-path', room: 'bedroom', name: '夜間如廁路線沒有照明',
      q: '晚上從床走到廁所，沿路有照明嗎？',
      options: [
        { label: '有感應夜燈或小燈', ok: true },
        { label: '要一路開大燈', sev: 1 },
        { label: '沒有，摸黑走', sev: 3 }
      ],
      ask: '問問{who}：晚上起床上廁所，會不會怕黑或頭暈？',
      boost: ['night', 'fall', 'vision'],
      principles: [4, 5],
      why: '夜間如廁是長輩跌倒的高風險時刻：剛睡醒血壓偏低、光線暗、又急著走。腳邊的低亮度感應燈不刺眼，也不用找開關。',
      actions: [
        { tier: 'now', text: '沿路在腳邊插上感應式小夜燈：床邊、走道、廁所門口各一盞', cost: '數百元' }
      ]
    },
    {
      id: 'bed-height', room: 'bedroom', name: '床的高度不合適',
      q: '{who}坐在床邊時，雙腳能平踩地面、膝蓋大約成直角嗎？',
      options: [
        { label: '可以', ok: true },
        { label: '床太低，膝蓋比屁股高', sev: 2 },
        { label: '床太高，腳踩不到地', sev: 2 }
      ],
      ask: '問問{who}：早上起床，從床上站起來會不會吃力？',
      boost: ['mobility', 'fall'],
      principles: [6, 7],
      why: '床太低起身費力，床太高腳踩不穩，兩種都容易在上下床時跌倒。',
      actions: [
        { tier: 'diy', text: '床太低可加床腳增高墊；太高可換薄一點的床墊', cost: '數百～數千元' },
        { tier: 'diy', text: '行動較不便時，可評估可調高度的電動床', cost: '上萬元', subsidy: 'device' }
      ]
    },
    {
      id: 'bed-support', room: 'bedroom', name: '床邊沒有可扶的地方',
      q: '床邊有可以扶著起身的東西嗎？',
      options: [
        { label: '有穩固的扶手或家具', ok: true },
        { label: '沒有', sev: 2 },
        { label: '只有會移動的東西（例如有輪子的櫃子）', sev: 3 }
      ],
      ask: '問問{who}：起床時會扶著哪裡？',
      boost: ['mobility', 'fall'],
      principles: [5, 6],
      why: '起身時下意識抓住的東西如果會滑動，反而會讓人失去平衡。',
      actions: [
        { tier: 'now', text: '把會滑動的家具移開，換成穩固的床頭櫃', cost: '免費' },
        { tier: 'diy', text: '加裝床邊扶手', cost: '數千元', subsidy: 'device' }
      ]
    },

    // ── 客廳與走道 ──
    {
      id: 'living-cords', room: 'living', name: '電線橫過走道',
      q: '走道或常走的地方，有沒有電線、延長線橫過地面？',
      options: [
        { label: '有', sev: 2 },
        { label: '沒有', ok: true }
      ],
      ask: '請{who}帶你走一次平常最常走的路線，看看腳下有什麼。',
      boost: ['fall', 'vision'],
      principles: [5],
      why: '地上的電線不容易被注意到，腳抬得不夠高時很容易勾到。',
      actions: [
        { tier: 'now', text: '把電線沿牆邊收好，用線槽或膠帶固定', cost: '免費～數百元' }
      ]
    },
    {
      id: 'living-rugs', room: 'living', name: '會滑動的地墊',
      q: '地上有沒有容易滑動或捲邊的地墊、小地毯？',
      options: [
        { label: '有', sev: 2 },
        { label: '沒有', ok: true }
      ],
      ask: '問問{who}：這些地墊是為了什麼放的？可以拿掉嗎？',
      boost: ['fall', 'mobility'],
      principles: [5],
      why: '地墊捲邊會絆腳，底部不止滑會在踩上去時整片滑走；對使用助行器的人也是障礙。',
      actions: [
        { tier: 'now', text: '移除不必要的地墊；要留的話底下加止滑墊，四邊貼平', cost: '免費～數百元' }
      ]
    },
    {
      id: 'living-path', room: 'living', name: '通往廁所的路被擋住',
      q: '從臥室到廁所的路上，有沒有雜物或家具擋路，要側身或繞過？',
      options: [
        { label: '有', sev: 2 },
        { label: '沒有，可以直直走過去', ok: true }
      ],
      ask: '問問{who}：晚上走去廁所時，有沒有撞到或踢到過東西？',
      boost: ['night', 'mobility', 'wheelchair'],
      principles: [5, 7],
      why: '半夜精神不濟時，要繞路、側身就容易碰撞；使用助行器或輪椅時，通道更需要淨空。',
      actions: [
        { tier: 'now', text: '清出一條直直的通道，雜物改收進櫃子', cost: '免費' }
      ]
    },
    {
      id: 'living-chair', room: 'living', name: '椅子不好起身',
      q: '{who}從常坐的沙發或椅子站起來，會吃力嗎？',
      options: [
        { label: '很輕鬆', ok: true },
        { label: '有點吃力，要撐好幾次', sev: 2 },
        { label: '需要有人拉', sev: 3 }
      ],
      ask: '問問{who}：家裡哪張椅子坐起來最舒服、最好站起來？',
      boost: ['mobility'],
      principles: [6],
      why: '太低、太軟的沙發會讓人陷進去，起身時要用很大的力氣，也容易往後跌坐。',
      actions: [
        { tier: 'now', text: '改坐有扶手、座面較高較硬的椅子', cost: '免費' },
        { tier: 'diy', text: '沙發加硬坐墊墊高，旁邊放可以撐的穩固家具', cost: '數百元' }
      ]
    },

    // ── 門口與玄關 ──
    {
      id: 'entry-threshold', room: 'entry', name: '門檻太高',
      q: '大門或房門有門檻嗎？量量看最高的一個有多高。',
      tip: '用尺量門檻最高處到地面的高度。手邊沒有尺，可以用悠遊卡的長邊比對（約 8.5 公分）。',
      type: 'measure', unit: '公分',
      measure: { okMax: 0.5, highOver: 3 },
      alt: [{ label: '沒有門檻，是平的', ok: true }, { label: '量不到／不確定', unsure: true }],
      ask: '問問{who}：跨過這個門檻時，會不會需要扶著東西？',
      boost: ['mobility', 'fall', 'wheelchair'],
      principles: [5, 6, 7],
      why: '門檻是居家絆倒的常見原因，也會擋住輪椅、助行器和嬰兒車。臺北市無障礙住宅設計基準建議門檻不超過 3 公分，超過 0.5 公分就應做斜角處理。',
      actions: [
        { tier: 'now', text: '在門檻貼上顏色明顯的止滑條，讓它容易被看見', cost: '數百元' },
        { tier: 'diy', text: '放置門檻斜坡板，不需施工', cost: '數百～數千元', subsidy: 'ramp' },
        { tier: 'pro', text: '請師傅把門檻磨成斜角或移除', cost: '數千～上萬元', subsidy: 'ask' }
      ]
    },
    {
      id: 'entry-seat', room: 'entry', name: '玄關沒有穿鞋椅',
      q: '玄關有可以坐著穿脫鞋的椅子嗎？',
      options: [
        { label: '有', ok: true },
        { label: '沒有', sev: 2 }
      ],
      ask: '問問{who}：平常是站著穿鞋，還是要扶著牆？',
      boost: ['fall', 'mobility'],
      principles: [5, 6],
      why: '單腳站著穿鞋很容易失去平衡；坐著穿鞋省力又安全。',
      actions: [
        { tier: 'now', text: '先在玄關放一張穩固、有靠背的椅子', cost: '免費' },
        { tier: 'diy', text: '換成附扶手的穿鞋椅，旁邊掛一支長柄鞋拔', cost: '數百～數千元' }
      ]
    },
    {
      id: 'entry-light', room: 'entry', name: '玄關開燈不方便',
      q: '一進門，伸手就摸得到電燈開關嗎？',
      options: [
        { label: '摸得到', ok: true },
        { label: '要走進黑暗中才找得到', sev: 2 }
      ],
      ask: '問問{who}：晚上回家開門時，會不會一片黑？',
      boost: ['vision'],
      principles: [4, 5],
      why: '一手拿東西、一手找開關，又看不清腳下，是玄關跌倒的常見情況。',
      actions: [
        { tier: 'now', text: '在玄關放一盞感應式小燈', cost: '數百元' },
        { tier: 'pro', text: '請水電師傅在門邊加裝開關或感應燈', cost: '數千元' }
      ]
    },
    {
      id: 'entry-handle', room: 'entry', name: '圓形門把難轉開',
      q: '家裡的門把，是要用手「扭轉」的圓形喇叭鎖嗎？',
      options: [
        { label: '是，要扭轉', sev: 1 },
        { label: '有的是、有的不是', sev: 1 },
        { label: '都是往下壓的把手', ok: true }
      ],
      ask: '問問{who}：有沒有哪扇門比較難打開？',
      boost: ['hand'],
      principles: [2, 6],
      why: '握力差或關節痛時，圓形門把很難轉開；下壓式把手連手肘都能開，提著東西時也方便。',
      actions: [
        { tier: 'diy', text: '把常用的房門（廁所、臥室）換成下壓式把手', cost: '每個數百～數千元' }
      ]
    },

    // ── 廚房 ──
    {
      id: 'kitchen-reach', room: 'kitchen', name: '常用物品放太高或太低',
      q: '常用的鍋碗、調味料，需要踮腳、站上椅子或蹲到底才拿得到嗎？',
      options: [
        { label: '需要', sev: 2 },
        { label: '不需要', ok: true }
      ],
      ask: '請{who}拿一次平常最常用的鍋子，看看是怎麼拿的。',
      boost: ['fall', 'mobility'],
      principles: [6, 7],
      why: '站上椅子拿高處的東西是很常見的跌倒原因，蹲下再站起來也容易頭暈。',
      actions: [
        { tier: 'now', text: '把常用的東西移到腰到肩膀之間的高度', cost: '免費' }
      ]
    },
    {
      id: 'kitchen-stove', room: 'kitchen', name: '爐具沒有熄火保護',
      q: '瓦斯爐有自動熄火的安全裝置嗎？',
      options: [
        { label: '有', ok: true },
        { label: '沒有', sev: 2 },
        { label: '不知道', unsure: true }
      ],
      ask: '問問{who}：有沒有煮東西時忘記關火的經驗？',
      boost: ['alone'],
      principles: [5],
      why: '忘記關火，或湯汁溢出把火澆熄造成漏氣，都是廚房的重大風險。較舊的爐具可能沒有熄火安全裝置。',
      actions: [
        { tier: 'now', text: '煮東西時設定計時器提醒', cost: '免費' },
        { tier: 'pro', text: '更換有熄火安全裝置的爐具，並加裝瓦斯偵測器', cost: '數千元' }
      ]
    },

    // ── 樓梯與陽台 ──
    {
      id: 'stairs-rail', room: 'stairs', name: '樓梯扶手不足', when: { stairs: 'yes' },
      q: '樓梯兩側都有扶手，而且從頭到尾連續嗎？',
      options: [
        { label: '兩側都有', ok: true },
        { label: '只有一側', sev: 1 },
        { label: '沒有扶手', sev: 3 }
      ],
      ask: '問問{who}：上樓和下樓，哪一個比較怕？',
      boost: ['mobility', 'fall'],
      principles: [5, 6],
      why: '兩側都有扶手時，慣用手不同、或手上提東西時都能扶；扶手中斷的地方最容易失去支撐。',
      actions: [
        { tier: 'pro', text: '加裝扶手，最好兩側都有、頭尾延伸', cost: '數千～上萬元', subsidy: 'rail' }
      ]
    },
    {
      id: 'stairs-edge', room: 'stairs', name: '階梯邊緣看不清楚', when: { stairs: 'yes' },
      q: '每一階的邊緣看得清楚嗎？顏色和地面有區別嗎？',
      options: [
        { label: '看得清楚', ok: true },
        { label: '不太清楚', sev: 2 }
      ],
      ask: '問問{who}：下樓梯時，會不會看不清楚還有幾階？',
      boost: ['vision', 'fall'],
      principles: [4, 5],
      why: '階梯顏色一致時，視力退化的人很難判斷每階的邊界，下樓時容易踩空。',
      actions: [
        { tier: 'now', text: '在每階邊緣貼上對比色的止滑條', cost: '數百元' },
        { tier: 'pro', text: '整段樓梯做止滑處理', cost: '數千元', subsidy: 'nonslip' }
      ]
    },
    {
      id: 'stairs-switch', room: 'stairs', name: '樓梯只能一邊開燈', when: { stairs: 'yes' },
      q: '樓梯上面和下面都可以開關燈嗎？',
      options: [
        { label: '可以', ok: true },
        { label: '只有一邊可以', sev: 2 }
      ],
      ask: '問問{who}：晚上上下樓時，燈是怎麼開的？',
      boost: ['night', 'vision'],
      principles: [4, 5],
      why: '只有一邊有開關時，另一段路就得摸黑走。',
      actions: [
        { tier: 'diy', text: '先在樓梯上下裝感應燈', cost: '數百元' },
        { tier: 'pro', text: '請水電師傅改成上下都能開關的雙切開關', cost: '數千元' }
      ]
    },
    {
      id: 'balcony-dry', room: 'stairs', name: '晾衣服要高舉雙手',
      q: '晾衣服時，需要高舉雙手或踮腳嗎？',
      options: [
        { label: '需要', sev: 1 },
        { label: '不需要', ok: true }
      ],
      ask: '問問{who}：晾衣服時，肩膀或腰會不會不舒服？',
      boost: ['fall', 'mobility'],
      principles: [6, 7],
      why: '高舉雙手又踮腳時重心不穩，加上陽台地面常是濕的，容易跌倒。',
      actions: [
        { tier: 'diy', text: '改用可以升降的曬衣架，或放低一根晾衣桿', cost: '數百～數千元' }
      ]
    }
  ],

  reactions: ['還好啦', '有點擔心', '真的很困擾', '先不想改']
};
