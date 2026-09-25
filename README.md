# 🦊 白狐AI三 - 极速轻量 AI 绘图 Web 工具

<p align="center">
  <b>白狐AI三</b> 是一款简洁、移动端友好、零传统数据库依赖、可快速部署的高性能 AI 绘图工具。
</p>

---

## 🌟 核心特性与工程优势

1. **面板固定标题**：面板标题及全站品牌固定显示为 **白狐AI三**。
2. **多端融合算力引擎**：
   - 默认集成 **Pollinations 免费算力池**（免 API Key，随时即用）。
   - 支持集成 **Cloudflare Workers AI**（边缘计算推理）。
   - 支持接入 **SiliconFlow 硅基流动**、**OpenAI DALL-E 3**、**Stability AI**、**Fal.ai** 与 **HuggingFace**。
   - 包含智能降级与重试机制，算力异常时明确提示错误，无卡死或静默失败。
3. **移动优先交互**：
   - 紧凑型顶部大模型快速滑动选择与底部抽屉模式。
   - 正向与负向提示词词库输入、一键 **中英智能互译**、**五维 Prompt 画质润色**。
   - 核心画质调节棒（风格强度、采样步数、引导系数 CFG）、画幅预设与 **自定义 Width / Height 像素滑动条**。
   - 支持 **画质超分 2X (Upscale)** 处理与 **批量多张生成**。
4. **Cloudflare D1 数据库云同步（可选）**：
   - 默认采用浏览器本地 **IndexedDB**（结合 WebP 图片压缩技术），零数据库即可完整运行。
   - 绑定 Cloudflare D1 数据库后，系统自动并支持一键**手动同步设置、收藏与历史记录**，并在设置页面实时检测呈现连通状态。
5. **完整多平台部署能力**：支持 Cloudflare Pages、Vercel、Docker 及压缩包一键部署。

---

## 🚀 快速本地运行

```bash
# 1. 克隆代码仓库
git clone https://github.com/your-username/baihu-ai-three.git
cd baihu-ai-three

# 2. 安装依赖
npm install

# 3. 配置环境变量 (可选)
cp .env.example .env.local

# 4. 启动本地开发服务
npm run dev
# 浏览器访问 http://localhost:3000 即可使用
```

---

## ☁️ Cloudflare Pages 部署流程 (推荐)

### 步骤 1：创建 D1 数据库 (可选，实现云同步)

```bash
# 创建 D1 数据库
npx wrangler d1 create baihu-ai-d1

# 执行数据库建表初始化 schema
npx wrangler d1 execute baihu-ai-d1 --file=./schema.sql
```

### 步骤 2：Cloudflare Pages 一键构建部署

```bash
# 执行 Cloudflare Pages 原生适配构建
npm run pages:build

# 使用 Wrangler 部署到 Cloudflare Pages
npx wrangler pages deploy .vercel/output/static --project-name=baihu-ai-three
```

环境变量建议在 Cloudflare Pages 后台设置中添加：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `ADMIN_PASSWORD` (默认密码为 `admin888`)

---

## 📐 Vercel 部署流程

1. 将仓库 Fork 或上传至 GitHub。
2. 在 Vercel 控制台中选择 **Import Project**，导入本项目。
3. Framework Preset 选择 **Next.js**。
4. 在 Environment Variables 中填入对应 Key（如 `OPENAI_API_KEY` 或 `SILICONFLOW_API_KEY`）。
5. 点击 **Deploy** 即可瞬间上线。

---

## 🐳 Docker 部署流程

### 使用 Docker Compose 一键启动

```bash
# 启动容器
docker-compose up -d --build

# 访问服务
# 浏览器访问 http://localhost:3000
```

---

## 🔑 环境变量配置说明

| 变量名 | 必填 | 默认值 | 说明 |
| :--- | :---: | :---: | :--- |
| `ADMIN_PASSWORD` | 否 | `admin888` | 管理员登录初始密码 |
| `JWT_SECRET` | 否 | `baihu-fox-ai-3-secret` | 用于本地 Token 签署的密钥 |
| `CLOUDFLARE_API_TOKEN` | 否 | - | Cloudflare Workers AI 访问 Token |
| `CLOUDFLARE_ACCOUNT_ID` | 否 | - | Cloudflare Account ID |
| `SILICONFLOW_API_KEY` | 否 | - | SiliconFlow 硅基流动 API Key |
| `OPENAI_API_KEY` | 否 | - | OpenAI DALL-E 3 官方 Key |
| `STABILITY_API_KEY` | 否 | - | Stability AI 官方 Key |

---

## 🛡️ 常见问题与排查指南

1. **出图提示词不符合要求？**
   - 答：系统已内置正向提示词权重预处理（核心主体 1.35 权重注入），建议使用「🌐 中英互译」或「✨ 智能润色」将中文需求转为英文描述。
2. **Cloudflare D1 数据库显示“仅本地存储”？**
   - 答：若未绑定 D1 数据库，项目会自动降级为浏览器 IndexedDB 本地存储，完全不影响生图与历史功能；需使用 D1 请在 Cloudflare Pages 设置中绑定 `DB` 变量。
3. **夜间模式切换无效？**
   - 答：项目已全面升级 CSS `@custom-variant dark` 响应机制，在手机与桌面端均能瞬间生效。

---

*版权所有 © 2025 白狐AI三团队*
