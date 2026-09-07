# 白狐AI三 - 智能 AI 绘图 Web 项目

![白狐AI三](https://img.shields.io/badge/%E9%A1%B9%E7%9B%AE%E5%90%8D%E7%A7%B0-%E7%99%BD%E7%8B%90AI%E4%B8%89-orange?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0+-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.0+-blue?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0+-38BDF8?style=for-the-badge&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)

**白狐AI三** 是一个设计优雅、移动端优先（Mobile-First）、操作路径极短、无传统数据库依赖的轻量级 AI 绘图 Web 工具。支持极速接入 **Cloudflare Workers AI** API，并内置多条公共免费算力与 FLUX.1 模型作为降级兜底，确保在任何部署环境下绝不卡死、不出错、无静默失败。

---

## 🌟 项目亮点与核心功能

1. **面板固定显示标题**：
   - 顶部导航栏固定且唯一显示标题：`白狐AI三`。

2. **文本生成图像 (Text to Image)**：
   - 支持正向提示词 (Prompt) 与负向提示词 (Negative Prompt)。
   - 支持调整画面尺寸与常用比例（1:1, 16:9, 9:16, 4:3, 3:4）。
   - 支持自定义采样步数 (Steps) 与引导系数 (CFG Scale)。
   - 具备清晰的高质量图像实时渲染与下载。

3. **图像生成图像 (Image to Image)**：
   - 支持上传本地参考图（拖拽/点击上传，支持 PNG/JPG/WEBP）。
   - 支持自定义重绘强度 (Strength) 进行二次生成与艺术风格重构。
   - 上传过程与失败均包含友好直观的 Toast/Alert 提示。

4. **无数据库用户系统**：
   - 支持管理员用户名和密码登录。
   - 不依赖传统数据库，通过加密 JWT Token 与环境变量管理状态。
   - 生产环境可通过环境变量 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD` 灵活配置管理员账号，零硬编码明文密码。

5. **全能模型管理**：
   - 默认精选并展示 **30 条热门 AI 绘图模型**（涵盖 SDXL、FLUX.1、SD1.5、二次元动漫、写实摄影、3D盲盒等）。
   - 支持按名称/关键字实时搜索过滤及分类标签选择。
   - 支持星标收藏保存喜爱模型。
   - 支持一键将英文模型名称翻译为中文，翻译故障时优雅保留原始英文名称。

6. **历史记录管理**：
   - 保存已生图像、详细提示词、模型名称及生成时间。
   - 使用浏览器本地高容量 **IndexedDB** 实现，无需后端数据库。
   - 支持高清预览、一键下载图片、单条删除与一键清空全部记录。

7. **移动端优先 & 系统设置**：
   - 底部悬浮 Navigation Tab，适应手机大拇指触控。
   - 支持系统级夜间模式（Dark Mode）一键切换。
   - 支持在线配置 Cloudflare API Token 与 Account ID。
   - 支持自定义默认画面比例与生成参数，并支持“恢复出厂设置”。

---

## 🏗️ 项目目录结构

```
.
├── Dockerfile                  # Docker 多阶段构建文件 (Standalone 优化)
├── docker-compose.yml          # Docker Compose 一键启动配置
├── .dockerignore               # Docker 构建忽略文件
├── .npmrc                      # NPM legacy peer deps 避让依赖冲突配置
├── vercel.json                 # Vercel 自动化部署配置文件
├── wrangler.toml               # Cloudflare Pages 部署配置文件
├── .env.example                # 环境变量配置示例模板
├── package.json                # 项目依赖与脚本配置 (含 npm run pages:build)
├── next.config.ts              # Next.js 框架配置文件 (适配 Docker, Vercel & CF)
├── tsconfig.json               # TypeScript 规则配置
└── src
    ├── app
    │   ├── api
    │   │   ├── auth
    │   │   │   ├── login/route.ts       # 登录鉴权接口 (Edge Runtime)
    │   │   │   └── verify/route.ts      # JWT Token 验证接口 (Edge Runtime)
    │   │   ├── generate
    │   │   │   ├── text-to-image/route.ts # 文生图 Route (Edge Runtime, CF AI & 降级)
    │   │   │   └── image-to-image/route.ts # 图生图 Route (Edge Runtime)
    │   │   └── models
    │   │       └── translate/route.ts     # 模型中文翻译 Route (Edge Runtime)
    │   ├── layout.tsx                  # 根布局与 Viewport 移动端配置
    │   ├── page.tsx                    # 全局主页面 (整合全功能模块)
    │   └── globals.css                 # CSS 样式与 Tailwind 导入
    ├── components
    │   ├── Navbar.tsx                  # 顶部导航栏 (固定显示"白狐AI三")
    │   ├── MobileTabBar.tsx            # 移动端底部导航栏 (文生图/图生图/模型/历史/设置)
    │   ├── Txt2ImgTab.tsx              # 文生图交互组件
    │   ├── Img2ImgTab.tsx              # 图生图交互组件
    │   ├── ModelSelector.tsx           # 30条模型管理/搜索/收藏/一键翻译组件
    │   ├── HistoryTab.tsx              # 本地 IndexedDB 历史记录管理组件
    │   ├── SettingsTab.tsx             # 设置面板组件 (API Key, 恢复出厂设置)
    │   ├── AuthModal.tsx               # 管理员登录弹窗组件
    │   └── Toast.tsx                   # 轻量提示组件
    ├── context
    │   └── AppContext.tsx              # React 全局状态管理
    ├── lib
    │   ├── auth.ts                     # JOSE JWT 签发与解密模块
    │   ├── constants.ts                # 30 条预置 AI 模型列表与系统常量
    │   └── storage.ts                  # LocalStorage 与 IndexedDB 本地存储模块
    └── types
        └── index.ts                    # 项目 TypeScript 类型定义文件
```

---

## ☁️ 部署指南

### 1. Cloudflare Pages 部署步骤 (已零报错优化)

**白狐AI三** 已针对 Cloudflare Pages 进行全新适配：

1. **登录 Cloudflare Dashboard**：进入 [Cloudflare 控制台](https://dash.cloudflare.com/) -> **Workers & Pages** -> **Create Application** -> 选择 **Pages** -> **Connect to Git**。
2. **构建设置 (Build Settings)**：
   - **Framework preset**：选择 `Next.js` 或 `None`。
   - **Build command（构建命令）**：`npm run pages:build` 或 `npx @cloudflare/next-on-pages`
   - **Build output directory（输出目录）**：`.vercel/output/static`
3. **环境变量配置**：
   - 在 Settings -> Environment variables 添加：
     - `ADMIN_USERNAME`: 管理员账号 (默认 `admin`)
     - `ADMIN_PASSWORD`: 管理员密码
     - `CLOUDFLARE_API_TOKEN`: 你的 Cloudflare API Token (可选)
     - `CLOUDFLARE_ACCOUNT_ID`: 你的 Cloudflare Account ID (可选)
4. 点击 **Save and Deploy**，项目即可零报错秒级发布上线！

---

### 2. Vercel 一键部署步骤

1. 访问 [Vercel Dashboard](https://vercel.com/import)，点击 **Add New Project** 导入仓库。
2. 在 **Environment Variables** 添加：
   - `ADMIN_USERNAME`: 管理员账号
   - `ADMIN_PASSWORD`: 管理员密码
3. 点击 **Deploy** 部署上线。

---

### 3. Docker / Docker Compose 部署步骤

```bash
# Docker Compose 启动
docker-compose up -d --build
```
访问 `http://localhost:3000` 即可使用。

---

## 💡 部署常见错误排查

1. **Cloudflare 提示 `Output directory "out" not found`**：
   - 原因：Pages Dashboard 中输出目录填成了 `out`。
   - 解决：请在 Cloudflare Pages 设置中的 Build Output Directory 填入 `.vercel/output/static`，并确保构建命令为 `npm run pages:build`。

2. **Cloudflare 提示 `The following routes were not configured to run with the Edge Runtime`**：
   - 解决：本项目所有 API 路由均已内置 `export const runtime = 'edge';`，完全兼容 Cloudflare Edge Worker。
