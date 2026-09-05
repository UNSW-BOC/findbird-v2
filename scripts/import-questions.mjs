import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareSourceFilenames, extractViaEntries, IMAGE_EXTENSIONS, readImageDimensions, validateAndNormalizeEntry } from './question-tools.mjs';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceArgumentIndex = process.argv.indexOf('--source');
const sourceDirectory = path.resolve(
  projectDirectory,
  sourceArgumentIndex >= 0 && process.argv[sourceArgumentIndex + 1]
    ? process.argv[sourceArgumentIndex + 1]
    : 'question-import',
);
const outputFile = path.join(projectDirectory, 'src/data/questions.json');
const publicDirectory = path.join(projectDirectory, 'public');
const imageOutputDirectory = path.join(publicDirectory, 'questions');
const reportDirectory = path.join(projectDirectory, 'reports');

const report = {
  source: sourceDirectory,
  generatedAt: new Date().toISOString(),
  imported: [],
  skipped: [],
  errors: [],
  unmatchedImages: [],
  missingImages: [],
};

async function finish(exitCode = 0) {
  await mkdir(reportDirectory, { recursive: true });
  report.summary = {
    success: report.imported.length,
    skipped: report.skipped.length,
    errors: report.errors.length + report.unmatchedImages.length + report.missingImages.length,
  };
  await writeFile(path.join(reportDirectory, 'question-import-report.json'), `${JSON.stringify(report, null, 2)}\n`);

  console.log('\nFindBird 题库导入报告');
  console.log(`来源：${report.source}`);
  console.log(`成功 ${report.summary.success}，跳过 ${report.summary.skipped}，错误 ${report.summary.errors}`);
  report.imported.forEach((filename) => console.log(`  ✓ 已导入 ${filename}`));
  report.skipped.forEach((item) => console.log(`  ↷ 已跳过 ${item.filename}: ${item.reason}`));
  report.unmatchedImages.forEach((filename) => console.error(`  ✕ 图片无配套数据 ${filename}`));
  report.missingImages.forEach((filename) => console.error(`  ✕ 数据引用的图片不存在 ${filename}`));
  report.errors.forEach((message) => console.error(`  ✕ ${message}`));
  process.exitCode = exitCode || (report.summary.errors > 0 ? 1 : 0);
}

let sourceFiles;
try {
  sourceFiles = await readdir(sourceDirectory, { withFileTypes: true });
} catch {
  report.errors.push(`待导入目录不存在：${sourceDirectory}`);
  await finish(1);
  process.exit();
}

const imageNames = sourceFiles
  .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => entry.name);
const imageLookup = new Map(imageNames.map((filename) => [filename.toLocaleLowerCase(), filename]));
const dataFiles = sourceFiles.filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.json').map((entry) => entry.name);
const records = new Map();

for (const dataFile of dataFiles) {
  try {
    const data = JSON.parse(await readFile(path.join(sourceDirectory, dataFile), 'utf8'));
    for (const entry of extractViaEntries(data, dataFile)) {
      const filename = typeof entry.filename === 'string' ? path.basename(entry.filename.trim()) : '';
      const key = filename.toLocaleLowerCase();
      if (records.has(key)) report.errors.push(`${dataFile}: ${filename} 存在重复数据记录`);
      else records.set(key, { entry, dataFile, filename });
    }
  } catch (error) {
    report.errors.push(`${dataFile}: ${error.message}`);
  }
}

if (dataFiles.length === 0) report.errors.push('没有找到 JSON 题目数据文件');
const comparison = compareSourceFilenames(imageNames, [...records.values()].map((record) => record.filename));
report.unmatchedImages.push(...comparison.unmatchedImages);
report.missingImages.push(...comparison.missingImages);

let existingQuestions = [];
try {
  existingQuestions = JSON.parse(await readFile(outputFile, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') {
    report.errors.push(`无法读取现有正式题库：${error.message}`);
    await finish(1);
    process.exit();
  }
}
const existingNames = new Set(existingQuestions.map((question) => question.filename.toLocaleLowerCase()));
const existingIds = new Set(existingQuestions.map((question) => question.id));
const additions = [];

for (const [key, record] of records) {
  const actualFilename = imageLookup.get(key);
  if (!actualFilename) continue;
  if (existingNames.has(key)) {
    report.skipped.push({ filename: actualFilename, reason: '正式题库中已有同名题目，未覆盖' });
    continue;
  }
  try {
    const dimensions = await readImageDimensions(path.join(sourceDirectory, actualFilename));
    const result = validateAndNormalizeEntry({ ...record.entry, filename: actualFilename }, dimensions, record.dataFile);
    if (result.errors.length) {
      report.errors.push(...result.errors);
      continue;
    }
    if (existingIds.has(result.question.id) || additions.some((question) => question.id === result.question.id)) {
      report.errors.push(`${record.dataFile} → ${actualFilename}: 生成的题目 id 重复（${result.question.id}）`);
      continue;
    }
    additions.push(result.question);
  } catch (error) {
    report.errors.push(`${record.dataFile} → ${actualFilename}: ${error.message}`);
  }
}

await mkdir(imageOutputDirectory, { recursive: true });
const successfulAdditions = [];
for (const question of additions) {
  try {
    await copyFile(path.join(sourceDirectory, question.filename), path.join(imageOutputDirectory, question.filename));
    successfulAdditions.push(question);
    report.imported.push(question.filename);
  } catch (error) {
    report.errors.push(`${question.filename}: 复制图片失败：${error.message}`);
  }
}
const allQuestions = [...existingQuestions, ...successfulAdditions].sort((a, b) => a.filename.localeCompare(b.filename, 'en'));
await writeFile(outputFile, `${JSON.stringify(allQuestions, null, 2)}\n`);
await finish(report.errors.length || report.unmatchedImages.length || report.missingImages.length ? 1 : 0);
