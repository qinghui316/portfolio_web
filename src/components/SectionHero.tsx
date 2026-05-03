import { Github, Linkedin, Mail, FileText } from 'lucide-react';

export default function SectionHero() {
  return (
    <section className="hero-section h-screen w-full relative overflow-hidden flex items-center bg-transparent">
      {/* Navigation Header */}
      <nav className="absolute top-0 w-full p-6 md:p-8 flex justify-between items-center z-50 pointer-events-auto">
        <div className="font-display font-bold text-2xl text-ink">刘晖洋</div>
        <div className="hidden md:block font-mono text-sm text-ink">18379022106@163.com</div>
        <div className="flex gap-8 font-mono text-xs uppercase tracking-widest text-ink">
          <a href="#about" className="hover:text-primary transition-colors">About</a>
          <a href="#projects" className="hover:text-primary transition-colors">Work</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </div>
      </nav>

      {/* Social Links Left */}
      <div className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-50 pointer-events-auto text-ink">
        <a href="https://github.com/qinghui316/moonaigc" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
          <Github size={20} />
        </a>
        <a href="https://www.runninghub.cn/user-center/1907701705306169345" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors font-mono text-xs text-center flex flex-col items-center">
          <span className="font-bold leading-none">R</span>
          <span className="font-bold leading-none">H</span>
        </a>
        <a href="mailto:18379022106@163.com" className="hover:text-primary transition-colors">
          <Mail size={20} />
        </a>
      </div>

      {/* Resume Button Right Bottom */}
      <a href="#" className="absolute right-6 md:right-8 bottom-8 flex items-center gap-2 font-mono text-xs uppercase tracking-widest z-50 pointer-events-auto text-ink hover:text-primary transition-colors">
        Resume <FileText size={16} />
      </a>

      {/* Split Hero Texts */}
      <div className="max-w-[1600px] w-full mx-auto px-8 md:px-16 lg:px-24 flex flex-col md:flex-row justify-between items-center z-20 pointer-events-none hero-copy h-[100vh] pt-[20vh] md:pt-0">
        
        {/* Left Side text */}
        <div className="text-left w-full md:w-1/3 pointer-events-auto mb-16 md:mb-0">
          <p className="text-xl md:text-2xl font-mono text-primary mb-4">Hello! I'm</p>
          <h1 className="text-display-lg uppercase leading-none tracking-tight">
            刘晖洋
          </h1>
          <div className="mt-8 flex flex-col gap-2 font-mono text-xs text-muted uppercase tracking-wider">
            <span className="bg-surface-card px-3 py-1.5 rounded-sm inline-block w-fit">AIGC Workflow</span>
            <span className="bg-surface-card px-3 py-1.5 rounded-sm inline-block w-fit">Agent Orchestrator</span>
          </div>
        </div>

        {/* Right Side text */}
        <div className="w-full md:w-1/3 text-left md:text-right pointer-events-auto flex flex-col items-start md:items-end z-[15]">
          <p className="text-xl md:text-2xl font-mono text-primary mb-4">An</p>
          <div className="space-y-1">
             <h2 className="text-display-lg md:text-[56px] uppercase leading-[0.9] tracking-tight text-ink md:whitespace-nowrap">
               AI ENGINEER
             </h2>
             <h2 className="text-display-lg md:text-[56px] uppercase leading-[0.9] tracking-tight text-ink/40 md:whitespace-nowrap">
               FULL-STACK
             </h2>
          </div>
          <p className="mt-8 text-body max-w-[280px] text-sm leading-relaxed md:text-right">
            建筑学背景出身，擅长把漫剧、数字人口播、ComfyUI、Agent 工具链连接成可复用的 AI 生产系统。
          </p>
        </div>

      </div>
    </section>
  );
}
