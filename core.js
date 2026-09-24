"use strict";
window.CITY = (() => {
  const people = {
    gu: { name: "顾砚", job: "科技公司创始人 · 上海 / 东京", image: "gu", intro: "中日混血，东京大学毕业。少年时被称作天才，创办的科技公司专注辅助导航。他习惯迅速答对问题，却不擅长听见答题纸以外的声音。会被认真而笨拙的努力吸引，也必须学会尊重一个与自己不同的答案。", history: "父亲是中国人，母亲是日本人。母亲离开他安排妥当的住处，去开一间陶艺室。他来上海创立公司，也在学习一件自己从未擅长的事：亲近的人不必接受他提供的最优解。" },
    zhou: { name: "周予白", job: "飞行器制造工程师 · 上海", image: "zhou", intro: "你的高中同学，也是你曾偷偷喜欢的人。他的优秀来自重复、耐心与不会被老师看见的深夜。重逢后依然话少，依然会在下雨前多带一把伞。", history: "他习惯先解决别人的需要，最后才想自己。他保存了一本你早已忘记的练习册；有些藏在页边的答案，至今没有被任何人认真读完。" },
    lu: { name: "陆星野", job: "演员 · 北京 / 重庆", image: "lu", intro: "镜头认识他的笑，鲜有人认识他不笑的时候。父母很早离异，辗转的住处教会他做一个让每个人都轻松的小孩。如今是顶流，仍会在结束通告后偷偷查重庆末班地铁。", history: "他想公开喜欢一个人，又不想把被喜欢的人交给公共审判。姐姐只是一个称呼；他希望承担的是一个成年伴侣的责任。" },
    wen: { name: "闻照", job: "青年助理教授 · 深圳", image: "wen", intro: "香港中文大学（深圳）的年轻教师，研究公共设计与技术伦理。资质并不出众，却在接连出现的机会里走得很快。他知道幸运不是能力，也害怕别人发现这一点。", history: "回声项目让他得到位置，也把他放进校内项目办公室与城市更新部门的争执。他的银发是一次展览造型留下的颜色，不是什么超自然秘密。角色及校政项目情节均为虚构。" }
  };
  const assets = {
    lz1: "春日街角", lz2: "树影下的来客", lz3: "顾砚 · 樱花下的距离", lz4: "顾砚 · 留下的问题",
    lz5: "周予白 · 练习册页边", lz6: "周予白 · 雨向你这边落", lz7: "陆星野 · 今天只做游客", lz8: "陆星野 · 同一首未完的歌",
    lz9: "闻照 · 戏服试拍", lz10: "闻照 · 落幕以前", lz11: "北京 · 灯没有熄", lz12: "上海 · 从日常开始", lz13: "深圳 · 海湾来信",
    lz14: "伦敦 · 远行", lz15: "巴黎 · 自己的名字", lz17: "旧金山 · 另一种坐标", lz18: "东京 · 回声街道", lz19: "海边 · 镜头之外", lz20: "东京 · 旧日校园", lz21: "重庆 · 回家",
    studio: "上海 · 你的工作室", hospital: "上海 · 值班室", lab: "上海 · 飞行器工坊", campus: "深圳 · 下课以后",
    gu: "顾砚", zhou: "周予白", lu: "陆星野", wen: "闻照",
    "gu-daily": "顾砚 · 蛋糕也没有标准答案", "zhou-daily": "周予白 · 修好一条包带", "lu-daily": "陆星野 · 两碗小面", "wen-daily": "闻照 · 教授也会手工翻车",
    "gu-alone": "顾砚 · 最后一个离开的人", "zhou-alone": "周予白 · 藏起来的纸飞机", "lu-alone": "陆星野 · 卸妆以后", "wen-alone": "闻照 · 签名以前",
    "heroine-work": "你 · 我为作品署名", "heroine-rest": "你 · 今天先到这里", crossroads: "四个人，四杯咖啡，一个你"
  };
  const scenes = {}, endings = {};
  function add(route, list) {
    list.forEach((scene, i) => {
      if (scenes[scene.id]) throw Error(`重复场景 ${scene.id}`);
      scene.route = route;
      scene.next = scene.next || list[i + 1]?.id || "final";
      scene.choices = (scene.choices || []).map((o, j) => ({ id: `${scene.id}:${j}`, ...o }));
      scene.choices.push({ id: `${scene.id}:pass`, label: scene.pass?.[0] || "不选择。先照顾我的生活。", response: scene.pass?.[1] || "你把这件事留到以后再想。没有人有权把沉默当作同意。故事仍然向前走。", kind: "pass", next: scene.pass?.[2] });
      scenes[scene.id] = scene;
    });
  }
  function choice(label, response, person, effect = 1, extra = {}) { return { label, response, person, effect, ...extra }; }
  function create(name, seed) {
    return { version: 3, name: name.trim().slice(0, 12) || "夏宁", scene: "c01", page: 0, pending: null, seed: seed >>> 0,
      relationship: Object.fromEntries(Object.keys(people).map(k => [k, 0])), trust: Object.fromEntries(Object.keys(people).map(k => [k, 0])),
      flags: {}, evidence: [], gallery: ["lz1"], journal: [], work: 0, route: null, ending: null };
  }
  function select(state, optionId) {
    if (state.pending || state.ending) throw Error("请继续当前回合。");
    const scene = scenes[state.scene], option = scene?.choices.find(o => o.id === optionId);
    if (!option) throw Error("选项不存在。");
    if (option.require && !option.require(state)) throw Error("尚未满足选项条件。");
    const s = JSON.parse(JSON.stringify(state));
    if (option.person) {
      s.relationship[option.person] += option.effect || 0;
      s.trust[option.person] += option.trust || 0;
    }
    if (option.flags) Object.assign(s.flags, option.flags);
    if (option.work) s.work += option.work;
    if (option.evidence && !s.evidence.includes(option.evidence)) s.evidence.push(option.evidence);
    if (option.route) s.route = option.route;
    const next = option.next || scene.next;
    const person = option.person || scene.focus;
    const witnesses = option.witnesses || scene.witnesses || [];
    const response = typeof option.response === "function" ? option.response(s) : option.response;
    s.pending = { response, next, art: option.art || scene.art, person, kind: option.kind, witnesses, ending: option.ending || (next === "final" ? (s.route && s.route !== "all" ? "open" : "solo") : null) };
    s.journal.push({ scene: scene.id, title: scene.title, choice: option.label, response, kind: option.kind });
    return s;
  }
  function advance(state) {
    if (!state.pending) throw Error("请先作出选择。");
    const s = JSON.parse(JSON.stringify(state));
    const p = s.pending; s.pending = null; s.page = 0;
    if (p.ending) { s.ending = resolveEnding(s, p.ending); return s; }
    s.scene = p.next;
    if (!scenes[s.scene]) throw Error(`尚未编写场景 ${s.scene}`);
    for (const art of [scenes[s.scene].art, ...(scenes[s.scene].inserts || [])]) if (art && !s.gallery.includes(art)) s.gallery.push(art);
    return s;
  }
  function resolveEnding(s, requested) {
    requested = ({ together: "he", part: "be" })[requested] || requested;
    if (requested === "late-zhou" && ["gu", "lu", "wen"].includes(s.route)) return `${s.route}-late-zhou`;
    if (requested === "solo" || requested === "asura") return requested;
    const r = s.route;
    if (requested === "he" && s.trust[r] >= 3 && s.flags[`${r}Resolved`]) return `${r}-he`;
    if (requested === "be") return `${r}-be`;
    return `${r}-oe-${s.seed % 3}`;
  }
  function valid(s) {
    const own = (obj,key) => typeof key === "string" && Object.prototype.hasOwnProperty.call(obj,key);
    return !!s && s.version === 3 && typeof s.name === "string" && s.name.length <= 12 &&
      Number.isInteger(s.seed) && s.seed >= 0 && s.seed <= 4294967295 && Number.isInteger(s.page) && s.page >= 0 && own(scenes,s.scene) &&
      Object.keys(people).every(k => Number.isFinite(s.relationship?.[k]) && Number.isFinite(s.trust?.[k])) &&
      [null,"all",...Object.keys(people)].includes(s.route) && Number.isFinite(s.work) &&
      Array.isArray(s.evidence) && s.evidence.every(x=>typeof x === "string") && Array.isArray(s.gallery) && s.gallery.every(x=>own(assets,x)) &&
      Array.isArray(s.journal) && s.journal.length <= 5000 && s.journal.every(x=>x && typeof x.title === "string" && typeof x.choice === "string" && typeof x.response === "string") &&
      !!s.flags && typeof s.flags === "object" && !Array.isArray(s.flags) &&
      (!s.pending || (typeof s.pending.response === "string" && own(assets,s.pending.art) && Array.isArray(s.pending.witnesses) && s.pending.witnesses.every(w=>w && typeof w.text === "string" && (!w.who || own(people,w.who))) && (own(scenes,s.pending.next) || s.pending.ending))) && (!s.ending || own(endings,s.ending));
  }
  return { people, assets, scenes, endings, add, choice, create, select, advance, resolveEnding, valid };
})();
