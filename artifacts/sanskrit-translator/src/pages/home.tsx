import { useState, useRef, useEffect } from "react";
import { useTranslateImage, useTranslateText, useHistory } from "@/hooks/use-translator";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Image as ImageIcon, Type, Sparkles, BookOpen, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { TranslationResult } from "@/lib/api";
import { Link } from "wouter";

export default function Home() {
  const [mode, setMode] = useState<"image" | "text">("image");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const translateImage = useTranslateImage();
  const translateText = useTranslateText();
  const { data: history } = useHistory(3);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setPreviewUrl(URL.createObjectURL(droppedFile));
    }
  };

  const handleTranslate = async () => {
    try {
      let res;
      if (mode === "image" && file) {
        res = await translateImage.mutateAsync(file);
      } else if (mode === "text" && text) {
        res = await translateText.mutateAsync(text);
      }
      if (res) {
        setResult(res);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const isPending = translateImage.isPending || translateText.isPending;

  return (
    <Layout>
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="text-center mb-16 space-y-4">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-b from-primary via-primary/80 to-primary/40 pb-2">
            Decode the Sacred
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto">
            Unveil the meaning of ancient Sanskrit and Devanagari inscriptions with scholarly precision.
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-white/5 rounded-2xl p-2 mb-8 shadow-2xl relative z-20">
          <div className="flex p-1 bg-black/40 rounded-xl mb-6 w-fit mx-auto border border-white/5">
            <button
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm transition-all ${mode === "image" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("image")}
            >
              <ImageIcon className="w-4 h-4" />
              Upload Image
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm transition-all ${mode === "text" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setMode("text")}
            >
              <Type className="w-4 h-4" />
              Enter Text
            </button>
          </div>

          <div className="p-4 md:p-8 pt-0">
            <AnimatePresence mode="wait">
              {mode === "image" ? (
                <motion.div
                  key="image-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div
                    className={`relative group flex flex-col items-center justify-center w-full h-80 rounded-xl border-2 border-dashed transition-all duration-300 ${isDragging ? "border-primary bg-primary/5" : previewUrl ? "border-primary/30 bg-black/20" : "border-white/10 hover:border-primary/50 bg-black/20 hover:bg-black/40"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !previewUrl && fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    
                    {previewUrl ? (
                      <div className="relative w-full h-full p-2">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl z-10 pointer-events-none" />
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-lg opacity-80" />
                        <div className="absolute bottom-6 left-0 right-0 text-center z-20 flex justify-center gap-4">
                          <Button variant="outline" onClick={(e) => { e.stopPropagation(); setFile(null); setPreviewUrl(null); }} className="bg-black/50 border-white/10 backdrop-blur-sm">
                            Clear
                          </Button>
                          <Button onClick={(e) => { e.stopPropagation(); handleTranslate(); }} disabled={isPending} className="bg-primary text-black hover:bg-primary/90 font-medium">
                            {isPending ? <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            {isPending ? "Deciphering..." : "Translate Inscription"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-muted-foreground pointer-events-none">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/30 group-hover:text-primary transition-all duration-500">
                          <UploadCloud className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg text-foreground font-medium mb-1">Upload artifact image</p>
                          <p className="text-sm">Drag and drop or click to browse</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="text-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="ॐ नमः शिवाय..."
                    className="min-h-[240px] text-xl md:text-2xl p-6 devanagari-text bg-black/20 border-white/10 focus-visible:border-primary/50 rounded-xl resize-none leading-relaxed placeholder:text-white/20"
                    dir="auto"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleTranslate} disabled={!text || isPending} className="bg-primary text-black hover:bg-primary/90 font-medium px-8 h-12">
                      {isPending ? <Sparkles className="w-4 h-4 mr-2 animate-pulse" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      {isPending ? "Deciphering..." : "Translate Text"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {isPending && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col items-center justify-center py-20 space-y-6"
          >
            <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-primary animate-spin" />
            <p className="text-primary font-serif tracking-widest uppercase text-sm animate-pulse">Deciphering ancient script...</p>
          </motion.div>
        )}

        <AnimatePresence>
          {result && !isPending && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="mt-16 pt-16 border-t border-white/5 space-y-12"
            >
              <div className="text-center space-y-2">
                <h2 className="font-serif text-3xl text-primary flex items-center justify-center gap-3">
                  <BookOpen className="w-6 h-6 opacity-50" /> Translation Complete
                </h2>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs tracking-wider">
                  Confidence: {Math.round(result.confidence * 100)}%
                </div>
              </div>

              <div className="grid md:grid-cols-12 gap-8">
                {result.sourceType === "image" && previewUrl && (
                  <div className="md:col-span-4 space-y-4">
                    <div className="relative rounded-lg overflow-hidden border border-white/10 shadow-2xl p-2 bg-black/40">
                       <img src={previewUrl} alt="Source" className="w-full h-auto object-contain rounded opacity-80 mix-blend-luminosity" />
                    </div>
                  </div>
                )}
                
                <div className={`space-y-10 ${result.sourceType === "image" ? "md:col-span-8" : "md:col-span-12 max-w-3xl mx-auto w-full"}`}>
                  
                  <div className="space-y-4 text-center">
                    <h3 className="text-sm font-serif tracking-widest text-muted-foreground uppercase">Original Text</h3>
                    <p className="devanagari-text text-3xl md:text-5xl leading-tight text-white/90 drop-shadow-lg">
                      {result.originalText}
                    </p>
                    <p className="text-lg md:text-xl font-light italic text-primary/70 tracking-wide pt-2">
                      {result.transliteration}
                    </p>
                  </div>

                  <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto" />

                  <div className="space-y-4 text-center pb-4">
                    <h3 className="text-sm font-serif tracking-widest text-muted-foreground uppercase">English Translation</h3>
                    <p className="font-serif text-2xl md:text-3xl leading-relaxed text-foreground">
                      "{result.englishTranslation}"
                    </p>
                  </div>

                  {(result.wordByWord || result.context) && (
                    <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                      {result.wordByWord && (
                        <div className="bg-black/20 border border-white/5 rounded-xl p-6">
                          <h4 className="text-xs tracking-widest uppercase text-primary/80 mb-4 font-semibold">Word by Word</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">
                            {result.wordByWord}
                          </p>
                        </div>
                      )}
                      {result.context && (
                        <div className="bg-black/20 border border-white/5 rounded-xl p-6">
                          <h4 className="text-xs tracking-widest uppercase text-primary/80 mb-4 font-semibold">Cultural Context</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {result.context}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {history && history.length > 0 && !result && !isPending && (
          <div className="mt-32">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-serif text-xl flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Recent Archives</h3>
              <Link href="/history" className="text-sm text-primary hover:text-primary/80 transition-colors">View All &rarr;</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {history.map((item) => (
                <div key={item.id} className="bg-black/30 border border-white/5 rounded-xl p-6 hover:bg-black/40 hover:border-primary/20 transition-all cursor-pointer group" onClick={() => {
                  setResult(item);
                  setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                }}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs text-primary/60 border border-primary/20 rounded px-2 py-0.5 bg-primary/5 uppercase tracking-wider">{item.sourceType}</span>
                    <span className="text-xs text-muted-foreground opacity-50">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="devanagari-text text-xl mb-3 text-white/80 line-clamp-2">{item.originalText}</p>
                  <p className="text-sm text-muted-foreground line-clamp-3 font-serif italic">"{item.englishTranslation}"</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
