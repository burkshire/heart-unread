"use strict";
(() => {
  const B = window.CITY;
  const list = [
    { id: "color-light", scene: "c08", kind: "quiz", seconds: 10, title: "十秒 · 红与青", question: "屏幕里的红光与青光等量叠加，理想情况下会得到什么？", sceneChoices: true, correctChoice: "c08:0", explanation: "青光由绿光和蓝光组成，与红光叠加后趋向白；纸墨混色不能套用这条规则。" },
    { id: "studio-photo", scene: "c13", kind: "puzzle", title: "把影像棚的照片拼好", art: "lz9", ratio: "3 / 4" },
    { id: "dance-count", scene: "gq05", kind: "quiz", seconds: 10, title: "十秒 · 下一步", question: "老师给练习定了三步一组的规则。从第 1 步开始连续计数，第 8 步属于哪一组、哪一步？", answers: ["第 3 组，第 2 步", "第 2 组，第 3 步", "第 3 组，第 3 步"], correct: 0, explanation: "第 1 组是 1–3，第 2 组是 4–6，第 3 组是 7–9，所以第 8 步是第 3 组的第 2 步。" },
    { id: "model-scale", scene: "zq03", kind: "quiz", seconds: 10, title: "十秒 · 纸模型的比例", question: "一张公开纸模型图按 1∶10 缩小。原件长 80 厘米，模型应该长多少厘米？", answers: ["8 厘米", "800 厘米", "0.8 厘米"], correct: 0, explanation: "1∶10 表示模型长度是原件的十分之一，80 ÷ 10 = 8 厘米。" },
    { id: "actor-photo", scene: "lf10", kind: "puzzle", title: "拼好镜头之外的照片", art: "lu-swept", ratio: "3 / 4" },
    { id: "reading-groups", scene: "wf05", kind: "quiz", seconds: 10, title: "十秒 · 试读的分组卡", question: "甲、乙、丙各读一种不同的稿件：诗、故事、随笔。乙读随笔，甲不读诗，丙不读故事。甲读什么？", answers: ["故事", "诗", "随笔"], correct: 0, explanation: "乙已经读随笔；甲不读诗，只能读故事，剩下的诗归丙。" },
    { id: "shared-photo", scene: "an03", kind: "puzzle", title: "把那次见面的合照放回去", art: "crossroads", ratio: "3 / 2" }
  ];
  B.activities = Object.fromEntries(list.map(a => [a.scene, Object.freeze(a)]));
  B.activityList = Object.freeze(list);
  const neighbors = blank => [blank - 3, blank + 3, blank % 3 ? blank - 1 : -1, blank % 3 < 2 ? blank + 1 : -1].filter(i => i >= 0 && i < 9);
  B.puzzleBoardValid = board => Array.isArray(board) && board.length === 9 && new Set(board).size === 9 && board.every(n => Number.isInteger(n) && n >= 0 && n < 9);
  B.puzzleSolved = board => B.puzzleBoardValid(board) && board.every((n, i) => n === i);
  B.puzzleSolvable = board => {
    if (!B.puzzleBoardValid(board)) return false;
    const tiles = board.filter(n => n !== 8); let inversions = 0;
    for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) inversions++;
    return inversions % 2 === 0;
  };
  B.puzzleMove = (board, index) => {
    if (!B.puzzleBoardValid(board)) return null;
    const blank = board.indexOf(8); if (!neighbors(blank).includes(index)) return null;
    const next = [...board]; [next[index], next[blank]] = [next[blank], next[index]]; return next;
  };
  B.puzzleShuffle = seed => {
    let n = (seed >>> 0) || 137, board = [...Array(9).keys()], previous = -1;
    for (let i = 0; i < 28 || B.puzzleSolved(board); i++) {
      const blank = board.indexOf(8), options = neighbors(blank).filter(k => k !== previous);
      n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
      board = B.puzzleMove(board, options[n % options.length]); previous = blank;
    }
    return board;
  };
})();
