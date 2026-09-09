# 白狐AI三 - 智能 AI 绘图 Web 项目

![白狐AI三](https://img.shields.io/badge/%E9%A1%B9%E7%9B%AE%E5%90%8D%E7%A7%B0-%E7%99%BD%E7%8B%90AI%E4%B8%89-orange?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0+-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.0+-blue?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0+-38BDF8?style=for-the-badge&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)

**白狐AI三** 是一个设计优雅、移动端优先（Mobile-First）、操作路径极短、无传统数据库依赖的轻量级 AI 绘图 Web 工具。支持极速接入 **Cloudflare Workers AI** API，出厂默认以 **Stable Diffusion** 为算力，并兼容 **HuggingFace**、**Fal.ai**、**OpenAI DALL-E 3** 及 **Pollinations** 等算力节点，同时支持扩展 **Cloudflare D1 数据库** 多端同步与 **Wasmer** 容器部署。

---

## 📖 1. 项目介绍

本项目旨在提供一个简洁、手机操控友好、功能强大且免复杂数据库配置的 AI 绘图应用。面板固定标题为 **“白狐AI三”**。

### 核心功能与亮点：
1. **面板固定显示标题**：顶部导航栏固定显示 `白狐AI三`。
2. **文本生成图像 (Text to Image)**：
   - 支持正向/负向提示词输入与“✨ 提示词魔改/优化”一键成片。
   - 支持多种画面比例（1:1, 16:9, 9:16, 4:3, 3:4）与 1、2、4 张多图并发生成。
   - 支持采样步数 (Steps)、CFG Scale 与艺术风格预设。
3. **图像生成图像 (Image to Image)**：
   - 支持本地上传参考图并进行重绘强度 (Strength) 调整二次创作。
4. **模型管理与中文翻译**：
   - 预置 30 条热门模型，支持按分类与关键字搜索、收藏星标。
   - 内置“全网免费开源模型发现”，支持添加自定义 HuggingFace 或 SD WebUI 节点。
   - 支持模型名称一键翻译为中文（失败保留原名）。
5. **账号密码与登录壁纸定制**：
   - 支持全屏登录门禁，无需传统数据库即可注册与修改个人账号/密码。
   - 支持上传自定义登录界面背景壁纸并离线保存。
6. **历史记录与 D1 同步**：
   - 默认采用本地 **IndexedDB** 存储大容量历史图像，可选绑定 Cloudflare D1 进行全自动云端同步。

---

## 🛠️ 2. 本地运行流程

### 步骤一：克隆仓库与安装依赖
```bash
git clone https://github.com/luobikang1/ai3.git
cd ai3
npm install
```

### 步骤二：配置环境变量
拷贝根目录的 `.env.example` 并重命名为 `.env.local`：
```bash
cp .env.example .env.local
```
编辑 `.env.local` 填入管理员用户名和密码：
```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
AUTH_SECRET=your_jwt_secret_key
```

### 步骤三：启动本地开发服务器
```bash
npm run dev
```
打开浏览器访问 `http://localhost:3000` 即可使用。

---

## ☁️ 3. Cloudflare 部署流程 (Pages / Workers)

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 **Workers & Pages** -> 点击 **Create Application** -> 选择 **Pages**。
2. 连接 GitHub 仓库并选择本项目。
3. **构建设置 (Build Settings)**：
   - **Framework preset**：选择 `Next.js`。
   - **Build command**：`npm run pages:build`
   - **Build output directory**：`.vercel/output/static`
4. **环境变量配置**：
   在 Environment variables 中配置 `ADMIN_USERNAME` 与 `ADMIN_PASSWORD`。
5. 点击 **Save and Deploy** 部署上线。

---

## ⚡ 4. Vercel 部署流程

1. 登录 [Vercel Dashboard](https://vercel.com/)，点击 **Add New Project**。
2. 导入本 GitHub 仓库。
3. 在 **Environment Variables** 选项卡中添加：
   - `ADMIN_USERNAME`: 管理员账号（默认 `admin`）
   - `ADMIN_PASSWORD`: 管理员密码
4. 点击 **Deploy** 按钮，系统将在 1 分钟内自动打包部署完成。

---

## 🐳 5. Docker 部署流程

项目内置多阶段构建 Dockerfile（含 standalone 优化）：

### 方式一：使用 Docker Compose (推荐)
```bash
# 启动容器
docker-compose up -d --build

# 查看运行状态
docker-compose ps
```
浏览器访问 `http://your-server-ip:3000` 即可使用。

### 方式二：手动构建运行 Docker 镜像
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

## 🔑 6. 环境变量配置说明

| 环境变量名 | 必填 | 默认值 | 说明 |
| :--- | :---: | :--- | :--- |
| `ADMIN_USERNAME` | 否 | `admin` | 管理员用户名 |
| `ADMIN_PASSWORD` | 否 | 无 | 管理员登录密码（设置后需凭此密码登录管理员） |
| `AUTH_SECRET` | 否 | 随机密钥 | JWT 加密 Token 签发密钥 |
| `CLOUDFLARE_API_TOKEN` | 否 | 无 | Cloudflare Workers AI Token |
| `CLOUDFLARE_ACCOUNT_ID` | 否 | 无 | Cloudflare Account ID |
| `HUGGINGFACE_API_KEY` | 否 | 无 | HuggingFace Inference API Token |
| `FAL_KEY` | 否 | 无 | Fal.ai 算力 API Key |

---

## ⚙️ 7. API Key / Account ID 配置说明

用户可在登录后的**“设置”选项卡**中直观配置与修改：
1. **Cloudflare Credentials**：输入 32 位 `Account ID` 与具有 Workers AI 权限的 `API Token`。
2. **HuggingFace Token**：输入以 `hf_` 开头的 Token，解锁 HuggingFace 开源去限制模型。
3. **私有 SD WebUI / Wasmer 节点**：输入自建 SD WebUI Endpoint（如 `http://127.0.0.1:7860`）。

未配置任何 Key 时，系统自动调配免费开源算力，确保无报错、不出错。

---

## 💡 8. 部署重点和常见问题排查

1. **Cloudflare 提示 `Output directory "out" not found`**：
   - **原因**：Pages 构建设置中错误填成了 `out`。
   - **解决**：构建输出目录请填写 `.vercel/output/static`，或将构建脚本设为 `npm run pages:build`。

2. **提示“未配置 Cloudflare API Token”**：
   - **解决**：在“文生图”中若选用了以 `@cf/` 开头的 Cloudflare 专属模型，请在“设置”中填入 Key，或直接切换为默认的 Stable Diffusion / FLUX.1 模型。

3. **登录界面密码无效**：
   - **原因**：环境变量 `ADMIN_PASSWORD` 与输入不一致。
   - **解决**：校验部署环境变量设置，或使用免数据库“快速注册”功能创建离线通行账号。

---

## 📜 许可证

本项目基于 [MIT License](LICENSE) 开源许可，欢迎自由二次开发与部署！
