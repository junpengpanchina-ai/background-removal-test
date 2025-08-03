# AI 背景移除工具

一个世界级的全屏沉浸式AI背景移除工具，使用Next.js和Remove.bg API构建。

## ✨ 特性

- 🎨 **全屏沉浸式设计** - 专注图像处理的专业界面
- 🚀 **多种上传方式** - 拖拽、点击、粘贴图片
- ⚡ **批量处理** - 同时处理多张图片
- ⌨️ **键盘快捷键** - 专业级操作体验
- 🎯 **实时状态反馈** - 处理进度和错误提示
- 📱 **响应式设计** - 支持各种设备
- 🔒 **安全处理** - 本地处理，保护隐私

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置API密钥

1. 访问 [Remove.bg API](https://www.remove.bg/api) 注册账号
2. 获取免费的API密钥（每月50张免费额度）
3. 在应用界面顶部输入API密钥

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🎯 使用方法

### 上传图片
- **拖拽上传**: 直接拖拽图片到上传区域
- **点击选择**: 点击"选择文件"按钮
- **粘贴图片**: 复制图片后按Ctrl+V粘贴

### 键盘快捷键
- `Ctrl+O` - 选择文件
- `Ctrl+V` - 粘贴图片
- `F11` - 全屏切换
- `Esc` - 关闭面板

### 批量处理
1. 选择多张图片
2. 系统会自动排队处理
3. 处理完成后可一键下载全部

## 🛠️ 技术栈

- **前端框架**: Next.js 15.4.5
- **样式**: Tailwind CSS 4.0
- **语言**: TypeScript
- **API**: Remove.bg API
- **动画**: CSS Animations

## 📁 项目结构

```
background-removal-test/
├── app/
│   ├── globals.css      # 全局样式
│   ├── layout.tsx       # 布局组件
│   └── page.tsx         # 主页面组件
├── public/              # 静态资源
├── package.json         # 依赖配置
└── README.md           # 项目说明
```

## 🔧 配置选项

### 环境变量
创建 `.env.local` 文件（可选）：
```env
NEXT_PUBLIC_REMOVE_BG_API_KEY=your_api_key_here
NEXT_PUBLIC_MAX_FILE_SIZE=12582912
NEXT_PUBLIC_SUPPORTED_FORMATS=image/jpeg,image/png,image/webp
```

### 设置面板
- **输出质量**: 高质量/中等质量/快速处理
- **输出格式**: PNG/JPG/WEBP
- **批量处理**: 启用并行处理
- **自动保存**: 处理完成后自动下载

## 🎨 设计特色

- **玻璃态效果**: 现代化的毛玻璃UI
- **渐变背景**: 深色主题，专注体验
- **流畅动画**: 60fps的流畅过渡
- **状态指示**: 清晰的处理状态反馈
- **错误处理**: 友好的错误提示和重试机制

## 📊 API限制

- **文件大小**: 最大12MB
- **支持格式**: JPG, PNG, WEBP
- **免费额度**: 每月50张（Remove.bg）
- **处理时间**: 通常5-15秒

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Remove.bg API文档](https://www.remove.bg/api)
- [Next.js文档](https://nextjs.org/docs)
- [Tailwind CSS文档](https://tailwindcss.com/docs)
