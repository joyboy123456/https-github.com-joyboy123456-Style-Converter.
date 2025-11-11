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
    <div className={`relative bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center h-full border-2 border-dashed ${isDragging ? 'border-solid border-indigo-500 scale-105' : 'border-gray-600'} hover:border-indigo-500 transition-all duration-300`}>
      <label
        htmlFor={id}
        className={`w-full h-full flex flex-col items-center justify-center text-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex items-center text-xl font-semibold text-indigo-400 mb-4">
          {icon}
          <span className="ml-3">{label}</span>
        </div>
        <div className="w-full h-64 bg-gray-900/50 rounded-lg flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt={label} className="w-full h-full object-contain" />
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <UploadIcon />
              <span className="mt-2 font-semibold">Click or Drag & Drop</span>
              <span className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP</span>
            </div>
          )}
        </div>
      </label>
      {isDragging && (
        <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm rounded-xl flex items-center justify-center pointer-events-none z-10">
          <p className="text-xl font-semibold text-indigo-300">Drop Image Here</p>
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
  const [apiKeySelected, setApiKeySelected] = useState<boolean | null>(null);

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      } catch (e) {
        console.error("Error checking for API key:", e);
        setApiKeySelected(false);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      // Assume success after the dialog opens, to handle race conditions
      setApiKeySelected(true);
    } catch (e) {
      console.error("Error opening API key selection:", e);
      setError("Could not open the API key selection dialog.");
    }
  };

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

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
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
      if (e.message?.includes('Requested entity was not found.')) {
        setError("API Key error. Please select a valid API key and try again.");
        setApiKeySelected(false);
      } else {
        setError(e.message || "An unexpected error occurred.");
      }
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = !styleImage || !sourceImage || isLoading;

  if (apiKeySelected === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!apiKeySelected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-lg text-center max-w-md border border-gray-700">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-4">
            API Key Required
          </h2>
          <p className="text-gray-400 mb-6">
            To use this application, you need to select a Gemini API key. Your key is stored securely and only used for your requests during this session.
          </p>
          <button
            onClick={handleSelectKey}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-6 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-1 shadow-lg"
          >
            Select API Key
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Using the Gemini API may incur costs. Please review the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">billing documentation</a>.
          </p>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          AI Style Transfer
        </h1>
        <p className="mt-2 text-lg text-gray-400 max-w-2xl mx-auto">
          Blend the style of one image with the content of another using Gemini.
        </p>
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

          <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-600">
            <div className="flex items-center text-xl font-semibold text-purple-400 mb-4">
              <SparklesIcon />
              <span className="ml-3">Generated Image</span>
            </div>
            <div className="w-full h-64 bg-gray-900/50 rounded-lg flex items-center justify-center overflow-hidden">
              {isLoading && <LoadingSpinner />}
              {error && !isLoading && (
                <div className="text-center text-red-400 p-4">
                  <p><strong>Error</strong></p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {generatedImage && !isLoading && (
                <img src={generatedImage} alt="Generated result" className="w-full h-full object-contain" />
              )}
              {!isLoading && !generatedImage && !error && (
                <div className="text-gray-500">Result will appear here</div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700">
        <div className="container mx-auto max-w-7xl flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className={`
              inline-flex items-center justify-center px-8 py-4 text-lg font-bold
              rounded-full transition-all duration-300 ease-in-out
              shadow-lg hover:shadow-xl transform hover:-translate-y-1
              ${isButtonDisabled
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700'
              }
            `}
          >
            <SparklesIcon />
            <span className="ml-3">{isLoading ? 'Generating...' : 'Transfer Style'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}