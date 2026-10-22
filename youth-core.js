"use strict";
window.HEART_YOUTH = (() => {
  const D = window.HEART_YOUTH_DATA;
  if (!D || !Array.isArray(D.rounds) || D.rounds.length !== 24) throw Error("高中故事资料尚未载入。");
  const SK = ["study", "express", "logic", "craft"], DK = ["design", "science", "humanities", "media"], PK = ["zhou", "cheng", "xu", "lin", "tang"];
  const SC = ["classroom", "corridor", "noticeboard", "clubroom", "broadcast", "schoolyard", "school-gate", "dormitory"];
  const GROUPS = ["event", "game", "study", "explore", "project", "social", "hobby", "rest"];
  const related = { design: ["craft", "express"], science: ["logic", "study"], humanities: ["express", "study"], media: ["express", "craft"] };
  const projectNames = { design: "实验高中的角落说明书", science: "纸桥承重实验记录", humanities: "校园里没写进校史的故事", media: "星期五声音小刊" };
  const projectLines = {
    design: ["你蹲在公告栏前记下大家找不到的信息。程屿路过时问你在看什么，你说：‘先看看大家究竟在哪里迷路。’", "第一版说明牌被同学拿倒了。你忍住解释的冲动，记下他最先看见的字，把箭头和标题重新排了一次。", "你把现场照片、试版和修改理由装订成小册。封面不够惊艳，但有人照着它找到了社团教室，这让你比想象中高兴。"],
    science: ["你用相同的纸做了三种折法，把硬币一枚枚放上去。纸桥突然塌下时，你先扶住桌边的水杯，再去捡散开的硬币。", "第二次测试，你只改变折痕宽度。数字还是不漂亮，不过这一次你能说清自己改了什么，也知道下一次该核对哪里。", "你给记录画了表格，连那次忘记清零的重量都留下。实验册最后一行写着：目前解释到这里，还有一个问题没想通。"],
    humanities: ["你先问了对方愿不愿意被记录。保洁阿姨指着旧合照笑，说校门口以前的树比照片里还矮。你把日期旁边留了一个问号。", "两位受访者记得的年份不同。你又走了一趟档案室，把能核实的和只是回忆的内容分开，没有替任何人编一个整齐的答案。", "你把采访整理成册，寄出校对稿后等了几天才印。某一句被删掉了，某一句保留下来，故事也因此比最初更接近它自己。"],
    media: ["你给星期五的歌单写了一段开场。读到第二句自己先笑了：像颁奖礼。你划掉那句话，重新写下今天为什么想听这首歌。", "试听时，纸张摩擦声盖住了结尾。你重录了三遍，最后保留了有一点停顿的那版。沈棠说：‘这回终于像你在讲话了。’", "你把声音链接、文字和图片出处一起排好。小刊翻到最后是你的署名，也有协作者的名字。你打印两份，一份送出，一份自己留下。"]
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const own = (value, key) => typeof key === "string" && Object.prototype.hasOwnProperty.call(value, key);
  const obj = value => value && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
  const keys = (value, names) => obj(value) && Object.keys(value).length === names.length && names.every(k => own(value, k));
  const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  const string = (s, max = 2000) => typeof s === "string" && s.length <= max;
  const clamp = (n, max) => Math.max(0, Math.min(max, n));
  const personName = id => id === "heroine" ? "你" : D.people[id]?.name || "你";
  const directionName = id => D.directions[id].name;
  const skillName = id => D.skills[id].name;
  const term = s => D.rounds[s.round].term;
  const latest = (s, id) => s.works.filter(work => work.direction === id).at(-1);
  const quality = (s, id) => related[id].reduce((sum, key) => sum + s.skills[key], 0);
  function screens(lines) {
    const result = [];
    for (const source of lines || []) {
      const pieces = String(source).match(/[^。！？；]+[。！？；]*|[。！？；]+/g) || [String(source)];
      let line = "";
      for (const piece of pieces) {
        const chars = Array.from(piece);
        if (Array.from(line).length + chars.length <= 64) { line += piece; continue; }
        if (line) result.push(line);
        line = "";
        while (chars.length > 64) result.push(chars.splice(0, 64).join(""));
        line = chars.join("");
      }
      if (line) result.push(line);
    }
    return result.length ? result : ["你把这一小段时间留给自己。"];
  }
  function create(name = "夏宁", seed = 1) {
    return { version: 2, name: String(name).trim().slice(0, 12) || "夏宁", seed: Number(seed) >>> 0, round: 0, phase: "opening", page: 0,
      energy: 10, actions: 0, stress: 12, cash: 20,
      skills: Object.fromEntries(SK.map(k => [k, 1])), interests: Object.fromEntries(DK.map(k => [k, 0])), bonds: Object.fromEntries(PK.map(k => [k, 0])),
      projects: Object.fromEntries(DK.map(k => [k, null])), visits: Object.fromEntries(PK.map(k => [k, [0, 0, 0, 0, 0, 0]])),
      works: [], flags: {}, completedGames: {}, doneEvents: [], roundActions: [], journal: [], feedback: null, game: null,
      reflectionStep: 0, chosenDirection: null, chosenFriend: null, zhouChoice: null, ending: null };
  }
  function record(s, title, lines, kind, id = "") {
    s.journal.push({ round: s.round, title, lines: screens(lines), kind, id });
  }
  function effects(s, e = {}) {
    for (const key of SK) if (Number.isInteger(e.skills?.[key])) s.skills[key] = clamp(s.skills[key] + e.skills[key], 30);
    for (const key of DK) if (Number.isInteger(e.interests?.[key])) s.interests[key] = clamp(s.interests[key] + e.interests[key], 30);
    for (const key of PK) if (Number.isInteger(e.bonds?.[key])) s.bonds[key] = clamp(s.bonds[key] + e.bonds[key], 100);
    if (Number.isInteger(e.cash)) s.cash = clamp(s.cash + e.cash, 20000);
    if (Number.isInteger(e.stress)) s.stress = clamp(s.stress + e.stress, 100);
  }
  function delta(before, s) {
    const result = [];
    for (const k of SK) if (before.skills[k] !== s.skills[k]) result.push(`${skillName(k)} ${s.skills[k] - before.skills[k] > 0 ? "+" : ""}${s.skills[k] - before.skills[k]}`);
    for (const k of DK) if (before.interests[k] !== s.interests[k]) result.push(`${directionName(k)}探索 ${s.interests[k] - before.interests[k] > 0 ? "+" : ""}${s.interests[k] - before.interests[k]}`);
    if (before.cash !== s.cash) result.push(`零用钱 ${s.cash - before.cash > 0 ? "+" : ""}¥${s.cash - before.cash}`);
    if (before.stress !== s.stress) result.push(`压力 ${s.stress - before.stress > 0 ? "+" : ""}${s.stress - before.stress}`);
    return result.length ? result.join("；") + "。" : "这段经历已经留在手账里。";
  }
  function feedback(s, title, lines, next = "plan", sceneId = "classroom", personId = "heroine") {
    s.phase = "feedback"; s.page = 0;
    s.feedback = { title, lines: screens(lines), next, sceneId, personId };
    return s;
  }
  function recall(s, source) {
    return source.recall?.find(item => s.flags[item.flag])?.lines || source.lines || [];
  }
  function reviews(s) {
    const lines = s.roundActions.length ? [`你翻到手账这一页，记下了${s.roundActions.length}件确实做过的事：${s.roundActions.map(a => a.label).join("、")}。`] : ["你没有把课余时间排满。这一回合，日常的课程仍然照常进行，空白也真实留在这一页。"];
    if (!s.doneEvents.includes(D.rounds[s.round].event.id)) lines.push("那件推荐的校园小事，你这次没有参与。别人的一天还会继续，你的安排也不会因此被取消。");
    if (s.stress >= 70) lines.push("最近的压力有些高，同样的练习比较难集中。下一回合可以留一段时间休息；每项行动仍然只花3点精力。");
    lines.push(s.round === 23 ? "课表终于翻到最后。离开学校以前，你想先看看自己这些年真正留下了什么。" : "你合上本子。下一回合精力重新回到10点，余下的精力不会累加，新的零用钱也会按约定到账。");
    return screens(lines);
  }
  function scene(s) {
    const r = D.rounds[s.round];
    let title = r.title, lines = [], sceneId = r.sceneId, personId = "heroine";
    if (s.phase === "opening") { lines = screens(r.opening); if (s.round === 0) sceneId = "dormitory"; }
    else if (s.phase === "plan") { title = "这一回合，时间由你安排"; lines = [`本回合精力${s.energy}/10；每项行动固定花3点，最多安排三件事，也可以提前结束。`]; }
    else if (s.phase === "event") { title = r.event.title; lines = screens(r.event.lines); sceneId = r.event.sceneId; personId = r.event.personId; }
    else if (s.phase === "game") { const g = D.games[s.game.id]; title = g.title; lines = screens([g.prompt]); sceneId = g.sceneId; personId = g.personId; }
    else if (s.phase === "feedback") { ({ title, lines, sceneId, personId } = s.feedback); }
    else if (s.phase === "review") { title = "这一回合留下的事"; lines = reviews(s); }
    else if (s.phase === "reflect") {
      title = ["我还想继续学什么", "想继续来往的人", "周予白，要怎样放在记忆里"][s.reflectionStep];
      lines = [["先看看做过的作品和真正试过的方向。你可以选择想深入了解的专业，也可以继续探索。"], ["朋友和同学都不只是一串熟悉度。你想认真继续哪一段关系？也可以不把任何人排第一。"], ["忽冷忽热不能替他说明心意。你可以保留自己的喜欢、做普通朋友，也可以不再猜。"]][s.reflectionStep];
      sceneId = "schoolyard";
    } else if (s.phase === "graduate") { title = "下一页，想从哪里开始"; lines = ["你把三年的经历收好，决定下一段路要怎么走。高考和香港留学计划，都不要求选择任何男生。"]; sceneId = "school-gate"; }
    else if (s.phase === "ending") { const e = D.graduation[s.ending]; title = e.title; lines = screens(e.lines); sceneId = "school-gate"; }
    else if (s.phase === "complete") return null;
    else return null;
    const page = Math.min(s.page, lines.length - 1);
    return { title, speaker: personName(personId), text: lines[page], sceneId, personId, page, total: lines.length };
  }
  function advance(state) {
    const current = scene(state);
    if (!current || !["opening", "event", "feedback", "review", "ending"].includes(state.phase)) throw Error("请先完成当前选择。");
    const s = clone(state);
    if (s.page + 1 < current.total) { s.page++; return s; }
    if (s.phase === "event") return s;
    s.page = 0;
    if (s.phase === "opening") s.phase = "plan";
    else if (s.phase === "feedback") { s.phase = s.feedback.next; s.feedback = null; }
    else if (s.phase === "ending") s.phase = "complete";
    else if (s.round === 23) s.phase = "reflect";
    else {
      s.round++; s.phase = "opening"; s.energy = 10; s.actions = 0; s.roundActions = [];
      effects(s, { cash: s.round % 4 === 0 ? 90 : 30, stress: -6 });
      if (s.round % 4 === 0) effects(s, { skills: { study: 1 } });
    }
    return s;
  }
  function groups(s) {
    if (s.phase !== "plan") return [];
    const r = D.rounds[s.round];
    return [
      ...(!s.doneEvents.includes(r.event.id) ? [{ id: "event", label: r.event.title, note: "本回合的校园事件 · 固定3精力；回应不再扣精力" }] : []),
      ...(r.gameId && !s.completedGames[r.gameId] ? [{ id: "game", label: D.games[r.gameId].title, note: "课余小互动 · 固定3精力；可以略过，无额外扣费" }] : []),
      { id: "study", label: "学习与方法", note: "把不会的地方弄懂，压力高时练习效率会降低" },
      { id: "explore", label: "试一种新方向", note: "了解设计、工程、人文或传播，留下具体经历" },
      { id: "project", label: "做自己的作品", note: "三个步骤才能完成；学会新方法后还能修订和展示" },
      { id: "social", label: "找同学待一会儿", note: "五位同学都有六学期的后续交集，可自由选择" },
      { id: "hobby", label: "留给爱好的时间", note: "听歌、追星手账、唱片或现场，按自己的预算安排" },
      { id: "rest", label: "休息与独处", note: "同样消耗3精力，只减轻压力，不恢复本回合精力" }
    ];
  }
  function option(s, group, id, label, note, cash = 0, blocked = "") {
    const used = s.roundActions.some(a => a.group === group && a.id === id);
    return { id, label, note, cash, energy: 3, blocked: blocked || (used ? "这一回合已经做过这件事" : s.actions >= 3 || s.energy < 3 ? "本回合精力不足，请结束回合" : s.cash < cash ? `还需要¥${cash - s.cash}零用钱` : "") };
  }
  function options(s, group) {
    if (!groups(s).some(g => g.id === group)) return [];
    const o = (id, label, note, cash = 0, blocked = "") => option(s, group, id, label, note, cash, blocked);
    const r = D.rounds[s.round];
    if (group === "event") return [o(r.event.id, r.event.title, r.event.note || "参与这件校园小事，怎样回应由你决定")];
    if (group === "game") return [o(r.gameId, D.games[r.gameId].title, D.games[r.gameId].type === "quiz" ? "准备后开始10秒答题，可暂停或略过" : D.games[r.gameId].type === "puzzle" ? "三乘三滑块，无时间限制，可略过" : "依次点选卡片，无时间限制，可略过")];
    if (group === "study") return SK.map(id => o(id, `练习${skillName(id)}`, `对应能力+${s.stress >= 70 ? 1 : 2}，压力+5；能力影响作品质量`, 0, s.skills[id] >= 30 ? "已熟悉这种方法，可以试着把它用在作品里" : ""));
    if (group === "explore") return DK.map(id => o(id, `试一试${directionName(id)}`, `${D.directions[id].description} · ¥10 · 探索+2`, 10, s.interests[id] >= 30 ? "这个方向已有很多经历，可以整理作品或换个方向" : ""));
    if (group === "social") return PK.map(id => o(id, `和${personName(id)}待一会儿`, D.people[id].visits[term(s)].title));
    if (group === "rest") return [o("quiet", "给自己一段安静的时间", "压力−18；消耗3精力，不恢复精力")];
    if (group === "hobby") return [
      o("listen", "听完一张喜欢的歌单", "免费 · 压力−10；爱好不需要变成成绩"),
      o("scrapbook", "做一页沿岸电台的追星手账", "¥15 · 动手、表达各+1 · 传播探索+1", 15),
      o("album", "买想了很久的唱片", "¥45 · 压力−12，记下收藏的快乐", 45),
      o("show", "和沈棠去看周末现场", "¥160 · 压力−16，需要留好自己的预算", 160, s.round < 4 ? "高一下开始可以安排周末现场" : "")
    ];
    if (group === "project") return DK.flatMap(id => {
      const p = s.projects[id], w = latest(s, id), step = p?.step || 0;
      const result = [o(`${id}:${step + 1}`, `${["开始收集", "制作试版", "整理完成"][step]}《${projectNames[id]}》`, `第${step + 1}/3步 · ¥10${step === 2 ? ` · 当前能力对应质量${quality(s, id)}` : ""}`, 10)];
      if (w && !p) result.push(o(`${id}:revise`, `修订《${w.title}》`, `¥5 · 质量${w.quality}→${Math.max(w.quality, quality(s, id))}；需要后来学会的方法`, 5, quality(s, id) <= w.quality ? "先练习相关能力，修订才会带来真实改进" : ""));
      if (w && !w.presented) result.push(o(`${id}:present`, `展示《${w.title}》`, "需要完整作品质量≥12、方向探索≥4；不等于获奖或录取", 0, w.quality < 12 || s.interests[id] < 4 ? "先练习相关能力、修订作品并积累方向探索" : ""));
      return result;
    });
    return [];
  }
  function act(state, group, id) {
    if (state.phase !== "plan") throw Error("当前不是安排课余时间的时候。");
    const o = options(state, group).find(x => x.id === id);
    if (!o || o.blocked) throw Error(o?.blocked || "这项行动不存在。");
    const s = clone(state); s.energy -= 3; s.actions++; s.cash -= o.cash; s.page = 0;
    s.roundActions.push({ group, id, label: o.label });
    if (group === "event") { s.phase = "event"; return s; }
    if (group === "game") { const g = D.games[id]; s.phase = "game"; s.game = { id, type: g.type, moves: 0, ...(g.type === "puzzle" ? { board: scramble(s.seed + s.round * 17) } : {}) }; return s; }
    let lines = [], personId = "heroine", sceneId = D.rounds[s.round].sceneId;
    if (group === "study") {
      effects(s, { skills: { [id]: state.stress >= 70 ? 1 : 2 }, stress: 5 });
      lines = ["你没有整页重抄，而是给真正卡住的那一步画了圈。换一种方法再试时，问题终于小了一点。", state.stress >= 70 ? "注意力老是飘走，你今天少练了一些。你把停下的位置标好，没有用熬夜把这一页硬填满。" : "你把解题或表达的方法写成一句自己的话。下次不必重新猜，也可以试着用在作品里。"];
    } else if (group === "explore") {
      const task = { design: "你请两位同学试读同一张海报。最漂亮的那版竟然没人找到日期，你笑着把那一栏放大了。", science: "你比较两种纸翼的飞行距离，先保持重量相同。窗边来了一阵风，今天的异常结果也有了一个值得核对的线索。", humanities: "你带着三个问题去听一次校园口述访谈。听到意料之外的回答时，你放下原先准备的漂亮结尾，重新问了一句。", media: "你试着把一段长通知改成一分钟声音稿。读到半分钟才发现还没说地点，于是从头重新排了一次顺序。" };
      effects(s, { interests: { [id]: 2 }, skills: { [related[id][(s.seed + s.round) % 2]]: 1 } });
      s.flags[`explored_${id}`] = true;
      lines = [task[id], `你在${directionName(id)}那页写下：喜欢的是哪一部分，不喜欢的又是哪一部分。专业不再只有名字，今天多了一次亲手试过的经历。`];
    } else if (group === "project") {
      const [d, action] = id.split(":"), w = latest(s, d);
      sceneId = d === "media" ? "broadcast" : "clubroom";
      if (["1", "2", "3"].includes(action)) {
        const step = Number(action) - 1; lines = [projectLines[d][step]]; effects(s, { interests: { [d]: 1 }, stress: 3 });
        if (step < 2) s.projects[d] = { step: step + 1 };
        else { const q = quality(s, d), count = s.works.filter(x => x.direction === d).length + 1; s.works.push({ id: `${d}-${count}`, title: projectNames[d], direction: d, quality: q, presented: false, revisions: 0, round: s.round }); s.projects[d] = null; lines.push(`你写下完成日期。作品质量${q}，来自${related[d].map(skillName).join("和")}的实际积累，以后学会新方法还能回来修订。`); }
      } else if (action === "revise") { const old = w.quality; w.quality = quality(s, d); w.revisions++; lines = ["你翻出旧稿，把后来学会的办法真正用了一遍。原来以前那个绕不过去的地方，现在可以改得更清楚。", `修订把质量从${old}提高到${w.quality}。旧版也留着，方便看见哪里是自己一点点改过来的。`]; }
      else if (action === "present") { w.presented = true; effects(s, { skills: { express: 1 }, stress: -4 }); s.flags[`presented_${d}`] = true; lines = ["你把作品摆上社团的开放桌。第一位同学问的问题和你预想的不一样，你停了一下，拿出测试记录解释。", "最后没等来一个夸张的大奖，只收到几张认真写过的建议纸条。你把它们收好，这是一段以后真的能讲出来的经历。"]; }
    } else if (group === "social") {
      const visit = D.people[id].visits[term(s)], count = s.visits[id][term(s)];
      personId = id; sceneId = id === "xu" ? "broadcast" : id === "cheng" ? "schoolyard" : "corridor";
      lines = count === 0 ? recall(state, visit) : repeatVisit(state, id, count);
      s.visits[id][term(s)]++; effects(s, { bonds: { [id]: 1 }, stress: id === "zhou" ? -2 : -7 });
      if (visit.flag) s.flags[visit.flag] = true;
      s.flags[`met_${id}_${term(s)}`] = true;
    } else if (group === "rest") {
      effects(s, { stress: -18 }); lines = ["你把桌上没做完的东西归到一边。树影在走廊慢慢移过去，你没有顺手再给自己添一件任务。", "这段休息花去3点精力，压力轻了一些。本回合的精力不会恢复，剩下的安排可以慢一点再决定。"];
      sceneId = "schoolyard";
    } else if (group === "hobby") {
      s.flags.hobbySessions = (s.flags.hobbySessions || 0) + 1;
      s.flags[`hobby_${id}`] = (s.flags[`hobby_${id}`] || 0) + 1;
      if (id === "listen") { effects(s, { stress: -10 }); lines = ["你从头听完沿岸电台的一张免费歌单。最喜欢的那首没上热门，你还是在自己的歌单里把它放在第一位。", "耳机摘下时，作业没有自动变少。不过这段喜欢也不必替作业负责，今天它只是让你开心了一会儿。"]; }
      if (id === "scrapbook") { effects(s, { skills: { craft: 1, express: 1 }, interests: { media: 1 }, stress: -5 }); lines = ["你给喜欢的舞台做了一页手账，记好素材出处。那句只有自己听懂的歌词感想，最后还是写在了角落。", state.flags.hobby_listen ? "之前歌单里最喜欢的那首，终于有了属于它的一页。沈棠看见后说：‘这个颜色，我一看就知道是那段前奏。’" : "不需要有人点赞才算完成。你合上手账前，又看了一眼自己最喜欢的那一块配色。"]; }
      if (id === "album") { effects(s, { stress: -12 }); lines = ["你算过接下来两周的预算，才买下那张唱片。包装拆开时的声音很好听，你把小票和歌词页放在一起。", "这笔钱去了哪里，账本里写得明白。喜欢不等于必须买更多，今天这一张已经足够让你反复听很久。"]; }
      if (id === "show") { effects(s, { stress: -16, bonds: { tang: 1 } }); personId = "tang"; sceneId = "school-gate"; lines = ["开场前沈棠把票根折进透明袋，说千万别弄丢。副歌唱起来时，你们对视一眼，把路上背过的那句一起唱了出来。", state.flags.hobby_album ? "唱片里听过很多遍的停顿，到了现场还是让你愣了一下。回去的路上，你们认真争论究竟哪一版更好听。" : "现场没有突然替你选好专业，它只是留下了一个很亮的晚上。你把票根收好，周一仍然有自己的课要上。"]; }
    }
    record(s, o.label, [...lines, delta(state, s)], group, id);
    return feedback(s, o.label, [...lines, delta(state, s)], "plan", sceneId, personId);
  }
  function repeatVisit(s, id, count) {
    const warm = (s.seed + s.round + s.bonds.zhou) % 3 !== 0;
    if (id === "zhou") return warm ? ["他今天把收书的动作放慢了一点。你说起课上的小事，他听到一半问：‘后来呢？’", "到楼梯口，他又被别人叫走。你没有替这几分钟添上一个确定的意思，也没有把剩下的安排一直留空。"] : ["周予白回了简短的一句，便低头整理东西。你分不清是他没听懂，还是今天根本不想继续这个话题。", "你说自己还有安排，先走了。走廊的窗开着，接下来要去哪里，仍然由你决定。"];
    const repeats = {
      cheng: ["程屿把上次那组照片又洗了一遍。这回他先问你愿不愿意看，没有把镜头突然举到你面前。", "你们挑出一张别人可能不会注意的小景，给它起了个很长的名字。程屿说标题快比照片还大，你们笑着删掉三个字。"],
      xu: ["许知行请你试听一小段广播。他原本划掉了一个停顿，你听过后说，留下反而更像真的有人在讲话。", "他把修改写在稿纸边，问你下次还愿不愿意来。你先看了自己的安排，只答应一个确实空着的时间。"],
      lin: ["林见微摊开分工表，先问你这一周想做哪一部分。没空的格子留着，没有自动写上你的名字。", "你们把一处别扭的版面改了两遍才停。临走时她提醒你拿外套，自己却差点忘了橡皮。"],
      tang: ["沈棠拿来一张新歌单，给你看她自己排的顺序。你们各保留了一首对方不理解的最爱。", "聊到一半，你们把耳机摘下来，认真听完彼此这周的小烦恼。不是每次见面都要有大事，普通的一会儿也会慢慢变熟。"]
    };
    return count % 2 ? repeats[id] : [repeats[id][1], `第${count + 1}次留时间给这段来往，你们已经不用每次都重新找开场白。可不可以继续约下一次，还是要先问过彼此。`];
  }
  function choices(s) {
    if (s.phase !== "event" || s.page + 1 < screens(D.rounds[s.round].event.lines).length) return [];
    return D.rounds[s.round].event.choices.map(c => {
      const cash = Math.max(0, -(c.effects?.cash || 0));
      return { id: c.id, label: c.label, note: `${c.note || "按你自己的想法回应"}${cash ? ` · ¥${cash}` : ""} · 已在参与时扣过精力`, blocked: s.cash < cash ? `还需要¥${cash - s.cash}零用钱` : "" };
    });
  }
  function choose(state, id) {
    const allowed = choices(state).find(c => c.id === id), e = D.rounds[state.round].event;
    if (!allowed || allowed.blocked || state.doneEvents.includes(e.id)) throw Error(allowed?.blocked || "请先读完当前事件，再选择回应。");
    const c = e.choices.find(c => c.id === id), s = clone(state), lines = recall(state, c);
    effects(s, c.effects); if (c.flag) s.flags[c.flag] = true;
    s.doneEvents.push(e.id); record(s, e.title, [...lines, delta(state, s)], "event", id);
    return feedback(s, e.title, [...lines, delta(state, s)], "plan", e.sceneId, e.personId);
  }
  function scramble(seed) {
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 0]; let previous = -1, random = seed >>> 0;
    for (let n = 0; n < 18; n++) { const blank = board.indexOf(0), neighbors = [blank - 3, blank + 3, ...(blank % 3 ? [blank - 1] : []), ...(blank % 3 < 2 ? [blank + 1] : [])].filter(i => i >= 0 && i < 9 && i !== previous); random = (Math.imul(random, 1664525) + 1013904223) >>> 0; const next = neighbors[random % neighbors.length]; [board[blank], board[next]] = [board[next], board[blank]]; previous = blank; }
    if (board.every((v, i) => v === (i + 1) % 9)) [board[7], board[8]] = [board[8], board[7]];
    return board;
  }
  function resolvedGame(state, result) {
    const s = clone(state), g = D.games[s.game.id];
    if (s.completedGames[g.id]) throw Error("这次互动已经结束。");
    s.completedGames[g.id] = { result, round: s.round };
    if (result === "success") { effects(s, g.effects); if (g.flag) s.flags[g.flag] = true; }
    const lines = result === "success" ? g.success : result === "failure" ? [...g.failure, ...(g.explanation ? [g.explanation] : [])] : ["你把这次小互动先放下。不会再扣精力，也不会把略过写成一次惩罚；故事会照常往前走。"];
    s.game = null; record(s, g.title, [...lines, delta(state, s)], "game", g.id);
    return feedback(s, g.title, [...lines, delta(state, s)], "plan", g.sceneId, g.personId);
  }
  function play(state, payload) {
    if (state.phase !== "game" || !state.game) throw Error("当前没有正在进行的小互动。");
    const g = D.games[state.game.id];
    if (g.type === "quiz") {
      if (payload === null) return resolvedGame(state, "failure");
      if (!g.options.some(o => o.id === payload)) throw Error("请选择一道有效选项。");
      return resolvedGame(state, payload === g.correctId ? "success" : "failure");
    }
    if (g.type === "order") {
      if (!Array.isArray(payload) || payload.length !== g.items.length || new Set(payload).size !== payload.length || !payload.every(id => g.items.some(item => item.id === id))) throw Error("请把所有卡片各排列一次。");
      return resolvedGame(state, payload.every((id, i) => id === g.correctOrder[i]) ? "success" : "failure");
    }
    if (!integer(payload, 0, 8)) throw Error("这块拼图不存在。");
    const blank = state.game.board.indexOf(0), adjacent = Math.abs(Math.floor(blank / 3) - Math.floor(payload / 3)) + Math.abs(blank % 3 - payload % 3) === 1;
    if (!adjacent) return clone(state);
    const s = clone(state); [s.game.board[blank], s.game.board[payload]] = [s.game.board[payload], s.game.board[blank]]; s.game.moves++;
    return s.game.board.every((v, i) => v === (i + 1) % 9) ? resolvedGame(s, "success") : s;
  }
  function skip(state) {
    if (state.phase !== "game" || !state.game) throw Error("当前没有可以略过的小互动。");
    return resolvedGame(state, "skipped");
  }
  function finishRound(state) {
    if (state.phase !== "plan") throw Error("请先结束正在进行的对话或互动。");
    const s = clone(state); s.phase = "review"; s.page = 0;
    record(s, D.rounds[s.round].title, reviews(s), "review"); return s;
  }
  function reflectionOptions(s) {
    if (s.phase !== "reflect") return [];
    if (s.reflectionStep === 0) return [...DK.map(id => ({ id, label: `继续了解${directionName(id)}`, note: `探索${s.interests[id]} · 完整作品${s.works.filter(w => w.direction === id).length}件`, blocked: s.interests[id] < 4 || !s.works.some(w => w.direction === id) ? "需要方向探索≥4及一件完整作品；也可以继续探索" : "" })), { id: "open", label: "还想继续探索", note: "没有想清楚的部分，诚实地留到下一页", blocked: "" }];
    if (s.reflectionStep === 1) return [...PK.filter(id => id !== "zhou").map(id => ({ id, label: `想继续珍惜和${personName(id)}的来往`, note: `实际交集${s.bonds[id]}次；关系还要靠以后继续相处`, blocked: s.bonds[id] < 3 ? "共同经历还不够多，可以先不给友谊排名" : "" })), { id: "open", label: "不为朋友排名", note: "已经发生的每一段交集都保留", blocked: "" }];
    return [{ id: "undefined", label: "承认自己心动过，暂不给关系命名", note: "不把他的冷热推定为承诺", blocked: "" }, { id: "friend", label: "回到普通同学和朋友的位置", note: "不必用猜测维持关系", blocked: "" }, { id: "release", label: "不再猜他的意思", note: "也可以从未选择过他", blocked: "" }];
  }
  function reflect(state, id) {
    const o = reflectionOptions(state).find(o => o.id === id);
    if (!o || o.blocked) throw Error(o?.blocked || "这项回望暂时不能选择。");
    const s = clone(state), step = s.reflectionStep;
    let lines;
    if (step === 0) { s.chosenDirection = id; lines = [id === "open" ? "你把‘继续探索’写进下一页。旁边列着已经做过和还没来得及做的事，没有用一个好听的专业名把问题全部盖住。" : `你写下${directionName(id)}，旁边附上自己做过的作品和尝试。它是接下来想深入了解的方向，不是一张提前发出的录取通知。`]; }
    if (step === 1) { s.chosenFriend = id; lines = [id === "open" ? "你没有给朋友排第一名。那些分过的耳机、没拍好的照片和一起改过的纸页，各有各的位置。" : `你写下${personName(id)}的名字。以后不再每天见面，继续来往也许需要多问一句有没有空，你还是想认真试试。`]; }
    if (step === 2) { s.zhouChoice = id; lines = [id === "undefined" ? "你承认自己的喜欢，却没有替周予白填写另一半答案。有些话到毕业时依然没说清，也可以先停在那里。" : id === "friend" ? "你把周予白放回普通同学的位置。熟悉的侧脸仍在合照里，接下来的生活却不必等他的每一次回复才开始。" : "你没有再从那几句简短的话里找暗号。这份记忆可以留下，今天以后的时间，也完整地回到自己手里。"];
    }
    s.reflectionStep++; record(s, o.label, lines, "reflection", id);
    return feedback(s, o.label, lines, s.reflectionStep < 3 ? "reflect" : "graduate", "schoolyard");
  }
  function graduate(state, path) {
    if (state.phase !== "graduate" || !["gaokao", "hongkong"].includes(path)) throw Error("请先完成高中回望，再选择下一段路。");
    const s = clone(state); s.ending = path; s.phase = "ending"; s.page = 0;
    record(s, D.graduation[path].title, D.graduation[path].lines, "graduation", path); return s;
  }
  function summary(s) {
    const direction = s.chosenDirection && s.chosenDirection !== "open" ? directionName(s.chosenDirection) : "继续探索";
    const friend = s.chosenFriend && s.chosenFriend !== "open" ? personName(s.chosenFriend) : "不为友谊排名";
    const zhou = s.zhouChoice === "undefined" ? "心动暂不命名" : s.zhouChoice === "friend" ? "普通同学与朋友" : s.zhouChoice === "release" ? "不再猜他的心意" : "周予白不是必选项";
    return { title: s.ending ? "我在实验高中的三年" : "这一页，正在长大", lines: [
      `完成作品${s.works.length}件，公开展示${s.works.filter(w => w.presented).length}件；下一步方向：${direction}。`,
      `想继续珍惜的来往：${friend}。${PK.filter(k => s.bonds[k]).map(k => `${personName(k)}，熟悉度${s.bonds[k]}`).join("；") || "还没有额外安排同学交集"}。`,
      s.flags.hobbySessions ? `给个人爱好留过${s.flags.hobbySessions}段时间${s.flags.hobby_show ? `，包括${s.flags.hobby_show}次周末现场` : ""}。这些喜欢不需要都变成专业和成绩。` : "爱好仍然可以慢慢找到，它不是另一项必须完成的指标。",
      `关于周予白：${zhou}。这不决定任何升学与成长机会。`,
      `零用钱余额¥${s.cash}；参与互动${Object.keys(s.completedGames).length}/6，其中成功${Object.values(s.completedGames).filter(g => g.result === "success").length}次。`
    ], direction, friend, zhou, ending: s.ending, works: clone(s.works), terms: D.terms.map((t, i) => ({ title: t.title, visits: Object.fromEntries(PK.map(k => [k, s.visits[k][i]])), events: D.rounds.filter(r => r.term === i && s.doneEvents.includes(r.event.id)).map(r => r.event.title), actions: s.journal.filter(j => Math.floor(j.round / 4) === i && GROUPS.includes(j.kind)).length })) };
  }
  function actionId(s, a) {
    if (a.group === "event") return a.id === D.rounds[s.round].event.id;
    if (a.group === "game") return a.id === D.rounds[s.round].gameId;
    if (a.group === "study") return SK.includes(a.id);
    if (a.group === "explore") return DK.includes(a.id);
    if (a.group === "social") return PK.includes(a.id);
    if (a.group === "hobby") return ["listen", "scrapbook", "album", "show"].includes(a.id);
    if (a.group === "rest") return a.id === "quiet";
    if (a.group === "project") { const [d, step, extra] = a.id.split(":"); return !extra && DK.includes(d) && ["1", "2", "3", "revise", "present"].includes(step); }
    return false;
  }
  function valid(value) {
    try {
      const s = value, phases = ["opening", "plan", "event", "game", "feedback", "review", "reflect", "graduate", "ending", "complete"];
      if (!obj(s) || s.version !== 2 || !string(s.name, 12) || !s.name.trim() || !integer(s.seed, 0, 4294967295) || !integer(s.round, 0, 23) || !phases.includes(s.phase) || !integer(s.page, 0, 100)) return false;
      if (!keys(s, ["version", "name", "seed", "round", "phase", "page", "energy", "actions", "stress", "cash", "skills", "interests", "bonds", "projects", "visits", "works", "flags", "completedGames", "doneEvents", "roundActions", "journal", "feedback", "game", "reflectionStep", "chosenDirection", "chosenFriend", "zhouChoice", "ending"])) return false;
      if (!integer(s.actions, 0, 3) || s.energy !== 10 - s.actions * 3 || !integer(s.stress, 0, 100) || !integer(s.cash, 0, 20000)) return false;
      if (!["skills", "interests", "bonds", "projects", "visits", "flags", "completedGames"].every(k => obj(s[k]))) return false;
      if (Object.keys(s.skills).length !== 4 || !SK.every(k => integer(s.skills[k], 0, 30)) || Object.keys(s.interests).length !== 4 || !DK.every(k => integer(s.interests[k], 0, 30)) || Object.keys(s.bonds).length !== 5 || !PK.every(k => integer(s.bonds[k], 0, 100))) return false;
      if (Object.keys(s.projects).length !== 4 || !DK.every(k => s.projects[k] === null || obj(s.projects[k]) && Object.keys(s.projects[k]).length === 1 && [1, 2].includes(s.projects[k].step))) return false;
      if (Object.keys(s.visits).length !== 5 || !PK.every(k => Array.isArray(s.visits[k]) && s.visits[k].length === 6 && s.visits[k].every((n, i) => integer(n, 0, 4) && (i <= term(s) || n === 0)))) return false;
      if (!Array.isArray(s.roundActions) || s.roundActions.length !== s.actions || !s.roundActions.every(a => keys(a, ["group", "id", "label"]) && GROUPS.includes(a.group) && string(a.id, 100) && a.id && string(a.label, 180) && actionId(s, a)) || new Set(s.roundActions.map(a => `${a.group}:${a.id}`)).size !== s.roundActions.length) return false;
      if (Object.keys(s.flags).length > 230 || !Object.entries(s.flags).every(([k, v]) => /^[A-Za-z][A-Za-z0-9_-]{0,70}$/.test(k) && !["__proto__", "constructor", "prototype"].includes(k) && (typeof v === "boolean" || integer(v, 0, 100)))) return false;
      if (!Array.isArray(s.works) || s.works.length > 24 || new Set(s.works.map(w => w?.id)).size !== s.works.length || !s.works.every(w => keys(w, ["id", "title", "direction", "quality", "presented", "revisions", "round"]) && DK.includes(w.direction) && new RegExp(`^${w.direction}-[1-9][0-9]?$`).test(w.id) && w.title === projectNames[w.direction] && integer(w.quality, 0, 60) && typeof w.presented === "boolean" && integer(w.revisions, 0, 72) && integer(w.round, 0, s.round) && (!w.presented || w.quality >= 12))) return false;
      const eventIds = D.rounds.slice(0, s.round + 1).map(r => r.event.id);
      if (!Array.isArray(s.doneEvents) || new Set(s.doneEvents).size !== s.doneEvents.length || !s.doneEvents.every(id => eventIds.includes(id))) return false;
      if (!Object.entries(s.completedGames).every(([id, v]) => own(D.games, id) && keys(v, ["result", "round"]) && ["success", "failure", "skipped"].includes(v.result) && integer(v.round, 0, s.round) && D.rounds[v.round].gameId === id)) return false;
      if (!Array.isArray(s.journal) || s.journal.length > 180 || !s.journal.every(j => keys(j, ["round", "title", "lines", "kind", "id"]) && integer(j.round, 0, s.round) && string(j.title, 180) && string(j.id, 100) && [...GROUPS, "review", "reflection", "graduation"].includes(j.kind) && Array.isArray(j.lines) && j.lines.length > 0 && j.lines.length <= 50 && j.lines.every(l => string(l, 256) && Array.from(l).length <= 64))) return false;
      if (!integer(s.reflectionStep, 0, 3) || ![null, ...DK, "open"].includes(s.chosenDirection) || ![null, ...PK.filter(k => k !== "zhou"), "open"].includes(s.chosenFriend) || ![null, "undefined", "friend", "release"].includes(s.zhouChoice)) return false;
      if ((s.reflectionStep > 0) !== (s.chosenDirection !== null) || (s.reflectionStep > 1) !== (s.chosenFriend !== null) || (s.reflectionStep > 2) !== (s.zhouChoice !== null)) return false;
      if (s.chosenDirection && s.chosenDirection !== "open" && (s.interests[s.chosenDirection] < 4 || !s.works.some(w => w.direction === s.chosenDirection))) return false;
      if (s.chosenFriend && s.chosenFriend !== "open" && s.bonds[s.chosenFriend] < 3) return false;
      if (["reflect", "graduate", "ending", "complete"].includes(s.phase) && s.round !== 23 || s.phase === "reflect" && s.reflectionStep >= 3 || ["graduate", "ending", "complete"].includes(s.phase) && s.reflectionStep !== 3) return false;
      if (s.round < 23 && s.reflectionStep !== 0 || s.reflectionStep > 0 && !["feedback", "reflect", "graduate", "ending", "complete"].includes(s.phase)) return false;
      if (![null, "gaokao", "hongkong"].includes(s.ending) || (["ending", "complete"].includes(s.phase) !== (s.ending !== null))) return false;
      if (s.phase === "opening" && (s.actions !== 0 || s.page >= screens(D.rounds[s.round].opening).length)) return false;
      if (["plan", "reflect", "graduate", "complete", "game"].includes(s.phase) && s.page !== 0) return false;
      if (s.phase === "event" && (!s.roundActions.some(a => a.group === "event" && a.id === D.rounds[s.round].event.id) || s.doneEvents.includes(D.rounds[s.round].event.id) || s.page >= screens(D.rounds[s.round].event.lines).length)) return false;
      if (s.phase === "game") {
        const g = s.game;
        if (!obj(g) || !keys(g, g.type === "puzzle" ? ["id", "type", "moves", "board"] : ["id", "type", "moves"]) || !own(D.games, g.id) || D.rounds[s.round].gameId !== g.id || g.type !== D.games[g.id].type || s.completedGames[g.id] || !integer(g.moves, 0, 100000) || !s.roundActions.some(a => a.group === "game" && a.id === g.id)) return false;
        if (g.type === "puzzle") { if (!Array.isArray(g.board) || g.board.length !== 9 || new Set(g.board).size !== 9 || !g.board.every(n => integer(n, 0, 8))) return false; const tiles = g.board.filter(Boolean), inversions = tiles.reduce((n, v, i) => n + tiles.slice(i + 1).filter(x => x < v).length, 0); if (inversions % 2 !== 0) return false; }
        else if (own(g, "board") || g.moves !== 0) return false;
      } else if (s.game !== null) return false;
      if (s.phase === "feedback") {
        const f = s.feedback;
        if (!keys(f, ["title", "lines", "next", "sceneId", "personId"]) || !string(f.title, 180) || !SC.includes(f.sceneId) || !["heroine", ...PK].includes(f.personId) || !["plan", "reflect", "graduate"].includes(f.next) || !Array.isArray(f.lines) || f.lines.length < 1 || f.lines.length > 60 || !f.lines.every(l => string(l, 256) && Array.from(l).length <= 64) || s.page >= f.lines.length) return false;
        if (f.next === "reflect" && (s.round !== 23 || s.reflectionStep < 1 || s.reflectionStep > 2) || f.next === "graduate" && (s.round !== 23 || s.reflectionStep !== 3)) return false;
        if (f.next === "plan" && s.reflectionStep !== 0) return false;
      } else if (s.feedback !== null) return false;
      if (["review", "ending"].includes(s.phase) && s.page >= scene(s).total) return false;
      return true;
    } catch { return false; }
  }
  return { create, valid, scene, advance, groups, options, act, choices, choose, play, skip, finishRound, reflectionOptions, reflect, graduate, summary };
})();
