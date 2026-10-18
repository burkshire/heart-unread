"use strict";
(() => {
  const G = window.HEART_SCHOOL, D = window.HEART_SCHOOL_DATA, KEY = "heart-unread-school-v1", PREFS = KEY + "-prefs";
  const $ = id => document.getElementById(id), copy = value => JSON.parse(JSON.stringify(value));
  const artDescriptions = {
    "school-heroine": "教室窗边，黑色长直发的你翻开自己的草稿本", "school-zhou": "周予白坐在教室里，安静地整理手中的纸模型", "school-friends": "你和女生朋友们放学后留在一起聊天", "beijing-home": "家里的书桌与日常物件", "wen-sidepart": "公开展览中，一位银灰色头发的低年级学生"
  };
  let state = null, undo = [], group = null, currentArt = "", imageRequest = 0, toastTimer, loadingTimer, storageWarning = false, returnFocus;
  let fontSize = 21;
  const imageCache = new Map(), reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  function el(tag, text, className) { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (className) n.className = className; return n; }
  function button(text, action, className = "sheet-button") { const n = el("button", text, className); n.type = "button"; n.onclick = action; return n; }
  function toast(text) { clearTimeout(toastTimer); $("toast").textContent = text; $("toast").hidden = false; toastTimer = setTimeout(() => { $("toast").hidden = true; }, 3000); }
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  function valid(record) { return !!record && record.version === 1 && G.valid(record.state) && Array.isArray(record.undo) && record.undo.length <= 12 && record.undo.every(G.valid); }
  function record() { return { version: 1, state, undo }; }
  function save() {
    if (!state) return;
    try { localStorage.setItem(KEY, JSON.stringify(record())); $("saved").title = "高中篇已自动保存"; }
    catch { if (!storageWarning) { storageWarning = true; toast("浏览器暂时不能保存，可在菜单里导出高中进度。"); } }
  }
  function restore(value) { if (!valid(value)) return false; state = copy(value.state); undo = copy(value.undo); group = null; return true; }
  function imageURL(id, extension = "webp") { return "v3-" + id + "." + extension; }
  function schoolArt(id) {
    if (Object.hasOwn(artDescriptions, id)) return id;
    if (id === "zhou" || id.startsWith("zhou-") || id === "lz5" || id === "lz6") return "school-zhou";
    if (id === "lz2") return "school-friends";
    return "school-heroine";
  }
  function loadImage(id) {
    if (imageCache.has(id)) return imageCache.get(id);
    const task = new Promise((resolve, reject) => { const image = new Image(); let fallback = false; image.onload = () => resolve(image.src); image.onerror = () => { if (fallback) reject(Error(id)); else { fallback = true; image.src = imageURL(id, "jpg"); } }; image.src = imageURL(id); });
    imageCache.set(id, task); task.catch(() => imageCache.delete(id)); return task;
  }
  async function showArt(rawID, keyboard = false) {
    const id = schoolArt(rawID), request = ++imageRequest;
    clearTimeout(loadingTimer); $("loading-note").hidden = true;
    if (currentArt === id && $("artwork").complete && $("artwork").naturalWidth) return;
    loadingTimer = setTimeout(() => { if (request === imageRequest) $("loading-note").hidden = false; }, 800);
    try {
      const url = await loadImage(id); if (request !== imageRequest) return;
      clearTimeout(loadingTimer); $("loading-note").hidden = true; $("artwork").src = url; $("artwork").alt = artDescriptions[id]; $("artwork").dataset.art = id;
      $("scene-wash").style.backgroundImage = 'url("' + url + '")'; $("theater").dataset.shape = id === "school-friends" ? "wide" : "portrait"; currentArt = id;
      if (!keyboard && !reducedMotion.matches) $("artwork").animate([{ opacity: .65 }, { opacity: 1 }], { duration: 170, easing: "cubic-bezier(.23,1,.32,1)" });
    } catch { if (request === imageRequest) { clearTimeout(loadingTimer); $("loading-note").hidden = true; toast("这张画面没有加载成功，仍可继续。下一次切换时会重试。"); } }
  }
  function sheet(title, fill) {
    returnFocus = document.activeElement; $("sheet-title").textContent = title; $("sheet-body").replaceChildren(); fill($("sheet-body"));
    if (!$("sheet").open) $("sheet").showModal(); $("sheet-body").scrollTop = 0;
  }
  function closeSheet() { $("sheet").close(); if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); }
  function panel(kicker, title, description) {
    const n = $("panel"); n.replaceChildren(); n.hidden = false; n.dataset.start = "false";
    n.append(el("p", kicker, "growth-kicker"), el("h2", title)); if (description) n.append(el("p", description, "growth-description")); n.scrollTop = 0; return n;
  }
  function mutate(fn) {
    try { const next = fn(); if (!G.valid(next)) throw Error("这一页暂时没有准备好，当前进度已保留。"); undo.push(copy(state)); undo = undo.slice(-12); state = next; group = null; save(); render(); }
    catch (error) { toast(error.message); }
  }
  function advance(keyboard = false) {
    if (!state || $("sheet").open || !["story", "feedback"].includes(state.phase)) return;
    try { state = G.advance(state); save(); render(keyboard); } catch (error) { toast(error.message); }
  }
  function start(name, seed) { state = G.create(name, seed); undo = []; group = null; save(); render(); }
  function randomSeed() { const n = new Uint32Array(1); if (window.crypto?.getRandomValues) crypto.getRandomValues(n); else n[0] = Date.now() >>> 0; return n[0]; }
  function termStrip(parent) {
    const n = el("div", undefined, "school-chapter-strip");
    D.terms.forEach((name, index) => { const item = el("span", name.replace("·", "\n"), "school-term"); const current = state ? D.stages[state.stage].term : 0; if (index === current) { item.classList.add("current"); item.setAttribute("aria-current", "step"); } else if (index < current) item.classList.add("finished"); n.append(item); }); parent.append(n);
  }
  function showStart() {
    $("theater").dataset.mode = "start"; $("dialogue").hidden = true; $("advance-surface").disabled = true; $("status").hidden = true; $("journal-button").hidden = !state;
    $("stage-number").textContent = "序"; $("term-label").textContent = "高一 · 入学以前"; $("stage-label").textContent = "鹅市 · 春和高中";
    const n = panel("写给还不知道答案的你", "未定的三年"); n.dataset.start = "true"; n.querySelector("h2").replaceWith(el("h1", "未定的三年"));
    n.append(el("p", "先找到喜欢的事，再慢慢决定以后。", "school-subtitle"), el("p", "新校服还没有洗过，教室的座位表还没贴好。你带着一只没装满的书包，站在高中生活的门口。", "school-start-copy"));
    if (state) { n.append(button("继续这三年 · " + D.terms[D.stages[state.stage].term], () => render(), "sheet-button primary block"), el("p", "开始新进度会替换当前高中进度；可先在菜单里导出。", "growth-small")); }
    termStrip(n);
    const form = el("form", undefined, "growth-form"), label = el("label", "在这本手账上写下你的名字"); label.htmlFor = "school-name";
    const name = el("input"); name.id = "school-name"; name.name = "name"; name.maxLength = 12; name.value = state?.name || "夏宁"; name.autocomplete = "off";
    const submit = el("button", state ? "重新走进高一" : "走进高一的教室", "sheet-button primary"); submit.type = "submit";
    form.append(label, name, submit); form.onsubmit = event => { event.preventDefault(); start(name.value, randomSeed()); }; n.append(form);
    n.append(el("p", "每学期四段生活，每段两次课余安排。交朋友、学东西、做作品、追星或休息，都会留下不同的积累。", "growth-small"), el("p", "周予白会出现，但你不必把青春的答案交给他。三年后，再认真选择高考或香港留学的下一站。", "growth-small")); showArt("school-heroine");
  }
  function choiceList(parent, options, handler, type) {
    const list = el("div", undefined, "growth-list");
    for (const item of options) {
      const node = button("", () => handler(item.id), "growth-option"); node.dataset.choice = item.id; node.dataset.kind = type || "choice"; node.disabled = !!item.blocked;
      node.append(el("strong", item.label)); if (item.note) node.append(el("small", item.note));
      if (type === "action") { const cash = Number(item.cash || 0), energy = Number(item.energy || 0); node.append(el("small", `1 个课余时段 · ${cash > 0 ? "¥" + cash : cash < 0 ? "+¥" + -cash : "不花钱"}${energy > 0 ? " · 精力 −" + energy : ""}`, "cost")); }
      if (item.blocked) node.append(el("small", String(item.blocked), "blocked")); list.append(node);
    } parent.append(list);
  }
  function planner(view) {
    const groups = G.groups(state), selected = groups.find(g => g.id === group); if (!selected) group = null;
    const n = panel(view.kicker, selected?.title || "这段课余时间，想怎样过？", selected ? selected.note : "课堂照常进行。这里安排的是属于你的课余时间，每个阶段可以做两件事。");
    if (selected) {
      n.prepend(button("〈 回到课余安排", () => { group = null; render(); }, "growth-back"));
      choiceList(n, G.options(state, group), id => mutate(() => G.act(state, group, id)), "action");
    } else {
      n.append(el("p", `本阶段剩余 ${2 - state.slot} 个课余时段。兴趣可以改变，尝试过的东西会记在手账里。`, "school-stage-note"));
      const grid = el("div", undefined, "school-grid");
      for (const item of groups) { const node = button("", () => { group = item.id; render(); }, "growth-option"); node.dataset.group = item.id; node.append(el("strong", item.title), el("small", item.note)); grid.append(node); } n.append(grid);
    }
  }
  function eventChoices(view) { const stage = D.stages[state.stage], n = panel(view.kicker, view.title || stage.title, stage.prompt); choiceList(n, G.choices(state), id => mutate(() => G.choose(state, id))); }
  function reflection(view) {
    const text = ["不是每个认识的人都要成为最好的朋友。看看真正一起经历过什么，再决定怎样称呼这段关系。", "喜欢的方向来自试过、做过，也可能来自发现自己不喜欢什么。此刻还不确定，也可以保留继续探索的空间。", "你可以保留喜欢、回到同学关系，或者决定不再猜他的心情。这里的回答不会替你选择升学。"];
    const n = panel("毕业以前 · 认真想一次", view.title || "把自己的感受说清楚", text[state.reflectionStep] || "再看一眼这三年留下的东西。");
    n.append(button("先翻翻三年的手账", journal, "sheet-button block"), el("p", "", "growth-small")); choiceList(n, G.reflection(state), id => mutate(() => G.reflect(state, id)));
  }
  function graduation(view) {
    const n = panel("高三毕业 · 下一站由你选择", view.title || "把名字写在自己的路上", "你已经走过六个学期。现在作出的选择，属于认真经历过、也认真想过的你。");
    n.append(button("看看我为什么走到这里", journal, "sheet-button block"), el("p", "", "growth-small"));
    choiceList(n, [
      { id: "gaokao", label: "高考", note: "进入高考系统衔接点。高中经历完整保留；考试规则会在后续版本接入，本版不生成成绩或录取结果。" },
      { id: "hongkong", label: "香港留学", note: "开始赴港升学计划，先在公开活动中遇见闻照。申请材料与现实录取要求不由一个选项替代。" }
    ], id => mutate(() => G.graduate(state, id)));
  }
  function addSummary(parent, item, fallback) { if (!item) return; const section = el("section", undefined, "school-summary-section"); section.append(el("h3", item.name || fallback), el("p", item.text || "")); parent.append(section); }
  function ending() {
    const result = G.summary(state), n = panel("高中篇 · 完", result.title || "下一页，也可以慢慢写"); n.querySelector("h2").classList.add("school-ending-title");
    for (const line of result.lines || []) n.append(el("p", line, "growth-ending-copy"));
    for (const [key, label] of [["friend", "一起长大的人"], ["direction", "想继续探索的方向"], ["hobby", "留给喜欢的东西"], ["zhou", "关于周予白"], ["path", "下一站"]]) addSummary(n, result[key], label);
    const actions = el("div", undefined, "school-ending-actions"); actions.append(button("回看三年的选择与作品", journal), button("相同起点，过另一种高中生活", () => start(state.name, state.seed), "sheet-button primary"), button("导出这段高中经历", exportSave));
    const city = el("a", "城市长篇（旧版与原存档）", "sheet-button"); city.href = "city.html"; city.dataset.cityLink = ""; actions.append(city); n.append(actions);
    n.append(el("p", "高中经历已单独保存。高考与大学阶段的具体系统将按后续设定继续衔接，旧城市篇仍使用原有进度。", "growth-small"));
  }
  function render(keyboard = false) {
    if (!state) { showStart(); return; }
    const view = G.view(state), stage = D.stages[state.stage]; $("theater").dataset.mode = state.phase; $("theater").dataset.phase = state.phase; $("theater").dataset.stage = String(state.stage);
    $("panel").hidden = true; $("dialogue").hidden = true; $("advance-surface").disabled = true; $("status").hidden = false; $("journal-button").hidden = false;
    $("stage-number").textContent = String(state.stage + 1).padStart(2, "0"); $("term-label").textContent = D.terms[stage.term]; $("stage-label").textContent = stage.time + " · " + (state.phase === "plan" ? (state.slot === 0 ? "第一段课余" : "第二段课余") : stage.title);
    $("cash-status").textContent = "零用钱 ¥" + state.cash; $("energy-status").textContent = "精力 " + state.energy; $("pressure-status").textContent = "压力 " + state.pressure; $("cash-status").dataset.low = state.cash < 20; $("energy-status").dataset.low = state.energy < 16;
    if (["story", "feedback"].includes(state.phase)) {
      $("dialogue").hidden = false; $("advance-surface").disabled = false; $("speaker").textContent = !view.speaker || view.speaker === "旁白" ? "旁白" : view.speaker.replaceAll("{name}", state.name); $("caption").textContent = view.title;
      $("dialogue-text").textContent = (view.lines[view.index] || "").replaceAll("{name}", state.name); $("page-mark").textContent = String(view.index + 1).padStart(2, "0") + " / " + String(view.lines.length).padStart(2, "0"); $("next-label").textContent = view.index < view.lines.length - 1 ? "点击继续" : "继续这一段生活";
    } else if (state.phase === "plan") planner(view);
    else if (state.phase === "choice") eventChoices(view);
    else if (state.phase === "reflect") reflection(view);
    else if (state.phase === "graduate") graduation(view);
    else ending();
    showArt(view.art || stage.art, keyboard);
  }
  function journal() {
    if (!state) return;
    sheet("这些经历，渐渐成了我", body => {
      body.append(el("p", D.terms[D.stages[state.stage].term] + " · " + D.stages[state.stage].title, "sheet-description")); termStrip(body);
      const metrics = el("div", undefined, "growth-metrics");
      for (const [key, fallback] of [["study", "学习方法"], ["express", "表达"], ["logic", "逻辑"], ["craft", "动手创作"]]) { const card = el("div", undefined, "growth-metric"); card.append(el("b", String(state.skills[key])), el("small", G.skills?.[key] || fallback)); metrics.append(card); } body.append(metrics);
      body.append(el("h3", "试过以后，才慢慢喜欢"));
      for (const [id, direction] of Object.entries(D.directions)) { const box = el("section", undefined, "school-interest"); box.append(el("strong", direction.name), el("p", direction.description)); const track = el("div", undefined, "school-track"), fill = el("span"); fill.style.width = Math.min(100, state.interests[id] / 30 * 100) + "%"; track.append(fill); const count = state.works.filter(w => w.direction === id).length; box.append(track, el("small", "探索积累 " + state.interests[id] + " · 完成作品 " + count + "\n可继续了解：" + direction.majors.join(" / "), "school-track-note")); body.append(box); }
      body.append(el("h3", "一起长大的人")); const friends = el("ul", undefined, "growth-ledger");
      for (const [id, person] of Object.entries(D.friends)) { const li = el("li"); li.append(el("strong", person.name + (state.chosenFriend === id ? " · 你认真认定的朋友" : "")), el("small", person.description + "\n一起相处的积累：" + state.friends[id])); friends.append(li); } body.append(friends);
      body.append(el("h3", "亲手完成的东西")); const works = el("ul", undefined, "growth-ledger");
      for (const work of state.works) { const li = el("li"); li.append(el("strong", work.title), el("small", D.directions[work.direction].name + " · 质量 " + work.quality + (work.presented ? " · 已展示" : " · 暂时留在作品夹里"))); works.append(li); } if (!state.works.length) works.append(el("li", "还没有完成的作品。尝试、草稿和自己的感受也会留在记录里。")); body.append(works);
      body.append(el("h3", "从那些小事走到这里")); const history = el("ul", undefined, "growth-ledger");
      for (const item of [...state.journal].reverse()) { const li = el("li"); li.append(el("strong", D.terms[D.stages[item.stage].term] + " · " + item.title), el("small", item.text + (item.cause ? "\n留下的影响：" + item.cause : ""))); history.append(li); } if (!state.journal.length) history.append(el("li", "新的故事还没有写上这一页。")); body.append(history);
    });
  }
  function exportSave() { if (!state) return; const url = URL.createObjectURL(new Blob([JSON.stringify(record(), null, 2)], { type: "application/json" })), a = el("a"); a.href = url; a.download = "心动未读-高中三年.json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast("已导出高中进度。"); }
  function menu() {
    sheet("把这一页留好", body => {
      body.append(el("p", "高中篇在当前浏览器自动保存，精确到正在读的这一屏。城市长篇和七日样章各自保留原存档。", "growth-menu-note"));
      if (state) {
        body.append(button("打开高中手账", journal, "sheet-button block")); const back = button("回到上一个安排之前", () => { const previous = undo.pop(); if (!previous) return; state = previous; group = null; save(); closeSheet(); render(); toast("已还原安排之前的进度、资源和选择。"); }, "sheet-button block"); back.disabled = !undo.length;
        body.append(back, button("导出高中进度", exportSave, "sheet-button block"));
      }
      body.append(button("导入高中进度", () => $("import-file").click(), "sheet-button block"));
      const settings = el("div", undefined, "setting-row"); settings.append(el("p", "对白字号", "setting-label")); const row = el("div", undefined, "button-row");
      for (const [value, text] of [[21, "标准"], [24, "大字"], [27, "更大"]]) { const n = button(text, () => { fontSize = value; document.documentElement.style.setProperty("--text-size", value + "px"); try { localStorage.setItem(PREFS, JSON.stringify({ fontSize })); } catch {} menu(); }); n.setAttribute("aria-pressed", String(fontSize === value)); row.append(n); } settings.append(row); body.append(settings);
      body.append(button("重新走进高一", () => { closeSheet(); showStart(); }, "sheet-button block")); const old = el("a", "城市长篇（旧版与原存档）", "sheet-button block"); old.href = "city.html"; old.dataset.cityLink = ""; body.append(old);
      body.append(el("p", "三年以六学期、二十四个片段推进，每段两个课余时段；这是生活片段，不是逐日课表。恋爱可以不选，专业方向可以暂不确定；高考详细规则待后续接入。", "growth-small"));
    });
  }
  $("import-file").onchange = async event => {
    const file = event.target.files[0]; event.target.value = ""; if (!file) return;
    try { if (file.size > 2097152) throw Error("文件太大，请选择本游戏导出的高中存档。"); const value = JSON.parse(await file.text()); if (!restore(value)) throw Error("这不是有效的高中存档，现有进度已保留。"); save(); closeSheet(); render(); toast("高中进度已恢复。"); }
    catch (error) { toast(error instanceof SyntaxError ? "无法读取存档，现有进度已保留。" : error.message); }
  };
  $("menu-button").onclick = menu; $("journal-button").onclick = journal; $("close-sheet").onclick = closeSheet;
  $("next").onclick = event => { event.stopPropagation(); advance(); }; $("dialogue").onclick = () => advance(); $("advance-surface").onclick = () => advance();
  document.addEventListener("keydown", event => { if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || $("sheet").open || /^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(event.target.tagName)) return; if (event.key === " " || event.key === "Enter") { event.preventDefault(); advance(true); } });
  const preferences = read(PREFS); if ([21, 24, 27].includes(preferences?.fontSize)) fontSize = preferences.fontSize; document.documentElement.style.setProperty("--text-size", fontSize + "px");
  if (restore(read(KEY))) render(); else showStart();
})();
