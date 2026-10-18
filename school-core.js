"use strict";
window.HEART_SCHOOL = (() => {
  const D = window.HEART_SCHOOL_DATA;
  if (!D || D.stages.length !== 24) throw Error("高中故事资料尚未载入。");
  const skills = { study: "学习方法", express: "表达沟通", logic: "分析推理", craft: "动手创作" };
  const directions = D.directions, friends = D.friends;
  const directionKeys = ["design", "science", "humanities", "media"], friendKeys = ["lin", "cheng", "tang"];
  const related = { design: ["craft", "express"], science: ["logic", "study"], humanities: ["express", "study"], media: ["express", "craft"] };
  const projectNames = { design: "校园角落改造手册", science: "纸翼与风的小实验", humanities: "一条街的口述记录", media: "给喜欢的歌做一本小刊" };
  const projectLines = {
    design: ["你观察了排队、找路和借书的人，在纸上留下几个并不漂亮但真实的问题。", "你画出两种方案，请同学按它找一次路。原来好看和好用，需要一起慢慢练。", "你把试过的方案、失败的草图和修改理由放在一起，写下自己的署名。"],
    science: ["你把想知道的问题缩小成一个可以比较的条件。纸翼的长度和重量，先只改其中一种。", "几次结果不一样。你没有擦掉不好看的那组，而是回头检查记录方法。", "你把实验记录和仍然解释不了的部分一起整理。它没有证明你是天才，却证明你认真试过。"],
    humanities: ["你先征求对方同意，再记录一段普通人的往事。不愿回答的问题，你留了空白。", "同一件事有两种说法。你把转述和亲眼所见分开，重新核对自己的文字。", "你把采访、背景和自己的疑问整理成册。人的生活没有被压成一句漂亮结论。"],
    media: ["你想把喜欢一首歌的理由做成小刊。封面之外，你先写下自己真正想说的话。", "你尝试排版、剪辑和署名。喜欢别人创作的同时，也开始练习自己的表达。", "最后一页写着你的名字。它没有变成流量，却是一件可以拿给朋友看的完整作品。"]
  };
  const arts = new Set([...D.stages.map(s => s.art), "school-heroine", "school-zhou", "school-friends", "beijing-home", "wen-sidepart"]);
  const clone = value => JSON.parse(JSON.stringify(value));
  const own = (object, key) => typeof key === "string" && Object.prototype.hasOwnProperty.call(object, key);
  const clamp = (n, max = 100) => Math.max(0, Math.min(max, n));
  const bounded = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
  const text = (s, max = 200) => typeof s === "string" && s.length <= max;
  function screens(lines) {
    const result = [];
    for (const source of lines) {
      const chunks = String(source).match(/[^。！？；]+[。！？；]*|[。！？；]+/g) || [String(source)];
      let line = "";
      for (const chunk of chunks) {
        const chars = Array.from(chunk);
        if (Array.from(line).length + chars.length <= 64) { line += chunk; continue; }
        if (line) { result.push(line); line = ""; }
        while (chars.length > 64) result.push(chars.splice(0, 64).join(""));
        line = chars.join("");
      }
      if (line) result.push(line);
    }
    return result.length ? result : ["你把这一页留给自己。"];
  }
  function create(name = "夏宁", seed = 1) {
    return { version: 1, name: String(name).trim().slice(0, 12) || "夏宁", seed: seed >>> 0, stage: 0, slot: 0, phase: "story", page: 0,
      skills: { study: 1, express: 1, logic: 1, craft: 1 }, interests: { design: 0, science: 0, humanities: 0, media: 0 }, friends: { lin: 0, cheng: 0, tang: 0 },
      zhou: 0, cash: 120, energy: 80, pressure: 12, projects: { design: null, science: null, humanities: null, media: null }, works: [], flags: {}, journal: [],
      feedback: null, reflectionStep: 0, chosenFriend: null, chosenDirection: null, zhouChoice: null, ending: null };
  }
  function log(s, title, content, kind, cause = "") { s.journal.push({ stage: s.stage, title, text: content, kind, cause }); }
  function feedback(s, title, lines, next, art, speaker = "你") {
    s.phase = "feedback"; s.page = 0;
    s.feedback = { title, lines: screens(lines), next, art: arts.has(art) ? art : D.stages[s.stage].art, speaker, index: 0 };
    return s;
  }
  function changes(s, effects = {}) {
    for (const key of Object.keys(skills)) if (effects.skills?.[key]) s.skills[key] = clamp(s.skills[key] + effects.skills[key], 30);
    for (const key of directionKeys) if (effects.interests?.[key]) s.interests[key] = clamp(s.interests[key] + effects.interests[key], 30);
    for (const key of friendKeys) if (effects.friends?.[key]) s.friends[key] = clamp(s.friends[key] + effects.friends[key], 100);
    if (effects.zhou) s.zhou = clamp(s.zhou + effects.zhou, 100);
    for (const key of ["energy", "pressure"]) if (effects[key]) s[key] = clamp(s[key] + effects[key]);
    if (effects.cash) s.cash = Math.max(0, s.cash + effects.cash);
  }
  function delta(before, after) {
    const bits = [];
    for (const key of Object.keys(skills)) if (before.skills[key] !== after.skills[key]) bits.push(`${skills[key]} ${after.skills[key] - before.skills[key] > 0 ? "+" : ""}${after.skills[key] - before.skills[key]}`);
    for (const key of directionKeys) if (before.interests[key] !== after.interests[key]) bits.push(`${directions[key].name}探索 ${after.interests[key] - before.interests[key] > 0 ? "+" : ""}${after.interests[key] - before.interests[key]}`);
    if (before.cash !== after.cash) bits.push(`零用钱 ${after.cash - before.cash > 0 ? "+" : ""}¥${after.cash - before.cash}`);
    if (before.energy !== after.energy) bits.push(`精力 ${after.energy - before.energy > 0 ? "+" : ""}${after.energy - before.energy}`);
    if (before.pressure !== after.pressure) bits.push(`负荷 ${after.pressure - before.pressure > 0 ? "+" : ""}${after.pressure - before.pressure}`);
    return bits.length ? bits.join("；") + "。" : "这一段时间，留在了你的生活里。";
  }
  function groups(s) {
    if (s.phase !== "plan") return [];
    return [
      { id: "study", title: "找到适合自己的学习方法", note: "课内学习照常进行；额外安排用来补短板或试新方法" },
      { id: "explore", title: "去试一种还不确定的喜欢", note: "四个方向都可尝试，做过的事会留下探索记录" },
      { id: "project", title: "做一件属于自己的小作品", note: "探索、制作、完成各用一次安排；作品质量由实际能力决定" },
      { id: "friends", title: "把时间留给朋友", note: "一起做事、认真倾听，友谊会留下具体记忆" },
      { id: "hobby", title: "听歌、追星，保留个人爱好", note: "可免费欣赏，也可按预算做小刊、买唱片或看演出" },
      { id: "zhou", title: "要不要和周予白相处一会儿", note: "他的回应不总一样，你可以完全不选这一项" },
      ...(s.stage >= 8 ? [{ id: "opportunity", title: "把试过的事带到更大的地方", note: "社团展示会看作品、能力与探索经历，不要求恋爱" }] : []),
      { id: "rest", title: "这一次，先休息", note: "不花钱，不要求剩余精力；最多恢复 32 精力、减轻 18 负荷" }
    ];
  }
  function option(s, id, label, note, cash = 0, energy = 0, blocked = "") {
    return { id, label, note, cash, energy, blocked: blocked || (s.cash < cash ? `还需要 ¥${cash - s.cash} 零用钱` : s.energy < energy ? `需要 ${energy} 精力；可以先休息` : "") };
  }
  const quality = (s, direction) => related[direction].reduce((n, skill) => n + s.skills[skill], 0);
  const latestWork = (s, direction) => s.works.filter(w => w.direction === direction).at(-1);
  function options(s, group) {
    if (s.phase !== "plan" || !groups(s).some(g => g.id === group)) return [];
    if (group === "study") return Object.entries(skills).map(([id, name]) => option(s, id, `练一练${name}`, "不花钱 · 精力 −14 · 对应能力最多 +2，负荷 +5", 0, 14, s.skills[id] >= 30 ? "可以把已学到的方法用在作品上" : ""));
    if (group === "explore") return directionKeys.map(id => option(s, id, `试一试${directions[id].name}`, `${directions[id].description} · ¥10 · 精力 −10 · 探索 +2`, 10, 10, s.interests[id] >= 30 ? "可以把这一方向的尝试整理成作品或展示" : ""));
    if (group === "project") return directionKeys.flatMap(id => {
      const p = s.projects[id], work = latestWork(s, id), step = p?.step || 0;
      const result = [option(s, `${id}:${step ? "continue" : "start"}`, `${["开始", "继续制作", "完成"][step]}《${projectNames[id]}》`, `${["观察与收集", "尝试与修改", "整理与署名"][step]} · ¥10 · 精力 −12${step === 2 ? ` · 当前完成质量 ${quality(s, id)}` : ""}`, 10, 12)];
      if (work && !p) result.push(option(s, `${id}:revise`, `重新打磨《${work.title}》`, `按当前能力修订；质量 ${work.quality} → ${Math.max(work.quality, quality(s, id))} · ¥5 · 精力 −10`, 5, 10));
      if (work && !work.presented) result.push(option(s, `${id}:present`, `把《${work.title}》拿给别人看`, `需要质量 12 与方向探索 4；展示不等于获奖或录取 · 精力 −8`, 0, 8, work.quality < 12 || s.interests[id] < 4 ? "先积累相关能力，再完成质量至少 12、探索至少 4 的作品" : ""));
      return result;
    });
    if (group === "friends") return friendKeys.map(id => option(s, id, `和${friends[id].name}待一会儿`, `${friends[id].description} · 精力 −6；一起相处会减轻 8 负荷`, 0, 6));
    if (group === "hobby") return [
      option(s, "listen", "不花钱，认真听一张歌单", "精力 −3 · 负荷 −10；喜欢可以只是喜欢，不必产出作品", 0, 3),
      option(s, "scrapbook", "给喜欢的舞台做一页手账", "¥15 · 精力 −9；动手与表达各最多 +1，媒介探索 +1", 15, 9),
      option(s, "album", "按预算买一张喜欢的唱片", "¥45 · 精力 −5 · 负荷 −12；留下自己的收藏记忆", 45, 5),
      option(s, "show", "去看一场周末演出", "¥160 · 精力 −16 · 负荷 −16；一整段课外安排留给现场", 160, 16, s.stage < 4 ? "先在高一的日常里慢慢认识自己的喜好，第二学期开放现场演出" : "")
    ];
    if (group === "zhou") return [option(s, "talk", "下课后，问他要不要一起走", "精力 −6；这不是保证得到答复的承诺", 0, 6), option(s, "share", "把一件小事分享给他", "精力 −5；不用拿贵重礼物或自己的计划换回应", 0, 5)];
    if (group === "rest") return [option(s, "rest", "散一会儿步，或者好好睡一觉", "不花钱；最多恢复 32 精力，减轻 18 负荷")];
    if (group === "opportunity") return directionKeys.map(id => {
      const works = s.works.filter(w => w.direction === id), enough = works.some(w => w.quality >= 12), done = s.flags[`opportunity_${id}`];
      return option(s, id, `参加${directions[id].name}社团的开放展示`, "带上质量至少 12 的完整作品，方向探索积累至少 6 · 精力 −14", 0, 14,
        done ? "你已经留下这次社团展示经历，可以继续做新的作品" : !enough || s.interests[id] < 6 ? "需要这一方向质量至少 12 的完整作品，方向探索至少 6" : "");
    });
    return [];
  }
  function act(state, group, id) {
    if (state.phase !== "plan") throw Error("现在不是课外安排时间。");
    const o = options(state, group).find(x => x.id === id);
    if (!o || o.blocked) throw Error(o?.blocked || "这个安排暂时不可选。");
    const s = clone(state), before = clone(state); s.cash -= o.cash; s.energy -= o.energy;
    let lines = [], art = "school-heroine", speaker = "你", cause = "你把一个有限的课外安排留给了这件事。";
    if (group === "study") {
      changes(s, { skills: { [id]: 2 }, pressure: 5 });
      lines = ["你没有把整页重抄一遍，而是找出真正卡住自己的那一步，换一种方式再试。", "课内课程一直在继续。这次额外练习，补上的只有你亲手练过的部分。"];
      art = "school-heroine"; cause = `额外练习了${skills[id]}，以后作品的完成质量会用到实际能力。`;
    }
    if (group === "explore") {
      changes(s, { interests: { [id]: 2 }, skills: { [related[id][(s.seed + s.stage) % 2]]: 1 } });
      lines = [`你试了一次${directions[id].name}相关的小任务。它和想象里不完全一样，你也开始知道自己喜欢的是哪一部分。`, "今天不需要宣布一生的职业。你把感受写进手账，下次可以继续，也可以换一种试试。"];
      cause = `尝试${directions[id].name}，留下探索记录；相关方法也在练习中积累。`;
    }
    if (group === "project") {
      const [direction, action] = id.split(":"), p = s.projects[direction], work = latestWork(s, direction);
      if (action === "start" || action === "continue") {
        const step = p?.step || 0; lines = [projectLines[direction][step]];
        changes(s, { interests: { [direction]: 1 }, pressure: 3 });
        if (step < 2) s.projects[direction] = { step: step + 1 };
        else {
          const q = quality(s, direction), count = s.works.filter(w => w.direction === direction).length + 1;
          s.works.push({ id: `${direction}-${count}`, direction, title: projectNames[direction], quality: q, presented: false, stage: s.stage });
          s.projects[direction] = null; lines.push(`这件作品的完成质量是 ${q}，来自${related[direction].map(k => skills[k]).join("与")}的实际积累。`);
        }
        cause = `作品需要三个不同的课外安排；今天完成的是第 ${step + 1} 步。`;
      }
      if (action === "revise") {
        const old = work.quality; work.quality = Math.max(old, quality(s, direction));
        lines = ["你没有把旧稿当作失败删掉，而是用后来学会的方法改了一遍。", `修订后的质量为 ${work.quality}。学得更多时，修订才会真正改善作品。`];
        cause = `当前能力对应质量 ${quality(s, direction)}，旧稿质量 ${old}；修订保留真实进步。`;
      }
      if (action === "present") {
        work.presented = true; changes(s, { skills: { express: 1 }, pressure: -4 });
        lines = ["你把作品放在桌上，讲起为什么要这样做。有人提出不同意见，你把有用的部分记下来。", "这不是录取通知，也不是一次成名。它是一段你确实完成、也确实向别人讲述过的经历。"];
        cause = `已有质量 ${work.quality} 与探索 ${s.interests[direction]}，所以这次展示真正开放。`;
      }
      art = "school-heroine";
    }
    if (group === "friends") {
      const scene = {
        lin: ["见微把一张画坏的草图摊给你看。你们没有互相比较排名，先把那道难开口的问题聊完。", "你们一起绕了远路回家。不是每句话都有结论，但下次想倾诉时，你知道可以先问她有没有空。"],
        cheng: [`你和${friends.cheng.name}拆开一件坏掉的小物件。她负责记录，你负责试错，最后一起承认还差一块零件。`, `${friends.cheng.name}这次没急着帮你解决问题。她听你说完，问你希望她陪着，还是一起想办法。`],
        tang: [`${friends.tang.name}戴着一只耳机等你。你们交换最近喜欢的歌，把另一半时间留给她遇到的不开心。`, `你陪${friends.tang.name}整理一份活动记录。她记得你上次随口说过的偏好，你也记住她想尝试的那件事。`]
      };
      lines = [scene[id][s.friends[id] % 2]]; changes(s, { friends: { [id]: 1 }, pressure: -8 });
      art = "school-friends"; speaker = friends[id].name;
      cause = `和${friends[id].name}的共同相处积累达到 ${s.friends[id]}；包括课余安排和生活事件里的共同经历。`;
    }
    if (group === "hobby") {
      s.flags.hobbySessions = (s.flags.hobbySessions || 0) + 1;
      const hobby = {
        listen: ["你把耳机戴好，从头听完那张免费歌单。有一小段旋律让今天柔软了一点，你没有急着把它变成作业。", { pressure: -10 }],
        scrapbook: ["你剪下一块舞台色彩，记下打动自己的瞬间。你保留素材出处，再试着做出属于自己的编排。", { skills: { craft: 1, express: 1 }, interests: { media: 1 }, pressure: -5 }],
        album: ["你确认过余额，买下那张想了很久的唱片。拆开包装时，你知道自己留下了一笔怎样的花费，也留下了一点快乐。", { pressure: -12 }],
        show: ["现场没有改变你的人生，却让一段认真喜欢过的旋律有了温度。回家以后，你把票根收进手账。", { pressure: -16 }]
      };
      lines = [hobby[id][0]]; changes(s, hobby[id][1]); s.flags[`hobby_${id}`] = (s.flags[`hobby_${id}`] || 0) + 1;
      art = "school-heroine"; cause = "喜欢有时间和预算，也可以不产出成就；这次消费没有被记作道德过错。";
    }
    if (group === "zhou") {
      const warm = (s.seed + s.stage * 3 + s.zhou) % 3 !== 0;
      s.zhou++; art = "school-zhou"; speaker = "周予白";
      lines = warm ? ["他把书放慢了一点，和你一起走到楼梯口。你说起今天的小事，他听完，问了一句后来呢。", "下一节课铃响了，他先回了教室。这一段相处是真实的，却还不足以替他的心意作答。"] : ["他只回了简短的一句，收好东西便去赶别的安排。你不知道是疲惫、家里的事，还是他本来就不想多说。", "你没有继续追问。猜不透的人可以暂时放在一边，今天剩下的时间仍然属于你。"];
      cause = "你选择了一段相处。回应有冷热，但没有任何证据足以确认他的喜欢。";
    }
    if (group === "rest") {
      changes(s, { energy: 32, pressure: -18 });
      lines = ["你合上了本子，没有把休息写成奖励。窗外的风吹进来，今天不需要再证明什么。", "这一段时间同样向前走。你没有获得作品或额外分数，留下的是下一次能重新开始的力气。"];
      art = "school-heroine"; cause = "休息不要求金钱或精力，不会因为资源低而无路可走。";
    }
    if (group === "opportunity") {
      s.flags[`opportunity_${id}`] = true; changes(s, { interests: { [id]: 2 }, skills: { express: 1 } });
      lines = [`你带着${directions[id].name}方向的完整作品参加开放展示。提问没有都答好，但你能说清哪些事情是自己试过的。`, "你把真实经历写进方向笔记。这段经验能帮助选择想继续学的东西，不能替任何学校承诺录取。"];
      art = "school-heroine"; cause = "作品质量与探索积累满足条件，独立解锁了社团机会；没有使用恋爱关系。";
    }
    log(s, o.label, lines.join(""), group, cause); s.slot++;
    return feedback(s, o.label, [...lines, delta(before, s)], s.slot < 2 ? "plan" : "choice", art, speaker);
  }
  function choices(s) {
    if (s.phase !== "choice") return [];
    return D.stages[s.stage].choices.map(c => {
      const cash = Math.max(0, -(c.effects?.cash || 0)), energy = Math.max(0, -(c.effects?.energy || 0));
      const note = (c.note || "你可以按此刻自己的想法回应。") + (cash ? ` · ¥${cash}` : "") + (energy ? ` · 精力 −${energy}` : "");
      return option(s, c.id, c.label, note, cash, energy);
    });
  }
  function choose(state, id) {
    if (state.phase !== "choice") throw Error("当前没有待回应的生活事件。");
    const choice = D.stages[state.stage].choices.find(c => c.id === id);
    const allowed = choices(state).find(c => c.id === id);
    if (!choice || allowed.blocked) throw Error(allowed?.blocked || "这个回应不存在。");
    const s = clone(state); changes(s, choice.effects);
    if (choice.flag && /^[A-Za-z][A-Za-z0-9_-]{0,60}$/.test(choice.flag)) s.flags[choice.flag] = true;
    log(s, D.stages[s.stage].title, choice.lines.join(""), "event", choice.label);
    return feedback(s, D.stages[s.stage].title, [...choice.lines, delta(state, s)], s.stage === 23 ? "reflect" : "stage", D.stages[s.stage].art);
  }
  function stageEnd(s) {
    const previous = clone(s), recovery = s.pressure >= 65 ? 18 : 30;
    s.stage++; s.slot = 0; s.page = 0; s.phase = "story";
    changes(s, { energy: recovery, pressure: -9, cash: s.stage % 4 === 0 ? 90 : 30, skills: { [Object.keys(skills)[s.stage % 4]]: 1 } });
    log(s, "生活继续向前", delta(previous, s), "routine", recovery === 18 ? "前一片段负荷较高，课余恢复减少；课堂学习和约定的零用钱照常积累。" : "时间跨入下一个生活片段；课堂学习、课余恢复和约定的零用钱照常积累。");
    return s;
  }
  function advance(state) {
    const s = clone(state);
    if (s.phase === "story") {
      const lines = screens(D.stages[s.stage].lines);
      if (s.page + 1 < lines.length) s.page++; else { s.phase = "plan"; s.page = 0; }
      return s;
    }
    if (s.phase !== "feedback" || !s.feedback) throw Error("这一页需要先作出选择。");
    if (s.feedback.index + 1 < s.feedback.lines.length) { s.feedback.index++; return s; }
    const target = s.feedback.next; s.feedback = null; s.page = 0;
    if (target === "stage") return stageEnd(s);
    if (target === "reflect") { s.phase = "reflect"; return s; }
    s.phase = target; return s;
  }
  function directionEvidence(s, id) {
    return { exploration: s.interests[id], works: s.works.filter(w => w.direction === id), opportunity: !!s.flags[`opportunity_${id}`] };
  }
  function reflection(s) {
    if (s.phase !== "reflect") return [];
    if (s.reflectionStep === 0) return [...friendKeys.map(id => option(s, id, `${friends[id].name}，是我最想继续珍惜的朋友`, `共同相处积累 ${s.friends[id]}；关系需要彼此继续经营`, 0, 0, s.friends[id] < 3 ? "共同相处积累尚未达到 3；可以先保持开放，不必给友谊排名" : "")), option(s, "open", "不替友谊排名，继续认真相处", "不强行指定最好朋友；已有的相处记录仍会保留")];
    if (s.reflectionStep === 1) return [...directionKeys.map(id => {
      const e = directionEvidence(s, id), gate = e.exploration < 4 || (!e.works.length && !e.opportunity);
      return option(s, id, `想继续了解${directions[id].name}`, `探索 ${e.exploration} · 完整作品 ${e.works.length} · 社团展示 ${e.opportunity ? "已参加" : "未参加"}；相关专业：${directions[id].majors.join("、")}`, 0, 0, gate ? "先有方向探索至少 4，以及一件完整作品或社团经历，才把它写成下一步方向；也可保持开放" : "");
    }), option(s, "open", "还想继续探索，不急着确定专业", "把做过与尚未做过的事分清；不假装已经有答案")];
    return [option(s, "undefined", "承认喜欢过，暂时不给关系命名", "保留自己的心情，也不把他的冷热解释成承诺"), option(s, "friend", "把他当作普通朋友", "自己的方向、朋友与爱好继续向前走"), option(s, "release", "不再猜他的意思，把注意力收回来", "你可以完全不选择他；这不会关闭升学或成长机会")];
  }
  function reflect(state, id) {
    const o = reflection(state).find(c => c.id === id);
    if (!o || o.blocked) throw Error(o?.blocked || "这个总结暂时不能选择。");
    const s = clone(state), step = s.reflectionStep;
    if (step === 0) s.chosenFriend = id;
    if (step === 1) s.chosenDirection = id;
    if (step === 2) s.zhouChoice = id;
    s.reflectionStep++;
    const lines = step === 0 ? [id === "open" ? "你没有把朋友排出名次。那些一起等过的放学、分过的耳机和认真听过的话，不需要一张榜单证明。" : `你写下${friends[id].name}的名字。最好的朋友不是一个永久头衔，是毕业以后仍愿意为彼此留一点真实的时间。`] : step === 1 ? [id === "open" ? "你在专业方向一栏写下‘继续探索’。旁边列着已经试过的事，也列着以后想认真试的事。" : `你把${directions[id].name}写成下一步想深入了解的方向，旁边附上自己做过的尝试。喜欢不再只是一个听起来好听的专业名称。`] : [id === "undefined" ? "你承认自己的心动，却没有替另一个人写答案。高中停在这里，喜欢可以暂时没有结论。" : id === "friend" ? "你把周予白放回朋友的位置。那些忽冷忽热不再负责决定你今天好不好，你仍有很多想认真过的日子。" : "你决定不再从他的每句话里找隐藏的答案。没有得到一段恋爱，不等于少活了一段青春。"];
    log(s, ["关于朋友", "关于以后想学的东西", "关于周予白"][step], lines.join(""), "reflection", o.label);
    return feedback(s, ["想继续珍惜的人", "想继续了解的方向", "把心情交还给自己"][step], lines, s.reflectionStep < 3 ? "reflect" : "graduate", "school-heroine");
  }
  function graduate(state, path) {
    if (state.phase !== "graduate" || !["gaokao", "hongkong"].includes(path)) throw Error("先完成高中回望，再选择下一段出发方式。");
    const s = clone(state); s.flags.path = path;
    log(s, path === "gaokao" ? "选择高考" : "选择香港留学计划", path === "gaokao" ? "高中经历已整理，选择从高考系统继续；具体考试规则将按后续设定接入，没有生成成绩或录取。" : "把香港留学写成下一步准备的计划，先了解课程、申请材料、语言要求和家庭预算；这里不自动承诺录取。", "path", "这条选择由个人成长后的思考决定，不要求选择任何男主。");
    s.ending = summary(s);
    const lines = path === "gaokao" ? ["你把三年的笔记收进文件袋。里面不只有试卷，还有采访、草图、票根，以及一些终于不必急着回答的问题。", "你决定走向高考，把下一页留给那套考试系统。这里尚未模拟题目、分数或录取，你的高中经历会作为已经走过的起点。", "放学铃最后一次响起，你和朋友在校门口挥手。周予白是否回头，不再是这个夏天唯一值得记住的事。"] : ["你把香港写进下一步计划。课程、语言、材料和预算要逐项了解，愿望还不是录取通知，但准备可以从现在开始。", "暑假里，你在一次面向学生的公开课程说明活动中找错了楼。一个来参加低年级体验活动的学生把示意图转向你。", "‘你要找的是另一边。’他指着图说，‘我叫闻照，也刚刚绕了一圈。’你道了谢，把路线记进自己的本子。", "那时他还不是教授，也没有谁知道以后会在哪里重逢。眼前只是一次普通的相遇，你仍然有自己的下一段路要走。"];
    return feedback(s, path === "gaokao" ? "把下一页交给高考" : "海的另一边，先从问路开始", lines, "ending", path === "hongkong" ? "wen-sidepart" : "school-heroine", path === "hongkong" ? "夏天的路口" : "你");
  }
  function summary(s) {
    const completed = s.stage === 23 && s.reflectionStep === 3;
    const path = s.flags.path || null, f = s.chosenFriend, d = s.chosenDirection;
    const friend = f && f !== "open" ? { name: friends[f].name, text: `你们的共同相处积累为 ${s.friends[f]}，来自课余安排和生活事件里的共同经历。毕业以后，仍要靠新的倾听和行动继续成为朋友。` } : { name: "让友谊继续生长", text: friendKeys.filter(k => s.friends[k] > 0).map(k => `${friends[k].name}：共同相处积累 ${s.friends[k]}`).join("；") || "你还没有留下共同相处的积累。下一段生活仍可以慢慢认识想认真交往的人。" };
    const de = d && d !== "open" ? directionEvidence(s, d) : null;
    const direction = de ? { name: directions[d].name, text: `探索积累 ${de.exploration}，完整作品 ${de.works.length} 件${de.opportunity ? "，参加过社团开放展示" : ""}。想继续了解：${directions[d].majors.join("、")}。这是兴趣线索，不是录取结论。` } : { name: "继续探索", text: "还没有把自己固定成一种答案。已经试过的事和完整作品会保留，未来可以继续据此选择。" };
    const zhou = { name: s.zhouChoice === "undefined" ? "心动暂不命名" : s.zhouChoice === "friend" ? "回到普通朋友" : s.zhouChoice === "release" ? "不再猜他的心意" : "周予白不是必选项", text: `你和他的联系积累为 ${s.zhou}，记录来自课余安排与生活事件，不代表他的好感。${s.zhouChoice === "undefined" ? "你承认自己的喜欢，也没有从他的冷热推定他的答案。" : "自己的成长、朋友与出发方式，都不需要由他的回应批准。"}` };
    const hobbyCount = s.flags.hobbySessions || 0;
    const hobby = { name: hobbyCount ? "留给喜欢的时间" : "爱好仍可以慢慢找", text: hobbyCount ? `你额外留了 ${hobbyCount} 段时间给听歌、追星或收藏${s.flags.hobby_show ? `，其中 ${s.flags.hobby_show} 次去了演出现场` : ""}。快乐不必都转成比赛和成绩，花费也如实留在账本里。` : "你没有额外安排追星或收藏活动；生活事件里对喜欢的感受仍会留下。爱好不必成为另一项必做任务，你可以继续寻找自己的快乐。" };
    const evidence = s.journal.filter(r => ["project", "friends", "hobby", "opportunity", "reflection", "path"].includes(r.kind)).map(r => ({ title: r.title, text: r.cause ? `${r.text} ${r.cause}` : r.text, stage: r.stage }));
    return { title: completed ? "你已经走过的三年" : "慢慢找到自己的手账", lines: [completed ? "高中从一张陌生的课表开始，现在你能说出一些自己真正试过、也愿意继续的事。" : "还在路上。这里记录已经发生的事，不替未来提前评分。", `完成作品 ${s.works.length} 件，展示 ${s.works.filter(w => w.presented).length} 件；现有零用钱 ¥${s.cash}。`], friend, direction, zhou, hobby,
      path: { id: path, name: path === "gaokao" ? "高考" : path === "hongkong" ? "香港留学计划" : "还没有决定", text: path === "gaokao" ? "选择已保留；考试玩法按后续规则接入。本章没有模拟分数、排名或录取。" : path === "hongkong" ? "开始准备课程、材料、语言和预算；在学生公开活动中，提前与闻照有过一次普通初遇。" : "毕业时可以选择高考或香港留学计划，两条路都不要求恋爱。" }, evidence };
  }
  function view(s) {
    const stage = D.stages[s.stage], kicker = `${D.terms[stage.term]} · ${stage.time}`;
    if (s.phase === "feedback") return { kind: "feedback", title: s.feedback.title, kicker, art: s.feedback.art, speaker: s.feedback.speaker, lines: s.feedback.lines, index: s.feedback.index };
    if (s.phase === "story") return { kind: "story", title: stage.title, kicker, art: stage.art, speaker: "你", lines: screens(stage.lines), index: s.page };
    if (s.phase === "plan") return { kind: "plan", title: `留给自己的第${s.slot + 1}个课外安排`, kicker, art: stage.art, speaker: "你", lines: ["这不是每天的完整日程。课堂照常进行，每个生活片段只选两段能由自己安排的课余时间。"], index: 0 };
    if (s.phase === "choice") return { kind: "choice", title: stage.title, kicker, art: stage.art, speaker: "你", lines: screens([stage.prompt]), index: 0 };
    if (s.phase === "reflect") return { kind: "reflect", title: ["谁是想继续珍惜的朋友", "还想继续学些什么", "要怎样安放那一点喜欢"][s.reflectionStep], kicker: "高三毕业 · 给自己的回望", art: "school-heroine", speaker: "你", lines: [["三年里，你和谁真正度过了一些时间？可以选择最想继续珍惜的朋友，也可以不为友谊排名。"], ["喜欢的专业方向，需要从自己做过的事里慢慢辨认。尚未确定，也可以诚实写下来。"], ["周予白的冷热没有替你写好答案。你可以保留喜欢、做朋友，或者把注意力收回来。"]][s.reflectionStep], index: 0 };
    if (s.phase === "graduate") return { kind: "graduate", title: "下一段，往哪里走", kicker: "高中篇终章", art: "school-heroine", speaker: "你", lines: ["课表到了最后一页。你可以把下一段交给高考，也可以开始准备香港留学计划。决定与任何人的心意无关。"], index: 0 };
    return { kind: "ending", title: s.ending.title, kicker: "高中篇 · 已走完", art: s.flags.path === "hongkong" ? "wen-sidepart" : "school-heroine", speaker: "你", lines: screens(s.ending.lines), index: 0 };
  }
  function valid(s) {
    if (!s || s.version !== 1 || !text(s.name, 12) || !s.name.trim() || !bounded(s.seed, 0, 4294967295) || !bounded(s.stage, 0, 23) || !bounded(s.slot, 0, 2) || !bounded(s.page, 0, 100) || !["story", "plan", "feedback", "choice", "reflect", "graduate", "ending"].includes(s.phase)) return false;
    if (!["skills", "interests", "friends", "projects", "flags"].every(k => s[k] && typeof s[k] === "object" && !Array.isArray(s[k]))) return false;
    if (!Object.keys(skills).every(k => bounded(s.skills[k], 0, 30)) || !directionKeys.every(k => bounded(s.interests[k], 0, 30)) || !friendKeys.every(k => bounded(s.friends[k], 0, 100)) || !bounded(s.zhou, 0, 100) || !bounded(s.cash, 0, 20000) || !bounded(s.energy, 0, 100) || !bounded(s.pressure, 0, 100)) return false;
    if (!directionKeys.every(k => s.projects[k] === null || (s.projects[k] && [1, 2].includes(s.projects[k].step)))) return false;
    if (!Array.isArray(s.works) || s.works.length > 24 || new Set(s.works.map(w => w?.id)).size !== s.works.length || !s.works.every(w => w && directionKeys.includes(w.direction) && new RegExp(`^${w.direction}-[1-9][0-9]?$`).test(w.id) && w.title === projectNames[w.direction] && bounded(w.quality, 0, 60) && typeof w.presented === "boolean" && bounded(w.stage, 0, s.stage))) return false;
    if (Object.keys(s.flags).length > 130 || !Object.entries(s.flags).every(([k, v]) => /^[A-Za-z][A-Za-z0-9_-]{0,60}$/.test(k) && (typeof v === "boolean" || bounded(v, 0, 100) || (k === "path" && ["gaokao", "hongkong"].includes(v))))) return false;
    if (!Array.isArray(s.journal) || s.journal.length > 220 || !s.journal.every(r => r && bounded(r.stage, 0, s.stage) && text(r.title, 150) && text(r.text, 2000) && text(r.cause, 400) && ["study", "explore", "project", "friends", "hobby", "zhou", "rest", "opportunity", "event", "routine", "reflection", "path"].includes(r.kind))) return false;
    if (!bounded(s.reflectionStep, 0, 3) || ![null, ...friendKeys, "open"].includes(s.chosenFriend) || ![null, ...directionKeys, "open"].includes(s.chosenDirection) || ![null, "undefined", "friend", "release"].includes(s.zhouChoice)) return false;
    if ((s.reflectionStep > 0) !== (s.chosenFriend !== null) || (s.reflectionStep > 1) !== (s.chosenDirection !== null) || (s.reflectionStep > 2) !== (s.zhouChoice !== null)) return false;
    if (s.chosenFriend && s.chosenFriend !== "open" && s.friends[s.chosenFriend] < 3) return false;
    if (s.chosenDirection && s.chosenDirection !== "open" && (s.interests[s.chosenDirection] < 4 || !s.works.some(w => w.direction === s.chosenDirection))) return false;
    if (s.phase === "story" && (s.slot !== 0 || s.page >= screens(D.stages[s.stage].lines).length)) return false;
    if (s.phase === "plan" && s.slot >= 2) return false;
    if (["choice", "reflect", "graduate", "ending"].includes(s.phase) && s.slot !== 2) return false;
    if (["reflect", "graduate", "ending"].includes(s.phase) && s.stage !== 23) return false;
    if (s.phase === "reflect" && s.reflectionStep >= 3) return false;
    if (["graduate", "ending"].includes(s.phase) && s.reflectionStep !== 3) return false;
    if (s.phase === "feedback") {
      const f = s.feedback;
      if (!f || !text(f.title, 150) || !arts.has(f.art) || !text(f.speaker, 40) || !Array.isArray(f.lines) || !f.lines.length || f.lines.length > 80 || !f.lines.every(l => typeof l === "string" && Array.from(l).length <= 64) || !bounded(f.index, 0, f.lines.length - 1) || !["plan", "choice", "stage", "reflect", "graduate", "ending"].includes(f.next)) return false;
      if (f.next === "plan" && s.slot >= 2 || ["choice", "stage", "reflect", "graduate", "ending"].includes(f.next) && s.slot !== 2) return false;
      if (f.next === "stage" && s.stage >= 23 || f.next === "ending" && (!s.flags.path || s.reflectionStep !== 3)) return false;
    } else if (s.feedback !== null) return false;
    if (s.flags.path && (s.stage !== 23 || s.slot !== 2 || s.reflectionStep !== 3 || !["feedback", "ending"].includes(s.phase))) return false;
    if ((s.phase === "ending" || s.flags.path) && (!s.ending || JSON.stringify(s.ending) !== JSON.stringify(summary(s)))) return false;
    if (!s.flags.path && s.ending !== null) return false;
    return true;
  }
  return { skills, directions, friends, create, advance, groups, options, act, choices, choose, reflection, reflect, graduate, summary, valid, view };
})();
