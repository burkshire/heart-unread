"use strict";
(() => {
  const B = window.CITY;
  B.createActivityUI = api => {
    const { node, button } = api;
    const panel = document.getElementById("activity-panel"), puzzle = document.getElementById("puzzle-panel");
    let timer = null, timerOwner = null, referenceKey = null;
    function cancelTimer() { if (timer !== null) clearInterval(timer); timer = null; timerOwner = null; }
    function context() {
      const state = api.state(), config = state && B.activities[state.scene];
      return state && config ? { state, config } : null;
    }
    function recordFor(state, config) {
      if (!state.activities || typeof state.activities !== "object" || Array.isArray(state.activities)) state.activities = {};
      let record = Object.prototype.hasOwnProperty.call(state.activities, config.id) ? state.activities[config.id] : null;
      const statuses = ["ready", "running", "paused", "done", "skipped"];
      if (!record || typeof record !== "object" || !statuses.includes(record.status) ||
          config.kind === "puzzle" && ["running", "paused", "done"].includes(record.status) && !B.puzzleSolvable(record.board) ||
          config.kind === "quiz" && record.status === "running" && !Number.isFinite(record.deadline)) {
        record = { status: "ready" }; state.activities[config.id] = record;
      }
      if (config.kind === "quiz" && record.status === "running") record.deadline = Math.min(record.deadline, Date.now() + 10000);
      if (config.kind === "puzzle" && record.status === "done" && !B.puzzleSolved(record.board)) { record.status = "paused"; record.acknowledged = false; }
      return record;
    }
    function remaining(record) {
      const value = record.status === "running" ? Number(record.deadline) - Date.now() : Number(record.remaining);
      return Math.max(0, Math.min(10000, Number.isFinite(value) ? value : 10000));
    }
    function pause() {
      const current = context();
      if (current?.config.kind === "quiz") {
        const record = recordFor(current.state, current.config);
        if (record.status === "running") { record.remaining = remaining(record); record.status = "paused"; delete record.deadline; api.save(); }
      }
      cancelTimer();
    }
    function owns(sceneId, activityId) {
      const state = api.state();
      return state && !state.pending && !state.ending && state.scene === sceneId && B.activities[sceneId]?.id === activityId;
    }
    function optionsFor(config, scene, state) {
      const options = config.sceneChoices
        ? scene.choices.filter(o => o.kind !== "pass" && (!o.require || o.require(state))).map(o => ({ label: o.label, choiceId: o.id }))
        : config.answers.map((label, index) => ({ label, index }));
      let seed = state.seed >>> 0;
      for (const char of config.id) seed = (Math.imul(seed, 31) + char.charCodeAt(0)) >>> 0;
      for (let i = options.length - 1; i > 0; i--) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const j = seed % (i + 1); [options[i], options[j]] = [options[j], options[i]];
      }
      return options;
    }
    function settle(config, answer) {
      if (!owns(config.scene, config.id)) return;
      const state = api.state(), record = recordFor(state, config);
      if (record.status !== "running") return;
      if (remaining(record) <= 0) answer = null;
      cancelTimer();
      record.status = "done"; record.answer = answer?.choiceId ?? answer?.index ?? null;
      record.correct = answer !== null && (config.sceneChoices ? answer.choiceId === config.correctChoice : answer.index === config.correct);
      record.timeout = answer === null; delete record.deadline; delete record.remaining;
      if (config.sceneChoices) {
        record.acknowledged = true;
        const pass = B.scenes[config.scene].choices.find(o => o.kind === "pass");
        api.save(); api.choose(answer?.choiceId || pass.id);
      } else { api.save(); api.render(false); }
    }
    function runTimer(config) {
      cancelTimer(); timerOwner = config.scene;
      const tick = () => {
        if (!owns(config.scene, config.id)) { cancelTimer(); return; }
        const record = recordFor(api.state(), config);
        if (record.status !== "running") { cancelTimer(); return; }
        if (document.hidden) { pause(); api.render(false); return; }
        const ms = remaining(record), clock = panel.querySelector(".activity-clock"), meter = panel.querySelector(".activity-meter-fill");
        if (clock) clock.textContent = `${Math.ceil(ms / 1000)} 秒`;
        if (meter) meter.style.transform = `scaleX(${ms / 10000})`;
        if (ms <= 0) settle(config, null);
      };
      // An expired restored save settles on a later task, after the reader has rendered.
      timer = setInterval(tick, 100);
    }
    function startQuiz(config) {
      if (!owns(config.scene, config.id)) return;
      const record = recordFor(api.state(), config);
      const ms = record.status === "paused" ? remaining(record) : 10000;
      record.status = "running"; record.deadline = Date.now() + ms; delete record.remaining;
      api.save(); api.render(false);
      panel.scrollIntoView({ block: "start" });
    }
    function skip(config) {
      if (!owns(config.scene, config.id)) return;
      cancelTimer(); const record = recordFor(api.state(), config);
      record.status = "skipped"; record.acknowledged = true; delete record.deadline; delete record.remaining;
      if (config.sceneChoices) {
        api.save(); api.choose(B.scenes[config.scene].choices.find(o => o.kind === "pass").id);
      } else { api.save(); api.render(false); }
    }
    function acknowledge(config) {
      if (!owns(config.scene, config.id)) return;
      recordFor(api.state(), config).acknowledged = true; api.save(); api.render(false);
    }
    function startPuzzle(config) {
      if (!owns(config.scene, config.id)) return;
      const state = api.state(), record = recordFor(state, config);
      if (!record.board || !B.puzzleSolvable(record.board)) {
        const code = [...config.id].reduce((n, char) => (Math.imul(n, 31) + char.charCodeAt(0)) >>> 0, state.seed);
        record.board = B.puzzleShuffle(code); record.moves = 0;
      }
      record.status = B.puzzleSolved(record.board) ? "done" : "running";
      api.save(); api.render(false);
      puzzle.scrollIntoView({ block: "start" });
    }
    function renderPuzzle(config, record) {
      puzzle.hidden = false; document.getElementById("scene-image").hidden = true;
      document.getElementById("art-controls").hidden = true;
      document.getElementById("view-art").hidden = true;
      const grid = node("div", undefined, "puzzle-grid");
      grid.style.aspectRatio = config.ratio; grid.setAttribute("role", "group"); grid.setAttribute("aria-label", config.title);
      record.board.forEach((tile, index) => {
        if (tile === 8) { const empty = node("div", "空格", "puzzle-empty"); empty.setAttribute("aria-label", "拼图空格"); grid.append(empty); return; }
        const next = B.puzzleMove(record.board, index);
        const piece = button("", () => {
          if (!owns(config.scene, config.id) || record.status !== "running") return;
          const current = recordFor(api.state(), config), moved = B.puzzleMove(current.board, index);
          if (!moved) return;
          current.board = moved; current.moves = (Number.isSafeInteger(current.moves) ? current.moves : 0) + 1;
          if (B.puzzleSolved(moved)) current.status = "done";
          api.save(); api.render(false);
          puzzle.querySelector(`[data-tile="${tile}"]`)?.focus({ preventScroll: true });
        }, "puzzle-tile");
        piece.disabled = !next; piece.dataset.tile = String(tile); piece.dataset.cell = String(index);
        piece.setAttribute("aria-label", `拼块 ${tile + 1}${next ? "，可移动" : ""}`);
        piece.style.backgroundImage = `url("${api.imageURL(config.art)}")`;
        piece.style.backgroundPosition = `${tile % 3 * 50}% ${Math.floor(tile / 3) * 50}%`;
        piece.append(node("span", String(tile + 1), "puzzle-number")); grid.append(piece);
      });
      const tools = node("div", undefined, "puzzle-tools");
      const moves = node("span", `已移动 ${record.moves || 0} 次`, "muted"); moves.setAttribute("role", "status");
      tools.append(moves, button("看看原图", () => api.fullArt(config.art), "art-step"), button("收起拼图", () => {
        if (!owns(config.scene, config.id)) return;
        recordFor(api.state(), config).status = "paused"; api.save(); api.render(false); panel.scrollIntoView({ block: "start" });
      }, "art-step"));
      puzzle.replaceChildren(grid, tools);
      // The reference also supplies the JPEG fallback URL to the CSS pieces.
      const key = config.id + api.imageURL(config.art);
      if (referenceKey !== key) referenceKey = key;
      const reference = node("img"); reference.loading = "eager";
      reference.addEventListener("load", () => {
        if (!owns(config.scene, config.id) || puzzle.hidden || referenceKey !== key) return;
        puzzle.querySelectorAll(".puzzle-tile").forEach(piece => { piece.style.backgroundImage = `url("${reference.src}")`; });
      });
      api.setImageSource(reference, config.art);
    }
    function render(scene, eligible) {
      cancelTimer(); panel.replaceChildren(); panel.hidden = true; puzzle.replaceChildren(); puzzle.hidden = true;
      document.getElementById("scene-image").hidden = false; document.getElementById("view-art").hidden = false;
      const config = B.activities[scene.id], state = api.state(); if (!config || !state) return false;
      const record = recordFor(state, config);
      if (!eligible) {
        if (record.status === "running" && config.kind === "quiz") pause();
        if (state.pending && config.sceneChoices && record.status === "done") {
          panel.hidden = false; panel.append(node("p", record.timeout ? "十秒已到，本次暂不作答。" : record.correct ? "这次答对了。" : "这次答错了，也可以看清楚原因。", "activity-result"));
        }
        return false;
      }
      // Undoing a narrative answer starts a fresh timed attempt, rather than exposing untimed answers.
      if (config.sceneChoices && ["done", "skipped"].includes(record.status)) {
        state.activities[config.id] = { status: "ready" }; return render(scene, eligible);
      }
      panel.hidden = false; panel.dataset.activity = config.id; panel.dataset.kind = config.kind;
      panel.append(node("p", "途中小互动", "eyebrow"), node("h3", config.title));
      const choices = document.getElementById("choices");
      if (config.kind === "quiz") {
        panel.append(node("p", config.question, "activity-question"));
        if (["ready", "paused"].includes(record.status)) {
          if (record.status === "paused") panel.append(node("p", `已暂停，剩余 ${Math.ceil(remaining(record) / 1000)} 秒。`, "muted"));
          else panel.append(node("p", "准备好再开始。十秒只用于答题，正文阅读不限时。", "muted"));
          choices.append(button(record.status === "paused" ? "继续十秒答题" : "开始十秒答题", () => startQuiz(config), "option continue"), button("跳过小互动", () => skip(config), "option pass"));
          return true;
        }
        if (record.status === "running") {
          const clock = node("p", `${Math.ceil(remaining(record) / 1000)} 秒`, "activity-clock"); clock.setAttribute("role", "timer"); clock.setAttribute("aria-live", "off");
          const meter = node("div", undefined, "activity-meter"), fill = node("div", undefined, "activity-meter-fill");
          fill.style.transform = `scaleX(${remaining(record) / 10000})`; meter.setAttribute("aria-hidden", "true"); meter.append(fill); panel.append(clock, meter);
          optionsFor(config, scene, state).forEach(answer => {
            const b = button(answer.label, () => settle(config, answer), "option activity-answer");
            b.dataset.answer = String(answer.choiceId ?? answer.index); choices.append(b);
          });
          choices.append(button("暂停答题", () => { pause(); api.render(false); }, "option"), button("跳过小互动", () => skip(config), "option pass"));
          runTimer(config); return true;
        }
        if (record.status === "done") {
          const result = node("p", record.timeout ? "时间到了，这一题先留到以后。" : record.correct ? "答对了。" : "这次没答对，看看怎么推出来。", "activity-result"); result.setAttribute("role", "status");
          panel.append(result, node("p", config.explanation));
          if (!record.acknowledged) { choices.append(button("回到故事", () => acknowledge(config), "option continue")); return true; }
        } else panel.append(node("p", "本次跳过，故事照常继续。", "muted"));
        return false;
      }
      panel.append(node("p", "轻点空格旁的拼块，把它移入空格。也可以用键盘选中拼块后按回车。没有倒计时。", "activity-question"));
      if (["ready", "paused"].includes(record.status)) {
        choices.append(button(record.status === "paused" ? "继续拼图" : "开始拼图", () => startPuzzle(config), "option continue"), button("跳过小互动", () => skip(config), "option pass")); return true;
      }
      if (record.status === "running") {
        renderPuzzle(config, record);
        panel.append(node("p", "拼图进度会随存档保留，随时可以收起或跳过。", "muted"));
        choices.append(button("跳过小互动", () => skip(config), "option pass")); return true;
      }
      if (record.status === "done") {
        api.displayArt(config.art); panel.append(node("p", `拼好了，移动 ${record.moves || 0} 次。`, "activity-result"));
        if (!record.acknowledged) { choices.append(button("回到故事", () => acknowledge(config), "option continue")); return true; }
      } else panel.append(node("p", "本次跳过，故事照常继续。", "muted"));
      return false;
    }
    document.addEventListener("visibilitychange", () => { if (document.hidden && timerOwner) { pause(); api.render(false); } });
    window.addEventListener("pagehide", pause);
    return { render, pause, cancel: cancelTimer, hasPaused: () => { const current = context(); return !!current && recordFor(current.state, current.config).status === "paused"; } };
  };
})();
