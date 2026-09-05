import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateGeneratedQuestion } from './question-tools.mjs';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const questionFile = path.join(projectDirectory, 'src/data/questions.json');
const questions = JSON.parse(await readFile(questionFile, 'utf8'));
const errors = [];

if (!Array.isArray(questions)) errors.push('questions.json 根节点必须是数组');
const ids = new Set();
const filenames = new Set();
const counts = { easy: 0, medium: 0, hard: 0 };

for (const question of Array.isArray(questions) ? questions : []) {
  if (ids.has(question.id)) errors.push(`题目 id 重复：${question.id}`);
  if (filenames.has(question.filename)) errors.push(`题目文件名重复：${question.filename}`);
  ids.add(question.id);
  filenames.add(question.filename);
  if (question.difficulty in counts) counts[question.difficulty] += 1;
  errors.push(...await validateGeneratedQuestion(question, path.join(projectDirectory, 'public')));
}

for (const [difficulty, minimum] of Object.entries({ easy: 2, medium: 2, hard: 1 })) {
  if (counts[difficulty] < minimum) errors.push(`${difficulty} 题库不足：至少 ${minimum}，现有 ${counts[difficulty]}`);
}

if (errors.length) {
  console.error(`题库校验失败（${errors.length} 项）`);
  errors.forEach((error) => console.error(`  ✕ ${error}`));
  process.exitCode = 1;
} else {
  console.log(`题库校验通过：共 ${questions.length} 题（easy ${counts.easy} / medium ${counts.medium} / hard ${counts.hard}）`);
}
