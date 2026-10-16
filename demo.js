"use strict";
(() => {
  const D = window.HEART_DEMO;
  const KEY = "heart-unread-visual-demo-v1";
  const $ = id => document.getElementById(id);
  const has = (object, key) => typeof key === "string" && Object.prototype.hasOwnProperty.call(object, key);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let state = { version: 1, name: "夏宁", path: [D.start], choiceVisible: false };
  let prefs = { speed: 24, size: 21 };
  let typingTimer = null, autoTimer = null, loadingTimer = null, toastTimer = null;
  let typing = false, auto = false, clean = false, currentArt = null, artRequest = 0;
  let fullText = "", dialogReturn = null, storageWarned = false;
  const imageCache = new Map();
  const current = () => D.frames[state.path.at(-1)];
  const format = text => text.replaceAll("{name}", state.name);
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function button(label, action, className = "sheet-button") {
    const node = element("button", label, className); node.type = "button"; node.onclick = action; return node;
  }
  function read(key, fallback = null) {
    try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch {
      if (!storageWarned) { storageWarned = true; toast("浏览器暂时不能保存，仍可继续试玩。"); }
      return false;
    }
  }
  function valid(value) {
    if (!value || value.version !== 1 || typeof value.name !== "string" || !value.name.trim() || value.name.length > 12 || !Array.isArray(value.path) || !value.path.length || value.path.length > 300 || !value.path.every(id => has(D.frames, id))) return false;
    if (!Object.values(D.routes).some(route => route.start === value.path[0])) return false;
    return value.path.every((id, index) => !index || D.frames[value.path[index - 1]].next === id || D.frames[value.path[index - 1]].choices?.some(choice => choice.next === id));
  }
  function restore(record) {
    if (!valid(record?.state)) return false;
    state = { version: 1, name: record.state.name, path: [...record.state.path], choiceVisible: !!record.state.choiceVisible && !!D.frames[record.state.path.at(-1)].choices };
    return true;
  }
  function save() { return write(KEY + "-auto", { state, updated: new Date().toISOString() }); }
  function toast(text) {
    clearTimeout(toastTimer); $("toast").textContent = text; $("toast").hidden = false;
    toastTimer = setTimeout(() => { $("toast").hidden = true; }, 2600);
  }
  function imageURL(id, extension = "webp") { return "assets/" + id + "." + extension; }
  function loadImage(id) {
    if (imageCache.has(id)) return imageCache.get(id);
    const request = new Promise((resolve, reject) => {
      const img = new Image(); let fallback = false;
      img.onload = () => resolve(img.currentSrc || img.src);
      img.onerror = () => { if (fallback) reject(new Error(id)); else { fallback = true; img.src = imageURL(id, "jpg"); } };
      img.src = imageURL(id);
    });
    imageCache.set(id, request);
    request.catch(() => imageCache.delete(id));
    return request;
  }
  async function showArt(id, animate) {
    const request = ++artRequest;
    clearTimeout(loadingTimer); $("loading-note").hidden = true;
    if (currentArt === id) return;
    loadingTimer = setTimeout(() => { if (request === artRequest) $("loading-note").hidden = false; }, 700);
    try {
      const url = await loadImage(id);
      if (request !== artRequest) return;
      clearTimeout(loadingTimer); $("loading-note").hidden = true;
      const image = $("artwork"); const art = D.art[id];
      $("scene-wash").style.backgroundImage = 'url("' + url + '")';
      image.src = url; image.alt = art.alt; image.style.objectPosition = art.focus || "center";
      $("theater").dataset.shape = art.shape || "portrait";
      currentArt = id;
      if (animate && !reduced.matches) image.animate([{ opacity: .35 }, { opacity: 1 }], { duration: 220, easing: "cubic-bezier(.23,1,.32,1)" });
    } catch {
      if (request === artRequest) { clearTimeout(loadingTimer); $("loading-note").hidden = true; toast("这张画面没有加载成功，点下一句时会再试一次。"); }
    }
  }
  function preloadNext(frame) {
    const next = frame.next && D.frames[frame.next];
    if (next && !frame.end && !frame.choices && next.art !== frame.art) loadImage(next.art).catch(() => {});
  }
  function stopAutoTimer() { clearTimeout(autoTimer); autoTimer = null; }
  function setAuto(value) {
    auto = value;
    $("auto").setAttribute("aria-pressed", String(auto));
    $("auto").replaceChildren(element("span", auto ? "Ⅱ" : "▷"), document.createTextNode(auto ? " 自动中" : " 自动"));
    stopAutoTimer(); scheduleAuto();
  }
  function scheduleAuto() {
    stopAutoTimer();
    if (!auto || typing || document.hidden || $("sheet").open || clean || state.choiceVisible || current().choices || current().end) return;
    autoTimer = setTimeout(() => advance(true), Math.max(2300, Math.min(7000, fullText.length * 75 + 1300)));
  }
  function revealText() {
    clearInterval(typingTimer); typingTimer = null; typing = false;
    $("dialogue-text").textContent = fullText;
    $("dialogue-text").setAttribute("aria-live", "polite");
    $("next-label").textContent = current().end ? "这一幕，未完待续" : current().choices ? "作出选择" : "点击继续";
    scheduleAuto();
  }
  function typeText(instant) {
    clearInterval(typingTimer); stopAutoTimer();
    fullText = current().lines.map(format).join("\n");
    if (instant || prefs.speed === 0 || reduced.matches) { revealText(); return; }
    const letters = Array.from(fullText); let count = 0; typing = true;
    $("dialogue-text").setAttribute("aria-live", "off");
    $("dialogue-text").textContent = "";
    $("next-label").textContent = "点击显示完整对白";
    typingTimer = setInterval(() => {
      if (document.hidden || $("sheet").open) return;
      count++; $("dialogue-text").textContent = letters.slice(0, count).join("");
      if (count >= letters.length) revealText();
    }, prefs.speed);
  }
  function syncClean() {
    for (const id of ["scene-hud", "dialogue", "game-tools", "choice-panel"]) $(id).hidden = clean || (id === "choice-panel" ? !state.choiceVisible : id === "dialogue" ? state.choiceVisible : false);
    $("restore-ui").hidden = !clean;
    $("advance-surface").setAttribute("aria-label", clean ? "显示对白" : "显示完整对白或继续下一句");
  }
  function render({ instant = false, animate = true } = {}) {
    const frame = current(), route = D.routes[frame.route];
    clearInterval(typingTimer); stopAutoTimer();
    if (frame.end || frame.choices) setAuto(false);
    $("theater").dataset.frame = frame.id;
    $("theater").dataset.route = frame.route;
    $("theater").dataset.choosing = String(state.choiceVisible);
    $("chapter-number").textContent = route.number;
    $("chapter-label").textContent = frame.route === "opening" ? route.name : route.subtitle;
    $("place-label").textContent = frame.place;
    $("speaker").textContent = format(frame.speaker);
    $("speaker-caption").textContent = frame.speaker === "旁白" ? frame.caption : frame.speaker === "{name}" ? "你的心声" : "此刻，在你身边";
    $("page-mark").textContent = String(state.path.length).padStart(2, "0");
    $("back").disabled = state.path.length === 1 && !state.choiceVisible;
    $("choice-list").replaceChildren();
    if (frame.choices) {
      $("choice-title").textContent = frame.question;
      frame.choices.forEach(choice => {
        const option = button("", () => go(choice.next), "choice-option" + (choice.kind === "pass" ? " pass" : ""));
        const label = element("span"); label.append(element("strong", format(choice.label)), element("small", choice.note));
        const arrow = element("span", "↗", "choice-arrow"); arrow.setAttribute("aria-hidden", "true");
        option.append(label, arrow); $("choice-list").append(option);
      });
    }
    syncClean(); typeText(instant || state.choiceVisible); showArt(frame.art, animate); preloadNext(frame); save();
  }
  function go(id, keyboard = false) {
    if (!has(D.frames, id)) return;
    state.path.push(id); state.choiceVisible = false; clean = false;
    render({ animate: !keyboard });
  }
  function advance(keyboard = false) {
    if ($("sheet").open) return;
    if (clean) { clean = false; syncClean(); scheduleAuto(); return; }
    if (state.choiceVisible) return;
    if (typing) { revealText(); return; }
    const frame = current();
    if (frame.choices) { state.choiceVisible = true; render({ instant: true, animate: !keyboard }); $("choice-list").querySelector("button")?.focus({ preventScroll: true }); return; }
    if (frame.end) { finish(); return; }
    if (frame.next) go(frame.next, keyboard);
  }
  function back() {
    if (state.choiceVisible) state.choiceVisible = false;
    else if (state.path.length > 1) state.path.pop();
    else return;
    setAuto(false); clean = false; render({ instant: true, animate: false });
  }
  function openSheet(title, kicker = "心动未读") {
    stopAutoTimer(); dialogReturn = document.activeElement;
    $("sheet-title").textContent = title; $("sheet-kicker").textContent = kicker; $("sheet-body").replaceChildren();
    if (!$("sheet").open) $("sheet").showModal();
    $("sheet").scrollTop = 0;
    return $("sheet-body");
  }
  function closeSheet() { $("sheet").close(); }
  function start(route) {
    const entry = D.routes[route]; if (!entry) return;
    setAuto(false); state = { version: 1, name: state.name, path: [entry.start], choiceVisible: false }; clean = false;
    closeSheet(); render({ animate: false });
  }
  function chapters() {
    const area = openSheet("想先听谁的心事？", "画面试映 · 片段选择");
    area.append(element("p", "每段都有自己的小分支，也可以选择保持距离。切换片段会从这一段开头读起。", "sheet-description"));
    const list = element("div", undefined, "route-list");
    Object.entries(D.routes).forEach(([id, route]) => {
      const option = button("", () => start(id), "route-entry"), image = element("img");
      image.src = imageURL(route.image); image.alt = ""; image.loading = "lazy"; image.width = 52; image.height = 58;
      const label = element("span"); label.append(element("strong", route.name), element("small", route.subtitle));
      const arrow = element("span", "↗", "choice-arrow"); arrow.setAttribute("aria-hidden", "true");
      option.append(image, label, arrow); list.append(option);
    });
    area.append(list);
  }
  function history() {
    const area = openSheet("刚刚说过的话", "回看 · 只留下你走过的片段");
    state.path.forEach((id, index) => {
      const frame = D.frames[id];
      const choice = index && D.frames[state.path[index - 1]].choices?.find(option => option.next === id);
      if (choice) area.append(element("p", "你选择了：" + format(choice.label), "history-choice"));
      const entry = element("section", undefined, "history-entry");
      entry.append(element("strong", format(frame.speaker)), element("p", frame.lines.map(format).join("\n"))); area.append(entry);
    });
  }
  function slots() {
    const area = openSheet("把这一刻留下", "试映存档");
    area.append(element("p", "试玩进度会自动保存，也能在下面留下三个不同的时刻。试玩存档与正式游戏分别保存。", "sheet-description"));
    const autoRecord = read(KEY + "-auto");
    const autoCard = element("section", undefined, "slot-card");
    autoCard.append(element("strong", "自动记录"), element("p", valid(autoRecord?.state) ? state.name + " · " + D.routes[current().route].name + " · 当前这句" : "暂时无法写入浏览器存档")); area.append(autoCard);
    for (let i = 1; i <= 3; i++) {
      const record = read(KEY + "-slot-" + i), validRecord = valid(record?.state);
      const card = element("section", undefined, "slot-card");
      card.append(element("strong", "存档 " + i));
      const stored = validRecord ? D.frames[record.state.path.at(-1)] : null;
      card.append(element("p", stored ? record.state.name + " · " + D.routes[stored.route].name + " · 第 " + record.state.path.length + " 句" : "空白的一页"));
      const row = element("div", undefined, "button-row");
      row.append(button("存入这里", () => {
        const perform = () => { if (write(KEY + "-slot-" + i, { state, updated: new Date().toISOString() })) { slots(); toast("这一刻已存入存档 " + i); } };
        if (!validRecord) { perform(); return; }
        const confirm = openSheet("替换存档 " + i + "？", "试映存档");
        confirm.append(element("p", "将用当前这句替换这个试玩槽位。其他槽位会保留。", "sheet-description"), button("确认存入", perform, "sheet-button primary"), button("返回存档", slots));
      }));
      const load = button("读取", () => { if (restore(record)) { setAuto(false); clean = false; closeSheet(); render({ instant: true, animate: false }); toast("回到留下的这一句。"); } });
      load.disabled = !validRecord; row.append(load); card.append(row); area.append(card);
    }
  }
  function settings() {
    const area = openSheet("用你舒服的节奏", "阅读设置");
    const nameRow = element("section", undefined, "setting-row"), label = element("label", "故事怎么称呼你？", "setting-label"); label.htmlFor = "demo-name";
    const form = element("form", undefined, "name-form"), input = element("input"); input.id = "demo-name"; input.value = state.name; input.maxLength = 12; input.autocomplete = "off"; input.required = true;
    const submit = element("button", "保存", "sheet-button"); submit.type = "submit"; form.append(input, submit);
    form.onsubmit = event => { event.preventDefault(); const name = input.value.trim().slice(0, 12); if (!name) return; state.name = name; save(); render({ instant: true, animate: false }); toast("那就叫你「" + name + "」。"); };
    nameRow.append(label, form); area.append(nameRow);
    for (const [title, key, values] of [["文字出现的速度", "speed", [["慢慢说", 45], ["自然", 24], ["立即显示", 0]]], ["对白字号", "size", [["小一点", 19], ["标准", 21], ["大一点", 24]]]]) {
      const row = element("section", undefined, "setting-row"); row.append(element("span", title, "setting-label"));
      const options = element("div", undefined, "button-row");
      values.forEach(([text, value]) => { const option = button(text, () => { prefs[key] = value; write(KEY + "-preferences", prefs); document.documentElement.style.setProperty("--text-size", prefs.size + "px"); render({ instant: true, animate: false }); settings(); }); option.setAttribute("aria-pressed", String(prefs[key] === value)); options.append(option); });
      row.append(options); area.append(row);
    }
    area.append(element("p", "第一次点击会显示完整对白，再点一下进入下一句。自动播放会在选择处停下。空格 / Enter 推进，左方向键回退，H 显示或收起对白。", "setting-note"));
  }
  function finish() {
    setAuto(false);
    const area = openSheet("这一幕，先停在这里。", "试映结束 · 正文未完");
    area.append(element("p", "◇", "finish-mark"), element("p", "一句话，一次靠近。\n余下的故事，等你来决定。", "finish-copy"));
    area.append(button("试试另一个人的片段", chapters, "sheet-button primary block"), button("从早晨重新开始", () => start("opening"), "sheet-button block"), button("留在这一刻", closeSheet, "sheet-button block"));
  }
  async function toggleFullscreen() {
    const theater = $("theater");
    if (document.fullscreenElement) { await document.exitFullscreen().catch(() => {}); return; }
    if (theater.classList.contains("is-expanded")) { theater.classList.remove("is-expanded"); document.body.classList.remove("expanded"); $("fullscreen").setAttribute("aria-label", "展开游戏画面"); return; }
    if (theater.requestFullscreen) { try { await theater.requestFullscreen(); return; } catch { /* An in-page expansion also works where native fullscreen is unavailable. */ } }
    theater.classList.add("is-expanded"); document.body.classList.add("expanded"); $("fullscreen").setAttribute("aria-label", "收起游戏画面");
  }
  $("advance-surface").onclick = event => advance(event.detail === 0);
  $("next").onclick = event => advance(event.detail === 0);
  $("dialogue").onclick = event => { if (!event.target.closest("button")) advance(); };
  $("back").onclick = back;
  $("history").onclick = history;
  $("save").onclick = slots;
  $("settings").onclick = settings;
  $("chapter-menu").onclick = chapters;
  $("auto").onclick = () => { if (current().choices || current().end) { toast("这一刻，等你自己作选择。"); return; } setAuto(!auto); };
  $("hide-ui").onclick = () => { clean = true; stopAutoTimer(); syncClean(); $("restore-ui").focus({ preventScroll: true }); };
  $("restore-ui").onclick = () => { clean = false; syncClean(); scheduleAuto(); };
  $("fullscreen").onclick = toggleFullscreen;
  document.addEventListener("fullscreenchange", () => { $("fullscreen").setAttribute("aria-label", document.fullscreenElement ? "收起游戏画面" : "展开游戏画面"); });
  $("close-sheet").onclick = closeSheet;
  $("sheet").addEventListener("cancel", event => { event.preventDefault(); closeSheet(); });
  $("sheet").addEventListener("close", () => { if (dialogReturn?.isConnected) dialogReturn.focus({ preventScroll: true }); scheduleAuto(); });
  document.addEventListener("visibilitychange", scheduleAuto);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && $("theater").classList.contains("is-expanded") && !$("sheet").open) { $("theater").classList.remove("is-expanded"); document.body.classList.remove("expanded"); $("fullscreen").setAttribute("aria-label", "展开游戏画面"); return; }
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || $("sheet").open || event.target.closest("button,input,textarea,select,[contenteditable]")) return;
    if ([" ", "Enter", "ArrowRight"].includes(event.key)) { event.preventDefault(); advance(true); }
    if (event.key === "ArrowLeft") { event.preventDefault(); back(); }
    if (event.key.toLowerCase() === "h") { clean = !clean; syncClean(); scheduleAuto(); }
  });
  const storedPrefs = read(KEY + "-preferences", {});
  if ([0, 24, 45].includes(storedPrefs?.speed)) prefs.speed = storedPrefs.speed;
  if ([19, 21, 24].includes(storedPrefs?.size)) prefs.size = storedPrefs.size;
  document.documentElement.style.setProperty("--text-size", prefs.size + "px");
  const record = read(KEY + "-auto");
  restore(record);
  render({ instant: !!record, animate: false });
})();
