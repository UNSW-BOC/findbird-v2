import type { Difficulty } from './types';

export type Language = 'zh' | 'en';

export const COPY = {
  zh: {
    documentTitle: 'FindBird · 寻鸟挑战',
    documentDescription: '在真实自然照片中寻找鸟类的五关观察游戏。',
    homeLabel: 'FindBird 首页',
    switchLanguage: 'Switch to English',
    challenge: '五关寻鸟挑战',
    heroLead: '凝神，',
    heroMiddle: '发现',
    heroAccent: '羽迹。',
    heroIntro: '在真实自然照片里找到藏身其中的鸟。每张照片 30 秒，找齐才能得分。',
    start: '开始观察',
    factsLabel: '游戏规则摘要',
    photoRounds: '关照片',
    secondsPerRound: '秒 / 关',
    highestScore: '最高分',
    libraryPreview: '本期题库照片预览',
    naturePhotoAlt: '自然环境中的鸟类',
    lookCloser: '仔细观察',
    fieldNoteTop: '真实照片',
    fieldNoteBottom: '随机抽题',
    howToPlay: '玩法说明',
    beforeStart: '出发前',
    threeThings: '三件小事',
    briefing: [
      ['放大照片', '移动滑杆或使用加减按钮，放大后可拖动观察。'],
      ['点中鸟儿', '找到后会留下标记；重复点击已找到的鸟不扣分。'],
      ['兼顾速度', '找齐才有分，时间越多、误点越少，得分越高。'],
    ],
    cannotStart: '无法开始',
    bankNeedsMore: '题库需要补充',
    bankError: '题库至少需要 2 张简单、2 张中等和 1 张困难照片。',
    backHome: '返回首页',
    webmcpTitle: '开始寻鸟挑战',
    webmcpDescription: '开始一局新的五关 FindBird 游戏，并在页面中显示第一关。',
    webmcpNoArgs: 'start_findbird_game 不接受参数',
    found: '已找到',
    timeLeft: '剩余时间',
    wrongClicks: '误点',
    missionLive: '观察任务进行中',
    dragHint: '拖动照片继续观察',
    clickHint: '点击照片中鸟所在的位置',
    loadingPhoto: '正在载入照片',
    roundGoal: '本关目标',
    observationComplete: '观察完成',
    allFound: '全部找到！',
    roundFinished: '本关结束',
    timeUp: '时间到',
    lookAgain: '再仔细看看',
    photoAlt: '请在这张自然照片中寻找目标鸟',
    zoomOut: '缩小照片',
    zoomLevel: '照片缩放比例',
    zoomIn: '放大照片',
    resultsKicker: '本次观察记录',
    perfectResult: '目光如炬，五处羽迹全部收入眼底。',
    goodResult: '很好的观察！还有几只鸟藏得更深。',
    tryAgainResult: '自然从不急着显露，再靠近一点看看。',
    completedRounds: '完成关卡',
    foundTargets: '发现目标',
    replay: '再玩一次',
    resultsLabel: '五关结果',
    completed: '✓ 已全部找到',
    incomplete: '未找齐',
    roundScore: '本关得分',
    timeResult: '用时结果',
    exhausted: '时间耗尽',
    answerFound: '✓ 已找到',
    answerMissed: '○ 未找到',
    retry: '重新挑战',
  },
  en: {
    documentTitle: 'FindBird · Birding Challenge',
    documentDescription: 'A five-round observation game using real wildlife photographs.',
    homeLabel: 'FindBird home',
    switchLanguage: '切换为中文',
    challenge: 'FIVE-ROUND BIRDING CHALLENGE',
    heroLead: 'Look closer,',
    heroMiddle: 'follow the',
    heroAccent: 'feather trail.',
    heroIntro: 'Find every bird hidden in real wildlife photographs. You have 30 seconds per photo, and only a complete find scores.',
    start: 'Start observing',
    factsLabel: 'Game rules at a glance',
    photoRounds: 'photo rounds',
    secondsPerRound: 'seconds / round',
    highestScore: 'top score',
    libraryPreview: 'Question bank photo preview',
    naturePhotoAlt: 'Bird habitat in the wild',
    lookCloser: 'Look closer',
    fieldNoteTop: 'Real photos',
    fieldNoteBottom: 'Random draw',
    howToPlay: 'How to play',
    beforeStart: 'Before you begin',
    threeThings: 'Three quick tips',
    briefing: [
      ['Zoom in', 'Move the slider or use the buttons. Once zoomed in, drag the photo to explore.'],
      ['Spot the bird', 'A marker stays on each find. Clicking a bird you already found never counts as a miss.'],
      ['Balance speed', 'You only score after finding them all. More time and fewer misses mean more points.'],
    ],
    cannotStart: 'Unable to start',
    bankNeedsMore: 'The question bank needs more photos',
    bankError: 'The bank needs at least 2 easy, 2 medium, and 1 hard photo.',
    backHome: 'Back to home',
    webmcpTitle: 'Start the birding challenge',
    webmcpDescription: 'Start a new five-round FindBird game and show the first round.',
    webmcpNoArgs: 'start_findbird_game does not accept arguments',
    found: 'Found',
    timeLeft: 'Time left',
    wrongClicks: 'Misses',
    missionLive: 'Observation in progress',
    dragHint: 'Drag the photo to keep exploring',
    clickHint: 'Click where you see a bird',
    loadingPhoto: 'Loading photo',
    roundGoal: 'Round target',
    observationComplete: 'Observation complete',
    allFound: 'All birds found!',
    roundFinished: 'Round finished',
    timeUp: 'Time is up',
    lookAgain: 'Look a little closer',
    photoAlt: 'Find the target bird in this wildlife photograph',
    zoomOut: 'Zoom out',
    zoomLevel: 'Photo zoom level',
    zoomIn: 'Zoom in',
    resultsKicker: 'Your observation record',
    perfectResult: 'An eagle eye — you found every feathered trace.',
    goodResult: 'Sharp spotting. A few birds were hiding even deeper.',
    tryAgainResult: 'Nature takes its time revealing itself. Look a little closer.',
    completedRounds: 'Rounds cleared',
    foundTargets: 'Birds found',
    replay: 'Play again',
    resultsLabel: 'Five-round results',
    completed: '✓ All found',
    incomplete: 'Not all found',
    roundScore: 'Round score',
    timeResult: 'Time result',
    exhausted: 'Time expired',
    answerFound: '✓ Found',
    answerMissed: '○ Missed',
    retry: 'Try again',
  },
} as const;

export const DIFFICULTY_LABELS: Record<Language, Record<Difficulty, string>> = {
  zh: { easy: '简单', medium: '中等', hard: '困难' },
  en: { easy: 'Easy', medium: 'Medium', hard: 'Hard' },
};

export const DIFFICULTY_CODES: Record<Difficulty, string> = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' };

export function targetCountText(language: Language, count: number) {
  return language === 'zh' ? `图中有 ${count} 只鸟` : `${count} bird${count === 1 ? '' : 's'} in this photo`;
}

export function remainingTargetText(language: Language, count: number) {
  return language === 'zh' ? `还剩 ${count} 只鸟` : `${count} bird${count === 1 ? '' : 's'} left`;
}

export function roundTitle(language: Language, difficulty: Difficulty) {
  return language === 'zh' ? `${DIFFICULTY_LABELS.zh[difficulty]}关卡` : `${DIFFICULTY_LABELS.en[difficulty]} round`;
}

export function remainingTimeText(language: Language, seconds: number) {
  return language === 'zh' ? `剩 ${seconds} 秒` : `${seconds}s left`;
}

export function cropAltText(language: Language, nameZh: string, nameEn: string) {
  return language === 'zh' ? `${nameZh}局部放大图` : `Close-up of ${nameEn}`;
}
