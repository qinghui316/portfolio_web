import { Github, Mail, FileText, ArrowDown, Sparkles } from 'lucide-react';

export default function SectionHero() {
  return (
    <section className="hero-section min-h-screen w-full relative overflow-hidden flex items-center bg-surface-dark text-on-dark">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(204,120,92,0.22),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(93,184,166,0.12),transparent_26%),linear-gradient(180deg,#181715_0%,#1f1e1b_54%,#181715_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-surface-dark via-surface-dark/70 to-transparent" />

      <nav className="absolute top-0 w-full px-6 py-6 md:px-8 flex justify-between items-center z-50 pointer-events-auto text-on-dark">
        <div className="font-display text-2xl md:text-3xl font-medium">刘晖洋</div>
        <div className="hidden lg:block font-mono text-xs text-on-dark-soft">AI PRODUCT / AIGC / AGENT</div>
        <div className="flex gap-6 md:gap-8 font-mono text-[11px] uppercase tracking-[0.24em] text-on-dark-soft">
          <a href="#about" className="hover:text-primary transition-colors">About</a>
          <a href="#projects" className="hover:text-primary transition-colors">Work</a>
          <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
        </div>
      </nav>

      <div className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-6 z-50 pointer-events-auto text-on-dark-soft">
        <a href="https://github.com/qinghui316/moonaigc" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors" aria-label="GitHub">
          <Github size={20} />
        </a>
        <a href="https://www.runninghub.cn/user-center/1907701705306169345" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors font-mono text-xs text-center flex flex-col items-center" aria-label="RunningHub">
          <span className="font-bold leading-none">R</span>
          <span className="font-bold leading-none">H</span>
        </a>
        <a href="mailto:18379022106@163.com" className="hover:text-primary transition-colors" aria-label="Email">
          <Mail size={20} />
        </a>
      </div>

      <a href="#" className="absolute right-6 md:right-8 bottom-8 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] z-50 pointer-events-auto text-on-dark-soft hover:text-primary transition-colors">
        Resume <FileText size={16} />
      </a>

      <div className="max-w-[1600px] w-full mx-auto px-8 md:px-16 lg:px-24 flex flex-col md:flex-row justify-between items-center z-20 pointer-events-none hero-copy min-h-screen pt-[18vh] pb-24 md:py-0">
        <div className="text-left w-full md:w-[34%] pointer-events-auto mb-16 md:mb-0">
          <p className="inline-flex items-center gap-2 text-sm md:text-base font-mono text-primary mb-5 uppercase tracking-[0.22em]">
            <Sparkles size={16} /> Hello, I'm
          </p>
          <h1 className="font-display text-[64px] sm:text-[86px] lg:text-[112px] leading-[0.86] tracking-[-1px]">
            刘晖洋
          </h1>
          <div className="mt-8 flex flex-col gap-2 font-mono text-xs text-on-dark-soft uppercase tracking-[0.18em]">
            <span className="bg-surface-dark-elevated/80 border border-on-dark/10 px-3 py-1.5 rounded-sm inline-block w-fit">AIGC Workflow Builder</span>
            <span className="bg-surface-dark-elevated/80 border border-on-dark/10 px-3 py-1.5 rounded-sm inline-block w-fit">Agent Orchestrator</span>
            <span className="bg-surface-dark-elevated/80 border border-on-dark/10 px-3 py-1.5 rounded-sm inline-block w-fit">Multimodal Retrieval Engineer</span>
          </div>
        </div>

        <div className="w-full md:w-[34%] text-left md:text-right pointer-events-auto flex flex-col items-start md:items-end z-[15]">
          <p className="text-sm md:text-base font-mono text-primary mb-5 uppercase tracking-[0.22em]">AI 产品经理 / AI 算法工程师</p>
          <div className="space-y-1">
            <h2 className="font-display text-[42px] md:text-[58px] uppercase leading-[0.9] text-on-dark md:whitespace-nowrap">
              AI OPERATOR
            </h2>
            <h2 className="font-display text-[42px] md:text-[58px] uppercase leading-[0.9] text-on-dark/40 md:whitespace-nowrap">
              FULL-STACK
            </h2>
          </div>
          <p className="mt-8 text-on-dark-soft max-w-[330px] text-sm leading-relaxed md:text-right">
            建筑学背景出身，擅长把漫剧、数字人口播、ComfyUI、Agent 工具链连接成可复用的 AI 生产系统。
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-start md:justify-end">
            <a href="#projects" className="btn-primary h-11">查看项目</a>
            <a href="#about" className="btn-dark-secondary h-11">了解能力</a>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-on-dark-soft z-30">
        Scroll <ArrowDown size={14} />
      </div>
    </section>
  );
}
