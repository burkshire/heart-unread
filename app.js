"use strict";
(() => {
  const B = window.CITY, $ = id => document.getElementById(id), KEY = "heart-unread-city-v3";
  let state = null, undo = [], slot = 0, storageOK = true, focusBefore, toastTimer, renderedScene;
  const copy = x => JSON.parse(JSON.stringify(x));
  function read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { storageOK = false; return false; } }
  let library = read(KEY + "-library", { art: [], endings: [], read: [] });
  if (!library || !["art", "endings", "read"].every(k => Array.isArray(library[k]))) library = { art: [], endings: [], read: [] };
  const format = text => String(text ?? "").replaceAll("{name}", state?.name || "夏宁");
  function node(tag, text, cls) { const e = document.createElement(tag); if (text !== undefined) e.textContent = format(text); if (cls) e.className = cls; return e; }
  function button(text, action, cls) { const b = node("button", text, cls); b.type = "button"; b.onclick = action; return b; }
  function image(id, cls) { const im = node("img", undefined, cls); im.src = `v3-${id}.jpg`; im.alt = B.assets[id] || "剧情插图"; im.decoding = "async"; return im; }
  function message(text) { $("toast").textContent = text; $("toast").hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { $("toast").hidden = true; }, 4000); }
  function modal(title) { focusBefore = document.activeElement; $("dialog-body").replaceChildren(node("h2", title)); if (!$("dialog").open) $("dialog").showModal(); return $("dialog-body"); }
  function close() { $("dialog").close(); focusBefore?.focus(); }
  $("close").onclick = close;
  $("dialog").addEventListener("cancel", () => focusBefore?.focus());
  function reveal(art) { if (!art || !B.assets[art]) return; if (!library.art.includes(art)) { library.art.push(art); write(KEY + "-library", library); } }
  function fullArt(art) { modal(B.assets[art]).append(image(art, "modal-art")); }
  function paragraphs(parent, text) {
    for (const line of format(text).split(/\n\s*\n/).filter(Boolean)) {
      const m = line.match(/^([^：\n]{1,8})：([\s\S]+)/);
      const p = node("p", undefined, m ? "dialogue" : "");
      if (m) p.append(node("strong", m[1]), document.createTextNode(m[2])); else p.textContent = line;
      parent.append(p);
    }
  }
  function pages(scene) {
    const blocks = format(typeof scene.text === "function" ? scene.text(state) : scene.text).split(/\n\s*\n/).filter(Boolean);
    const all = []; let page = [], count = 0;
    for (const p of blocks) { if (page.length && count + p.length > 380) { all.push(page.join("\n\n")); page = []; count = 0; } page.push(p); count += p.length; }
    if (page.length) all.push(page.join("\n\n")); return all;
  }
  function save() {
    if (!state) return;
    write(KEY + "-slot-" + slot, { state, undo: undo.slice(-30), updated: Date.now() }); write(KEY + "-active", slot);
    $("saved").textContent = storageOK ? `已保存到存档 ${slot + 1} · 仅当前浏览器` : "浏览器暂不能保存，请到手账导出存档。";
  }
  function show(id) { for (const k of ["cover", "reader", "ending"]) $(k).hidden = k !== id; }
  function render(scroll = true) {
    if (!state) return;
    if (state.ending) { finish(); save(); return; }
    const scene = B.scenes[state.scene], all = pages(scene);
    const changedScene=renderedScene!==state.scene;renderedScene=state.scene;
    state.page = Math.min(state.page, all.length - 1);
    show("reader");
    const art = state.pending?.art || scene.art;
    reveal(art);
    $("scene-image").src = `v3-${art}.jpg`; $("scene-image").alt = B.assets[art];
    $("place").textContent = scene.place;
    $("art-caption").textContent = format(scene.caption || B.assets[art]);
    $("present").replaceChildren();
    for (const person of scene.present || (scene.focus ? [scene.focus] : [])) $("present").append(node("span", B.people[person].name, "tag"));
    $("chapter").textContent = scene.chapter;
    $("kicker").textContent = `${scene.route === "common" ? "你的生活" : B.people[scene.route]?.name || "交会"} / ${state.page + 1} · ${all.length}`;
    $("title").textContent = scene.title;
    $("text").replaceChildren(); paragraphs($("text"), all[state.page]);
    $("inserts").replaceChildren();
    if (state.page === all.length - 1) for (const art of scene.inserts || []) {
      reveal(art); const f = node("figure", undefined, "inset-image"); f.append(image(art), node("figcaption", B.assets[art])); $("inserts").append(f);
    }
    $("choices").replaceChildren(); $("reaction").hidden = !state.pending;
    if (state.pending) {
      $("reaction").replaceChildren(node("p", "这一次，你的回答", "eyebrow")); paragraphs($("reaction"), state.pending.response);
      for (const witness of state.pending.witnesses) {
        const w = node("div", undefined, "witness");
        w.append(node("strong", witness.who ? B.people[witness.who].name : "共同项目"), node("div", witness.text)); $("reaction").append(w);
      }
      $("choices").append(button("继续这段生活 →", advance, "option continue"));
    } else if (state.page < all.length - 1) {
      $("choices").append(button("继续阅读 →", () => { state.page++; render(); save(); }, "option continue"));
      if (library.read.includes(scene.id)) $("choices").append(button("跳过已读正文", () => { state.page = all.length - 1; render(); save(); }, "option"));
    } else {
      if (!library.read.includes(scene.id)) { library.read.push(scene.id); write(KEY + "-library", library); }
      scene.choices.forEach(o => {
        if (o.require && !o.require(state)) return;
        $("choices").append(button(o.label, () => choose(o.id), `option ${o.kind || ""}`));
      });
    }
    $("back").disabled = !undo.length;
    $("view-art").onclick = () => fullArt(art);
    if (scroll) { $("title").focus({ preventScroll: true }); (state.pending ? $("reaction") : changedScene ? $("scene-figure") : $("title")).scrollIntoView({ block: "start" }); }
    save();
  }
  function choose(id) { undo.push(copy(state)); undo = undo.slice(-30); state = B.select(state, id); render(); }
  function advance() { state = B.advance(state); render(); }
  function begin(name) {
    const seed = new Uint32Array(1); crypto.getRandomValues(seed);
    state = B.create(name, seed[0]); undo = []; render(false); window.scrollTo(0, 0); save();
  }
  $("start").onsubmit = e => {
    e.preventDefault(); const name = $("name").value.trim(); if (!name) { $("name").focus(); return; } $("name").blur();
    if (read(KEY + "-slot-" + slot, null)) {
      const area = modal("开始新的生活？"); area.append(node("p", `会替换存档 ${slot + 1} 的进度。其他槽位、图鉴和旧版存档都保留。`));
      area.append(button("确认重新开始", () => { close(); begin(name); }, "primary"));
    } else begin(name);
  };
  $("back").onclick = () => { if (undo.length) { state = undo.pop(); render(); } };
  $("home").onclick = () => { save(); show("cover"); refreshResume(); window.scrollTo(0, 0); };
  function refreshResume() { slot = [0, 1, 2].includes(read(KEY + "-active", 0)) ? read(KEY + "-active", 0) : 0; $("resume").hidden = !B.valid(read(KEY + "-slot-" + slot, null)?.state); }
  function loadSlot(i) {
    const record = read(KEY + "-slot-" + i, null); if (!B.valid(record?.state)) { message("这个槽位没有可读取的存档。"); return; }
    slot = i; state = record.state; undo = Array.isArray(record.undo) ? record.undo.filter(B.valid).slice(-30) : []; close(); render(false); window.scrollTo(0, 0);
  }
  $("resume").onclick = () => loadSlot(slot);
  function profiles(id) { const p = B.people[id]; reveal(p.image); reveal(id); const area = modal(p.name); area.append(image(p.image, "modal-art"), node("p", `${p.age} 岁 · ${p.job}`, "eyebrow"), node("p", p.intro), node("p", p.history), node("h3", "最初的相遇"), image(id, "modal-art")); }
  Object.entries(B.people).forEach(([id, p]) => {
    const c = button("", () => profiles(id)); c.setAttribute("aria-label", `查看${p.name}的档案`); c.append(image(p.image));
    const caption = node("div", undefined, "label"); caption.append(node("small", `${p.age} · ${p.job.split(" · ")[0]}`), node("strong", p.name)); c.append(caption); $("cast").append(c);
  });
  function journal() {
    const a = modal("我留下的痕迹");
    if (!state) { a.append(node("p", "从一个普通的早晨开始，故事会在这里留下痕迹。")); return; }
    a.append(node("p", `作品进展 ${state.work} · 已发现线索 ${state.evidence.length}`));
    if (state.evidence.length) { a.append(node("h3", "已确认的细节")); state.evidence.forEach(v => a.append(node("p", v))); }
    [...state.journal].reverse().forEach(entry => { const e = node("section", undefined, "entry"); e.append(node("strong", entry.title), node("p", entry.choice), node("p", entry.response, "muted")); a.append(e); });
  }
  function gallery() {
    const area = modal("回忆里的光"); area.append(node("p", `已解锁 ${library.art.length} / ${Object.keys(B.assets).length} 幅。插图会随剧情自然解锁。`));
    const grid = node("div", undefined, "gallery-grid");
    for (const [id, name] of Object.entries(B.assets)) {
      const unlocked = library.art.includes(id); const b = button("", () => fullArt(id)); b.disabled = !unlocked;
      if (unlocked) b.append(image(id)); b.append(node("span", unlocked ? name : "尚未遇见")); grid.append(b);
    }
    area.append(grid);
  }
  function endingShelf() {
    const area = modal("不同的以后");
    area.append(node("p", "HE 是共同承诺，BE 是失去与告别，OE 留下没有复合保证的余地。结局不会由一次普通的拒绝决定。"));
    Object.entries(B.endings).forEach(([id, v]) => area.append(button(library.endings.includes(id) ? `${v.type} · ${v.title}` : `${v.type} · 未解锁`, () => { const a = modal(v.title); a.append(image(v.art, "modal-art")); paragraphs(a, v.text); }, library.endings.includes(id) ? "option" : "option locked")));
    area.querySelectorAll(".locked").forEach(b => { b.disabled = true; });
  }
  function download() {
    if (!state) { message("开始游戏后即可导出。"); return; }
    const data = { format: "heart-unread-city-v3", state, undo, library };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "心动未读-城市回声-存档.json"; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  function slots() {
    const area = modal("把这一页留下");
    [0, 1, 2].forEach(i => {
      const r = read(KEY + "-slot-" + i, null), e = node("section", undefined, "slot");
      e.append(node("strong", `存档 ${i + 1}${i === slot ? " · 使用中" : ""}`), node("p", B.valid(r?.state) ? `${r.state.name} · ${B.scenes[r.state.scene].title} · ${new Date(r.updated).toLocaleString()}` : "空白的一页"));
      e.append(button("读取", () => loadSlot(i)), button("存入这里", () => {
        if (!state) { message("请先开始故事。"); return; }
        const perform = () => { slot = i; save(); slots(); };
        if (r && i !== slot) { const a = modal("覆盖这个槽位？"); a.append(node("p", `存档 ${i + 1} 将被当前进度替换。`), button("确认覆盖", perform, "primary")); } else perform();
      })); area.append(e);
    });
    area.append(button("导出存档文件", download, "option"));
    const input = node("input"); input.type = "file"; input.accept = ".json,application/json"; input.setAttribute("aria-label", "导入游戏存档");
    input.onchange = async () => {
      const file = input.files[0]; if (!file || file.size > 5e6) { message("请选择不超过 5 MB 的游戏存档。"); return; }
      try {
        const value = JSON.parse(await file.text()); if (value.format !== "heart-unread-city-v3" || !B.valid(value.state)) throw Error();
        const confirm = modal("使用导入的存档？"); confirm.append(node("p", `将把 ${value.state.name} 的进度存入槽位 ${slot + 1}。`), button("确认导入", () => {
          state = value.state; undo = Array.isArray(value.undo) ? value.undo.filter(B.valid).slice(-30) : [];
          for (const k of ["art", "read", "endings"]) if (Array.isArray(value.library?.[k])) library[k] = [...new Set([...library[k], ...value.library[k].filter(x => typeof x === "string" && (k === "art" ? B.assets[x] : k === "read" ? B.scenes[x] : B.endings[x]))])];
          write(KEY + "-library", library); close(); render(false);
        }, "primary"));
      } catch { message("这不是有效的第三版存档，原进度没有改变。"); }
    }; area.append(node("p", "换设备时，可以把导出的文件发给自己，再在这里导入。"), input);
  }
  function settings() {
    const a = modal("按你的节奏读");
    for (const [cls, text] of [["large", "切换大字"], ["paper", "切换纸页 / 夜间模式"]]) a.append(button(text, () => { document.body.classList.toggle(cls); write(KEY + "-settings", [...document.body.classList]); }, "option"));
    a.append(node("p", "正文不设阅读倒计时。已读内容可快进；选择反馈和证据仍由你决定是否查看。系统会遵循设备的减少动态效果设置。"));
  }
  $("reading-settings").onclick = settings;
  async function share() {
    const url = location.origin + location.pathname;
    if (navigator.share) { try { await navigator.share({ title: "心动未读 · 城市回声", text: "这一次，从自己的生活开始。", url }); return; } catch (e) { if (e.name === "AbortError") return; } }
    const a = modal("分享这个故事"), input = node("input"); input.value = url; input.readOnly = true; input.style.width = "100%";
    input.onclick = () => input.select(); a.append(input, button("复制链接", async () => { try { await navigator.clipboard.writeText(url); message("已复制。"); } catch { input.select(); message("请长按或使用复制命令。"); } }, "option"));
  }
  $("menu").onclick = () => {
    const a = modal("属于你的手账"), grid = node("div", undefined, "menu-grid");
    [["选择与线索", journal], ["存档 / 导入导出", slots], ["回忆图鉴", gallery], ["结局回收", endingShelf], ["阅读设置", settings], ["分享故事", share]].forEach(([title, fn]) => grid.append(button(title, fn)));
    a.append(grid, node("p", "开发预览：新版职业与长篇结构正在制作。现实机构仅用作虚构人物的背景；回声项目、争议及相关人员均属虚构。", "muted"));
  };
  function finish() {
    const e = B.endings[state.ending]; show("ending"); reveal(e.art);
    if (!library.endings.includes(state.ending)) { library.endings.push(state.ending); write(KEY + "-library", library); }
    const wrap = node("div", undefined, "ending-wrap"); wrap.append(image(e.art), node("p", e.type, "eyebrow"), node("h1", e.title), node("p", e.subtitle, "lead"));
    const text = node("div", undefined, "prose"); paragraphs(text, e.text); wrap.append(text);
    if (state.route !== "zhou") paragraphs(wrap, "整理工作室时，你在高中练习册里找到一张描图纸。周予白把你的名字写在纸背，正面恰好是一道受力分析题。你把纸对着窗，终于看清那句十七岁时没有读懂的批注：如果她问我愿不愿意，我会说愿意。\n\n你轻轻合上书。晚知道的心意，也不要求你改写现在的选择。");
    wrap.append(button("回到首页", () => { show("cover"); refreshResume(); window.scrollTo(0, 0); }, "primary"), button("回看我的选择", journal, "option"), button("查看结局收藏", endingShelf, "option"));
    $("ending").replaceChildren(wrap); window.scrollTo(0, 0);
  }
  const settingsValue=read(KEY + "-settings", []);
  for (const cls of Array.isArray(settingsValue)?settingsValue:[]) if (["large", "paper"].includes(cls)) document.body.classList.add(cls);
  refreshResume();
})();
