import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "白狐AI三 - 智能AI绘图与图像生成平台",
  description: "白狐AI三，轻量极速、移动端友好的 AI 绘图与图像二次生成平台，支持 Cloudflare Workers AI 与公共模型，极速部署。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <body className="antialiased min-h-screen selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
