'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  processed?: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// 背景移除API配置
const REMOVE_BG_API_KEY = 'gy5GewZD5G38dpf5bNZGp1b8'; // 用户提供的API密钥
const REMOVE_BG_URL = 'https://api.remove.bg/v1.0/removebg';

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [apiKey, setApiKey] = useState('gy5GewZD5G38dpf5bNZGp1b8');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + O 打开文件
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      
      // Ctrl/Cmd + V 粘贴图片
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
      
      // Escape 关闭设置面板
      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowKeyboardShortcuts(false);
      }
      
      // F11 全屏切换
      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // 粘贴图片功能
  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      const imageFiles: File[] = [];
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type });
            imageFiles.push(file);
          }
        }
      }
      
      if (imageFiles.length > 0) {
        addImages(imageFiles);
      }
    } catch (error) {
      console.log('粘贴功能需要用户授权或浏览器不支持');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      addImages(imageFiles);
    }
  }, []);

  // 真正的背景移除功能
  const removeBackground = async (imageFile: File, imageId: string) => {
    try {
      // 检查文件大小 (remove.bg 限制 12MB)
      if (imageFile.size > 12 * 1024 * 1024) {
        throw new Error('文件大小不能超过12MB');
      }

      // 检查API密钥
      const currentApiKey = apiKey || REMOVE_BG_API_KEY;
      if (!currentApiKey || currentApiKey.length < 10) {
        throw new Error('API密钥无效，请检查密钥格式');
      }

      console.log('使用API密钥:', currentApiKey.substring(0, 8) + '...');

      // 创建 FormData
      const formData = new FormData();
      formData.append('image_file', imageFile);
      formData.append('size', 'auto');

      // 调用 remove.bg API
      const response = await fetch(REMOVE_BG_URL, {
        method: 'POST',
        headers: {
          'X-Api-Key': currentApiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API响应:', response.status, response.statusText);
        console.error('错误详情:', errorText);
        throw new Error(`API错误: ${response.status} - ${errorText}`);
      }

      // 获取处理后的图片
      const processedBlob = await response.blob();
      const processedUrl = URL.createObjectURL(processedBlob);

      // 更新状态
      setImages(prev => prev.map(item => 
        item.id === imageId 
          ? { ...item, status: 'completed', processed: processedUrl }
          : item
      ));

    } catch (error) {
      console.error('背景移除失败:', error);
      setImages(prev => prev.map(item => 
        item.id === imageId 
          ? { ...item, status: 'error', error: error instanceof Error ? error.message : '处理失败' }
          : item
      ));
    }
  };

  const addImages = (files: File[]) => {
    const newImages: ImageFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading'
    }));

    setImages(prev => [...prev, ...newImages]);
    
    // 开始处理每张图片
    newImages.forEach((img, index) => {
      setTimeout(() => {
        setImages(prev => prev.map(item => 
          item.id === img.id ? { ...item, status: 'processing' } : item
        ));
        
        // 开始真正的背景移除
        removeBackground(img.file, img.id);
      }, index * 1000); // 每张图片间隔1秒开始处理
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addImages(files);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image?.processed) {
        URL.revokeObjectURL(image.processed);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const downloadImage = (image: ImageFile) => {
    const link = document.createElement('a');
    link.href = image.processed || image.preview;
    link.download = `removed-bg-${image.file.name.replace(/\.[^/.]+$/, '')}.png`;
    link.click();
  };

  const downloadAll = () => {
    const completedImages = images.filter(img => img.status === 'completed');
    completedImages.forEach((image, index) => {
      setTimeout(() => downloadImage(image), index * 100);
    });
  };

  const retryProcessing = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      setImages(prev => prev.map(item => 
        item.id === imageId ? { ...item, status: 'processing', error: undefined } : item
      ));
      removeBackground(image.file, imageId);
    }
  };

  // 测试API密钥有效性
  const testApiKey = async () => {
    try {
      const response = await fetch('https://api.remove.bg/v1.0/account', {
        headers: {
          'X-Api-Key': apiKey,
        },
      });
      
      if (response.ok) {
        const accountInfo = await response.json();
        console.log('API密钥有效，账户信息:', accountInfo);
        alert('API密钥验证成功！');
      } else {
        const errorText = await response.text();
        console.error('API密钥验证失败:', errorText);
        alert(`API密钥验证失败: ${errorText}`);
      }
    } catch (error) {
      console.error('API密钥测试失败:', error);
      alert('API密钥测试失败，请检查网络连接');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* 顶部工具栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold gradient-text">AI 背景移除工具</h1>
            <span className="text-sm text-gray-300">专业级图像处理</span>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* API密钥输入 */}
            <div className="flex items-center space-x-2">
              <input
                type="password"
                placeholder="输入 Remove.bg API 密钥"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="px-3 py-1 bg-white/10 border border-white/20 rounded text-sm w-48"
              />
              <button
                onClick={testApiKey}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
              >
                测试
              </button>
              <a 
                href="https://www.remove.bg/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs"
              >
                获取密钥
              </a>
            </div>

            {/* 批量下载按钮 */}
            {images.filter(img => img.status === 'completed').length > 0 && (
              <button
                onClick={downloadAll}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors btn-hover"
              >
                下载全部 ({images.filter(img => img.status === 'completed').length})
              </button>
            )}
            
            <button
              onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="键盘快捷键"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="设置"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title={isFullscreen ? "退出全屏" : "全屏"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 主工作区域 */}
      <div className="pt-20 px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {/* 拖拽上传区域 */}
          <div
            className={`relative min-h-[60vh] rounded-2xl border-2 border-dashed transition-all duration-300 drag-area ${
              isDragOver 
                ? 'border-blue-400 bg-blue-400/10 scale-105 dragover' 
                : 'border-white/20 bg-white/5 hover:bg-white/10'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
              <div className="text-center space-y-6 animate-fade-in">
                <div className="w-24 h-24 mx-auto bg-white/10 rounded-full flex items-center justify-center animate-pulse-slow">
                  <svg className="w-12 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-responsive">拖拽图片到这里移除背景</h2>
                  <p className="text-gray-300 mb-6">支持 JPG、PNG、WEBP 格式，最大 12MB</p>
                  
                  {!apiKey && (
                    <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-300 text-sm">
                        ⚠️ 请先在上方输入 Remove.bg API 密钥才能使用背景移除功能
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center space-x-4 flex-wrap">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors btn-hover"
                      disabled={!apiKey}
                    >
                      选择文件
                    </button>
                    <span className="text-gray-400">或</span>
                    <button 
                      onClick={handlePaste}
                      className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-lg font-medium transition-colors btn-hover"
                      disabled={!apiKey}
                    >
                      粘贴图片
                    </button>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-400 space-y-1">
                    <p>💡 快捷键: Ctrl+O 选择文件 | Ctrl+V 粘贴图片 | F11 全屏</p>
                    <p>支持批量处理，可同时拖拽多张图片</p>
                  </div>
                </div>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 图片处理区域 */}
          {images.length > 0 && (
            <div className="mt-8 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">处理队列 ({images.length})</h3>
                <div className="text-sm text-gray-300">
                  已完成: {images.filter(img => img.status === 'completed').length} / {images.length}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="bg-white/5 rounded-xl p-4 border border-white/10 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative aspect-square mb-4">
                      <Image
                        src={image.preview}
                        alt="Preview"
                        fill
                        className="object-cover rounded-lg"
                      />
                      
                      {/* 状态指示器 */}
                      <div className="absolute top-2 right-2">
                        {image.status === 'uploading' && (
                          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        )}
                        {image.status === 'processing' && (
                          <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        )}
                        {image.status === 'completed' && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        {image.status === 'error' && (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-gray-300 truncate">{image.file.name}</p>
                      
                      {image.status === 'processing' && (
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full animate-pulse-slow" style={{ width: '60%' }} />
                        </div>
                      )}
                      
                      {image.status === 'error' && (
                        <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded">
                          {image.error}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => removeImage(image.id)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors"
                        >
                          删除
                        </button>
                        
                        {image.status === 'error' && (
                          <button
                            onClick={() => retryProcessing(image.id)}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-medium transition-colors btn-hover"
                          >
                            重试
                          </button>
                        )}
                        
                        {image.status === 'completed' && (
                          <button
                            onClick={() => downloadImage(image)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors btn-hover"
                          >
                            下载
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 键盘快捷键面板 */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40">
          <div className="absolute right-6 top-20 w-80 glass rounded-xl p-6 animate-slide-in">
            <h3 className="text-lg font-semibold mb-4">键盘快捷键</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>选择文件</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Ctrl+O</kbd>
              </div>
              <div className="flex justify-between">
                <span>粘贴图片</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Ctrl+V</kbd>
              </div>
              <div className="flex justify-between">
                <span>全屏切换</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs">F11</kbd>
              </div>
              <div className="flex justify-between">
                <span>关闭面板</span>
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40">
          <div className="absolute right-6 top-20 w-80 glass rounded-xl p-6 animate-slide-in">
            <h3 className="text-lg font-semibold mb-4">设置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">输出质量</label>
                <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2">
                  <option>高质量 (推荐)</option>
                  <option>中等质量</option>
                  <option>快速处理</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">输出格式</label>
                <select className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2">
                  <option>PNG (透明背景)</option>
                  <option>JPG</option>
                  <option>WEBP</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">批量处理</label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">启用并行处理</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">自动保存</label>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm">处理完成后自动下载</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
