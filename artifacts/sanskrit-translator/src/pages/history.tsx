import { useHistory, useStats } from "@/hooks/use-translator";
import { Layout } from "@/components/layout";
import { motion } from "framer-motion";
import { BookOpen, Search, Filter, Image as ImageIcon, Type, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function History() {
  const { data: history, isLoading: historyLoading } = useHistory(50);
  const { data: stats, isLoading: statsLoading } = useStats();

  return (
    <Layout>
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" /> The Archives
            </h1>
            <p className="text-muted-foreground mt-2 font-light">A repository of deciphered inscriptions.</p>
          </div>

          {!statsLoading && stats && (
            <div className="flex gap-4 p-4 rounded-xl bg-black/40 border border-white/5 backdrop-blur-sm">
              <div className="text-center px-4">
                <p className="text-2xl font-serif text-primary">{stats.totalTranslations}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center px-4">
                <p className="text-2xl font-serif text-foreground">{stats.imageTranslations}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Images</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center px-4">
                <p className="text-2xl font-serif text-foreground">{stats.textTranslations}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Texts</p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-8 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search archives..." 
              className="pl-10 bg-black/20 border-white/10 focus-visible:border-primary/50"
            />
          </div>
          <button className="px-4 py-2 bg-black/20 border border-white/10 rounded-md text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-black/40 transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>

        {historyLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-64 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map((item, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                key={item.id}
                className="group relative bg-black/20 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 hover:bg-black/40 transition-all duration-300 flex flex-col"
              >
                <div className="p-6 flex-1 flex flex-col relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="flex items-center gap-1.5 text-xs text-primary/80 border border-primary/20 rounded-md px-2.5 py-1 bg-primary/5 uppercase tracking-wider">
                      {item.sourceType === "image" ? <ImageIcon className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                      {item.sourceType}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="mb-6 flex-1">
                    <p className="devanagari-text text-2xl text-white/90 line-clamp-3 mb-2 opacity-80 group-hover:opacity-100 transition-opacity leading-snug">
                      {item.originalText}
                    </p>
                    <p className="text-xs text-primary/50 italic line-clamp-1 mb-4">
                      {item.transliteration}
                    </p>
                    <p className="font-serif text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                      "{item.englishTranslation}"
                    </p>
                  </div>
                </div>
                <div className="px-6 py-4 bg-black/40 border-t border-white/5 mt-auto flex justify-between items-center text-xs opacity-60 group-hover:opacity-100 transition-opacity">
                   <span className="text-muted-foreground">Confidence: {Math.round(item.confidence * 100)}%</span>
                   <span className="text-primary flex items-center gap-1">Read full &rarr;</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border border-white/5 border-dashed rounded-2xl bg-black/10">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-muted-foreground">The Archives are empty</h3>
            <p className="text-sm text-muted-foreground/60 mt-2">Translate an inscription to begin the archive.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
