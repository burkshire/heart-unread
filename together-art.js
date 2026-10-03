"use strict";
(() => {
  const B = window.CITY;
  Object.assign(B.assets, {
    "gu-kitchen": "顾砚 · 厨房里的意外答案",
    "gu-nighttrain": "顾砚 · 末班车的肩膀",
    "zhou-supper": "周予白 · 留下另一双筷子",
    "zhou-ferry": "周予白 · 把心事带到江边",
    "lu-rain": "陆星野 · 雨只落在伞外",
    "lu-lamplight": "陆星野 · 只说给你听",
    "wen-cake": "闻照 · 今天可以做坏一点",
    "wen-morning": "闻照 · 天亮以前的约定"
  });
  // This object can exist without the player choosing the paper-star activity.
  // Leave the actual star memory in the choice response, where its flag is checked.
  const last = B.scenes.lp09;
  last.text = last.text.replace("他拿出那颗蓝星，边角已经磨白。你问怎么带着，他说今天想拿来给你看看。你突然觉得那些不需要被全国认识的东西，也可以被很认真地保管。", "他拿出小剧场的节目单，边角已经磨白，上面有他为下一次排练做的笔记。你问怎么带着，他说今天想拿来给你看看。你突然觉得那些不需要被全国认识的东西，也可以被很认真地保管。");
})();
