/** @typedef {'easy' | 'medium' | 'hard'} Difficulty */

export const GAME_CONFIG = Object.freeze({
  roundSeconds: 30,
  roundCount: 5,
  baseScore: 700,
  secondsMultiplier: 10,
  wrongClickPenalty: 100,
  minimumCompletedScore: 100,
  maximumRoundScore: 1000,
  hitTolerancePx: 6,
  introDurationMs: 1500,
  successDelayMs: 950,
  timeoutRevealMs: 1400,
});

export const ROUND_DIFFICULTIES = /** @type {const} */ (['easy', 'easy', 'medium', 'medium', 'hard']);

/**
 * @param {number} remainingSeconds
 * @param {number} wrongClicks
 * @param {boolean} completed
 */
export function calculateRoundScore(remainingSeconds, wrongClicks, completed) {
  if (!completed) return 0;
  return Math.min(
    GAME_CONFIG.maximumRoundScore,
    Math.max(
      GAME_CONFIG.minimumCompletedScore,
      GAME_CONFIG.baseScore + remainingSeconds * GAME_CONFIG.secondsMultiplier - wrongClicks * GAME_CONFIG.wrongClickPenalty,
    ),
  );
}

/**
 * @template {{ id: string, difficulty: Difficulty }} T
 * @param {T[]} questions
 * @param {() => number} [random]
 * @returns {T[]}
 */
export function selectRoundQuestions(questions, random = Math.random) {
  /** @type {Record<Difficulty, T[]>} */
  const pools = { easy: [], medium: [], hard: [] };
  questions.forEach((question) => pools[question.difficulty]?.push(question));

  const required = { easy: 2, medium: 2, hard: 1 };
  const shortages = /** @type {string[]} */ ([]);
  Object.entries(required).forEach(([difficulty, count]) => {
    const available = pools[/** @type {Difficulty} */ (difficulty)].length;
    if (available < count) shortages.push(`${difficulty}: 需要 ${count}，现有 ${available}`);
  });
  if (shortages.length) throw new Error(`题库数量不足（${shortages.join('；')}）`);

  /** @param {T[]} items */
  const shuffled = (items) => {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  };

  const chosen = {
    easy: shuffled(pools.easy).slice(0, 2),
    medium: shuffled(pools.medium).slice(0, 2),
    hard: shuffled(pools.hard).slice(0, 1),
  };
  const offsets = { easy: 0, medium: 0, hard: 0 };
  return ROUND_DIFFICULTIES.map((difficulty) => chosen[difficulty][offsets[difficulty]++]);
}

/**
 * @template {{ id: string, x: number, y: number, width: number, height: number }} T
 * @param {T[]} targets
 * @param {string[]} foundTargetIds
 * @param {number} x
 * @param {number} y
 * @param {number} [tolerance]
 * @returns {{ kind: 'found-again', target: T } | { kind: 'found-new', target: T } | { kind: 'miss' }}
 */
export function resolveTargetClick(targets, foundTargetIds, x, y, tolerance = 0) {
  /** @param {T} target */
  const isHit = (target) => x >= target.x - tolerance
    && x <= target.x + target.width + tolerance
    && y >= target.y - tolerance
    && y <= target.y + target.height + tolerance;
  const foundTarget = targets.find((target) => foundTargetIds.includes(target.id) && isHit(target));
  if (foundTarget) return { kind: 'found-again', target: foundTarget };
  const newTarget = targets.find((target) => !foundTargetIds.includes(target.id) && isHit(target));
  if (newTarget) return { kind: 'found-new', target: newTarget };
  return { kind: 'miss' };
}
