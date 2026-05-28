import { Link, useLocation } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden dark">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]" />
      
      <header className="w-full border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full border border-primary/30 flex items-center justify-center bg-black/50 group-hover:border-primary/60 transition-colors">
              <span className="font-serif text-primary text-xl">ॐ</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg tracking-wider text-foreground leading-tight">DECODEX</span>
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground leading-tight">Ancient Scripts AI</span>
            </div>
          </Link>

          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm tracking-wide transition-colors ${location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Translate
            </Link>
            <Link 
              href="/history" 
              className={`text-sm tracking-wide transition-colors ${location === "/history" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Archive
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10">
        {children}
      </main>

      <footer className="py-8 border-t border-white/5 mt-auto bg-black/20 text-center text-xs text-muted-foreground relative z-10">
        <p className="tracking-widest uppercase opacity-50">Preserving the past with the technology of the future</p>
      </footer>
    </div>
  );
}
