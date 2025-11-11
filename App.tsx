import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { StyleIcon, ContentIcon, UploadIcon, SparklesIcon, LoadingSpinner } from './components/icons';

interface ImageState {
  base64: string;
  mimeType: string;
  preview: string;
}

// Helper component for uploading images with drag-and-drop support.
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
    // This check prevents the leave event from firing when moving over child elements
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault(); // Necessary to allow dropping
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
    <div className={`relative backdrop-blur-xl bg-gradient-to-br from-gray-800/80 via-gray-900/80 to-gray-800/80 p-6 rounded-3xl shadow-2xl flex flex-col items-center justify-center h-full border-2 ${isDragging ? 'border-pink-500 scale-105 shadow-pink-500/50' : 'border-gray-700/50'} hover:border-purple-500/70 hover:shadow-purple-500/30 transition-all duration-500 group`}>
      <label
        htmlFor={id}
        className={`w-full h-full flex flex-col items-center justify-center text-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex items-center text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
          <span className="ml-3">{label}</span>
        </div>
        <div className="w-full h-64 bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-700/30 group-hover:border-purple-500/50 transition-all duration-300 shadow-inner">
          {previewUrl ? (
            <img src={previewUrl} alt={label} className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="text-gray-400 flex flex-col items-center group-hover:text-purple-300 transition-colors duration-300">
              <div className="group-hover:scale-110 transition-transform duration-300">
                <UploadIcon />
              </div>
              <span className="mt-2 font-semibold">Click or Drag & Drop</span>
              <span className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP</span>
            </div>
          )}
        </div>
      </label>
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-indigo-500/30 backdrop-blur-md rounded-3xl flex items-center justify-center pointer-events-none z-10 animate-pulse border-2 border-pink-400">
          <p className="text-2xl font-bold text-white drop-shadow-lg">✨ Drop Image Here ✨</p>
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


// Main App Component
export default function App() {
  const [styleImage, setStyleImage] = useState<ImageState | null>(null);
  const [sourceImage, setSourceImage] = useState<ImageState | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if API key is available from environment variable
  const apiKey = process.env.API_KEY;
  const hasApiKey = !!apiKey;

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

  const handleGenerate = async () => {
    if (!styleImage || !sourceImage) {
      setError("Please upload both a style and a source image.");
      return;
    }

    if (!apiKey) {
      setError("API Key is not configured. Please add GEMINI_API_KEY to your .env.local file.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            // New structure: Content Image -> Style Image -> Instruction
            { inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } },
            { inlineData: { data: styleImage.base64, mimeType: styleImage.mimeType } },
            { text: "Based on the second image, redraw the first image in that artistic style. Maintain the subject and composition of the first image." },
          ],
        },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
      if (imagePart && imagePart.inlineData) {
        const generatedImageDataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        setGeneratedImage(generatedImageDataUrl);
      } else {
        throw new Error("No image was generated. The model may not have been able to process the request.");
      }
    } catch (e: any) {
      if (e.message?.includes('Requested entity was not found.') || e.message?.includes('API key')) {
        setError("API Key error. Please check your GEMINI_API_KEY in .env.local file.");
      } else {
        setError(e.message || "An unexpected error occurred.");
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !styleImage || !sourceImage || isLoading || !hasApiKey;

  // Show API Key configuration message if not configured
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center text-white p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"></div>

        <div className="relative backdrop-blur-xl bg-gradient-to-br from-gray-800/80 via-purple-900/40 to-gray-800/80 p-10 rounded-3xl shadow-2xl text-center max-w-2xl border-2 border-purple-500/30 hover:border-pink-500/50 transition-all duration-500">
          <div className="mb-6">
            <div className="text-6xl mb-4 animate-bounce">🔑</div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-4">
              API Key Required
            </h2>
          </div>

          <p className="text-gray-300 mb-6 leading-relaxed">
            To use AI Style Transfer, you need to configure your <span className="text-purple-400 font-bold">Gemini API key</span>.
          </p>

          <div className="bg-gray-900/50 border border-purple-500/30 rounded-xl p-6 mb-6 text-left">
            <h3 className="text-lg font-bold text-purple-400 mb-3">📝 Setup Instructions:</h3>
            <ol className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">1.</span>
                <span>Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Google AI Studio</a></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">2.</span>
                <span>Create a <code className="bg-gray-800 px-2 py-1 rounded text-purple-300">.env.local</code> file in the project root</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">3.</span>
                <span>Add this line: <code className="bg-gray-800 px-2 py-1 rounded text-purple-300">GEMINI_API_KEY=your_api_key_here</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 font-bold">4.</span>
                <span>Restart the development server</span>
              </li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
            <p className="text-xs text-yellow-300">
              ⚠️ Using the Gemini API may incur costs. Please review the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200 font-semibold">billing documentation</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white p-4 sm:p-6 lg:p-8 flex flex-col relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <header className="text-center mb-8 relative z-10">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-2 drop-shadow-2xl animate-gradient">
          ✨ AI Style Transfer ✨
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto font-medium">
          Transform your images with the power of <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 font-bold">Gemini AI</span>
        </p>
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-gray-400">
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span>Powered by Google Gemini 2.5 Flash</span>
        </div>
      </header>

      <main className="flex-grow container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
          <ImageUploader
            id="style-upload"
            label="Style Reference Image"
            onFileSelect={(file) => processFile(file, setStyleImage)}
            previewUrl={styleImage?.preview || null}
            icon={<StyleIcon />}
            disabled={isLoading}
          />
          <ImageUploader
            id="source-upload"
            label="Source Content Image"
            onFileSelect={(file) => processFile(file, setSourceImage)}
            previewUrl={sourceImage?.preview || null}
            icon={<ContentIcon />}
            disabled={isLoading}
          />

          <div className="relative backdrop-blur-xl bg-gradient-to-br from-purple-800/40 via-pink-800/40 to-indigo-800/40 p-6 rounded-3xl shadow-2xl flex flex-col items-center justify-center h-full border-2 border-purple-500/30 hover:border-pink-500/50 transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-indigo-500/5 rounded-3xl blur-xl group-hover:opacity-75 transition-opacity"></div>
            <div className="relative z-10 w-full h-full flex flex-col">
              <div className="flex items-center text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 mb-4">
                <SparklesIcon />
                <span className="ml-3">✨ Generated Result</span>
              </div>
              <div className="w-full h-64 bg-gradient-to-br from-gray-900/90 to-gray-800/90 rounded-2xl flex items-center justify-center overflow-hidden border border-purple-500/20 shadow-inner relative">
                {isLoading && <LoadingSpinner />}
                {error && !isLoading && (
                  <div className="text-center p-6 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                    <p className="text-red-400 font-bold text-lg mb-2">⚠️ Error</p>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}
                {generatedImage && !isLoading && (
                  <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain animate-fadeIn" />
                )}
                {!isLoading && !generatedImage && !error && (
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <div className="text-sm font-medium">Your masterpiece will appear here</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent backdrop-blur-xl border-t border-purple-500/20 z-20">
        <div className="container mx-auto max-w-7xl flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className={`
              relative inline-flex items-center justify-center px-10 py-5 text-xl font-black
              rounded-full transition-all duration-500 ease-out
              transform hover:scale-105 active:scale-95
              ${isButtonDisabled
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white hover:from-purple-500 hover:via-pink-500 hover:to-indigo-500 shadow-2xl hover:shadow-pink-500/50 animate-shimmer'
              }
            `}
          >
            {/* Glow effect */}
            {!isButtonDisabled && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 blur-xl opacity-60 group-hover:opacity-100 transition-opacity"></div>
            )}

            <div className="relative z-10 flex items-center gap-3">
              <SparklesIcon />
              <span className="tracking-wide">
                {isLoading ? '🎨 Creating Magic...' : '✨ Transform Style ✨'}
              </span>
            </div>
          </button>
        </div>

        {/* Progress hint */}
        {!isButtonDisabled && !isLoading && (
          <p className="text-center mt-3 text-sm text-gray-400 animate-pulse">
            Ready to create something amazing? 🚀
          </p>
        )}
      </footer>
    </div>
  );
}