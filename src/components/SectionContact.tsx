export default function SectionContact() {
  return (
    <section className="py-32 bg-canvas border-t border-hairline relative z-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24">
        <h2 className="text-display-lg mb-16">Contact</h2>
        
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-8 text-lg font-sans">
            <p className="text-body-strong leading-relaxed max-w-sm">
              寻找 AI 产品经理、AI 算法工程师及 AIGC 技术落地岗位机会。
            </p>
            
            <div className="flex flex-col gap-4 font-mono">
              <a href="mailto:18379022106@163.com" className="flex items-center gap-4 text-ink hover:text-primary transition-colors">
                <span className="text-muted w-20">Email:</span>
                18379022106@163.com
              </a>
              <div className="flex items-center gap-4 text-ink">
                <span className="text-muted w-20">Phone:</span>
                18379022106
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 md:items-end">
             <a href="https://github.com/qinghui316/moonaigc" target="_blank" rel="noreferrer" className="btn-secondary w-full md:w-64">
               GitHub ↗
             </a>
             <a href="https://www.runninghub.cn/user-center/1907701705306169345" target="_blank" rel="noreferrer" className="btn-secondary w-full md:w-64">
               RunningHub ↗
             </a>
             <a href="#" className="btn-primary w-full md:w-64 mt-4">
               下载 刘晖洋简历.pdf
             </a>
          </div>
        </div>
        
        <div className="mt-32 pt-8 border-t border-hairline flex flex-col md:flex-row justify-between text-sm font-mono text-muted uppercase tracking-widest gap-4">
          <span>© {new Date().getFullYear()} LIU HUIYANG</span>
          <span>AIGC / AGENT / FULL-STACK</span>
        </div>
      </div>
    </section>
  );
}
