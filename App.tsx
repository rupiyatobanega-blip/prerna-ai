
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateMotivationContent, generateImageFromTheme } from './services/geminiService';
import { MotivationContent, Category } from './types';
import QuoteCard from './components/QuoteCard';
import { toPng } from 'html-to-image';

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'motivational', label: 'Motivational', icon: '🚀' },
  { id: 'love', label: 'Love', icon: '❤️' },
  { id: 'trading', label: 'Trading', icon: '📈' },
  { id: 'friendship', label: 'Friendship', icon: '🤝' },
];

const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<Category>('motivational');
  const [content, setContent] = useState<MotivationContent | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [sharing, setSharing] = useState<boolean>(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const fetchNewPoster = useCallback(async (cat: Category = activeCategory) => {
    setLoading(true);
    setError(null);
    try {
      const newContent = await generateMotivationContent(cat);
      if (newContent) {
        setContent(newContent);
        const newImage = await generateImageFromTheme(newContent.theme);
        setImageUrl(newImage);
      }
    } catch (err: any) {
      console.error("App Error:", err);
      setError("Technical dikkat aa gayi hai. Phirse try karein.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchNewPoster();
  }, [fetchNewPoster]);

  const generateImageFile = async (): Promise<File | null> => {
    if (!cardRef.current) return null;
    try {
      // Wait for fonts and a small buffer for the image to render
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 800));
      
      const dataUrl = await toPng(cardRef.current, { 
        quality: 0.95, 
        pixelRatio: 2,
        cacheBust: true 
      });
      
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return new File([blob], `prerna-ai-${Date.now()}.png`, { type: 'image/png' });
    } catch (err) { 
      console.error("Capture error:", err);
      return null; 
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    const file = await generateImageFile();
    if (file) {
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.download = file.name;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert("Image save nahi ho payi. Screenshot le lo!");
    }
    setDownloading(false);
  };

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const file = await generateImageFile();
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: content?.title || 'Prerna AI Quote',
          text: 'Check out this quote from Prerna AI!',
        });
      } else if (navigator.share) {
        // Fallback for text-only sharing if files aren't supported
        await navigator.share({
          title: content?.title,
          text: `${content?.title}\n\n${content?.body}\n\nSent via Prerna AI`,
        });
      } else {
        alert("Aapka browser sharing support nahi karta. Save karke share karein.");
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error("Sharing failed", err);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center py-6 px-4 font-['Poppins']">
      {/* Brand */}
      <div className="mb-6 flex flex-col items-center">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-amber-400 to-orange-500 tracking-tighter italic">
          PRERNA AI
        </h1>
        <div className="h-1 w-16 bg-amber-500 rounded-full mt-1 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
      </div>

      {/* Category Selection */}
      <div className="w-full max-w-[400px] mb-8 flex overflow-x-auto gap-3 py-2 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); fetchNewPoster(cat.id); }}
            disabled={loading}
            className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border flex items-center gap-2 shadow-sm ${
              activeCategory === cat.id
                ? 'bg-amber-500 border-amber-500 text-black shadow-amber-500/20'
                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
            } disabled:opacity-50`}
          >
            <span className="text-base">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="relative w-full max-w-[400px] flex flex-col items-center">
        {error ? (
          <div className="w-full aspect-[9/16] rounded-[2.5rem] bg-slate-900 flex flex-col items-center justify-center p-8 text-center border border-red-500/20">
             <div className="text-red-400 mb-6 font-bold">{error}</div>
             <button onClick={() => fetchNewPoster()} className="bg-slate-800 px-8 py-3 rounded-full text-sm font-bold hover:bg-slate-700 transition-colors">Retry</button>
          </div>
        ) : loading ? (
          <div className="w-full aspect-[9/16] rounded-[2.5rem] bg-slate-900 flex flex-col items-center justify-center border border-slate-800 shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-slate-800/40 to-transparent animate-pulse"></div>
             <div className="z-10 flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                <div className="text-amber-500 font-black text-xs uppercase tracking-[0.3em]">Creating...</div>
             </div>
          </div>
        ) : (
          content && <QuoteCard content={content} imageUrl={imageUrl} cardRef={cardRef} />
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-4 w-full">
          {/* Main Refresh Button */}
          <button 
            onClick={() => fetchNewPoster()} 
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 p-5 rounded-2xl text-black font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Refresh New Image
          </button>

          {/* Save and Share Row */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleDownload} 
              disabled={loading || downloading}
              className="bg-white/5 p-5 rounded-2xl border border-white/10 text-white font-bold flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-transform disabled:opacity-50"
            >
              {downloading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              Save
            </button>

            <button 
              onClick={handleShare} 
              disabled={loading || sharing}
              className="bg-slate-800 p-5 rounded-2xl border border-slate-700 text-white font-bold flex items-center justify-center gap-3 hover:bg-slate-700 active:scale-95 transition-transform disabled:opacity-50"
            >
              {sharing ? (
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
              Share
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-slate-700 text-[10px] font-black tracking-[0.4em] uppercase">
        Designed by AI • Built for You
      </div>
    </div>
  );
};

export default App;
