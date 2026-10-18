"use strict";
window.HEART_GROWTH = (() => {
  const days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const skills = { design: "设计表达", observe: "观察研究", negotiate: "沟通议价" };
  const origins = {
    paid: { title: "上一笔稿费到账了", cash: 2600, observe: 1, intro: "上一笔尾款刚到账。你把房租日期圈起来，想给自己的作品留一点时间。" },
    delayed: { title: "有一笔尾款还没到账", cash: 1700, observe: 1, intro: "账面上有九百元尾款，账户里还没有。客户上周说的‘尽快’，没有给出日期。" },
    sketchbook: { title: "手里已有半本观察笔记", cash: 2200, observe: 2, intro: "你把没卖出去的速写收成半本小册。它还不是作品集，但里面开始有了自己的判断。" }
  };
  const jobs = {
    bakery: { title: "面包店开业海报", client: "花间面包", opens: 1, deadline: 3, pay: 900, target: 3, brief: "让路过的人先看见营业时间和入口，而不是先看见装饰。", gate: "" },
    bookshop: { title: "旧书店活动折页", client: "渡口书店", opens: 2, deadline: 5, pay: 750, target: 3, brief: "活动很多，纸只有一张。需要让第一次来的人也能找到自己的那一场。", gate: "" },
    wayfinding: { title: "公共空间导视提案", client: "独立展览团队", opens: 4, deadline: 7, pay: 1500, target: 4, brief: "把入口、无障碍路线和出口讲清楚。对方会看你是否完成过一次真实交付。周日需要亲自参加验收，与全天书展冲突。", gate: "设计表达 3，完成至少一笔委托；周日现场验收" }
  };
  const contacts = {
    gu: { name: "顾砚", art: "gu-glasses", available: [1, 4, 6], skill: "negotiate", text: "顾砚把自己的意见停在询问里。你们讨论了一份报价单，最后写下的价格仍由你决定。", bonus: "你把交付范围和修改次数分开写清，第一次发现报价也可以是一种设计。" },
    zhou: { name: "周予白", art: "zhou-parted", available: [2, 3, 5, 7], skill: "observe", text: "周予白带来一张公开的纸模型图。你们在桌上慢慢展开，讨论图纸为什么会让第一次使用的人迷路。", bonus: "你学会沿着使用者的手指检查一张图，而不只站在作者的角度看。" },
    lu: { name: "陆星野", art: "lu-swept", available: [1, 3, 6, 7], skill: "observe", text: "陆星野在北京结束排练，和你通了一会儿视频。他问你的海报想让站在十米外的人先看见什么。", bonus: "你把页面缩成手机上一张小图。那些舍不得删掉的装饰，忽然有了取舍。" },
    wen: { name: "闻照", art: "wen-sidepart", available: [2, 4, 5, 7], skill: "design", text: "闻照从深圳发来一张社区活动单。你们谈起一张图的秩序，也谈起秩序该给不同的人留下多少位置。", bonus: "你画了两种信息层级，决定先让真正要找路的人看懂，再考虑它是否漂亮。" },
    friend: { name: "林见微", art: "heroine-straight", available: [1, 2, 3, 4, 5, 6, 7], skill: "negotiate", text: "见微带着两杯豆浆过来。你们没有互相汇报成就，只把最近最难开口的一件事说清楚。", bonus: "你练习了一次拒绝免费的额外修改。她没替你发送，那段话终于由你自己写完。" }
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const own = (object, key) => typeof key === "string" && Object.prototype.hasOwnProperty.call(object, key);
  const clamp = n => Math.max(0, Math.min(100, n));
  const dateName = n => n <= 7 ? days[n - 1] : "下" + days[(n - 1) % 7];
  function create(name = "夏宁", seed = 1, origin) {
    seed = seed >>> 0; origin = own(origins, origin) ? origin : Object.keys(origins)[seed % 3];
    const start = origins[origin];
    return { version: 1, name: String(name).trim().slice(0, 12) || "夏宁", seed, origin, day: 1, slot: 0, phase: "plan", cash: start.cash, energy: 72, strain: 10,
      skills: { design: 1, observe: start.observe, negotiate: 1 }, contacts: Object.fromEntries(Object.keys(contacts).map(k => [k, 0])),
      active: null, completed: [], works: [], personal: 0, flags: {}, journal: [], feedback: null, ending: null };
  }
  function record(s, title, text, kind, cause) { s.journal.push({ day: s.day, slot: s.slot, title, text, kind, cause: cause || "" }); }
  function changeSkill(s, skill, amount = 1) { s.skills[skill] = Math.min(8, s.skills[skill] + amount); }
  function affordable(s, cash, energy) { return cash > 0 && s.cash < cash ? `还需要 ¥${cash - s.cash}` : s.energy < energy ? `需要 ${energy} 精力，先休息一下` : ""; }
  function option(s, id, label, note, cash = 0, energy = 0, blocked = "") { return { id, label, note, cash, energy, blocked: blocked || affordable(s, cash, energy) }; }
  function remainingSlots(s, deadline) { return (deadline - s.day) * 2 + 2 - s.slot; }
  function projectGate(s, id) {
    const job = jobs[id];
    if (s.active) return "先处理手头的委托";
    if (s.completed.includes(id)) return "这一笔已完成";
    if (s.day < job.opens) return `${days[job.opens - 1]}开始征稿`;
    if (remainingSlots(s, job.deadline) < 3) return "剩余时段不足以完成三个交付步骤";
    if (id === "wayfinding" && (s.skills.design < 3 || !s.completed.length)) return job.gate;
    return "";
  }
  function groups(s) {
    if (s.phase !== "plan") return [];
    return [
      { id: s.active ? "project" : "jobs", title: s.active ? `${jobs[s.active.id].title} · ${["", "做方案", "交付"][s.active.stage]}` : "找一笔适合的委托", note: s.active ? `${days[jobs[s.active.id].deadline - 1]}交付 · 剩 ${3 - s.active.stage} 个步骤` : "先看报酬、截止时间和能力要求" },
      { id: "learn", title: "学一点真正用得上的东西", note: "学会的方法，会出现在后续的方案选项里" },
      { id: "personal", title: s.personal === 0 ? "开始自己的小册" : s.personal === 1 ? "把小册做完" : "修订自己的小册", note: "个人作品需要两个时段，质量来自设计与观察的积累" },
      { id: "contacts", title: "留一段时间给想见的人", note: "他们也有自己的安排；见面占用一个时段" },
      ...(s.origin === "delayed" && !s.flags.invoiceAsked ? [{ id: "invoice", title: "把旧尾款的交付记录整理好", note: "占一个时段，争取明确的回款日期" }] : []),
      { id: "rest", title: "今天这一段，先休息", note: "最多恢复 28 精力，负荷 −18；时间照常向前走" }
    ];
  }
  function options(s, group) {
    if (s.phase !== "plan" || !groups(s).some(g => g.id === group)) return [];
    if (group === "jobs") return Object.entries(jobs).map(([id, j]) => option(s, id, j.title, `¥${j.pay} · ${days[j.deadline - 1]}截止 · 三个时段${j.gate ? " · " + j.gate : ""}`, 0, 12, projectGate(s, id)));
    if (group === "project") {
      const p = s.active, job = jobs[p.id];
      if (p.stage === 1) return [
        option(s, "hierarchy", "先把信息层级做清楚", "需要设计表达 2 · 方案质量 +2 · 精力 −16", 0, 16, s.skills.design < 2 ? "设计表达需要达到 2，版式实训可以学到" : ""),
        option(s, "fieldwork", "按现场使用方式调整", "需要观察研究 2 · 方案质量 +2 · 精力 −16", 0, 16, s.skills.observe < 2 ? "观察研究需要达到 2，可以去做一次街区观察" : ""),
        option(s, "template", "用现成结构完成基础稿", "方案质量不变 · 精力 −10；交付时可再做一次有成本的打样", 0, 10)
      ];
      const deliveryGate = p.id === "wayfinding" && s.day < 7 ? "展览团队安排周日现场验收，这一步须在周日完成" : "";
      return [
        option(s, "deliver", "按约交付这一版", p.quality >= job.target ? `质量符合约定 · 稿费 +¥${job.pay}` : `质量尚需打磨，改为简化版本结算 ¥${Math.floor(job.pay * .55)}；仍保留实际交付作品`, 0, 10, deliveryGate),
        option(s, "proof", "做一次付费打样，再交付", `花费 ¥100 · 质量 +2 · 精力 −18${p.quality + 2 >= job.target ? " · 达到这笔委托要求" : " · 仍需简化结算"}`, 100, 18, deliveryGate)
      ];
    }
    if (group === "learn") return [
      option(s, "design", "上一堂版式实训", "¥120 · 精力 −12 · 设计表达 +1；达到 2 可自主做信息层级，达到 3 可争取导视提案", 120, 12, s.skills.design >= 8 ? "这周可以先把学到的用起来" : ""),
      option(s, "observe", "去街区做一次观察速写", "¥20 · 精力 −8 · 观察研究 +1；达到 2 可按现场使用方式做方案", 20, 8, s.skills.observe >= 8 ? "这周可以先把观察整理成作品" : ""),
      option(s, "negotiate", "练习把报价和范围写清", "¥80 · 精力 −10 · 沟通议价 +1；可在加需求时守住原合同", 80, 10, s.skills.negotiate >= 8 ? "这一周已经练得足够多" : "")
    ];
    if (group === "personal") return [option(s, "make", s.personal === 0 ? "从这座城市的一处细节开始" : s.personal === 1 ? "把散页整理成一本小册" : "用这周学到的方法重新修订", "¥40 · 精力 −14；完成质量 = 设计表达 + 观察研究，达到 5 可送去书展", 40, 14)];
    if (group === "contacts") return Object.entries(contacts).map(([id, c]) => option(s, id, id === "lu" || id === "wen" ? `和${c.name}通一会儿电话` : `和${c.name}见一面`, `¥20 · 精力 −6 · 首次交流可学到一点${skills[c.skill]}${id === "friend" ? "，也能卸下一点负荷" : ""}`, 20, 6, !c.available.includes(s.day) ? `${c.name}今天已有安排，${days[c.available.find(d => d > s.day) - 1] || "这一周之后"}再约` : ""));
    if (group === "invoice") return [option(s, "ask", "附上验收与交付记录，要求明确日期", `沟通议价最多 +1 · ¥900 尾款预计${dateName(s.day + 1 + s.seed % 2)}到账 · 精力 −8`, 0, 8)];
    return [option(s, "rest", "关掉工作消息，认真休息", "不花钱 · 最多恢复 28 精力 · 负荷 −18；这一时段留给自己")];
  }
  function shortLines(lines) {
    return lines.flatMap(line => {
      const result = []; let part = "";
      for (const sentence of line.match(/[^。！？；]+[。！？；]?/gu) || [line]) {
        if (part && Array.from(part + sentence).length > 64) { result.push(part); part = ""; }
        for (const char of sentence) { if (Array.from(part).length >= 64) { result.push(part); part = ""; } part += char; }
      }
      if (part) result.push(part); return result;
    });
  }
  function feedback(s, title, lines, next, art = "heroine-straight", speaker = "旁白") {
    s.phase = "feedback"; s.feedback = { title, lines: shortLines(lines), next, art, speaker, index: 0 };
    return s;
  }
  function act(state, group, id) {
    const o = options(state, group).find(x => x.id === id);
    if (!o || o.blocked) throw Error(o?.blocked || "这个安排现在不可用。");
    const s = clone(state), before = { cash: s.cash, energy: s.energy, skills: clone(s.skills) };
    s.cash -= o.cash; s.energy = clamp(s.energy - o.energy);
    let title = o.label, lines = [], art = "heroine-straight", cause = "";
    if (group === "jobs") {
      s.active = { id, stage: 1, quality: 1 };
      changeSkill(s, "negotiate"); s.strain = clamp(s.strain + 7);
      lines = [`你没有马上开始画。你问清楚受众、交付范围和修改次数，把它们写进了报价。`, `${jobs[id].client}确认了委托：${jobs[id].brief}`, `沟通议价增加 ${s.skills.negotiate - before.skills.negotiate}。后面还要留出两个时段做方案、交付。`];
      cause = "有了明确的受众和交付范围";
    } else if (group === "project") {
      const p = s.active, job = jobs[p.id]; title = job.title + " · " + title; s.strain = clamp(s.strain + (id === "proof" ? 13 : 8));
      if (p.stage === 1) {
        p.stage = 2; p.quality += id === "template" ? 0 : 2;
        cause = id === "hierarchy" ? "你已学会版式层级" : id === "fieldwork" ? "你已有现场观察的方法" : "你选择先完成基础结构";
        lines = [id === "hierarchy" ? "你把最重要的信息单独留出来，删掉了挡住入口和时间的装饰。这一次，你知道自己为什么这样改。" : id === "fieldwork" ? "你从一个第一次到访的人走路的方向重新看页面。以前以为漂亮的位置，原来恰好遮住了出口。" : "你用已有结构做完基础稿。它节省了眼下的力气，也留下了交付前还要解决的质量差距。", `${cause}，这份方案目前质量 ${p.quality} / ${job.target}。还需要一个时段交付。`];
      } else {
        p.quality += id === "proof" ? 2 : 0;
        const passed = p.quality >= job.target, pay = passed ? job.pay : Math.floor(job.pay * .55);
        s.cash += pay; s.completed.push(p.id); s.works.push({ id: p.id, title: job.title, quality: p.quality, kind: "client" });
        s.flags["passed-" + p.id] = passed; s.active = null;
        cause = passed ? "完成了符合约定的真实交付" : "完成了简化结算的真实交付";
        lines = [id === "proof" ? "你为样张付了钱，也亲手看见屏幕和纸张的差别。交付前的最后一次调整，终于有了实物作为依据。" : "你把源文件、使用说明和交付清单放进同一个文件夹。发送时，你没有再给文件名添一个‘最终最终版’。", passed ? `${job.client}确认验收，¥${pay} 到账。作品集里多了一个真正被使用的案例。` : `你如实说明了这版的限制。双方按简化范围结算 ¥${pay}，这次交付也提醒你下一次要准备什么。`];
      }
    } else if (group === "learn") {
      changeSkill(s, id); s.strain = clamp(s.strain + 5);
      lines = [{ design: "你把一张海报拆成标题、时间、地点和装饰，再试着重新排序。你带走的是一套能在下一张稿里用上的方法。", observe: "你在街口看了很久。有人绕过漂亮的招牌去找不起眼的门，有人蹲下来才读清小字。你的笔记里多了实际使用者的路。", negotiate: "你把‘随便改’改成了交付清单，把‘很快’改成了具体日期。那些不好意思说的边界，慢慢变成了可以说清的话。" }[id], `${skills[id]}达到 ${s.skills[id]}。${id === "design" && s.skills.design === 3 ? "如果已经交付过委托，现在可以争取公共空间导视提案。" : "这项积累会保留到后面的选择里。"}`];
      cause = `主动学习了${skills[id]}`;
    } else if (group === "personal") {
      s.strain = clamp(s.strain + 6); s.personal = Math.min(2, s.personal + 1);
      if (s.personal === 1) lines = ["这一页没有客户的名字。你从楼下那家修伞铺画起，决定先讲清自己为什么会在这里停下来。", "个人小册：1 / 2。还需要一个时段把散页整理成作品。"];
      else {
        const quality = s.skills.design + s.skills.observe, existing = s.works.find(w => w.id === "zine");
        if (existing) existing.quality = Math.max(existing.quality, quality); else s.works.push({ id: "zine", title: "走慢一点的街道", quality, kind: "personal" });
        lines = ["你把自己的名字印在封面上。它不会立即替你付房租，但它第一次把‘我喜欢什么’变成了一件可以交给别人翻阅的东西。", `小册质量 ${Math.max(existing?.quality || 0, quality)}。${quality >= 5 ? "已经达到书展送审要求；还需要准备印本和出席时间。" : "达到 5 可以送审。继续学习或观察后，可以再用一个时段修订。"}`];
      }
      cause = "把能力积累用在了自己的作品上";
    } else if (group === "contacts") {
      const c = contacts[id]; art = c.art;
      lines = [c.text]; s.contacts[id]++;
      if (s.contacts[id] === 1) { changeSkill(s, c.skill); lines.push(c.bonus + `${skills[c.skill]}增加 ${s.skills[c.skill] - before.skills[c.skill]}。`); }
      else lines.push("这次你们没有再把见面变成一堂课。你讲起自己的近况，他也有正在过的生活。多见一次，不会替你完成未交的稿。".replace("他也", id === "friend" ? "她也" : "他也"));
      s.strain = clamp(s.strain - (id === "friend" ? 12 : 5)); cause = `自己留出了和${c.name}交流的时间`;
    } else if (group === "invoice") {
      s.flags.invoiceAsked = true; s.flags.invoiceDue = s.day + 1 + s.seed % 2; changeSkill(s, "negotiate");
      lines = ["你把验收邮件、源文件日期和约定的款项整理在一起，要求对方给出具体日期。这一次，你不再只收到一句‘尽快’。", `尾款 ¥900 已约定在${dateName(s.flags.invoiceDue)}到账。它还没有进入余额，不能提前当作已经拿到的钱。`];
      cause = "用交付证据争取了明确的回款日期";
    } else {
      s.energy = clamp(s.energy + 28); s.strain = clamp(s.strain - 18); art = "heroine-blacknight";
      lines = ["你把手机翻过去，吃一顿不用盯着聊天框的饭。窗外的人声照常经过，今天不需要每一段时间都拿来证明自己。", `精力恢复了 ${s.energy - before.energy}。截止日期仍在原来的那天，你知道接下来需要怎样安排。`];
      cause = "为后面的安排留出了可用精力";
    }
    const delta = `余额 ${s.cash - before.cash >= 0 ? "+" : ""}${s.cash - before.cash} · 精力 ${s.energy - before.energy >= 0 ? "+" : ""}${s.energy - before.energy}`;
    record(s, title, lines.join("\n"), group, cause); s.slot++;
    return feedback(s, title, [...lines, delta], s.slot < 2 ? "plan" : "evening", art);
  }
  function evening(s) {
    if (s.day === 1) return { title: "一张还没写名字的报名表", text: "周日的独立书展还留着几张桌子。提前留位要 ¥100；你还需要一本达到送审要求的小册、印本，以及周日完整的一天。", choices: [option(s, "reserve", "先留住一张桌子", "余额 −¥100；书展占周日全天，后续仍可放弃", 100), option(s, "wait", "先把作品做出来，再决定", "周六若还有准备好的作品，可以按 ¥220 申请临时位") ] };
    if (s.day === 2 && s.seed % 2 === 0) return { title: "一场提早知道的雨", text: "书展群里通知，周日可能改到室内，桌子会变少。能出示完整印本的人，可以在周六先确认位置。", choices: [option(s, "note", "把印本的准备时间写进日历", "记录提醒；印本仍需周五自行准备"), option(s, "pass", "暂不作决定", "雨和名额照常变化，明天再安排") ] };
    if (s.day === 2) return { title: "‘顺手再加一个’", text: s.active ? "客户在群里发来一句：能不能顺手再加一个版本？你看着已经写清的范围，第一次需要实际使用那条边界。" : "有人邀请你无偿画一张‘只要几分钟’的图。这个晚上，你第一次需要把自己的时间说清楚。", choices: [option(s, "boundary", "按新增范围重新报价", "需要沟通议价 2；守住约定，后续加需求时更有依据", 0, 0, s.skills.negotiate < 2 ? "沟通议价需要达到 2；也可以先要求对方写清需求" : ""), option(s, "clarify", "先请对方把新增需求写清", "记录范围，不先承诺免费修改"), option(s, "overtime", "今晚多做一版", "精力 −18，负荷 +22；进行中的方案质量 +1", 0, 18)] };
    if (s.day === 3) return { title: "还有半页没有做完", text: "入夜后，你又看了一眼桌上的东西。再做一点，确实可能快一点；把灯关掉，明天也许能看得更清楚。", choices: [option(s, "sleep", "今天到这里，留给明天", "精力 +12，负荷 −10"), option(s, "overtime", "再改一轮进行中的方案", "精力 −18，负荷 +22；进行中的方案质量 +1", 0, 18, !s.active ? "现在没有进行中的委托" : "") ] };
    if (s.day === 4) {
      const ready = !projectGate({ ...s, active: null, slot: 0 }, "wayfinding");
      return { title: ready ? "你的作品被继续往下看了" : "同一个通知，暂时不同的门槛", text: ready ? "独立展览团队看过你的交付案例，发来导视提案的邀请。报酬更高，也要留出三个时段。书展和小册仍在另一页日历上。" : "你看到一份导视提案的征集：设计表达达到 3，并完成一次委托。要求写得清楚，你也能看见自己还差哪一步。", choices: [option(s, "client", "这几天，把委托排在前面", "记录你的优先事项；仍需自行接单和交付"), option(s, "personal", "保留自己的作品时间", "记录你的优先事项；书展仍需准备完成"), option(s, "pass", "先不替这周定一个答案", "继续按每天的实际状况安排") ] };
    }
    if (s.day === 5) {
      const work = s.works.find(w => w.id === "zine");
      return { title: "从屏幕走到纸上", text: work ? `你把《${work.title}》重新翻了一遍。质量 ${work.quality}，送审要求 5。印一批样本要 ¥120；只在屏幕上发表也可以，但不能拿数字稿替代书展要求的印本。` : "印刷店最后一轮样张明天取。你还没有完成自己的小册，也可以把这个晚上用于整理实际交付过的案例。", choices: [option(s, "print", "做一批书展印本", "余额 −¥120；需要小册质量达到 5", 120, 0, !work || work.quality < 5 ? "还需要完成一本质量达到 5 的个人小册" : ""), option(s, "digital", "先以数字版发表", "不花印刷费；保留发表记录，不取得现场书展席位", 0, 0, !work ? "还没有完成个人小册" : ""), option(s, "file", "整理这周已经完成的东西", "保留已交付案例与学习笔记，不额外花钱") ] };
    }
    if (s.day === 6) return { title: "日历只剩两个空格", text: "书展的出席名单今晚确认。布展、摆摊和撤场会用掉周日全天；导视提案的现场验收也在同一天。手头的委托不会自动延期，你需要决定把明天交给哪件事。", choices: [option(s, "fair", "确认周日全天赴书展", `${s.flags.reserved ? "已提前留位" : "临时位 ¥220"}；用掉明天两个时段，无法再交付导视提案`, s.flags.reserved ? 0 : 220, 0, !s.flags.printed ? "需要已经准备好的书展印本" : ""), option(s, "free", "把明天留给未完成的安排", "不出席书展；已付留位费不退，可以继续委托、休息或见人") ] };
    return { title: "房租到期的这个晚上", text: `这周最后一天，你的余额是 ¥${s.cash}。今晚还有 ¥60 日常开支。独立工作室续租 ¥1800，共享工位 ¥1000；也可以先把工作桌带回住处。你不必用租下一间房证明自己值得被爱。`, choices: [option(s, "stay", "续租现在的工作室", "房租 ¥1800，另留 ¥60 日常开支", 1800, 0, s.cash < 1860 ? "余额尚不足以同时覆盖续租和今晚日常开支" : ""), option(s, "share", "换到共享工位", "工位 ¥1000，另留 ¥60 日常开支；减少下一阶段固定支出", 1000, 0, s.cash < 1060 ? "余额尚不足以同时覆盖工位和今晚日常开支" : ""), option(s, "home", "先不续租，把工作桌带回住处", "不付空间租金；作品、能力和已经建立的联系都会留下") ] };
  }
  function decide(state, id) {
    if (state.phase !== "evening") throw Error("还没到晚间决定。");
    const event = evening(state), o = event.choices.find(x => x.id === id);
    if (!o || o.blocked) throw Error(o?.blocked || "这个回应不可用。");
    const s = clone(state); s.cash -= o.cash; s.energy = clamp(s.energy - o.energy);
    let line = "你把这件事记下来，让明天仍然由实际的时间和准备程度决定。";
    if (s.day === 1) { s.flags.reserved = id === "reserve"; line = id === "reserve" ? "你付了留位费。现在日历上有了一张桌子，但桌上摆什么，仍需要你接下来亲手完成。" : "你保留了这笔钱。这个决定让眼下宽裕一些，也意味着晚些申请时可能要付更高的费用。"; }
    if (s.day === 2) { s.flags.rainNotice = s.seed % 2 === 0; if (id === "boundary" || id === "clarify") { s.flags.boundary = true; line = "你让新增的要求先变成可以讨论的文字，再决定是否接受。没有人替你按下发送。"; } }
    if (id === "overtime") { s.strain = clamp(s.strain + 22); if (s.active) s.active.quality++; line = "方案又往前走了一点。你也真实地少睡了一段时间，明天能用的精力不会由一句‘坚持’补回来。"; }
    if (s.day === 3 && id === "sleep") { s.energy = clamp(s.energy + 12); s.strain = clamp(s.strain - 10); line = "你没有拿这个晚上继续填满交付清单。灯关掉以后，桌上的问题留在了明天，而你也留下一点解决它的力气。"; }
    if (s.day === 4) { s.flags.priority = id; line = id === "client" ? "你在日历上给交付留了位置。新的报酬要靠真实的接单和完成获得，不会因为写下愿望就到账。" : id === "personal" ? "你给那本还没卖出的作品留了时间。它会挤掉别的安排，也可能长成另一种可以继续走的路。" : "你没有急着把自己固定成某一种人。明天出现的机会，仍会检查你已经做过的事。"; }
    if (s.day === 5) { s.flags.printed = id === "print"; s.flags.digital = id === "digital"; line = id === "print" ? "纸从打印机里慢慢吐出来。你为它付了钱，也终于能把自己的名字捧在手里。周六确认席位时，这批印本会派上用场。" : id === "digital" ? "你把数字版认真发表，没有把它假装成已经印好的书。它是作品的一次抵达，另一张桌子可以留到以后。" : "你把完成过的东西和没来得及完成的东西分开放好。它们都不是一个人的全部，但会影响下一次机会从哪里开始。"; }
    if (s.day === 6) { s.flags.fair = id === "fair"; line = id === "fair" ? "你确认出席。周日完整的一天已经留给书展；如果手头还有要验收的导视提案，那笔稿费将无法取得。" : "你没有把周日答应给书展。这一天可以用来交付、休息，或见一个自己想见的人。"; }
    if (s.day === 7) { s.flags.housing = id; line = id === "stay" ? "你把房租付清。没有庆祝的配乐，只是下一张工作桌仍然有了放下稿纸的位置。" : id === "share" ? "你付了共享工位的费用。空间小了一些，固定开支也少了一些；你把省下来的余地留给下一阶段。" : "你没有续租。收拾桌子时，你发现能带走的远比以为的多：学会的方法、已经交付的作品，还有愿意认真看你作品的人。"; }
    record(s, event.title, line, "evening", o.label);
    return feedback(s, event.title, [line], "next-day", "heroine-blacknight");
  }
  function dayEnd(s) {
    const recovery = s.strain >= 55 ? 10 : 18, previousEnergy = s.energy;
    s.cash -= 60; s.energy = clamp(s.energy + recovery); s.strain = clamp(s.strain - 8);
    record(s, "今天收起来了", `日常开支 ¥60；夜间恢复 ${s.energy - previousEnergy} 精力。`, "daily", recovery === 10 ? "白天负荷达到 55，睡一晚只能恢复 10 精力" : "正常休息最多恢复 18 精力");
    if (s.active && jobs[s.active.id].deadline <= s.day) {
      record(s, "这笔委托到了截止时间", `${jobs[s.active.id].client}改请了其他人。你保留草稿，没有取得尚未交付的稿费。`, "deadline", "有限的时段被安排给了其他事情"); s.active = null;
    }
    if (s.day === 7) { s.phase = "end"; s.ending = ending(s); return s; }
    s.day++; s.slot = 0; s.phase = "plan";
    if (s.flags.invoiceAsked && !s.flags.invoicePaid && s.day >= s.flags.invoiceDue) { s.cash += 900; s.flags.invoicePaid = true; record(s, "旧尾款到账", "约定日期到了，¥900 进入余额。", "income", "此前用交付记录争取了明确的日期"); }
    if (s.day === 7 && s.flags.fair) {
      s.slot = 2; s.energy = clamp(s.energy - 24); s.flags.fairDone = true;
      record(s, "在书展摆下自己的名字", "有人翻完小册，问还有没有下一期。你没有因此立刻成名，却第一次以作者的身份留下了联系方式。布展、摆摊和撤场用掉了一整天。", "milestone", "此前完成了小册、准备印本，并确认了出席时间");
      return feedback(s, "这张桌子真的有了你的名字", ["你把印本摆上桌。有人停下来，认真问起画里那家修伞铺。你第一次不用借客户的项目名称介绍自己。", "个人作品、印本和出席准备一起换来了这次机会。全天用在书展上，其他委托没有因此自动完成。"], "evening", "heroine-straight");
    }
    return s;
  }
  function next(state) {
    if (state.phase !== "feedback" || !state.feedback) throw Error("现在没有待继续的片段。");
    const s = clone(state), f = s.feedback;
    if (f.index < f.lines.length - 1) { f.index++; return s; }
    const target = f.next; s.feedback = null;
    if (target === "next-day") return dayEnd(s);
    s.phase = target; return s;
  }
  function ending(s) {
    let id = "steady", title = "可以继续过下去的日常", text = "这一周没有一个足以概括你的人生的答案。你看清了账单、时间和自己愿意留下的东西，下一周可以从这些真实的积累继续。";
    if (s.flags.fairDone) { id = "author"; title = "先把自己的名字写上去"; text = "书展结束以后，你没有突然变得富有。有人认真翻过你的小册，留下了下一期的询问。你开始知道，自己的作品也能成为一种走向世界的方法。"; }
    else if (s.flags["passed-wayfinding"]) { id = "studio"; title = "下一次合作，先问你的档期"; text = "展览团队问你下一阶段是否还有档期。你没有立刻答应，先打开自己的日历。收入和被看见都来自这周完成过的交付，下一次选择也仍然由你作出。"; }
    else if (s.flags.housing === "home") { id = "restart"; title = "换一张桌子，也能继续"; text = "你把工作桌带回住处，暂时放下独立工作室的租金。那本小册、学会的版式和曾经交付过的文件都跟着你回来。暂停一项开支，不会替这些积累划上句号。"; }
    if (s.strain >= 55) { text += " 这周留下的负荷也需要处理。你在下一页日历上，先留出了一段不接工作的时间。"; }
    if (s.flags.digital) text += " 数字版的发表记录也留在了作品页上；它还没有带来现场展出的机会。";
    const reasons = s.journal.filter(r => ["milestone", "deadline", "invoice", "income", "learn", "project", "personal", "contacts"].includes(r.kind)).map(r => ({ day: r.day, title: r.title, cause: r.cause }));
    return { id, title, text, reasons, cash: s.cash, housing: s.flags.housing };
  }
  function valid(s) {
    return !!s && s.version === 1 && typeof s.name === "string" && !!s.name.trim() && s.name.length <= 12 && own(origins, s.origin) &&
      Number.isInteger(s.seed) && s.seed >= 0 && s.seed <= 4294967295 && Number.isInteger(s.day) && s.day >= 1 && s.day <= 7 && Number.isInteger(s.slot) && s.slot >= 0 && s.slot <= 2 &&
      ["plan", "feedback", "evening", "end"].includes(s.phase) && (s.phase !== "plan" || s.slot < 2) && (s.phase !== "evening" || s.slot === 2) && (s.phase !== "end" || s.day === 7) && Number.isInteger(s.cash) && s.cash >= -10000 && s.cash <= 100000 &&
      [s.energy, s.strain].every(n => Number.isFinite(n) && n >= 0 && n <= 100) && Object.keys(skills).every(k => Number.isInteger(s.skills?.[k]) && s.skills[k] >= 0 && s.skills[k] <= 8) &&
      Object.keys(contacts).every(k => Number.isInteger(s.contacts?.[k]) && s.contacts[k] >= 0 && s.contacts[k] <= 14) &&
      [0, 1, 2].includes(s.personal) && Array.isArray(s.completed) && s.completed.length <= 3 && new Set(s.completed).size === s.completed.length && s.completed.every(id => own(jobs, id)) &&
      Array.isArray(s.works) && s.works.length <= 4 && new Set(s.works.map(w => w?.id)).size === s.works.length && s.works.every(w => w && typeof w.title === "string" && w.title.length < 100 && ["personal", "client"].includes(w.kind) && (own(jobs, w.id) || w.id === "zine") && Number.isInteger(w.quality) && w.quality >= 0 && w.quality <= 16) &&
      (!s.active || own(jobs, s.active.id) && [1, 2].includes(s.active.stage) && Number.isFinite(s.active.quality) && s.active.quality >= 0 && s.active.quality <= 12) &&
      !!s.flags && typeof s.flags === "object" && !Array.isArray(s.flags) && Object.entries(s.flags).every(([k, v]) => k === "invoiceDue" ? Number.isInteger(v) && v >= 2 && v <= 9 : k === "housing" ? ["stay", "share", "home"].includes(v) : k === "priority" ? ["client", "personal", "pass"].includes(v) : ["invoiceAsked", "invoicePaid", "reserved", "rainNotice", "boundary", "printed", "digital", "fair", "fairDone", ...Object.keys(jobs).map(id => "passed-" + id)].includes(k) && typeof v === "boolean") &&
      Array.isArray(s.journal) && s.journal.length <= 80 && s.journal.every(r => r && Number.isInteger(r.day) && r.day >= 1 && r.day <= 7 && Number.isInteger(r.slot) && r.slot >= 0 && r.slot <= 2 && [r.title, r.text, r.kind, r.cause].every(x => typeof x === "string" && x.length <= 2000)) &&
      (s.phase !== "feedback" || !!s.feedback && typeof s.feedback.title === "string" && Array.isArray(s.feedback.lines) && s.feedback.lines.length > 0 && s.feedback.lines.length < 30 && s.feedback.lines.every(x => typeof x === "string" && Array.from(x).length <= 64) && Number.isInteger(s.feedback.index) && s.feedback.index >= 0 && s.feedback.index < s.feedback.lines.length && ["plan", "evening", "next-day"].includes(s.feedback.next) && ["heroine-straight", "heroine-blacknight", "gu-glasses", "zhou-parted", "lu-swept", "wen-sidepart"].includes(s.feedback.art) && typeof s.feedback.speaker === "string") &&
      (s.phase !== "end" || !!s.ending && ["steady", "author", "studio", "restart"].includes(s.ending.id) && typeof s.ending.title === "string" && typeof s.ending.text === "string" && Array.isArray(s.ending.reasons) && s.ending.reasons.length <= 80 && s.ending.reasons.every(r => r && Number.isInteger(r.day) && r.day >= 1 && r.day <= 7 && typeof r.title === "string" && typeof r.cause === "string"));
  }
  return { days, skills, origins, jobs, contacts, create, groups, options, act, evening, decide, next, ending, valid, shortLines };
})();
