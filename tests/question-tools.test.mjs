import assert from 'node:assert/strict';
import test from 'node:test';
import { compareSourceFilenames, validateAndNormalizeEntry } from '../scripts/question-tools.mjs';

const baseEntry = {
  filename: 'multi-bird.jpg',
  file_attributes: { difficulty: 'medium' },
  regions: [
    {
      shape_attributes: { name: 'rect', x: 20, y: 30, width: 60, height: 70 },
      region_attributes: { nameZh: '鸟甲', nameEn: 'Bird A', scientificName: 'Avis alpha' },
    },
    {
      shape_attributes: { name: 'rect', x: 400, y: 250, width: 80, height: 90 },
      region_attributes: { nameZh: '鸟乙', nameEn: 'Bird B', scientificName: 'Avis beta' },
    },
  ],
};

test('导入器支持一张照片中的多个目标鸟', () => {
  const result = validateAndNormalizeEntry(baseEntry, { width: 800, height: 600 }, 'questions.json');
  assert.deepEqual(result.errors, []);
  assert.equal(result.question.targets.length, 2);
  assert.notEqual(result.question.targets[0].id, result.question.targets[1].id);
});

test('导入器拒绝越界目标并指出数据文件与区域', () => {
  const invalid = structuredClone(baseEntry);
  invalid.regions[1].shape_attributes.x = 760;
  const result = validateAndNormalizeEntry(invalid, { width: 800, height: 600 }, 'questions.json');
  assert.equal(result.question, undefined);
  assert.match(result.errors.join('\n'), /questions\.json.*区域 2.*超出图片范围/);
});

test('导入器拒绝无效难度和不完整名称', () => {
  const invalid = structuredClone(baseEntry);
  invalid.file_attributes.difficulty = 'expert';
  invalid.regions[0].region_attributes.nameZh = '';
  const result = validateAndNormalizeEntry(invalid, { width: 800, height: 600 }, 'questions.json');
  assert.match(result.errors.join('\n'), /difficulty/);
  assert.match(result.errors.join('\n'), /nameZh/);
});

test('导入报告明确区分无数据图片与不存在的引用图片', () => {
  const result = compareSourceFilenames(
    ['matched.jpg', 'without-data.jpg'],
    ['matched.jpg', 'missing-image.jpg'],
  );
  assert.deepEqual(result.unmatchedImages, ['without-data.jpg']);
  assert.deepEqual(result.missingImages, ['missing-image.jpg']);
});
