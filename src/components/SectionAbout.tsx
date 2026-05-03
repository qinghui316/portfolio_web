export default function SectionAbout() {
  const keywords = [
    "ComfyUI",
    "LoRA",
    "MCP",
    "RAG",
    "N8N",
    "FastAPI",
    "React",
    "Prisma",
    "PostgreSQL",
    "Linux",
  ];

  return (
    <section className="about-section min-h-screen w-full relative flex items-center bg-canvas py-24 md:py-32" id="about">
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-surface-dark to-transparent opacity-70" />
      <div className="max-w-[1400px] mx-auto w-full px-6 md:px-12 xl:px-24 grid lg:grid-cols-[0.9fr_1.1fr] gap-16 items-center relative z-20">
        <div className="hidden lg:block pointer-events-none">
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-muted mb-6">Compound Background</p>
          <h2 className="font-display text-[72px] leading-[0.9] text-ink/10">
            Architecture<br />
            AIGC<br />
            Agent
          </h2>
        </div>

        <div className="about-copy pointer-events-auto">
          <p className="font-mono text-xs text-primary uppercase tracking-[0.26em] mb-6">About Me</p>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95] mb-10">
            把不稳定的 AI 工具，变成可复用的生产系统。
          </h2>

          <div className="grid md:grid-cols-2 gap-x-10 gap-y-8 text-body leading-relaxed">
            <p>
              <strong className="text-primary font-medium">建筑学硕士背景</strong> 带来空间叙事、视觉审美、结构化表达和方案落地能力。
            </p>
            <p>
              <strong className="text-ink font-medium">AIGC 经验</strong> 覆盖漫剧、数字人口播、视觉内容生产 SOP、ComfyUI 工作流和 LoRA 调优。
            </p>
            <p>
              <strong className="text-ink font-medium">Agent 经验</strong> 覆盖 MCP、RAG、embedding、N8N、飞书多维表格、Claude Code、Codex、Cursor。
            </p>
            <p>
              <strong className="text-ink font-medium">工程经验</strong> 覆盖 FastAPI、Next.js、React、Node.js、Prisma、PostgreSQL、Linux 部署。
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-hairline">
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span key={keyword} className="badge-pill">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
