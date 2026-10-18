"use strict";
(() => {
  const G = window.HEART_GROWTH, KEY = "heart-unread-growth-v1";
  const $ = id => document.getElementById(id), copy = value => JSON.parse(JSON.stringify(value));
  const arts = {
    "heroine-straight": "黑色长直发的你站在春日街道上", "heroine-blacknight": "夜晚灯光下，你留出一段独处的时间",
    "gu-glasses": "戴金丝框眼镜的顾砚", "zhou-parted": "三七分发型的周予白", "lu-swept": "排练间隙的陆星野", "wen-sidepart": "银灰侧分头发的闻照"
  };
  let state = null, intro = 3, history = [], group = null, artID = "heroine-straight", artRequest = 0, toastTimer, loadingTimer, storageWarned = false, returnFocus;
  const imageCache = new Map(), reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function el(tag, text, className) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; }
  function button(text, action, className = "sheet-button") { const n = el("button", text, className); n.type = "button"; n.onclick = action; return n; }
  function toast(text) { clearTimeout(toastTimer); $("toast").textContent = text; $("toast").hidden = false; toastTimer = setTimeout(() => { $("toast").hidden = true; }, 3000); }
  function read() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
  function valid(record) { return !!record && record.version === 1 && G.valid(record.state) && Number.isInteger(record.intro) && record.intro >= 0 && record.intro <= 3 && Array.isArray(record.history) && record.history.length <= 24 && record.history.every(r => r && G.valid(r.state) && Number.isInteger(r.intro) && r.intro >= 0 && r.intro <= 3); }
  function pack() { return { version: 1, state, intro, history }; }
  function save() { if (!state) return; try { localStorage.setItem(KEY, JSON.stringify(pack())); $("save-indicator").title = "本样章已自动保存"; } catch { if (!storageWarned) { storageWarned = true; toast("浏览器暂时不能保存，可在菜单里导出这一周。"); } } }
  function restore(record) { if (!valid(record)) return false; state = copy(record.state); intro = record.intro; history = copy(record.history); group = null; return true; }
  function imageURL(id, extension = "webp") { return "v3-" + id + "." + extension; }
  function loadImage(id) {
    if (imageCache.has(id)) return imageCache.get(id);
    const task = new Promise((resolve, reject) => { const image = new Image(); let fallback = false; image.onload = () => resolve(image.src); image.onerror = () => { if (fallback) reject(Error(id)); else { fallback = true; image.src = imageURL(id, "jpg"); } }; image.src = imageURL(id); });
    imageCache.set(id, task); task.catch(() => imageCache.delete(id)); return task;
  }
  async function art(id) {
    const request = ++artRequest; clearTimeout(loadingTimer); $("loading-note").hidden = true;
    if (id === artID && $("artwork").complete && $("artwork").naturalWidth) return;
    loadingTimer = setTimeout(() => { if (request === artRequest) $("loading-note").hidden = false; }, 800);
    try { const url = await loadImage(id); if (request !== artRequest) return; clearTimeout(loadingTimer); $("loading-note").hidden = true; $("artwork").src = url; $("artwork").alt = arts[id]; $("artwork").dataset.art = id; $("scene-wash").style.backgroundImage = 'url("' + url + '")'; artID = id; if (!reduced.matches) $("artwork").animate([{ opacity: .6 }, { opacity: 1 }], { duration: 180 }); }
    catch { if (request === artRequest) { clearTimeout(loadingTimer); $("loading-note").hidden = true; toast("这张画面未能加载，仍可继续；下次切换时会重试。"); } }
  }
  function clearPanel(kicker, title, text) { const panel = $("panel"); panel.replaceChildren(); panel.hidden = false; panel.dataset.start = "false"; if (kicker) panel.append(el("p", kicker, "growth-kicker")); panel.append(el("h2", title)); if (text) panel.append(el("p", text, "growth-description")); panel.scrollTop = 0; return panel; }
  function showSheet(title, fill) { returnFocus = document.activeElement; $("sheet-title").textContent = title; const body = $("sheet-body"); body.replaceChildren(); fill(body); if (!$("sheet").open) $("sheet").showModal(); body.scrollTop = 0; }
  function closeSheet() { $("sheet").close(); if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); }
  function choose(groupID, id) { try { const result = groupID === "evening" ? G.decide(state, id) : G.act(state, groupID, id); history.push({ state: copy(state), intro }); history = history.slice(-24); state = result; group = null; save(); render(); } catch (error) { toast(error.message); } }
  function advance() {
    if ($("sheet").open || !state) return;
    if (intro < 3) { intro++; save(); render(); return; }
    if (state.phase === "feedback") { state = G.next(state); save(); render(); }
  }
  function undo() { const previous = history.pop(); if (!previous) return; state = previous.state; intro = previous.intro; group = null; save(); closeSheet(); render(); toast("已回到上一个安排之前；费用和时间也已还原。"); }
  function start(seed, origin, name) { state = G.create(name, seed, origin); history = []; group = null; intro = 0; save(); render(); }
  function newSeed() { const numbers = new Uint32Array(1); if (window.crypto?.getRandomValues) crypto.getRandomValues(numbers); else numbers[0] = Date.now() >>> 0; return numbers[0]; }
  function showStart() {
    $("theater").dataset.mode = "start"; $("dialogue").hidden = true; $("advance-surface").disabled = true; $("growth-status").hidden = true; $("week-button").hidden = !state;
    $("day-number").textContent = "七日"; $("day-label").textContent = "从自己的生活开始"; $("place-label").textContent = "上海 · 自由设计师"; art("heroine-straight");
    const panel = clearPanel("一周之后，会留下什么？", "把日子过成自己的", "你从北京来到上海做自由设计。这一周，房租要交，客户会催稿，你还想做一本属于自己的小册。"); panel.dataset.start = "true";
    panel.firstElementChild.nextElementSibling.replaceWith(el("h1", "把日子过成自己的"));
    if (state) { panel.append(button("继续这一周 · " + G.days[state.day - 1], () => render(), "sheet-button primary block")); panel.append(el("p", "下方开始会替换本样章进度。可先在菜单里导出；长篇存档独立保留。", "growth-small")); }
    const form = el("form", undefined, "growth-form"); const nameLabel = el("label", "怎么称呼你"); nameLabel.htmlFor = "growth-name";
    const name = el("input"); name.id = "growth-name"; name.name = "name"; name.maxLength = 12; name.value = state?.name || "夏宁"; name.autocomplete = "off";
    const originLabel = el("label", "这一周从哪里开始"); originLabel.htmlFor = "growth-origin"; const origin = el("select"); origin.id = "growth-origin"; origin.name = "origin";
    const random = el("option", "让这一周的起点自己出现"); random.value = ""; origin.append(random);
    for (const [id, data] of Object.entries(G.origins)) { const item = el("option", data.title + " · ¥" + data.cash); item.value = id; origin.append(item); }
    const submit = el("button", state ? "开始新的一周" : "从这个早晨开始", "sheet-button primary"); submit.type = "submit";
    form.append(nameLabel, name, originLabel, origin, submit); form.onsubmit = event => { event.preventDefault(); start(newSeed(), origin.value, name.value); }; panel.append(form);
    panel.append(el("p", "每天两个时段，学习、接稿、创作和见人都占用时间。日常开支 ¥60 / 天，周日决定工作空间。你随时可以把一段时间留给休息。", "growth-small"));
    panel.append(el("p", "这是独立的七日玩法样章。此处成长尚未接入长篇的全部剧情。", "growth-small"));
  }
  function optionList(panel, choices, groupID) {
    const list = el("div", undefined, "growth-list");
    for (const o of choices) { const node = button("", () => choose(groupID, o.id), "growth-option"); node.dataset.choice = o.id; node.disabled = !!o.blocked; node.append(el("strong", o.label), el("small", o.note)); if (groupID !== "evening") node.append(el("small", `1 个时段 · ${o.cash ? "¥" + o.cash : "不花钱"}${o.energy ? " · 精力 −" + o.energy : ""}`, "cost")); if (o.blocked) node.append(el("small", o.blocked, "blocked")); list.append(node); }
    panel.append(list);
  }
  function planner() {
    const slot = state.slot === 0 ? "上午" : "下午", active = state.active && G.jobs[state.active.id];
    const panel = clearPanel("" + G.days[state.day - 1] + " · " + slot, group ? G.groups(state).find(g => g.id === group)?.title || "这一段时间" : "这一段时间，留给什么？", group ? "" : "每个安排占用一个时段。做过的事会留下，错过的时间也会。" );
    if (group) { const back = button("〈 回到今天的安排", () => { group = null; render(); }, "growth-back"); panel.prepend(back); if (group === "jobs") panel.append(el("p", "接洽 → 做方案 → 交付，共三个时段。只接单不会收到稿费；报价前可以先学习。", "growth-description")); if (group === "project") panel.append(el("p", `${active.client}：${active.brief}\n方案质量 ${state.active.quality} / ${active.target}；${G.days[active.deadline - 1]}截止。`, "growth-description")); optionList(panel, G.options(state, group), group); }
    else {
      if (active) panel.append(el("p", `${active.title} · ${G.days[active.deadline - 1]}截止 · 尚需 ${3 - state.active.stage} 个步骤${state.active.id === "wayfinding" ? "（周日现场验收）" : ""}`, "growth-focus"));
      const list = el("div", undefined, "growth-list"); for (const item of G.groups(state)) { const node = button("", () => { group = item.id; render(); }, "growth-option"); node.dataset.group = item.id; node.append(el("strong", item.title), el("small", item.note)); list.append(node); } panel.append(list);
    }
    art("heroine-straight");
  }
  function showEvening() { const event = G.evening(state), panel = clearPanel(G.days[state.day - 1] + " · 入夜", event.title, event.text); optionList(panel, event.choices, "evening"); art("heroine-blacknight"); }
  function dialogue(lines, index, title, speaker) { $("panel").hidden = true; $("dialogue").hidden = false; $("advance-surface").disabled = false; $("speaker").textContent = speaker; $("speaker-caption").textContent = title; $("page-mark").textContent = String(index + 1).padStart(2, "0") + " / " + String(lines.length).padStart(2, "0"); $("dialogue-text").textContent = lines[index]; $("next-label").textContent = index === lines.length - 1 ? "继续安排生活" : "点击继续"; }
  function endPanel() {
    const e = state.ending, panel = clearPanel("七日之后 · " + ({ studio: "新的合作", author: "自己的名字", restart: "换一种继续", steady: "日常也有重量" }[e.id]), e.title);
    panel.append(el("p", e.text, "growth-ending-copy")); panel.append(el("p", "下一周的工作桌：" + ({ stay: "保留现在的工作室", share: "换到共享工位", home: "先带回住处" }[state.flags.housing]), "growth-description")); const metrics = el("div", undefined, "growth-metrics");
    for (const [value, label] of [["¥" + state.cash, "扣除最后一天开支后"], [state.works.length, "完成的作品"], [state.completed.length, "真实交付"]]) { const card = el("div", undefined, "growth-metric"); card.append(el("b", String(value)), el("small", label)); metrics.append(card); } panel.append(metrics);
    panel.append(el("p", "看看这个结果是怎样发生的", "growth-description")); const steps = el("ol", undefined, "growth-steps");
    for (const r of e.reasons.slice(-5)) { const li = el("li"); li.append(el("strong", G.days[r.day - 1] + " · " + r.title), el("small", r.cause)); steps.append(li); } panel.append(steps);
    panel.append(button("回看这一周的积累与取舍", ledger, "sheet-button block"), button("相同起点，换一种安排", () => start(state.seed, state.origin, state.name), "sheet-button primary block"), button("让新的一周从另一种起点开始", showStart, "sheet-button block"));
    panel.append(el("p", "相同起点重来，会保留本周的外部事件条件。生活走向的差别，来自你换过的安排。", "growth-small")); art("heroine-straight");
  }
  function render() {
    if (!state) { showStart(); return; }
    $("theater").dataset.mode = intro < 3 ? "feedback" : state.phase; $("theater").dataset.day = String(state.day); $("theater").dataset.phase = state.phase;
    $("panel").hidden = true; $("dialogue").hidden = true; $("advance-surface").disabled = true; $("growth-status").hidden = false; $("week-button").hidden = false;
    $("day-number").textContent = String(state.day).padStart(2, "0"); $("day-label").textContent = G.days[state.day - 1] + " · " + (state.phase === "end" ? "一周之后" : state.slot === 2 ? "入夜" : state.slot === 0 ? "上午" : "下午"); $("place-label").textContent = state.name + " · 上海";
    $("cash-status").textContent = "余额 ¥" + state.cash; $("energy-status").textContent = "精力 " + state.energy; $("strain-status").textContent = "负荷 " + state.strain; $("cash-status").dataset.low = state.cash < 300; $("energy-status").dataset.low = state.energy < 18; $("strain-status").dataset.low = state.strain >= 55;
    if (intro < 3) { const lines = [G.origins[state.origin].intro, "你在上海租了一间工作室。客户的消息和自己的草稿都在桌上，这一周的时间需要自己安排。", "会的方法可以用到下一笔稿，完成的作品可以带来新机会。可日历只有这些空格，不能把每条路都走一遍。"]; dialogue(lines, intro, "一个普通的早晨", state.name); art("heroine-straight"); }
    else if (state.phase === "plan") planner();
    else if (state.phase === "evening") showEvening();
    else if (state.phase === "end") endPanel();
    else { const f = state.feedback; dialogue(f.lines, f.index, f.title, f.speaker === "旁白" ? state.name : f.speaker); art(f.art); }
  }
  function ledger() {
    if (!state) return;
    showSheet("做过的事，会留下", body => {
      body.append(el("p", G.origins[state.origin].title + " · 同一周的外部条件编号 " + state.seed, "sheet-description"));
      const metrics = el("div", undefined, "growth-metrics"); for (const [id, name] of Object.entries(G.skills)) { const card = el("div", undefined, "growth-metric"); card.append(el("b", String(state.skills[id])), el("small", name)); metrics.append(card); } body.append(metrics);
      body.append(el("p", "设计达到 2 能独立做信息层级；达到 3 且交付过委托，可争取导视提案。观察达到 2 能按现场做方案；沟通达到 2 能守住新增需求的报价。个人小册质量来自设计与观察之和。", "sheet-description"));
      body.append(el("h3", "眼下的账与日历")); const calendar = el("ul", undefined, "growth-ledger");
      for (const [title, detail] of [["余额 ¥" + state.cash, "每天夜间扣除 ¥60 日常开支。周日工作室续租 ¥1800，或共享工位 ¥1000，也可先不租空间。"], ["精力 " + state.energy + " · 负荷 " + state.strain, "夜间最多恢复 18 精力；负荷达到 55 时只恢复 10。认真休息能恢复精力、降低负荷。"], ["周日的两件事", "书展布撤场和摆摊用全天；导视提案必须周日现场验收。确认书展就无法拿到这笔提案稿费。"]]) { const li = el("li"); li.append(el("strong", title), el("small", detail)); calendar.append(li); }
      if (state.active) { const j = G.jobs[state.active.id], li = el("li"); li.append(el("strong", "手头的委托 · " + j.title), el("small", `${G.days[j.deadline - 1]}截止，方案质量 ${state.active.quality} / ${j.target}，尚需 ${3 - state.active.stage} 个步骤。`)); calendar.append(li); } body.append(calendar);
      body.append(el("h3", "真正完成的作品")); const works = el("ul", undefined, "growth-ledger");
      for (const work of state.works) { const li = el("li"); li.append(el("strong", work.title), el("small", (work.kind === "personal" ? "个人作品" : "客户已验收") + " · 质量 " + work.quality)); works.append(li); } if (!state.works.length) works.append(el("li", state.personal === 1 ? "小册还在整理中，已完成一个创作时段。" : "还没有完成的作品，学习和草稿会继续保留。")); body.append(works);
      body.append(el("h3", "这条路是怎样走出来的")); const journal = el("ul", undefined, "growth-ledger");
      for (const r of [...state.journal].reverse()) { const li = el("li"); li.append(el("strong", `${G.days[r.day - 1]} · ${r.title}`), el("small", r.text + (r.cause ? "\n留下的影响：" + r.cause : ""))); journal.append(li); } if (!state.journal.length) journal.append(el("li", "今天还没有作出的安排。")); body.append(journal);
    });
  }
  function exportSave() { const blob = new Blob([JSON.stringify(pack(), null, 2)], { type: "application/json" }), url = URL.createObjectURL(blob); const a = el("a"); a.href = url; a.download = "心动未读-成长样章.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast("已导出本样章进度。"); }
  function menu() { showSheet("这一页，听你的", body => { body.append(el("p", "成长样章单独自动保存，仅在当前浏览器。这里的进度不会替换长篇存档。", "growth-menu-note")); if (state) { body.append(button("看这一周的积累", ledger, "sheet-button block")); const back = button("回到上一个安排之前", undo, "sheet-button block"); back.disabled = !history.length; body.append(back, button("导出成长样章进度", exportSave, "sheet-button block")); } body.append(button("导入成长样章进度", () => $("import-file").click(), "sheet-button block"), button("从新的一周开始", () => { closeSheet(); showStart(); }, "sheet-button block")); body.append(el("p", "每天两个安排时段；晚间作一次决定，然后结算日常开支和休息。课程、创作与见人都真实消耗时段。这里没有恋爱分数门槛，工作机会也可以靠自己的学习获得。", "growth-small")); }); }
  $("import-file").onchange = async event => { const file = event.target.files[0]; event.target.value = ""; if (!file) return; try { if (file.size > 250000) throw Error("文件太大，请选择本样章导出的存档。"); const record = JSON.parse(await file.text()); if (!restore(record)) throw Error("这份文件不是有效的成长样章存档，当前进度已保留。"); save(); closeSheet(); render(); toast("已恢复这一周的进度。"); } catch (error) { toast(error.message === "Unexpected end of JSON input" || error instanceof SyntaxError ? "无法读取这份存档，当前进度已保留。" : error.message); } };
  $("menu-button").onclick = menu; $("week-button").onclick = ledger; $("close-sheet").onclick = closeSheet; $("next").onclick = event => { event.stopPropagation(); advance(); }; $("dialogue").onclick = advance; $("advance-surface").onclick = advance;
  document.addEventListener("keydown", event => { if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || $("sheet").open || /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(event.target.tagName)) return; if (event.key === " " || event.key === "Enter") { event.preventDefault(); advance(); } });
  const previous = read(); if (restore(previous)) render(); else showStart();
})();
