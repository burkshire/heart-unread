"use strict";
(() => {
  const B = window.CITY;
  // Keep stable scene IDs so existing V3 saves can resume after an expansion.
  B.reviseScene = (id, patch) => {
    const scene = B.scenes[id];
    if (!scene) throw Error(`不存在的场景 ${id}`);
    const oldPass = scene.choices.find(o => o.kind === "pass");
    Object.assign(scene, patch);
    if (patch.choices || patch.pass) {
      const options = patch.choices || scene.choices.filter(o => o.kind !== "pass");
      scene.choices = options.map((o, i) => ({ ...o, id: `${id}:${i}` }));
      scene.choices.push(patch.pass ? {
        id: `${id}:pass`, kind: "pass", label: patch.pass[0],
        response: patch.pass[1], next: patch.pass[2]
      } : oldPass);
    }
    return scene;
  };
  B.insertScenes = (after, route, list) => {
    const prior = B.scenes[after];
    if (!prior || !list.length) throw Error(`无效的插入位置 ${after}`);
    const oldNext = prior.next;
    list[list.length - 1].next = oldNext;
    B.add(route, list);
    prior.next = list[0].id;
    // Explicit pass/choice links must not accidentally skip the new chapters.
    for (const option of prior.choices) {
      if (!option.ending && option.next === oldNext) option.next = list[0].id;
    }
  };
})();
