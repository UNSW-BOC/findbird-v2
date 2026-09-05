import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateRoundScore, resolveTargetClick, ROUND_DIFFICULTIES, selectRoundQuestions } from '../src/gameRules.js';

const questions = [
  ...Array.from({ length: 5 }, (_, index) => ({ id: `e${index}`, difficulty: 'easy' })),
  ...Array.from({ length: 4 }, (_, index) => ({ id: `m${index}`, difficulty: 'medium' })),
  ...Array.from({ length: 3 }, (_, index) => ({ id: `h${index}`, difficulty: 'hard' })),
];

test('每局按简单、简单、中等、中等、困难顺序选出五道不重复题目', () => {
  for (let run = 0; run < 100; run += 1) {
    const round = selectRoundQuestions(questions);
    assert.deepEqual(round.map((question) => question.difficulty), ROUND_DIFFICULTIES);
    assert.equal(new Set(round.map((question) => question.id)).size, 5);
  }
});

test('题库不足时明确报错，不用重复照片补足', () => {
  assert.throws(
    () => selectRoundQuestions(questions.filter((question) => question.difficulty !== 'hard')),
    /题库数量不足.*hard/,
  );
});

test('计分与规格示例一致', () => {
  assert.equal(calculateRoundScore(30, 0, true), 1000);
  assert.equal(calculateRoundScore(15, 0, true), 850);
  assert.equal(calculateRoundScore(15, 2, true), 650);
  assert.equal(calculateRoundScore(5, 8, true), 100);
  assert.equal(calculateRoundScore(18, 0, false), 0);
});

test('完整五局总分为各局分数之和且不超过 5000', () => {
  const scores = [1000, 850, 650, 100, 0];
  assert.equal(scores.reduce((sum, score) => sum + score, 0), 2600);
  assert.ok(scores.reduce((sum, score) => sum + score, 0) <= 5000);
});

test('点击判定区分新目标、已找到目标和误点', () => {
  const targets = [
    { id: 'bird-1', x: 100, y: 100, width: 30, height: 40 },
    { id: 'bird-2', x: 300, y: 200, width: 50, height: 60 },
  ];
  assert.equal(resolveTargetClick(targets, [], 105, 105).kind, 'found-new');
  assert.equal(resolveTargetClick(targets, ['bird-1'], 105, 105).kind, 'found-again');
  assert.equal(resolveTargetClick(targets, ['bird-1'], 295, 195, 6).kind, 'found-new');
  assert.equal(resolveTargetClick(targets, [], 20, 20).kind, 'miss');
});
