"use strict";
(() => {
  const B = window.CITY;
  const FRAME_LIMIT = 64;
  // Presentation only: keep every authored character and the existing story graph.
  function frames(text) {
    const source = String(text ?? ""), result = [];
    for (const match of source.matchAll(/[^\n]+(?:\n(?!\s*\n)[^\n]+)*/g)) {
      const block = match[0], prefix = block.match(/^([^：\n]{1,8})：/);
      const speaker = prefix?.[1] || "旁白";
      const parts = block.match(/[^。！？；]*[。！？；]+[”’」』]?|[^。！？；]+$/g) || [block];
      let raw = "", start = match.index, cursor = match.index;
      const push = () => {
        if (!raw) return;
        const content = start === match.index && prefix ? raw.slice(prefix[0].length) : raw;
        result.push({ raw, text: content, speaker, offset: start, end: start + raw.length });
        start += raw.length; raw = "";
      };
      for (const part of parts) {
        if (raw && Array.from(raw + part).length > FRAME_LIMIT) push();
        const letters = Array.from(part);
        while (letters.length > FRAME_LIMIT) { raw = letters.splice(0, FRAME_LIMIT).join(""); push(); }
        raw += letters.join(""); cursor += part.length;
      }
      push();
      if (cursor !== match.index + block.length) throw Error("对白分屏没有保留完整正文。");
    }
    return result.length ? result : [{ raw: "", text: "", speaker: "旁白", offset: 0, end: 0 }];
  }
  function legacyPages(text) {
    const pages = []; let count = 0, first = 0, group = [];
    for (const match of String(text).matchAll(/\S[\s\S]*?(?=\n\s*\n|$)/g)) {
      const block = match[0];
      if (group.length && count + block.length > 380) { pages.push({ offset: first, text: group.join("\n\n") }); count = 0; group = []; }
      if (!group.length) first = match.index;
      group.push(block); count += block.length;
    }
    if (group.length) pages.push({ offset: first, text: group.join("\n\n") });
    return pages.length ? pages : [{ offset: 0, text: "" }];
  }
  B.novelFrames = frames;
  B.novelLegacyPages = legacyPages;
  B.createNovelReader = api => {
    const $ = id => document.getElementById(id), stage = $("novel-stage");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let currentFrames = [], currentText = "", frameScope = "", typingTimer, autoTimer;
    let typing = false, auto = false, clean = false, displayed = "", currentPhase = "body";
    let speed = 24;
    try { const stored = JSON.parse(localStorage.getItem("heart-unread-city-v3-novel-settings")); if ([0, 24, 45].includes(stored?.speed)) speed = stored.speed; } catch { /* Use the default. */ }
    const clearTimers = () => { clearInterval(typingTimer); clearTimeout(autoTimer); typing = false; };
    function phase() {
      const s = api.state();
      if (s.ending) return s.vn?.scene === s.scene && s.vn?.ending === s.ending && s.vn.phase === "end" ? "end" : "ending";
      if (s.pending) return "response";
      return s.vn?.scene === s.scene && s.vn.phase === "choice" ? "choice" : "body";
    }
    function reset(value = "body") {
      const s = api.state();
      s.vn = { version: 1, scene: s.scene, phase: value, index: 0, ending: s.ending };
      clean = false;
    }
    function source() {
      const s = api.state(), scene = B.scenes[s.scene];
      if (s.ending) return api.format(B.endings[s.ending].text);
      if (s.pending) return api.format(s.pending.response);
      return api.format(typeof scene.text === "function" ? scene.text(s) : scene.text);
    }
    function responseFrames(text) {
      const s = api.state(), list = frames(text);
      for (const w of s.pending.witnesses || []) {
        list.push(...frames(api.format(w.text)).map(f => ({ ...f, speaker: w.who ? B.people[w.who].name : "旁白", witness: true })));
      }
      return list;
    }
    function position(text, list, p) {
      const s = api.state(), old = s.vn;
      const readablePhase = ["choice", "body"].includes(p) ? "body" : p === "end" ? "ending" : p;
      const compatible = old?.version === 1 && old.scene === s.scene && (old.phase === p || readablePhase === "body" && old.phase === "body") && (!s.ending || old.ending === s.ending);
      let index = compatible && Number.isInteger(old.index) ? old.index : 0;
      if (!compatible && p === "body") {
        const pages = legacyPages(text), offset = pages[Math.min(s.page, pages.length - 1)]?.offset || 0;
        index = Math.max(0, list.findIndex(f => f.end > offset));
      }
      index = Math.max(0, Math.min(list.length - 1, index));
      s.vn = { version: 1, scene: s.scene, phase: p, index, ending: s.ending };
      if (readablePhase === "body") {
        const pages = legacyPages(text), offset = list[index].offset;
        s.page = 0; for (let i = 0; i < pages.length; i++) if (pages[i].offset <= offset) s.page = i;
      }
      return index;
    }
    function stopAuto() { clearTimeout(autoTimer); }
    function schedule() {
      stopAuto();
      if (!auto || typing || clean || document.hidden || $("dialog").open || $("reader").hidden || ["choice", "end"].includes(currentPhase)) return;
      autoTimer = setTimeout(next, Math.max(2000, Math.min(7500, displayed.length * 70 + 900)));
    }
    function setAuto(value) {
      auto = value; $("auto").setAttribute("aria-pressed", String(auto)); $("auto").textContent = auto ? "Ⅱ 自动中" : "▷ 自动"; schedule();
    }
    function revealText() {
      clearInterval(typingTimer); typing = false;
      const target = currentPhase === "response" ? $("reaction") : $("text");
      target.textContent = displayed; target.setAttribute("aria-live", "polite");
      $("next-label").textContent = label(); schedule();
    }
    function label() {
      if (api.state().vn.index < currentFrames.length - 1) return "点击继续";
      return currentPhase === "response" ? "下一幕" : currentPhase === "ending" ? "留下这一页" : "作出选择";
    }
    function typeText(instant) {
      clearTimers(); const target = currentPhase === "response" ? $("reaction") : $("text");
      target.scrollTop = 0;
      if (instant || !speed || reduced.matches) { revealText(); return; }
      target.textContent = ""; target.setAttribute("aria-live", "off"); typing = true;
      $("next-label").textContent = "点击显示完整对白";
      const letters = Array.from(displayed); let i = 0;
      typingTimer = setInterval(() => {
        if (document.hidden || $("dialog").open || clean) return;
        target.textContent = letters.slice(0, ++i).join("");
        if (i >= letters.length) revealText();
      }, speed);
    }
    function syncClean() {
      $("scene-hud").hidden = clean;
      $("dialogue").hidden = clean || ["choice", "end"].includes(currentPhase);
      $("choice-panel").hidden = clean || !["choice", "end"].includes(currentPhase);
      $("restore-ui").hidden = !clean;
    }
    function render(instant = false) {
      const s = api.state(), scene = B.scenes[s.scene], e = s.ending && B.endings[s.ending];
      currentPhase = phase();
      currentText = source();
      const scope = s.scene + ":" + currentPhase + ":" + (s.ending || "") + ":" + currentText;
      if (scope !== frameScope) { currentFrames = s.pending ? responseFrames(currentText) : frames(currentText); frameScope = scope; }
      const index = position(currentText, currentFrames, currentPhase), frame = currentFrames[index];
      stage.dataset.phase = currentPhase; stage.dataset.scene = s.scene; stage.dataset.route = s.route || "common";
      $("chapter").textContent = e ? `${e.type} · 城市回声` : api.format(scene.chapter);
      $("title").textContent = api.format(e ? e.title : scene.title);
      $("place").textContent = api.format(e ? e.subtitle : scene.place);
      $("speaker").textContent = api.format(frame.speaker);
      $("speaker-caption").textContent = frame.witness ? "另一处的回声" : frame.speaker === "旁白" ? "你的生活" : frame.speaker === s.name || frame.speaker === "你" ? "你的心声" : "此刻，在你身边";
      $("page-mark").textContent = `${String(index + 1).padStart(2, "0")} / ${currentFrames.length}`;
      $("text").hidden = currentPhase === "response"; $("reaction").hidden = currentPhase !== "response";
      displayed = frame.text;
      $("choices").replaceChildren();
      api.sceneArt(scene, currentFrames.length, index, e);
      const activityOwns = api.activity().render(scene, currentPhase === "choice");
      if (currentPhase === "choice") {
        setAuto(false); api.markRead(scene.id);
        $("choice-title").textContent = "你想怎么回应？";
        if (!activityOwns) for (const o of scene.choices) {
          if (!o.require || o.require(s)) $("choices").append(api.button(o.label, () => api.choose(o.id), `option ${o.kind || ""}`));
        }
      } else if (currentPhase === "end") {
        setAuto(false); $("choice-title").textContent = e.type + " · " + e.title;
        $("choices").append(api.button("回到首页", api.home, "option continue"), api.button("回看我的选择", api.journal, "option"), api.button("查看结局收藏", api.endingShelf, "option"));
      }
      $("back").disabled = index === 0 && !api.canUndo() && !["choice", "end"].includes(currentPhase);
      syncClean(); typeText(instant || ["choice", "end"].includes(currentPhase)); api.save();
    }
    function next() {
      if (!api.state() || $("dialog").open || $("reader").hidden) return;
      if (clean) { clean = false; syncClean(); schedule(); return; }
      if (typing) { revealText(); return; }
      if (["choice", "end"].includes(currentPhase)) return;
      const s = api.state();
      if (s.vn.index < currentFrames.length - 1) { s.vn.index++; render(); }
      else if (currentPhase === "response") api.advance();
      else { s.vn.phase = currentPhase === "ending" ? "end" : "choice"; render(true); $("choices").querySelector("button")?.focus({ preventScroll: true }); }
    }
    function back() {
      if (!api.state()) return;
      api.activity().pause(); setAuto(false); clean = false;
      const s = api.state();
      if (["choice", "end"].includes(currentPhase)) { s.vn.phase = currentPhase === "end" ? "ending" : "body"; s.vn.index = currentFrames.length - 1; }
      else if (s.vn.index > 0) s.vn.index--;
      else { if (!api.canUndo()) return; api.undo(); }
      render(true);
    }
    function history(area) {
      if (!api.state()) return;
      const p = currentPhase, list = currentFrames.slice(0, api.state().vn.index + 1);
      area.append(api.node("h3", "这一幕，已经读过的话"));
      const entry = api.node("section", undefined, "history-current");
      for (const f of list) entry.append(api.node("p", (f.speaker === "旁白" ? "" : f.speaker + "：") + f.text));
      area.append(entry);
      return p;
    }
    async function fullscreen() {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      if (stage.classList.contains("is-expanded")) { stage.classList.remove("is-expanded"); document.body.classList.remove("expanded"); $("fullscreen").setAttribute("aria-label", "展开游戏画面"); return; }
      try { if (stage.requestFullscreen) { await stage.requestFullscreen(); return; } } catch { /* iOS uses the same page in an expanded layer. */ }
      stage.classList.add("is-expanded"); document.body.classList.add("expanded"); $("fullscreen").setAttribute("aria-label", "收起游戏画面");
    }
    function leave() {
      clearTimers(); setAuto(false); clean = false;
      stage.classList.remove("is-expanded"); document.body.classList.remove("expanded");
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
    $("next").onclick = next;
    $("advance-surface").onclick = () => { if (!getSelection()?.toString()) next(); };
    $("dialogue").onclick = event => { if (!event.target.closest("button") && !getSelection()?.toString()) next(); };
    $("auto").onclick = () => { if (!api.state() || ["choice", "end"].includes(currentPhase)) { api.message("这一刻，等你自己作选择。"); return; } api.close(); setAuto(!auto); };
    $("hide-ui").onclick = () => { if (!api.state()) return; api.activity().pause(); api.close(); clean = true; stopAuto(); syncClean(); $("restore-ui").focus({ preventScroll: true }); };
    $("restore-ui").onclick = () => { clean = false; syncClean(); schedule(); };
    $("fullscreen").onclick = fullscreen;
    document.addEventListener("fullscreenchange", () => $("fullscreen").setAttribute("aria-label", document.fullscreenElement ? "收起游戏画面" : "展开游戏画面"));
    $("dialog").addEventListener("close", schedule);
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("pagehide", () => { stopAuto(); api.activity().pause(); });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && stage.classList.contains("is-expanded") && !$("dialog").open) { leave(); return; }
      if (!api.state() || $("reader").hidden || $("dialog").open || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.target.closest("input,textarea,select,[contenteditable]")) return;
      const control = event.target.closest("button");
      if (control && (!["advance-surface", "next"].includes(control.id) || [" ", "Enter"].includes(event.key))) return;
      if ([" ", "Enter", "ArrowRight"].includes(event.key)) { event.preventDefault(); next(); }
      if (event.key === "ArrowLeft") { event.preventDefault(); back(); }
    });
    return { render, next, back, reset, leave, history, pause: stopAuto, resume: schedule, complete: revealText,
      settings(area) {
        const row = api.node("section", undefined, "setting-row"); row.append(api.node("p", "文字出现的速度"));
        const options = api.node("div", undefined, "setting-options");
        for (const [name, value] of [["慢慢说", 45], ["自然", 24], ["立即显示", 0]]) {
          const b = api.button(name, () => { speed = value; try { localStorage.setItem("heart-unread-city-v3-novel-settings", JSON.stringify({ speed })); } catch { api.message("设置暂时不能保存。"); } if (api.state() && !$("reader").hidden) revealText(); api.settings(); });
          b.setAttribute("aria-pressed", String(speed === value)); options.append(b);
        }
        row.append(options); area.append(row);
      }
    };
  };
})();
