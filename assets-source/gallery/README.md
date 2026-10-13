# Product Gallery Artwork

Seven complete 16:9 promotional images are generated with built-in ImageGen, including Chinese typography and interface/process imagery. These PNGs are editable source assets; Vite does not include this directory in production output.

`npm run prepare:gallery-assets` resizes/encodes the finished artwork into 1600x900 and 960x540 WebP, plus the lightweight inline Sayweave preview. It does not compose a poster or add text. Runtime files live in `src/assets/gallery` and follow the ordered IDs in `src/assets/projects/project-manifest.json`.

## Sources

| Project | Source PNG | Grounding |
| --- | --- | --- |
| Sayweave | sayweave-generated-v2.png | Current public input/dictionary demonstrations from https://sayweave.top/. Retained references: sayweave-input.png, sayweave-window.png. |
| MoonAI | moonai-generated-v3.png | Public workbench and storyboard demonstrations from https://moonai.asia/. Retained references: moonai-workbench.webp, moonai-storyboard.webp. |
| Beaver Code | beaver-code-generated-v3.png | Public Agent workbench from https://beavercode.moonai.asia/. Retained reference: beaver-agents-live.png. |
| 遥小绘 | yaoxiaohui-generated-v3.png | Supplied internal-platform description: Feishu table, ComfyUI, local API, RunningHub and batch tools. Marked 流程示意. |
| video_fast_clip | video-fast-clip-generated-v3.png | Actual project's README and detailed pipeline document: slicing, quality filtering/clustering, ASR/VLM, script generation, TTS/FFmpeg composition. Marked 流程示意 and 示例素材. |
| Qwen 微调 | qwen-embedding-generated-v3.png | Supplied project facts: video retrieval, Qwen3-VL-8B, LoRA, Recall/MRR/NDCG and the data/training/evaluation loop. Marked 流程示意 and 检索示例; no measured metric values claimed. |
| AIGC 课程 | aigc-course-generated-v3.png | Supplied course/SOP project description and current AI workflow/Harness course manuscripts. Marked 课程内容示意. |

Public website references were captured on 2026-10-13. These are promotional illustrations, not unedited application screenshots. The four process/content illustrations show documented purposes, not exact shipped interfaces or measured research results. Incidental generated marks and sample content are illustrative.

The exact six continuation prompts are retained in `PROMPTS.json`. Sayweave's first-image direction: a premium Windows voice-input poster grounded in the public input and dictionary references, titled Sayweave 随言, with 让想法，自然成文, Windows 实时语音输入与口语整理, and the features 实时输入 / 口语整理 / 专有词典. The input sentence is 明天下午三点，我们一起确认新版首页。 The complete image is generated; no code overlay is used.

## Budgets

- Desktop file: below 400KB; seven desktop files: below 2.8MB.
- Current desktop total: 1,095,170 bytes; mobile total: 516,078 bytes.
- Preview: below 4KB for inline delivery.
- Gallery tests validate dimensions, budgets, finite endpoints and scroll-progress synchronization.
