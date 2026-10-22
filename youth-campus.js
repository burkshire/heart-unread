"use strict";
window.HEART_YOUTH_CAMPUS = (() => {
  const S = window.HEART_YOUTH, D = window.HEART_YOUTH_DATA;
  if (!S || !D) throw Error("请先载入高中故事与进度规则。");
  const freeze = value => { for (const child of Object.values(value)) if (child && typeof child === "object") freeze(child); return Object.freeze(value); };
  const places = freeze({
    classroom: { id: "classroom", label: "教室", sceneId: "classroom", art: "classroom", description: "窗边有翻动的书页。可以整理学习方法，也可以和周予白聊一会儿。", position: { x: 19, y: 19 } },
    dormitory: { id: "dormitory", label: "宿舍", sceneId: "dormitory", art: "campus-dormitory", description: "书桌、耳机和留给自己的角落。听歌、收好喜欢的东西，或者安静休息。", position: { x: 20, y: 72 } },
    cafeteria: { id: "cafeteria", label: "食堂", sceneId: "corridor", art: "campus-cafeteria", description: "和沈棠一起找张空桌，聊聊最近喜欢的歌，也可以约好周末从这里出发。", position: { x: 82, y: 74 } },
    club: { id: "club", label: "社团活动室", sceneId: "clubroom", art: "campus-club", description: "纸桥、广播稿和等待测试的点子都在这里。许知行也常来整理器材。", position: { x: 60, y: 53 } },
    sports: { id: "sports", label: "运动场", sceneId: "schoolyard", art: "campus-sports", description: "海风经过跑道。程屿在寻找新的取景，偶尔把相机放下，认真看一会儿。", position: { x: 86, y: 34 } },
    artroom: { id: "artroom", label: "画室", sceneId: "clubroom", art: "campus-artroom", description: "色卡与草图铺开一桌。试试设计、练习创作，和林见微把想法做成能翻的一页。", position: { x: 17, y: 45 } },
    library: { id: "library", label: "图书馆", sceneId: "classroom", art: "campus-library", description: "书架之间留着安静的位置。查资料、练习推理，把听来的故事慢慢核实。", position: { x: 52, y: 24 } }
  });
  const scenePlace = freeze({ classroom: "classroom", corridor: "classroom", noticeboard: "club", clubroom: "club", broadcast: "club", schoolyard: "sports", "school-gate": "sports", dormitory: "dormitory" });
  const studyPlace = freeze({ study: "classroom", express: "classroom", logic: "library", craft: "artroom" });
  const directionPlace = freeze({ design: "artroom", science: "club", humanities: "library", media: "club" });
  const socialPlace = freeze({ zhou: "classroom", cheng: "sports", xu: "club", lin: "artroom", tang: "cafeteria" });
  const hobbyPlace = freeze({ listen: "dormitory", scrapbook: "dormitory", album: "dormitory", show: "cafeteria" });
  const own = (value, key) => typeof key === "string" && Object.prototype.hasOwnProperty.call(value, key);
  function destination(state, group, id) {
    if (group === "event") return scenePlace[D.rounds[state.round].event.sceneId] || "classroom";
    if (group === "game") return scenePlace[D.games[id]?.sceneId] || "classroom";
    if (group === "study") return studyPlace[id] || "classroom";
    if (group === "explore") return directionPlace[id] || "classroom";
    if (group === "project") return directionPlace[id.split(":")[0]] || "classroom";
    if (group === "social") return socialPlace[id] || "classroom";
    if (group === "hobby") return hobbyPlace[id] || "classroom";
    if (group === "rest") return "dormitory";
    return "classroom";
  }
  function activities(state, placeId) {
    if (!own(places, placeId) || state?.phase !== "plan") return [];
    return S.groups(state).flatMap(group => S.options(state, group.id).filter(option => destination(state, group.id, option.id) === placeId).map(option => ({ group: group.id, option })));
  }
  function grouped(state, placeId) {
    if (!own(places, placeId) || state?.phase !== "plan") return [];
    const rows = activities(state, placeId);
    return S.groups(state).map(group => ({ id: group.id, label: group.label, note: group.note, options: rows.filter(row => row.group === group.id).map(row => row.option) })).filter(group => group.options.length);
  }
  function timeJump(before, after) {
    if (!before || !after || before.phase !== "review" || !Number.isInteger(before.round) || before.round < 0 || before.round > 23 || before.page !== S.scene(before).total - 1) return null;
    const previous = D.rounds[before.round], from = `${D.terms[previous.term].title} · ${previous.season}`;
    if (before.round === 23 && after.round === 23 && after.phase === "reflect") return { title: "毕业之前，再回头看一眼", from, to: "高三毕业 · 盛夏", caption: "铃声落下，三年的课表翻到最后。先把真正经历过的事收好，再决定下一页往哪里走。" };
    if (after.round !== before.round + 1 || after.phase !== "opening") return null;
    const next = D.rounds[after.round], nextTerm = next.term !== previous.term;
    const caption = nextTerm ? next.term === 2 || next.term === 4 ? "暑假过去，校园又响起熟悉的铃声。课表换了新的页码，你仍然可以决定把课余时间留给什么。" : "新的学期到了。带上已经试过的办法，也给还没决定的事留一点空白。" : "课堂、晚自习和放学后的路继续向前。你翻开新的空白页，接着安排属于自己的时间。";
    return { title: nextTerm ? "新学期，下一页" : "时间向前，课表继续", from, to: `${D.terms[next.term].title} · ${next.season}`, caption };
  }
  return Object.freeze({ places, activities, grouped, timeJump });
})();
