/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Share2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  X,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { OUTFIT_CATEGORIES, OUTFIT_STYLES, type OutfitStyle } from './constants';

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<OutfitStyle | null>(null);
  const [customOutfitImage, setCustomOutfitImage] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [outfitMode, setOutfitMode] = useState<'presets' | 'custom' | 'prompt'>('presets');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(OUTFIT_CATEGORIES[0]);
  const [gender, setGender] = useState<'Male' | 'Female'>('Female');

  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const onDropUserImage = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const onDropCustomOutfit = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomOutfitImage(reader.result as string);
        setSelectedStyle(null);
        setTextPrompt('');
        setOutfitMode('custom');
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps: getUserRootProps, getInputProps: getUserInputProps, isDragActive: isUserDragActive } = useDropzone({
    onDrop: onDropUserImage,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false
  });

  const { getRootProps: getOutfitRootProps, getInputProps: getOutfitInputProps, isDragActive: isOutfitDragActive } = useDropzone({
    onDrop: onDropCustomOutfit,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: false
  });

  const generateOutfit = async () => {
    if (!image || (outfitMode === 'presets' && !selectedStyle) || (outfitMode === 'custom' && !customOutfitImage) || (outfitMode === 'prompt' && !textPrompt)) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ai = getAI();
      const parts: any[] = [];
      
      // Add the base portrait
      if (!image.includes(',')) throw new Error("Invalid image format");
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });

      // Add the custom outfit image if in custom mode
      if (outfitMode === 'custom' && customOutfitImage) {
        if (!customOutfitImage.includes(',')) throw new Error("Invalid custom outfit image format");
        const outfitBase64 = customOutfitImage.split(',')[1];
        const outfitMimeType = customOutfitImage.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            data: outfitBase64,
            mimeType: outfitMimeType
          }
        });
      }

      const outfitDescription = outfitMode === 'presets' ? selectedStyle?.description : 
                                outfitMode === 'custom' ? 'the outfit shown in the second image' : 
                                textPrompt;

      const prompt = `Modify the person's outfit in the first image to be: ${outfitDescription}. 
      CRITICAL: Keep the person's identity, face, body, pose, the background, camera angle, and lighting EXACTLY the same as in the original image. 
      Only replace the clothing items. The result must look like a natural, photorealistic edit of the original photo.`;

      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts }
      });

      let generatedBase64 = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedBase64 = part.inlineData.data;
            break;
          }
        }
      }
      
      if (generatedBase64) {
        setGeneratedImage(`data:image/png;base64,${generatedBase64}`);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        throw new Error("No image was returned by the AI.");
      }
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate outfit. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-outfit-${selectedStyle?.id || 'custom'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shareImage = async () => {
    if (!generatedImage) return;
    try {
      const blob = await (await fetch(generatedImage)).blob();
      const file = new File([blob], 'outfit.png', { type: 'image/png' });
      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'My AI Outfit Try-On',
          text: 'Check out my new look generated with AI!',
        });
      } else {
        alert("Sharing is not supported on this browser. You can download the image instead.");
      }
    } catch (err) {
      console.error("Sharing failed:", err);
    }
  };

  const filteredStyles = OUTFIT_STYLES.filter(s => 
    s.category === activeCategory && (s.gender === gender || s.gender === 'Unisex')
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50 transition-colors duration-300">
      <header className="sticky top-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight">
            BS <span className="text-indigo-600">TryFit</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
            <button 
              onClick={() => setGender('Male')}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                gender === 'Male' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              Male
            </button>
            <button 
              onClick={() => setGender('Female')}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                gender === 'Female' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              Female
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12">
        {/* Mobile Selection */}
        <div className="sm:hidden flex flex-col items-center gap-4 mb-8">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full inline-flex">
            <button 
              onClick={() => setGender('Male')}
              className={cn(
                "px-8 py-2 rounded-full text-sm font-bold transition-all",
                gender === 'Male' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              Male
            </button>
            <button 
              onClick={() => setGender('Female')}
              className={cn(
                "px-8 py-2 rounded-full text-sm font-bold transition-all",
                gender === 'Female' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
              )}
            >
              Female
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Upload & Selection */}
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs font-bold">1</span>
                <h2 className="text-lg font-semibold">Upload Your Photo</h2>
              </div>
              
              {!image ? (
                <div 
                  {...getUserRootProps()} 
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
                    isUserDragActive ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" : "border-slate-300 dark:border-slate-700 hover:border-indigo-400"
                  )}
                >
                  <input {...getUserInputProps()} />
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-full mb-4">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-center">
                    <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop<br />
                    <span className="text-sm">Clear front-facing photo works best</span>
                  </p>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden group">
                  <img src={image} alt="Original" className="w-full h-80 object-cover" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <p className="text-white text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" /> Photo uploaded successfully
                    </p>
                  </div>
                </div>
              )}

            {/* Gemini Privacy Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Privacy First:</strong> Your images are processed securely by Google Gemini and not stored permanently.
              </p>
            </div>
          </section>

          <section className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-xs font-bold">2</span>
                  <h2 className="text-lg font-semibold">Choose Your Outfit</h2>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button 
                    onClick={() => setOutfitMode('presets')}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium transition-all",
                      outfitMode === 'presets' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
                    )}
                  >
                    Presets
                  </button>
                  <button 
                    onClick={() => setOutfitMode('custom')}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium transition-all",
                      outfitMode === 'custom' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
                    )}
                  >
                    Custom
                  </button>
                  <button 
                    onClick={() => setOutfitMode('prompt')}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs font-medium transition-all",
                      outfitMode === 'prompt' ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600" : "text-slate-500"
                    )}
                  >
                    Prompt
                  </button>
                </div>
              </div>

              {outfitMode === 'presets' ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {OUTFIT_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-all",
                          activeCategory === cat 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredStyles.map(style => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedStyle(style);
                          setCustomOutfitImage(null);
                          setTextPrompt('');
                        }}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all group relative",
                          selectedStyle?.id === style.id
                            ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-950"
                            : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                        )}
                      >
                        <div className="font-semibold text-sm mb-1 group-hover:text-indigo-600 transition-colors">
                          {style.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {style.description}
                        </div>
                        {selectedStyle?.id === style.id && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : outfitMode === 'custom' ? (
                <div className="space-y-4">
                  {!customOutfitImage ? (
                    <div 
                      {...getOutfitRootProps()} 
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer",
                        isOutfitDragActive ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" : "border-slate-300 dark:border-slate-700 hover:border-indigo-400"
                      )}
                    >
                      <input {...getOutfitInputProps()} />
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-full mb-3">
                        <Upload className="w-6 h-6 text-indigo-600" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-center text-sm">
                        <span className="font-semibold text-indigo-600">Upload outfit image</span><br />
                        AI will try to match this exact outfit
                      </p>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden group border-2 border-indigo-600">
                      <img src={customOutfitImage} alt="Custom Outfit" className="w-full h-48 object-contain bg-slate-50 dark:bg-slate-900" />
                      <button 
                        onClick={() => setCustomOutfitImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 p-3 bg-indigo-600/90 text-white text-xs font-bold text-center">
                        CUSTOM OUTFIT SELECTED
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Tip: Use an image with the outfit laid flat or on a mannequin for best results.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={textPrompt}
                      onChange={(e) => {
                        setTextPrompt(e.target.value);
                        setSelectedStyle(null);
                        setCustomOutfitImage(null);
                      }}
                      placeholder="Describe the outfit you want to try on (e.g., 'a vibrant blue summer dress with white floral patterns and a straw hat')"
                      className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none resize-none text-sm transition-all"
                    />
                    <div className="absolute bottom-3 right-3 text-slate-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Be descriptive! Mention colors, materials, and specific clothing items for better results.
                  </p>
                </div>
              )}
            </section>

            <button
              onClick={generateOutfit}
              disabled={
                !image || 
                (outfitMode === 'presets' && !selectedStyle) || 
                (outfitMode === 'custom' && !customOutfitImage) || 
                (outfitMode === 'prompt' && !textPrompt) || 
                isGenerating
              }
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-lg flex flex-col items-center justify-center gap-1 transition-all shadow-xl",
                (!image || 
                 (outfitMode === 'presets' && !selectedStyle) || 
                 (outfitMode === 'custom' && !customOutfitImage) || 
                 (outfitMode === 'prompt' && !textPrompt) || 
                 isGenerating)
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 shadow-indigo-200 dark:shadow-none"
              )}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  Generating Magic...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Generate My Look
                </div>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:sticky lg:top-32 space-y-8">
            <div className="glass-card p-6 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative">
                      <div className="w-24 h-24 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
                      <div className="w-24 h-24 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0"></div>
                      <Sparkles className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold">Styling your outfit...</h3>
                      <p className="text-slate-500 text-sm">Our AI is processing your new look.</p>
                    </div>
                  </motion.div>
                ) : generatedImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full space-y-6"
                  >
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
                      <ReactCompareSlider
                        itemOne={<ReactCompareSliderImage src={image!} alt="Original" />}
                        itemTwo={<ReactCompareSliderImage src={generatedImage} alt="Generated" />}
                        className="h-[500px]"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={downloadImage}
                        className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      >
                        <Download className="w-5 h-5" /> Download
                      </button>
                      <button 
                        onClick={shareImage}
                        className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                      >
                        <Share2 className="w-5 h-5" /> Share
                      </button>
                      <button 
                        onClick={() => setGeneratedImage(null)}
                        className="w-full border border-slate-200 dark:border-slate-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <RefreshCw className="w-5 h-5" /> Try Another Outfit
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 text-slate-400"
                  >
                    <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-full">
                      <ImageIcon className="w-16 h-16" />
                    </div>
                    <p className="text-center max-w-[250px]">
                      Upload a photo and select a style to see the magic happen.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-600 w-5 h-5" />
              <span className="font-display font-bold text-lg">BS TryFit</span>
            </div>
          </div>
          
          <div className="flex gap-8 text-sm text-slate-500 dark:text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
          </div>
          
          <p className="text-sm text-slate-400">
            &copy; 2026 BS TryFit. Powered by Google Gemini Nano Banana.
          </p>
        </div>
      </footer>
    </div>
  );
}
