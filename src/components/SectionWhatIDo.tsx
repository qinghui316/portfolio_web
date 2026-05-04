import { useState } from 'react';

export default function SectionWhatIDo() {
  const capabilities = [
    {
      title: "AIGC WORKFLOW",
      subtitle: "Content systems and production SOP",
      summary: "ComfyUI、数字人口播、AIGC 漫剧和团队复用 SOP。",
      desc: "ComfyUI 工作流搭建、数字人口播、AIGC 漫剧、高清放大、图像编辑、动作迁移和团队复用 SOP。",
      index: "01",
      tags: ["ComfyUI", "AIGC", "SOP"],
    },
    {
      title: "AGENT & MCP",
      subtitle: "Tool orchestration and automation",
      summary: "MCP tool、N8N、RAG 和 embedding 自动化链路。",
      desc: "MCP tool 标准化封装、N8N 编排、飞书多维表格自动化、RAG、embedding、skill 与 tool calling。",
      index: "02",
      tags: ["MCP", "N8N", "RAG"],
    },
    {
      title: "COMFYUI / LORA",
      subtitle: "Plugin, model tuning and adaptation",
      summary: "插件开发、LoRA 训练、模型适配和效果基线。",
      desc: "ComfyUI 插件开发、LoRA 训练、参数调试、模型适配、工作流性能优化和效果基线沉淀。",
      index: "03",
      tags: ["LoRA", "Plugin", "Tuning"],
    },
    {
      title: "MULTIMODAL VIDEO AI",
      subtitle: "Retrieval, clipping and generation pipeline",
      summary: "长视频检索、ASR/OCR/VLM/LLM 协同和自动混剪。",
      desc: "Qwen3-VL-Embedding 微调、ASR / OCR / VLM / LLM 协同、video_fast_clip 长视频自动混剪系统。",
      index: "04",
      tags: ["VLM", "ASR", "Video"],
    },
    {
      title: "FULL-STACK AI PRODUCT",
      subtitle: "Demo to deployed product",
      summary: "React 工作台、Node 后端、鉴权、数据库和 Linux 部署。",
      desc: "React + TypeScript 工作台、Node.js / Express / Prisma / PostgreSQL 后端、JWT 鉴权、Linux 部署。",
      index: "05",
      tags: ["React", "Node.js", "Prisma"],
    },
  ];
  const [expandedIndex, setExpandedIndex] = useState(0);

  const isCoarsePointer = () =>
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  return (
    <section className="what-i-do-section min-h-screen relative flex items-center text-on-dark py-24 overflow-hidden bg-surface-dark" id="what-i-do">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(204,120,92,0.2),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(93,184,166,0.09),transparent_24%),linear-gradient(180deg,#181715_0%,#151411_100%)]" />
      <div className="what-i-do-inner max-w-[1580px] w-full mx-auto px-6 md:px-16 xl:px-24 grid lg:grid-cols-[0.86fr_1.14fr] gap-12 items-center relative z-20">
        <div className="what-visual-column">
          <div className="what-visual-copy">
            <p className="font-mono text-xs uppercase tracking-[0.26em] text-primary mb-4">Capability Stack</p>
            <h2 className="font-display text-[58px] md:text-[94px] leading-[0.84] text-on-dark">
              WHAT<br />I DO
            </h2>
            <p className="mt-6 max-w-sm text-on-dark-soft leading-relaxed">
            能力模块不只是技能罗列，而是围绕“从 AI 工具到可运营产品”的完整落地链路。
            </p>
          </div>
        </div>

        <div className="what-grid">
          {capabilities.map((cap, i) => (
            <article
              key={cap.title}
              className={`what-panel ${i === expandedIndex ? "is-expanded" : ""}`}
              role="button"
              tabIndex={0}
              aria-expanded={i === expandedIndex}
              onFocus={() => setExpandedIndex(i)}
              onMouseEnter={() => setExpandedIndex(i)}
              onClick={() => {
                if (isCoarsePointer()) {
                  setExpandedIndex((current) => (current === i ? 0 : i));
                } else {
                  setExpandedIndex(i);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setExpandedIndex(i);
                }
              }}
            >
              <div className="corner corner-tl" />
              <div className="corner corner-tr" />
              <div className="corner corner-bl" />
              <div className="corner corner-br" />
              <div className="what-panel-head">
                <div className="font-mono text-primary text-xs tracking-[0.28em]">{cap.index}</div>
                <h3 className="font-display text-2xl md:text-[34px] leading-none">{cap.title}</h3>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-on-dark-soft">{cap.subtitle}</p>
              </div>
              <p className="what-panel-summary">{cap.summary}</p>
              <div className="what-panel-details">
                <p>{cap.desc}</p>
                <div className="what-panel-tags">
                  {cap.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className="what-panel-toggle" aria-hidden="true">
                <span className="font-mono text-xs">{i === expandedIndex ? "↱" : "↴"}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
