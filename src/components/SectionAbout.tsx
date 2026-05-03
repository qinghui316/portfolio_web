export default function SectionAbout() {
  return (
    <section className="about-section min-h-screen w-full relative flex items-center bg-transparent py-24" id="about">
      <div className="max-w-7xl mx-auto w-full px-6 md:px-12 xl:px-24 flex justify-end about-copy z-20">
        <div className="w-full md:w-[45%] pointer-events-auto p-8 lg:p-12">
          <h2 className="text-sm font-mono text-primary uppercase tracking-widest mb-6">About Me</h2>
          
          <div className="space-y-6 text-lg md:text-xl font-sans text-ink/80 leading-relaxed">
            <p>
              <strong className="text-primary font-medium">建筑学硕士背景</strong> 带来空间叙事、视觉审美、结构化表达和方案落地能力。
            </p>
            <p>
              <strong className="text-ink font-medium">AIGC 经验</strong> 覆盖漫剧、数字人口播、视觉内容生产 SOP、ComfyUI 工作流、LoRA 训练和参数调优。
            </p>
            <p>
              <strong className="text-ink font-medium">Agent 经验</strong> 覆盖 MCP、RAG、embedding、N8N、飞书多维表格、Claude Code、Codex、Cursor。
            </p>
            <p>
              <strong className="text-ink font-medium">工程经验</strong> 覆盖 vibe coding、FastAPI、Next.js、React、Node.js、Express、Prisma、PostgreSQL、Linux 部署。
            </p>
            <div className="mt-8 pt-8 border-t border-hairline relative">
              <span className="absolute -top-3 left-0 bg-canvas px-2 text-primary font-mono text-xs uppercase">Core Advantage</span>
              <p className="text-ink italic font-display text-2xl tracking-wide">
                个人优势是能把“不稳定的 AI 工具”封装成团队可复用、可批量、可管理的生产系统。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
