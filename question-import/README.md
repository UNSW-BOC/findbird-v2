# 待导入题库

把图片和按照仓库根目录 `question-template.json` 填写的 VIA JSON 数据文件放进本目录，然后在项目目录运行：

```bash
pnpm import:questions
```

导入器不会覆盖正式题库中的同名题目。详细结果会同时输出到终端和 `reports/question-import-report.json`。
