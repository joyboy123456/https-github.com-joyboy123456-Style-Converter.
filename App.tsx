import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

// 定义图片状态类型
interface ImageData {
  file: File;
  preview: string;
  base64: string;
  mimeType: string;
}

function App() {
  // 状态管理
  const [apiKey, setApiKey] = useState('');
  const [tempKey, setTempKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [styleImage, setStyleImage] = useState<ImageData | null>(null);
  const [contentImage, setContentImage] = useState<ImageData | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 页面加载时从localStorage读取API Key
  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) {
      setApiKey(saved);
    } else {
      setShowKeyInput(true);
    }
  }, []);

  // 保存API Key
  const saveApiKey = () => {
    if (tempKey.trim()) {
      setApiKey(tempKey.trim());
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setShowKeyInput(false);
      setError(null);
    }
  };

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'style' | 'content') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type;

      const imageData: ImageData = {
        file,
        preview: dataUrl,
        base64,
        mimeType,
      };

      if (type === 'style') {
        setStyleImage(imageData);
      } else {
        setContentImage(imageData);
      }
    };
    reader.readAsDataURL(file);
  };

  // 生成风格转换
  const generateStyleTransfer = async () => {
    if (!apiKey) {
      setError('请先输入 API 密钥');
      setShowKeyInput(true);
      return;
    }

    if (!styleImage || !contentImage) {
      setError('请上传风格图和内容图');
      return;
    }

    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const genAI = new GoogleGenAI({ apiKey });

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: contentImage.base64, mimeType: contentImage.mimeType } },
            { inlineData: { data: styleImage.base64, mimeType: styleImage.mimeType } },
            { text: '请基于第二张图片的艺术风格，重新绘制第一张图片。保持第一张图片的主要内容和构图，但采用第二张图片的艺术风格、色彩和绘画技法。' },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
      if (imagePart?.inlineData) {
        const resultUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        setResultImage(resultUrl);
      } else {
        throw new Error('生成失败');
      }
    } catch (err: any) {
      console.error('生成错误:', err);
      if (err.message?.includes('API key') || err.message?.includes('401') || err.message?.includes('403')) {
        setError('API 密钥无效，请重新输入');
        setShowKeyInput(true);
      } else {
        setError(err.message || '生成失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white">
      {/* API Key 输入栏 */}
      {showKeyInput && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-purple-500/30 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <span className="text-2xl">🔑</span>
            <input
              type="text"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveApiKey()}
              placeholder="输入 Gemini API 密钥 (AIzaSy...)"
              className="flex-1 px-4 py-2 bg-gray-800 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
            />
            <button
              onClick={saveApiKey}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:from-purple-500 hover:to-pink-500 transition"
            >
              确认
            </button>
            {apiKey && (
              <button
                onClick={() => setShowKeyInput(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">
            获取密钥：
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline ml-1">
              Google AI Studio
            </a>
          </p>
        </div>
      )}

      {/* 主内容 */}
      <div className={`container mx-auto px-4 py-8 ${showKeyInput ? 'pt-32' : 'pt-8'}`}>
        {/* 标题 */}
        <div className="text-center mb-12">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowKeyInput(true)}
              className="px-4 py-2 text-sm bg-gray-800/50 border border-gray-700 rounded-lg hover:border-purple-500/50 transition"
            >
              {apiKey ? '🔑 更换密钥' : '🔑 设置密钥'}
            </button>
          </div>
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
            AI 风格迁移
          </h1>
          <p className="text-xl text-gray-300">
            使用 Gemini AI 重绘你的图片
          </p>
        </div>

        {/* 图片上传区 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* 风格图 */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition">
            <h3 className="text-lg font-bold mb-4 text-purple-400">🎨 风格参考图</h3>
            <label className="block cursor-pointer">
              <div className="aspect-square bg-gray-900/50 rounded-xl overflow-hidden border-2 border-dashed border-gray-700 hover:border-purple-500 transition flex items-center justify-center">
                {styleImage ? (
                  <img src={styleImage.preview} alt="风格图" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📸</div>
                    <div className="text-sm">点击上传</div>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'style')}
                className="hidden"
              />
            </label>
          </div>

          {/* 内容图 */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 hover:border-pink-500/50 transition">
            <h3 className="text-lg font-bold mb-4 text-pink-400">🖼️ 源内容图</h3>
            <label className="block cursor-pointer">
              <div className="aspect-square bg-gray-900/50 rounded-xl overflow-hidden border-2 border-dashed border-gray-700 hover:border-pink-500 transition flex items-center justify-center">
                {contentImage ? (
                  <img src={contentImage.preview} alt="内容图" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">🖼️</div>
                    <div className="text-sm">点击上传</div>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'content')}
                className="hidden"
              />
            </label>
          </div>

          {/* 结果图 */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
            <h3 className="text-lg font-bold mb-4 text-indigo-400">✨ 生成结果</h3>
            <div className="aspect-square bg-gray-900/50 rounded-xl overflow-hidden border-2 border-gray-700 flex items-center justify-center">
              {loading ? (
                <div className="text-center">
                  <div className="animate-spin text-4xl mb-2">🎨</div>
                  <div className="text-sm text-gray-400">正在创作...</div>
                </div>
              ) : resultImage ? (
                <img src={resultImage} alt="结果" className="w-full h-full object-cover animate-fadeIn" />
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">✨</div>
                  <div className="text-sm">结果将显示在这里</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-center">
            ⚠️ {error}
          </div>
        )}

        {/* 生成按钮 */}
        <div className="text-center">
          <button
            onClick={generateStyleTransfer}
            disabled={!apiKey || !styleImage || !contentImage || loading}
            className={`px-12 py-4 text-xl font-bold rounded-full transition transform hover:scale-105 ${
              !apiKey || !styleImage || !contentImage || loading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white hover:shadow-2xl hover:shadow-pink-500/50'
            }`}
          >
            {loading ? '🎨 正在创作...' : '✨ 开始风格转换'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
