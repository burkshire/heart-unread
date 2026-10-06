"use strict";
(() => {
  const B = window.CITY;
  Object.assign(B.assets, {
    "heroine-straight": "你 · 新的黑发与自己的纸",
    "heroine-blacknight": "你 · 今晚的灯由自己关",
    "gu-glasses": "顾砚 · 镜片后的视线",
    "zhou-parted": "周予白 · 今天直接说",
    "lu-swept": "陆星野 · 镜头以外的新样子",
    "wen-sidepart": "闻照 · 想被你看见",
    "gu-reading-v2": "顾砚 · 这一页借你的肩",
    "gu-scarf-v2": "顾砚 · 灰蓝色的一小段暖",
    "zhou-photo-v2": "周予白 · 一张愿意留下的照片",
    "zhou-mugs-v2": "周予白 · 两只不同的杯子",
    "lu-rehearsal-v2": "陆星野 · 没有观众的信",
    "lu-hairdry-v2": "陆星野 · 等你说愿意",
    "wen-record-v2": "闻照 · 听完这一段",
    "wen-bridge-v2": "闻照 · 不需要旁白的桥"
  });
  const looks = {
    gu: { portrait: "gu-glasses", first: "gf01", previous: ["gu-close", "gu-alone", "gu-rain"], memories: [["guReadingShoulder", "gu-reading-v2"], ["guScarfMoment", "gu-scarf-v2"]] },
    zhou: { portrait: "zhou-parted", first: "zf01", previous: ["zhou-close", "zhou-alone", "zhou-workbench"], memories: [["zhouPaintedMugs", "zhou-mugs-v2"], ["zhouInstantPortrait", "zhou-photo-v2"]] },
    lu: { portrait: "lu-swept", first: "lf01", previous: ["lu-close", "lu-alone", "lu-kitchen"], memories: [["luHairdryCare", "lu-hairdry-v2"], ["luPrivateLetterRead", "lu-rehearsal-v2"]] },
    wen: { portrait: "wen-sidepart", first: "wf01", previous: ["wen-close", "wen-alone", "wen-classroom"], memories: [["wenBridgeHand", "wen-bridge-v2"], ["wenRecordShoulder", "wen-record-v2"]] }
  };
  for (const [route, look] of Object.entries(looks)) {
    B.people[route].image = look.portrait;
    // Appearance is narrated before the choice. Refusing a date changes no relationship,
    // but must not undo a haircut already made by each person for themselves.
    for (const option of B.scenes[look.first].choices) option.flags = { ...option.flags, [route + "NewLook"]: true };
  }
  B.presentationArt = (art, state, ending = false) => {
    const look = looks[state?.route];
    if (!look || !state.flags?.[state.route + "NewLook"]) return art;
    if (ending && state.ending === state.route + "-he") {
      // A finale may show a remembered CG only if its actual interaction was selected.
      return look.memories.find(([flag]) => state.flags[flag])?.[1] || look.portrait;
    }
    if (look.previous.includes(art) || art === B.endings[state.route + "-he"].art) return look.portrait;
    if (["heroine-rest", "heroine-quiet", "heroine-bluehour"].includes(art)) return "heroine-blacknight";
    if (["heroine-close", "heroine-work", "heroine-deadline", "heroine-cutting"].includes(art)) return "heroine-straight";
    return art; // Original event CGs, supplied art and gallery entries remain intact.
  };
})();
