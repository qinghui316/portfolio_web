export default function SectionWhatIDo() {
  const capabilities = [
    {
      title: "AIGC WORKFLOW",
      subtitle: "Content systems and production SOP",
      desc: "ComfyUI 工作流搭建、数字人口播、AIGC 漫剧、高清放大、图像编辑、动作迁移和团队复用 SOP。",
      index: "01",
    },
    {
      title: "AGENT & MCP",
      subtitle: "Tool orchestration and automation",
      desc: "MCP tool 标准化封装、N8N 编排、飞书多维表格自动化、RAG、embedding、skill 与 tool calling。",
      index: "02",
    },
    {
      title: "COMFYUI / LORA",
      subtitle: "Plugin, model tuning and adaptation",
      desc: "ComfyUI 插件开发、LoRA 训练、参数调试、模型适配、工作流性能优化和效果基线沉淀。",
      index: "03",
    },
    {
      title: "MULTIMODAL VIDEO AI",
      subtitle: "Retrieval, clipping and generation pipeline",
      desc: "Qwen3-VL-Embedding 微调、ASR / OCR / VLM / LLM 协同、video_fast_clip 长视频自动混剪系统。",
      index: "04",
    },
    {
      title: "FULL-STACK AI PRODUCT",
      subtitle: "Demo to deployed product",
      desc: "React + TypeScript 工作台、Node.js / Express / Prisma / PostgreSQL 后端、JWT 鉴权、Linux 部署。",
      index: "05",
    },
  ];

  return (
    <section className="what-i-do-section min-h-screen relative z-20 flex items-center text-on-dark py-32 overflow-hidden bg-surface-dark" id="what-i-do">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(204,120,92,0.18),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(93,184,166,0.09),transparent_24%)]" />
      <div className="max-w-[1500px] w-full mx-auto px-6 md:px-16 xl:px-24 grid lg:grid-cols-[0.78fr_1.22fr] gap-14 items-center relative z-20">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary mb-6">Capability Stack</p>
          <h2 className="font-display text-[62px] md:text-[108px] leading-[0.84] text-on-dark">
            WHAT<br />I DO
          </h2>
          <p className="mt-8 max-w-sm text-on-dark-soft leading-relaxed">
            能力模块不只是技能罗列，而是围绕“从 AI 工具到可运营产品”的完整落地链路。
          </p>
        </div>

        <div className="what-grid">
          {capabilities.map((cap, i) => (
            <article key={cap.title} className={`what-panel ${i === 0 ? "lg:col-span-2" : ""}`}>
              <div className="corner corner-tl" />
              <div className="corner corner-tr" />
              <div className="corner corner-bl" />
              <div className="corner corner-br" />
              <div className="font-mono text-primary text-xs tracking-[0.28em] mb-5">{cap.index}</div>
              <h3 className="font-display text-3xl md:text-4xl leading-none mb-3">{cap.title}</h3>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-on-dark-soft mb-5">{cap.subtitle}</p>
              <p className="text-sm leading-relaxed text-on-dark-soft">{cap.desc}</p>
              <div className="absolute right-5 bottom-5 w-7 h-7 border border-on-dark/25 flex items-center justify-center text-on-dark-soft">
                <span className="font-mono text-xs">↴</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
