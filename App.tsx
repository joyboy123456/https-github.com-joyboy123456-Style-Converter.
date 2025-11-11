import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { StyleIcon, ContentIcon, UploadIcon, SparklesIcon, LoadingSpinner } from './components/icons';

interface ImageState {
  base64: string;
  mimeType: string;
  preview: string;
}

// 图片上传组件
interface ImageUploaderProps {
  id: string;
  label: string;
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  icon: React.ReactNode;
  disabled: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onFileSelect, previewUrl, icon, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={`relative backdrop-blur-xl bg-gradient-to-br from-gray-800/60 via-gray-900/60 to-gray-800/60 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center h-full border ${isDragging ? 'border-pink-400 scale-105' : 'border-gray-700/50'} hover:border-purple-400/70 transition-all duration-300`}>
      <label
        htmlFor={id}
        className={`w-full h-full flex flex-col items-center justify-center text-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex items-center text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-3">
          {icon}
          <span className="ml-2">{label}</span>
        </div>
        <div className="w-full h-64 bg-gray-900/70 rounded-xl flex items-center justify-center overflow-hidden border border-gray-700/30 hover:border-purple-500/40 transition-all duration-300">
          {previewUrl ? (
            <img src={previewUrl} alt={label} className="w-full h-full object-contain" />
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <UploadIcon />
              <span className="mt-2 text-sm">点击或拖拽上传</span>
              <span className="text-xs text-gray-500 mt-1">PNG、JPG、WEBP</span>
            </div>
          )}
        </div>
      </label>
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center pointer-events-none z-10 border-2 border-pink-400">
          <p className="text-xl font-bold text-white">✨ 放开上传 ✨</p>
        </div>
      )}
      <input
        id={id}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
};


// 主应用组件
export default function App() {
  const [styleImage, setStyleImage] = useState<ImageState | null>(null);
  const [sourceImage, setSourceImage] = useState<ImageState | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // API Key 管理
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  // 从 localStorage 加载 API key
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowKeyInput(true);
    }
  }, []);

  // 保存 API key
  const handleSaveKey = (key: string) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      setApiKey(trimmedKey);
      localStorage.setItem('gemini_api_key', trimmedKey);
      setShowKeyInput(false);
      setError(null);
    }
  };

  // 处理文件上传
  const processFile = useCallback((
    file: File,
    setImageState: React.Dispatch<React.SetStateAction<ImageState | null>>
  ) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
      const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
      setImageState({ base64, mimeType, preview: dataUrl });
    };
    reader.readAsDataURL(file);
  }, []);

  // 生成风格迁移图片
  const handleGenerate = async () => {
    if (!styleImage || !sourceImage) {
      setError("请同时上传风格参考图和源内容图");
      return;
    }

    if (!apiKey) {
      setError("请先输入 API 密钥");
      setShowKeyInput(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } },
            { inlineData: { data: styleImage.base64, mimeType: styleImage.mimeType } },
            { text: "基于第二张图片的艺术风格，重新绘制第一张图片。保持第一张图片的主题和构图，完美融合第二张图的艺术风格。" },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
      if (imagePart?.inlineData) {
        const generatedImageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        setGeneratedImage(generatedImageDataUrl);
      } else {
        throw new Error("生成失败，请重试");
      }
    } catch (e: any) {
      console.error('Generation error:', e);

      if (e.message?.includes('API key') || e.message?.includes('401') || e.message?.includes('403')) {
        setError("API 密钥无效，请检查后重新输入");
        setShowKeyInput(true);
      } else if (e.message?.includes('quota') || e.message?.includes('429')) {
        setError("API 配额已用完，请稍后再试");
      } else if (e.message?.includes('timeout') || e.message?.includes('network')) {
        setError("网络连接失败，请检查网络后重试");
      } else {
        setError(e.message || "生成失败，请重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !styleImage || !sourceImage || isLoading || !apiKey;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 text-white p-4 sm:p-6 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* API Key 输入栏 */}
      {showKeyInput && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-gray-900 via-purple-900/30 to-transparent backdrop-blur-xl border-b border-purple-500/20 p-4 animate-fadeIn">
          <div className="container mx-auto max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 text-2xl">🔑</div>
              <input
                type="text"
                placeholder="请输入您的 Gemini API 密钥 (AIzaSy...)"
                className="flex-1 px-4 py-2 bg-gray-800/80 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-400 transition-all"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveKey(e.currentTarget.value);
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleSaveKey(input.value);
                }}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                确认
              </button>
              {apiKey && (
                <button
                  onClick={() => setShowKeyInput(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-400 text-center">
              获取 API 密钥：<a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 underline">Google AI Studio</a>
            </p>
          </div>
        </div>
      )}

      {/* 头部 */}
      <header className="text-center mb-8 relative z-10 pt-20">
        <div className="flex justify-end mb-2 max-w-7xl mx-auto">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="px-4 py-2 text-sm bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
          >
            {apiKey ? '🔑 更换密钥' : '🔑 设置密钥'}
          </button>
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-3">
          AI 风格迁移
        </h1>
        <p className="text-lg text-gray-300">
          使用 <span className="text-purple-400 font-bold">Gemini AI</span> 重绘您的图片
        </p>
      </header>

      {/* 主内容区 */}
      <main className="container mx-auto max-w-7xl mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 风格参考图 */}
          <ImageUploader
            id="style-upload"
            label="风格参考图"
            onFileSelect={(file) => processFile(file, setStyleImage)}
            previewUrl={styleImage?.preview || null}
            icon={<StyleIcon />}
            disabled={isLoading}
          />

          {/* 源内容图 */}
          <ImageUploader
            id="source-upload"
            label="源内容图"
            onFileSelect={(file) => processFile(file, setSourceImage)}
            previewUrl={sourceImage?.preview || null}
            icon={<ContentIcon />}
            disabled={isLoading}
          />

          {/* 生成结果 */}
          <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-800/30 to-pink-800/30 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center h-full border border-purple-500/30">
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400 mb-3">
                <SparklesIcon />
                <span className="ml-2">生成结果</span>
              </div>
              <div className="w-full h-64 bg-gray-900/70 rounded-xl flex items-center justify-center overflow-hidden border border-purple-500/20 relative">
                {isLoading && <LoadingSpinner />}
                {error && !isLoading && (
                  <div className="text-center p-4 bg-red-500/10 border border-red-500/30 rounded-lg max-w-xs">
                    <p className="text-red-400 font-bold mb-1">⚠️ {error}</p>
                  </div>
                )}
                {generatedImage && !isLoading && (
                  <img src={generatedImage} alt="生成结果" className="w-full h-full object-contain animate-fadeIn" />
                )}
                {!isLoading && !generatedImage && !error && (
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <div className="text-sm">作品将在这里显示</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 底部生成按钮 */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 to-transparent backdrop-blur-md z-40">
        <div className="container mx-auto max-w-7xl flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className={`px-12 py-4 text-xl font-black rounded-full transition-all duration-300 transform hover:scale-105 ${
              isButtonDisabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white hover:shadow-2xl hover:shadow-pink-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <SparklesIcon />
              <span>{isLoading ? '正在创作...' : '开始风格转换'}</span>
            </div>
          </button>
        </div>
      </footer>
    </div>
  );
}
