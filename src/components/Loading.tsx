interface LoadingProps {
  progress: number;
  status: string;
  isExiting: boolean;
}

export default function Loading({ progress, status, isExiting }: LoadingProps) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div
      className={`fixed inset-0 bg-surface-dark text-on-dark z-[100] flex flex-col justify-center overflow-hidden transition-opacity duration-700 ease-in-out ${isExiting ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_34%,rgba(204,120,92,0.18),transparent_28%),radial-gradient(circle_at_82%_68%,rgba(93,184,166,0.08),transparent_24%)]" />
      <div className="flex whitespace-nowrap opacity-25 relative">
        <div className="animate-[marquee_20s_linear_infinite] flex gap-16 font-display text-7xl md:text-9xl uppercase">
          <span>AI PRODUCT MANAGER</span>
          <span>AIGC ENGINEER</span>
          <span>AGENT BUILDER</span>
          <span>MULTIMODAL RETRIEVAL</span>
        </div>
        <div className="animate-[marquee_20s_linear_infinite] flex gap-16 font-display text-7xl md:text-9xl uppercase ml-16">
          <span>AI PRODUCT MANAGER</span>
          <span>AIGC ENGINEER</span>
          <span>AGENT BUILDER</span>
          <span>MULTIMODAL RETRIEVAL</span>
        </div>
      </div>

      <div className="absolute bottom-12 left-1/2 w-[min(520px,76vw)] -translate-x-1/2">
        <div className="mb-4 flex items-center justify-between gap-4 font-mono text-xs uppercase tracking-[0.24em] text-on-dark-soft">
          <span className="truncate">{status}</span>
          <span className="text-on-dark">{safeProgress}%</span>
        </div>
        <div className="h-px w-full overflow-hidden bg-on-dark/15">
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
