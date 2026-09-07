# 白狐AI三 - 智能 AI 绘图 Web 项目

![白狐AI三](https://img.shields.io/badge/%E9%A1%B9%E7%9B%AE%E5%90%8D%E7%A7%B0-%E7%99%BD%E7%8B%90AI%E4%B8%89-orange?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0+-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.0+-blue?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0+-38BDF8?style=for-the-badge&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)

**白狐AI三** 是一个设计优雅、移动端优先（Mobile-First）、操作路径极短的轻量级 AI 绘图 Web 工具。出厂默认以 **Stable Diffusion** 为核心算力引擎，同时支持极速接入 **Cloudflare Workers AI** API、自定义 SD WebUI / ComfyUI / OpenAI 接口与公共免费算力，并可选挂载 **Cloudflare D1 数据库** 实现跨端历史记录全自动云同步。

---

## 🌟 项目亮点与新特性

1. **登录门槛与免数据库注册登录**：
   - 访问操作界面前需先通过全屏登录拦截门禁。
   - 部署时配置的管理员账号/密码（环境变量 `ADMIN_USERNAME` / `ADMIN_PASSWORD`）可直接使用。
   - **无需传统数据库** 即可直接输入自定义账号密码快速通行/注册登录。

2. **多算力引擎 & 出厂默认 Stable Diffusion**：
   - **出厂默认设置**：以 **Stable Diffusion (SDXL / SD1.5)** 为默认算力引擎。
   - 支持实时配置、保存并搜索自定义 SD WebUI Endpoint、OpenAI API 或第三方算力节点，配置即刻生效并持久化。

3. **文本生成图像 (Text to Image)**：
   - 支持正向/负向提示词、常用尺寸比例（1:1, 16:9, 9:16, 4:3, 3:4）、采样步数与 CFG Scale 调优。

4. **图像生成图像 (Image to Image)**：
   - 支持上传本地参考图，配合重绘强度 (Strength) 进行图生图与风格转换。

5. **模型管理与一键翻译**：
   - 默认展示 30 条精选 AI 绘图模型，支持分类筛选、收藏与一键英文名翻译为中文（翻译失败保留原名）。

6. **Cloudflare D1 数据库历史记录云同步 (可选)**：
   - 默认采用本地 **IndexedDB** 存储大容量历史图像。
   - 部署在 Cloudflare 时若绑定了 **D1 数据库**，将自动开启无缝跨端历史记录云同步。

---

## 🏗️ 项目目录结构

```
.
├── Dockerfile                  # Docker 多阶段构建文件
├── docker-compose.yml          # Docker Compose 一键启动配置
├── .dockerignore               # Docker 构建忽略文件
├── .npmrc                      # NPM 依赖避让配置
├── vercel.json                 # Vercel 自动化部署配置文件
├── wrangler.toml               # Cloudflare Pages & D1 数据库配置文件
├── schema.sql                  # Cloudflare D1 数据库建表 SQL 脚本
├── .env.example                # 环境变量配置示例模板
├── package.json                # 项目依赖与脚本配置
├── next.config.ts              # Next.js 框架配置文件
└── src
    ├── app
    │   ├── api
    │   │   ├── auth
    │   │   │   ├── login/route.ts       # 登录/免数据库注册通行 Route (Edge)
    │   │   │   └── verify/route.ts      # JWT Token 验证 Route (Edge)
    │   │   ├── generate
    │   │   │   ├── text-to-image/route.ts # 文生图 Route (SD / CF / 降级)
    │   │   │   └── image-to-image/route.ts # 图生图 Route
    │   │   ├── history/route.ts         # D1 数据库历史记录同步 Route
    │   │   └── models
    │   │       └── translate/route.ts     # 模型名称中文翻译 Route
    │   ├── layout.tsx                  # 根布局配置
    │   └── page.tsx                    # 主页面 (登录门禁 + 交互组件)
    ├── components
    │   ├── LoginGateScreen.tsx         # 全屏登录/快速注册门禁组件
    │   ├── Navbar.tsx                  # 顶部导航栏 (固定显示"白狐AI三")
    │   ├── MobileTabBar.tsx            # 移动端底部导航栏
    │   ├── Txt2ImgTab.tsx              # 文生图交互组件
    │   ├── Img2ImgTab.tsx              # 图生图交互组件
    │   ├── ModelSelector.tsx           # 模型选择与算力源切换
    │   ├── HistoryTab.tsx              # 历史记录管理组件
    │   ├── SettingsTab.tsx             # 算力引擎与 API 设置面板
    │   ├── AuthModal.tsx               # 管理员登录弹窗组件
    │   └── Toast.tsx                   # 轻量提示组件
    ├── context
    │   └── AppContext.tsx              # React 全局状态管理
    ├── lib
    │   ├── auth.ts                     # JOSE JWT 鉴权模块
    │   ├── constants.ts                # 算力列表与 30 条出厂模型
    │   └── storage.ts                  # LocalStorage, IndexedDB 与 D1 混合存储模块
    └── types
        └── index.ts                    # TypeScript 类型定义
```

---

## 🗄️ Cloudflare D1 数据库配置说明 (可选)

项目已内置 SQL 脚本 `schema.sql`：

1. **创建 D1 数据库**：
   ```bash
   npx wrangler d1 create baihu_ai_db
   ```
2. **初始化数据表**：
   ```bash
   npx wrangler d1 execute baihu_ai_db --file=./schema.sql
   ```
3. 将返回的 `database_id` 填入 `wrangler.toml` 的 `[[d1_databases]]` 中即可启用历史记录全自动云同步！

---

## ☁️ 部署指南

### Cloudflare Pages 部署步骤
1. 将代码推送至 GitHub，在 Cloudflare Pages 中导入该仓库。
2. 构建命令：`npm run pages:build`
3. 输出目录：`.vercel/output/static`
4. 环境变量配置：`ADMIN_USERNAME` (默认 `admin`), `ADMIN_PASSWORD` (默认 `foxai123`)。

---

## 📜 许可证

本项目基于 [MIT License](LICENSE) 开源许可。
