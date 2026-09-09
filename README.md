# 白狐AI三 - 旗舰智能 AI 绘图 Web 平台

![白狐AI三](https://img.shields.io/badge/%E9%A1%B9%E7%9B%AE%E5%90%8D%E7%A7%B0-%E7%99%BD%E7%8B%90AI%E4%B8%89-orange?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0+-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.0+-blue?style=for-the-badge&logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0+-38BDF8?style=for-the-badge&logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript)
![Wasmer](https://img.shields.io/badge/Wasmer-WebAssembly-purple?style=for-the-badge)

**白狐AI三** 是一个设计极其优雅、移动端优先（Mobile-First）、操作路径极短的旗舰级 AI 绘图 Web 工具。支持 **Stable Diffusion**、**HuggingFace 开源去限制模型**、**Cloudflare Workers AI (Flux & 70+模型)**、**Fal.ai**、**OpenAI DALL-E 3**，并全面兼容 **Wasmer WebAssembly 容器部署**。

---

## 🌟 核心升级与旗舰功能

1. **顶级算力节点与多引擎**：
   - 出厂以 **FLUX.1** 与 **Stable Diffusion** 为预设算力。
   - 完美兼容 **HuggingFace Inference API** 开源去限制模型。
   - 深度集成 **Cloudflare Workers AI (70+模型节点)**。
   - 支持通过 **Vercel AI SDK** 架构统一调度 DALL-E 3 与 Fal.ai。

2. **多图批量生成 & 提示词品质优化 (一键魔改)**：
   - 支持一次并发生成 **1 张、2 张、4 张** 矩阵画作。
   - 内置主流 AI 成功的“✨ 提示词品质优化”一键增质按钮。

3. **全网免费模型探索与自定义接入**：
   - 模型选择器内置 **“全网免费开源模型发现”** 推荐列表（包含 FLUX.1 Schnell, Animagine XL 3.1, RealVisXL V4.0）。
   - 支持用户手动添加任何 HuggingFace 路径或自定义 SD/ComfyUI Endpoint。

4. ** Wasmer 容器与 WebAssembly 部署**：
   - 支持在 **Wasmer Edge / Wasmer WebAssembly** 环境下无缝运行与一键打包部署。

5. **登录门禁与 D1 数据库全自动同步**：
   - 全屏登录/免数据库快速注册门禁。
   - 可选连接 Cloudflare D1 数据库实现多端历史记录无缝同步。

---

## 🚀 Wasmer 部署说明

除了 Docker, Vercel 与 Cloudflare Pages 之外，本项目原生支持 **Wasmer** 极速部署：

1. **安装 Wasmer CLI**：
   ```bash
   curl https://get.wasmer.io -sSfL | sh
   ```
2. **构建部署项目至 Wasmer**：
   ```bash
   wasmer deploy
   ```
3. 在 Wasmer Dashboard 绑定自定义域名或直接访问 Wasmer 生成的 Web 链接。

---

## 📜 许可证

本项目基于 [MIT License](LICENSE) 开源许可。
