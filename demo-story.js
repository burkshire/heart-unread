"use strict";
window.HEART_DEMO = (() => {
  const art = {
    studio: { alt: "晨光落进摆满设计稿的工作室", shape: "wide" },
    "heroine-straight": { alt: "黑色长发的你在窗边读书", focus: "50% 26%" },
    "heroine-blacknight": { alt: "你独自坐在夜色与灯光之间", focus: "50% 27%" },
    "gu-glasses": { alt: "顾砚戴着金丝框眼镜，低头看向书页", focus: "50% 25%" },
    "gu-reading-v2": { alt: "你与顾砚靠在一起，读同一本书", focus: "50% 27%" },
    "zhou-parted": { alt: "周予白在工作台边摆弄一个小模型", focus: "50% 26%" },
    "zhou-mugs-v2": { alt: "你和周予白并肩画着各自的杯子", focus: "50% 28%" },
    "zhou-photo-v2": { alt: "周予白拿着相机，陪你看刚拍下的照片", focus: "50% 28%" },
    "lu-swept": { alt: "陆星野拿着一页台词，抬头朝你笑", focus: "50% 25%" },
    "lu-rehearsal-v2": { alt: "陆星野靠近你，念着纸上的那封信", focus: "50% 28%" },
    "wen-sidepart": { alt: "闻照坐在桌边，银灰色的头发落下柔和的光", focus: "50% 26%" },
    "wen-record-v2": { alt: "你和闻照戴着耳机，依偎着听唱片", focus: "50% 27%" },
    "wen-bridge-v2": { alt: "你和闻照在夜晚的桥边牵着手", focus: "50% 25%" }
  };
  const routes = {
    opening: { name: "一个普通的早晨", subtitle: "从你自己的生活开始", number: "序", start: "morning-1", image: "studio" },
    gu: { name: "顾砚", subtitle: "这一页，借你的肩", number: "壹", start: "gu-1", image: "gu-glasses" },
    zhou: { name: "周予白", subtitle: "不必画成一样的杯子", number: "贰", start: "zhou-1", image: "zhou-parted" },
    lu: { name: "陆星野", subtitle: "剧本里没有的那一句", number: "叁", start: "lu-1", image: "lu-swept" },
    wen: { name: "闻照", subtitle: "这次，不借工作的名字", number: "肆", start: "wen-1", image: "wen-sidepart" },
    solo: { name: "留给自己", subtitle: "一个人，也会发生好故事", number: "终", start: "solo-1", image: "heroine-straight" }
  };
  const frames = {};
  function add(route, defaults, list) {
    list.forEach((frame, index) => {
      if (frames[frame.id]) throw new Error("Duplicate demo frame: " + frame.id);
      frames[frame.id] = { route, speaker: "旁白", ...defaults, next: frame.end ? null : list[index + 1]?.id || null, ...frame };
    });
  }
  add("opening", { art: "studio", place: "上海 · 08:17", caption: "你的生活" }, [
    { id: "morning-1", lines: ["晨光越过窗沿，落在还没收好的色卡上。", "你把最后一张设计稿导出，终于有空喝一口咖啡。"] },
    { id: "morning-2", art: "heroine-straight", speaker: "{name}", lines: ["今天先不赶路。", "把早饭吃完，再决定要见谁。"] },
    { id: "morning-3", lines: ["你在北京长大，如今在上海做自由设计。", "妈妈刚发来一张阳台的花。你回了个笑脸，手机又接连亮起。"] },
    { id: "morning-4", lines: ["有人约你去书店，有人给你留了手作课的位置。", "还有一通来自北京的电话，和一条不肯再假装是工作邀约的消息。"] },
    { id: "morning-choice", lines: ["日程表上，还没有写下任何人的名字。", "这一天，可以慢慢由你来填。"], question: "先让哪一件事发生？", choices: [
      { label: "赴顾砚的书店之约", note: "他说，有一页需要你一起看。", next: "gu-1" },
      { label: "和周予白一起画杯子", note: "两只白杯，都还没有图案。", next: "zhou-1" },
      { label: "听陆星野把那句台词说完", note: "下一次北京行程，多留一小时。", next: "lu-1" },
      { label: "答应闻照的私人邀请", note: "去深圳布展的那个晚上，留给唱片。", next: "wen-1" },
      { label: "今天谁也不选", note: "先过完我自己的早晨。", next: "solo-1", kind: "pass" }
    ] }
  ]);
  add("gu", { art: "gu-glasses", place: "上海 · 旧书店 · 11:06", caption: "这一页，借你的肩" }, [
    { id: "gu-1", lines: ["顾砚比你早到。你刚坐下，他就把翻到一半的书推过来。", "镜片后的目光，却没有落在书上。"] },
    { id: "gu-2", speaker: "顾砚", lines: ["有一处，没看懂。"] },
    { id: "gu-3", speaker: "{name}", lines: ["你也会有看不懂的地方？"] },
    { id: "gu-4", lines: ["他翻开夹着便签的那一页。", "上面是你的字：想跟喜欢的人，一起做一次没用的事。"] },
    { id: "gu-5", speaker: "顾砚", lines: ["读书算不算？", "今天不谈方案，也不替你排明天的日程。"] },
    { id: "gu-choice", lines: ["你想起那张写完就忘掉的便签。", "原来有人把它当成了需要认真赴约的邀请。"], question: "你想怎么靠近？", choices: [
      { label: "挪过去，靠着他的肩读同一页", note: "今天，允许一件没有效率的事。", next: "gu-close-1" },
      { label: "问他：今天也有最优解吗？", note: "想听见公式以外的回答。", next: "gu-honest-1" },
      { label: "先不靠近。我想再慢一点", note: "舒服的距离，也由我决定。", next: "gu-slow-1", kind: "pass" }
    ] }
  ]);
  add("gu", { art: "gu-reading-v2", place: "上海 · 旧书店 · 11:24", caption: "这一页，借你的肩" }, [
    { id: "gu-close-1", lines: ["你只挪过去一点。顾砚便把书往自己这边收了收，空出肩膀。", "没有提醒你坐好。也没有翻页。"] },
    { id: "gu-close-2", speaker: "{name}", lines: ["这页很难？", "怎么半天不翻。"] },
    { id: "gu-close-3", speaker: "顾砚", lines: ["不难。", "我在等你靠稳。"] },
    { id: "gu-close-4", lines: ["你把额角轻轻抵在他的肩上。", "窗外的车又走过一轮。这一次，谁也没觉得浪费。"], end: true }
  ]);
  add("gu", { art: "gu-glasses", place: "上海 · 旧书店 · 11:24", caption: "这一页，借你的肩" }, [
    { id: "gu-honest-1", speaker: "顾砚", lines: ["没有。", "我想见你。这不是哪套算法算出来的。"] },
    { id: "gu-honest-2", lines: ["他第一次没有给自己的答案补上论证。", "你低头笑了一下，把手机翻了过去。"], end: true },
    { id: "gu-slow-1", speaker: "顾砚", lines: ["好。那就先坐在这里。"] },
    { id: "gu-slow-2", lines: ["他把你那侧的椅子往外让了半寸。", "那本书仍在你们中间，他没有问你还需要多久。"], end: true }
  ]);
  add("zhou", { art: "zhou-parted", place: "上海 · 手作工作室 · 14:20", caption: "不必画成一样的杯子" }, [
    { id: "zhou-1", lines: ["周予白在长桌另一端抬起头。", "两只白杯、一排画笔，和给你留好的窗边位置。"] },
    { id: "zhou-2", speaker: "周予白", lines: ["你的那只，不用照着我的画。"] },
    { id: "zhou-3", speaker: "{name}", lines: ["怕我画坏？"] },
    { id: "zhou-4", speaker: "周予白", lines: ["怕你又先问，别人喜欢什么。"] },
    { id: "zhou-5", lines: ["你握着笔，停了一下。", "他已经把最细的那一支递过来，笔尖朝着自己。"] },
    { id: "zhou-choice", lines: ["窗台的影子慢慢移进桌面。", "谁也没有催你下第一笔。"], question: "给这一刻留点什么？", choices: [
      { label: "往他的杯沿，点一朵歪歪的花", note: "先留下一个不太完美的记号。", next: "zhou-cup-1" },
      { label: "请他为我拍一张今天的照片", note: "这次，认真看镜头。", next: "zhou-photo-1" },
      { label: "不做双人杯，先画自己的", note: "我已经想好自己的图案。", next: "zhou-solo-1", kind: "pass" }
    ] }
  ]);
  add("zhou", { art: "zhou-mugs-v2", place: "上海 · 手作工作室 · 15:02", caption: "不必画成一样的杯子" }, [
    { id: "zhou-cup-1", lines: ["你一抖手，花瓣比想象中胖了一圈。", "周予白没有擦。他把杯子转了个方向，让那朵花正对着你。"] },
    { id: "zhou-cup-2", speaker: "周予白", lines: ["这样我一拿起来，就知道是你画的。"] },
    { id: "zhou-cup-3", lines: ["你的杯子上，他只添了一片很小的叶子。", "两只杯子没有画成一套，却能认出是放在一起的。"], end: true }
  ]);
  add("zhou", { art: "zhou-photo-v2", place: "上海 · 手作工作室 · 15:02", caption: "不必画成一样的杯子" }, [
    { id: "zhou-photo-1", lines: ["他举起相机，又放下，认真替你看了一遍窗边的光。", "照片慢慢显出来时，你发现自己正笑得毫无防备。"] },
    { id: "zhou-photo-2", speaker: "{name}", lines: ["你拍得比我想象中好。"] },
    { id: "zhou-photo-3", speaker: "周予白", lines: ["因为今天，你看起来很开心。", "想把这个留下来。"], end: true }
  ]);
  add("zhou", { art: "zhou-parted", place: "上海 · 手作工作室 · 15:02", caption: "不必画成一样的杯子" }, [
    { id: "zhou-solo-1", lines: ["他点点头，给你的调色盘添了点清水。", "你们仍坐在同一张桌子前，画着完全不同的图案。"] },
    { id: "zhou-solo-2", speaker: "周予白", lines: ["画完叫我。", "我想看看，你自己喜欢的样子。"], end: true }
  ]);
  add("lu", { art: "lu-swept", place: "三天后 · 北京 · 排练室", caption: "剧本里没有的那一句" }, [
    { id: "lu-1", lines: ["来北京交稿的最后一天，你给陆星野留了一小时。", "平日最会说话的人，已经把同一页台词读了三遍。"] },
    { id: "lu-2", speaker: "陆星野", lines: ["我对着镜头，不紧张。", "可你现在先别笑我。"] },
    { id: "lu-3", speaker: "{name}", lines: ["你不是拿过最佳男主角？"] },
    { id: "lu-4", speaker: "陆星野", lines: ["对你说的话，台词老师没教过。"] },
    { id: "lu-5", lines: ["他手里的纸被攥出一道浅浅的折痕。", "你忽然明白，今天他邀请来的并不是一个观众。"] },
    { id: "lu-choice", lines: ["门外有人经过，陆星野没有回头。", "他在等你的那一句。"], question: "这一次，要怎么接住他？", choices: [
      { label: "靠近他：说你自己的那一句", note: "我会认真听。", next: "lu-close-1" },
      { label: "逗他：这条打算 NG 几次？", note: "不着急，陪他慢慢来。", next: "lu-joke-1" },
      { label: "今天先不排这场戏，去吃饭", note: "不必立刻给浪漫一个回答。", next: "lu-dinner-1", kind: "pass" }
    ] }
  ]);
  add("lu", { art: "lu-rehearsal-v2", place: "北京 · 排练室 · 午后", caption: "剧本里没有的那一句" }, [
    { id: "lu-close-1", lines: ["你走到他旁边，替他把纸上卷起的角抚平。", "剧本还在，但他要说的下一句不在那张纸上。"] },
    { id: "lu-close-2", speaker: "陆星野", lines: ["我一直在想，怎么叫你的名字，才不像台词。"] },
    { id: "lu-close-3", speaker: "{name}", lines: ["那你试试看。"] },
    { id: "lu-close-4", speaker: "陆星野", lines: ["{name}。", "他说得很慢。这一遍，只给你一个人听。"], end: true }
  ]);
  add("lu", { art: "lu-swept", place: "北京 · 排练室 · 午后", caption: "剧本里没有的那一句" }, [
    { id: "lu-joke-1", speaker: "陆星野", lines: ["你不走的话，几次都行。"] },
    { id: "lu-joke-2", lines: ["你刚笑出声，他自己也跟着笑了。", "那道被攥皱的折痕，终于在他松开的手里舒展开。"], end: true },
    { id: "lu-dinner-1", speaker: "陆星野", lines: ["好。想吃什么？", "今天你不用负责捧场，我也可以陪你随便过。"] },
    { id: "lu-dinner-2", lines: ["他把剧本放回桌上，拿起外套。", "你没有接那句告白，门仍然被他好好地替你打开。"], end: true }
  ]);
  add("wen", { art: "wen-sidepart", place: "一周后 · 深圳 · 布展结束", caption: "这次，不借工作的名字" }, [
    { id: "wen-1", lines: ["布展结束，闻照抱着一张唱片站在门外。", "你正要问是不是项目组的安排，他先开了口。"] },
    { id: "wen-2", speaker: "闻照", lines: ["不是工作。", "我已经把“交流项目”的开场白删掉了。"] },
    { id: "wen-3", speaker: "{name}", lines: ["那是什么？"] },
    { id: "wen-4", speaker: "闻照", lines: ["一张唱片。", "和一个想见你、又一直在找借口的人。"] },
    { id: "wen-5", lines: ["他的指尖沿着唱片封套轻轻压了一下。", "这一次，邀请上没有任何别的名字。"] },
    { id: "wen-choice", lines: ["你把工作证收进包里。", "剩下的时间，终于只属于你自己。"], question: "让这个晚上停在哪里？", choices: [
      { label: "接过耳机，靠在他的肩上", note: "去唱片店，把这一面听完。", next: "wen-record-1" },
      { label: "一起去桥边，主动牵住他的手", note: "今天不需要旁白。", next: "wen-bridge-1" },
      { label: "今晚想一个人，下次再约", note: "喜欢，也允许留白。", next: "wen-alone-1", kind: "pass" }
    ] }
  ]);
  add("wen", { art: "wen-record-v2", place: "深圳 · 唱片店 · 20:46", caption: "这次，不借工作的名字" }, [
    { id: "wen-record-1", lines: ["唱针落下，细小的沙沙声从耳机里传来。", "你把头靠过去，他的肩膀便安静地低了一点。"] },
    { id: "wen-record-2", speaker: "闻照", lines: ["这一首，我提前听了很多遍。"] },
    { id: "wen-record-3", speaker: "{name}", lines: ["怕不好听？"] },
    { id: "wen-record-4", speaker: "闻照", lines: ["怕你听完，就说该回去了。", "但要是你想走，我会陪你走到门口。"], end: true }
  ]);
  add("wen", { art: "wen-bridge-v2", place: "深圳 · 桥边 · 21:10", caption: "这次，不借工作的名字" }, [
    { id: "wen-bridge-1", lines: ["你在走到桥中央时，主动伸出手。", "闻照愣了一下，才慢慢回握。"] },
    { id: "wen-bridge-2", speaker: "闻照", lines: ["我现在是不是可以，把准备好的话忘掉？"] },
    { id: "wen-bridge-3", lines: ["你把他的手握得紧了一点。", "远处的灯亮起来。你们没有急着过完这座桥。"], end: true }
  ]);
  add("wen", { art: "wen-sidepart", place: "深圳 · 布展结束", caption: "这次，不借工作的名字" }, [
    { id: "wen-alone-1", speaker: "闻照", lines: ["好。那你今晚好好休息。", "下次我会直接问：你什么时候有空？"] },
    { id: "wen-alone-2", lines: ["你们在门口告别。那张唱片留在他的手里。", "他没有把你的疲倦，读成一道需要被说服的题。"], end: true }
  ]);
  add("solo", { art: "heroine-straight", place: "上海 · 你的工作室 · 09:02", caption: "留给自己，也是一种选择" }, [
    { id: "solo-1", lines: ["你把消息一条条回好：今天想先忙自己的事。", "没有加上一个歉意的表情。"] },
    { id: "solo-2", art: "studio", lines: ["咖啡还温着，稿件也终于发了出去。", "你给妈妈回了一个电话，听她讲了很久阳台上的花。"] },
    { id: "solo-3", art: "heroine-blacknight", place: "上海 · 入夜", lines: ["到了晚上，你在本子上给新的设计起了一个名字。", "这一天没有奔向任何人，却也没有被浪费。"], end: true }
  ]);
  return Object.freeze({ version: 1, art, routes, frames, start: "morning-1" });
})();
