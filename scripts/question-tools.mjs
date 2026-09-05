import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
export const DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

export async function readImageDimensions(filePath) {
  const buffer = await readFile(filePath);
  if (buffer.length < 24) throw new Error('图片文件过小或已损坏');

  if (buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.toString('ascii', 0, 3) === 'GIF') {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const length = buffer.readUInt16BE(offset + 2);
      const isStartOfFrame = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
      if (isStartOfFrame) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      if (length < 2) break;
      offset += 2 + length;
    }
    throw new Error('无法从 JPEG 读取尺寸');
  }

  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const format = buffer.toString('ascii', 12, 16);
    if (format === 'VP8X') {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (format === 'VP8 ' && buffer.length >= 30 && buffer[23] === 0x9d && buffer[24] === 0x01 && buffer[25] === 0x2a) {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (format === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2f) {
      const bits = buffer.readUInt32LE(21);
      return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
    }
  }

  throw new Error(`不支持或无法识别的图片格式：${path.extname(filePath) || '未知'}`);
}

export function extractViaEntries(data, dataFile) {
  const source = data?._via_img_metadata ?? data;
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error(`${dataFile}: 数据根节点必须是 VIA 图片记录对象`);
  }
  return Object.values(source).filter((value) => value && typeof value === 'object' && 'filename' in value);
}

export function compareSourceFilenames(imageNames, recordFilenames) {
  const images = new Map(imageNames.map((filename) => [filename.toLocaleLowerCase(), filename]));
  const records = new Map(recordFilenames.map((filename) => [filename.toLocaleLowerCase(), filename]));
  return {
    unmatchedImages: imageNames.filter((filename) => !records.has(filename.toLocaleLowerCase())),
    missingImages: recordFilenames.filter((filename) => !images.has(filename.toLocaleLowerCase())),
  };
}

export function slugFromFilename(filename) {
  const stem = path.basename(filename, path.extname(filename));
  return stem
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || `question-${Date.now()}`;
}

export function validateAndNormalizeEntry(entry, dimensions, dataFile) {
  const filename = typeof entry.filename === 'string' ? path.basename(entry.filename.trim()) : '';
  const difficulty = entry.file_attributes?.difficulty;
  const prefix = `${dataFile} → ${filename || '未命名图片'}`;
  const errors = [];

  if (!filename) errors.push(`${prefix}: 缺少 filename`);
  if (!DIFFICULTIES.has(difficulty)) errors.push(`${prefix}: difficulty 必须为 easy、medium 或 hard`);
  if (!Array.isArray(entry.regions) || entry.regions.length === 0) errors.push(`${prefix}: 至少需要一个目标区域`);

  const targets = [];
  if (Array.isArray(entry.regions)) {
    entry.regions.forEach((region, index) => {
      const shape = region?.shape_attributes ?? {};
      const attributes = region?.region_attributes ?? {};
      const label = `${prefix} → 区域 ${index + 1}`;
      const values = [shape.x, shape.y, shape.width, shape.height];
      if (shape.name !== 'rect') errors.push(`${label}: 仅支持矩形 rect`);
      if (!values.every((value) => Number.isFinite(value))) {
        errors.push(`${label}: x、y、width、height 必须是数字`);
      } else if (shape.x < 0 || shape.y < 0 || shape.width <= 0 || shape.height <= 0) {
        errors.push(`${label}: 坐标不能为负，宽高必须大于 0`);
      } else if (shape.x + shape.width > dimensions.width || shape.y + shape.height > dimensions.height) {
        errors.push(`${label}: 超出图片范围 ${dimensions.width}×${dimensions.height}`);
      }

      for (const field of ['nameZh', 'nameEn', 'scientificName']) {
        if (typeof attributes[field] !== 'string' || !attributes[field].trim()) errors.push(`${label}: 缺少 ${field}`);
      }

      if (errors.every((message) => !message.startsWith(label))) {
        targets.push({
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
          nameZh: attributes.nameZh.trim(),
          nameEn: attributes.nameEn.trim(),
          scientificName: attributes.scientificName.trim(),
        });
      }
    });
  }

  if (errors.length) return { errors };
  const id = slugFromFilename(filename);
  return {
    errors,
    question: {
      id,
      filename,
      image: `questions/${filename}`,
      difficulty,
      sourceWidth: dimensions.width,
      sourceHeight: dimensions.height,
      targets: targets.map((target, index) => ({ ...target, id: `${id}-target-${index + 1}` })),
    },
  };
}

export async function validateGeneratedQuestion(question, publicDirectory) {
  const errors = [];
  if (!question || typeof question !== 'object') return ['题目不是对象'];
  if (!question.id || !question.filename || !question.image) errors.push('缺少 id、filename 或 image');
  if (!DIFFICULTIES.has(question.difficulty)) errors.push(`${question.filename}: difficulty 无效`);
  if (!Number.isInteger(question.sourceWidth) || !Number.isInteger(question.sourceHeight)) errors.push(`${question.filename}: 图片尺寸无效`);
  if (!Array.isArray(question.targets) || question.targets.length === 0) errors.push(`${question.filename}: 没有目标区域`);
  for (const target of question.targets ?? []) {
    if (!target.id || !target.nameZh || !target.nameEn || !target.scientificName) errors.push(`${question.filename}: 目标字段不完整`);
    if (target.x < 0 || target.y < 0 || target.width <= 0 || target.height <= 0 || target.x + target.width > question.sourceWidth || target.y + target.height > question.sourceHeight) {
      errors.push(`${question.filename}: 目标 ${target.id ?? '未知'} 超出图片范围`);
    }
  }
  try {
    const actual = await readImageDimensions(path.join(publicDirectory, question.image));
    if (actual.width !== question.sourceWidth || actual.height !== question.sourceHeight) errors.push(`${question.filename}: 记录尺寸与图片实际尺寸不一致`);
  } catch (error) {
    errors.push(`${question.filename}: ${error.message}`);
  }
  return errors;
}
