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
├── vercel.json                 # Vercel 自动化部署配置文件
├── wrangler.jsonc              # Cloudflare Workers / Pages 部署配置文件
├── .env.example                # 环境变量配置示例模板
├── package.json                # 项目依赖与脚本配置
├── next.config.ts              # Next.js 框架配置文件 (启用 standalone)
├── tsconfig.json               # TypeScript 规则配置
└── src
    ├── app
    │   ├── api
    │   │   ├── auth
    │   │   │   ├── login/route.ts       # 登录鉴权接口 (校验环境变量)
    │   │   │   └── verify/route.ts      # JWT Token 身份验证接口
    │   │   ├── generate
    │   │   │   ├── text-to-image/route.ts # 文生图核心处理 Route (支持 CF AI & 降级)
    │   │   │   └── image-to-image/route.ts # 图生图核心处理 Route
    │   │   └── models
    │   │       └── translate/route.ts     # 模型名称一键中文翻译 Route
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
    │   └── AppContext.tsx              # React 全局状态管理 (Zustand/Context 模式)
    ├── lib
    │   ├── auth.ts                     # jose 加密 Token 签发与解密模块
    │   ├── constants.ts                # 30 条预置 AI 模型列表与系统常量
    │   └── storage.ts                  # LocalStorage 与 IndexedDB 浏览器本地存储模块
    └── types
        └── index.ts                    # 项目 TypeScript 类型定义文件
```

---

## 🛠️ 技术栈说明

- **前端框架**：Next.js (App Router) + React 19 + TypeScript
- **样式与UI**：TailwindCSS + Lucide React 图标库 + Mobile-First 响应式
- **状态管理**：React Context API (统一托管设置、模型、历史记录与登录状态)
- **本地存储**：IndexedDB (历史记录大文件存储) + LocalStorage (用户偏好与 Auth Token)
- **后端接口**：Next.js API Routes (无缝适配 Node.js、Vercel Serverless 及 Cloudflare Workers)
- **认证方式**：JOSE (JWT 无状态Token) + 环境变量账号密码

---

## 🔑 环境变量说明

在根目录创建 `.env` 或 `.env.local` 文件，或在云平台上配置环境变量：

| 环境变量名称 | 必填 | 默认值 | 说明 |
| :--- | :---: | :--- | :--- |
| `ADMIN_USERNAME` | 否 | `admin` | 生产环境管理员登录用户名 |
| `ADMIN_PASSWORD` | 否 | `foxai123` | 生产环境管理员登录密码 (切勿硬编码) |
| `AUTH_SECRET` | 否 | 自动密钥 | JWT 加密签发密钥 |
| `CLOUDFLARE_API_TOKEN` | 否 | 无 | 默认 Cloudflare Workers AI API Token (也可在网页设置中配置) |
| `CLOUDFLARE_ACCOUNT_ID` | 否 | 无 | 默认 Cloudflare Account ID (也可在网页设置中配置) |

---

## 🚀 本地开发与运行流程

### 1. 克隆代码与安装依赖

```bash
git clone https://github.com/your-username/baihu-ai-three.git
cd baihu-ai-three
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

在 `.env.local` 中修改 `ADMIN_PASSWORD` 为你自定义的强密码。

### 3. 启动开发服务器

```bash
npm run dev
```

在浏览器打开 `http://localhost:3000` 即可体验 **白狐AI三**。

---

## ☁️ 部署指南

### 1. Cloudflare Pages / Workers 部署步骤

**白狐AI三** 天生适配 Cloudflare 平台：

1. **注册与登录 Cloudflare**：进入 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. **创建 Worker 或 Pages 项目**：
   - 进入 **Workers & Pages** -> **Create application** -> 选择 **Pages**。
   - 连接你的 GitHub 仓库。
3. **构建设置 (Build Settings)**：
   - **Framework preset**：选择 `Next.js`。
   - **Build command**：`npx @cloudflare/next-on-pages@1` 或 `npm run build`。
   - **Build output directory**：`.vercel/output/static`。
4. **配置环境变量**：
   - 在 Settings -> Environment variables 中添加：
     - `ADMIN_USERNAME`: 管理员账号
     - `ADMIN_PASSWORD`: 管理员密码
     - `CLOUDFLARE_API_TOKEN`: 具备 Workers AI 读写权限的 Token
     - `CLOUDFLARE_ACCOUNT_ID`: 你的 Cloudflare Account ID
5. **部署**：点击 **Save and Deploy** 即可完成公网上线！

---

## ⚡ Vercel 一键部署步骤

1. **推送代码至 GitHub** 仓库。
2. 访问 [Vercel Dashboard](https://vercel.com/import)，点击 **Add New Project** 并导入该 GitHub 仓库。
3. **Environment Variables（环境变量）配置**：
   - 展开 Environment Variables。
   - 添加 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD`。
   - （可选）添加 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`。
4. 点击 **Deploy** 按钮，Vercel 将自动完成构建并在 1 分钟内提供默认域名。

---

## 🐳 Docker / Docker Compose 部署步骤

项目已内置 Dockerfile（包含 Next.js standalone 体积优化）与 docker-compose.yml：

### 方式一：使用 Docker Compose (推荐)

```bash
# 启动容器
docker-compose up -d --build

# 查看运行状态与日志
docker-compose logs -f
```

访问 `http://your-server-ip:3000` 即可使用。

### 方式二：手动 Docker 构建

```bash
# 构建镜像
docker build -t baihu-ai-three:latest .

# 运行容器
docker run -d \
  --name baihu-ai-three \
  -p 3000:3000 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your_secure_password \
  baihu-ai-three:latest
```

---

## 📦 文件/压缩包部署方式

如果你需要以压缩包形式部署（例如上传至宝塔面板或 VPS）：

1. 将项目源码打包为 `.zip` 文件（注意排除 `node_modules` 与 `.next` 目录）。
2. 在服务器上解压后执行：
   ```bash
   npm install --production
   npm run build
   npm start
   ```
3. 使用 PM2 保持进程后台常驻：
   ```bash
   npm install -g pm2
   pm2 start npm --name "baihu-ai-three" -- start
   ```

---

## 💡 部署注意事项与常见错误排查

1. **报错：未配置 Cloudflare API Token**：
   - **排查**：如果在“文生图”中选择了带有 `@cf/` 前缀的 Cloudflare 模型，但未在环境变量或前端“设置”页面配置 Account ID 与 Token，系统将提示配置指引。
   - **解决**：只需前往项目“设置”选项卡，输入有效的 Cloudflare Credentials，或者在模型选择器中直接选择公共/免费模型（如 `FLUX.1`）即可无缝生成。

2. **登录无法通过或提示“用户名密码不正确”**：
   - **排查**：请确认是否在环境变量中配置了 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD`。
   - **默认值**：未设置时，默认管理员账号为 `admin`，默认密码为 `foxai123`。

3. **历史记录加载慢或数据丢失**：
   - **说明**：项目将所有生成的 Base64 高清图片存放在浏览器本地的 **IndexedDB** 中。清理浏览器缓存或在无痕模式下可能导致历史记录无法长久保存。

4. **Docker 容器构建极慢**：
   - **解决**：项目采用了多阶段构建 (Multi-stage build)，依赖项单独缓存。确保服务器网络良好，或在 Dockerfile 中配置 npm 镜像源。

---

## 📜 许可证

本项目基于 [MIT License](LICENSE) 开源许可，可自由二次开发与商业部署。
