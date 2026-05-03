export default function SectionWhatIDo() {
  const capabilities = [
    {
      title: "AI DEVELOPER",
      subtitle: "Building intelligent systems & AI solutions",
      desc: "Developing AI agents, chatbots, and machine learning models using Python. Specializing in LLMs, NLP, deep learning, and autonomous systems.",
    },
    {
      title: "FULL-STACK",
      subtitle: "Modern web development & scalable applications",
      desc: "React + TypeScript 前端工作台 / Node.js / Express / Prisma / PostgreSQL 后端 / JWT 鉴权和 userId 数据隔离 / Linux 服务器部署 / 快速 demo 到线上系统",
    },
    {
      title: "AIGC WORKFLOW",
      subtitle: "ComfyUI Plugin And LoRA",
      desc: "ComfyUI 工作流搭建 / 数字人口播 / AIGC 漫剧 / LoRA 训练和效果调优 / 参数调试、模型适配、工作流性能优化",
    },
    {
      title: "AGENT & MCP",
      subtitle: "Automation and tool orchestration",
      desc: "MCP tool 标准化封装 / N8N 工作流编排 / 飞书多维表格自动化 / RAG、embedding、skill、tool calling 基础架构理解",
    }
  ];

  return (
    <section className="what-i-do-section min-h-screen relative z-20 flex items-center text-ink py-32 overflow-hidden bg-transparent" id="what-i-do">
      <div className="max-w-[1400px] w-full mx-auto px-6 md:px-16 xl:px-32 flex flex-col md:flex-row items-center relative z-20">
        
        {/* Left Side Label */}
        <div className="w-full md:w-1/2 mb-16 md:mb-0">
          <h2 className="text-display-lg md:text-[80px] uppercase font-bold leading-none tracking-tighter mix-blend-difference z-30 relative pointer-events-none">
            WHAT I DO
          </h2>
        </div>

        {/* Right Side Cards */}
        <div className="w-full md:w-[55%] flex flex-col gap-6 md:pl-16">
          {capabilities.map((cap, i) => (
            <div key={i} className="group flex flex-col pt-8 pb-10 px-10 border border-hairline/50 bg-canvas/95 backdrop-blur shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden rounded-xl">
               {/* Decorative corner markers */}
               <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/30" />
               <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/30" />
               <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/30" />
               <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/30" />

              <h3 className="font-display text-4xl font-semibold tracking-tight mb-2 uppercase">{cap.title}</h3>
              <p className="font-mono text-xs text-muted uppercase tracking-widest mb-6">{cap.subtitle}</p>
              <p className="text-body text-sm leading-relaxed text-ink/70">{cap.desc}</p>
              
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded border border-ink/20 flex items-center justify-center">
                  <span className="font-mono text-xs">↓</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
