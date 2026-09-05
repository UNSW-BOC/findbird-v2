# FindBird V2

一个使用真实照片的五关静态寻鸟游戏，支持完整的中文/英文界面切换并记住本机语言偏好。项目基于 React、TypeScript 和 Vite，不需要数据库或后端服务，运行时不会请求外部图片。

## 开发与验证

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

`pnpm build` 会先验证正式题库，再生成 `dist/` 静态产物。

## 导入题库

把图片和按照 `question-template.json` 填写的数据 JSON 放入 `question-import/`，然后运行：

```bash
pnpm import:questions
```

导入器会校验配对关系、必填字段、难度和目标边界，复制通过校验的照片，并更新 `src/data/questions.json`。同名题目会跳过而不会覆盖。报告保存在 `reports/question-import-report.json`。

首次题库也是通过同一导入器从仓库上级的 `new_photo/` 生成：

```bash
pnpm import:initial
```

## 使用静态构建产物

先运行 `pnpm build`，再根据访问范围选择：

```bash
pnpm play:local
pnpm play:lan
```

## GitHub Pages

推送 `main` 分支后，GitHub Actions 会执行测试、题库校验和构建，并把 `dist/` 发布到仓库的 Pages 项目子路径。首次使用时请在仓库设置中将 Pages Source 设为 **GitHub Actions**。
