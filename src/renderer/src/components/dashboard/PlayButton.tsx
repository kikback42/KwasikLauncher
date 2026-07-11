export const PlayButton = ({ onClick }: { onClick: () => void }) => (
  <button 
    className="relative group px-12 py-4 bg-cyan-600 rounded-lg text-white font-bold text-xl hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_40px_rgba(6,182,212,0.8)]"
    onClick={onClick}
  >
    PLAY
    <div className="absolute inset-0 rounded-lg border-2 border-cyan-400 group-hover:scale-105 transition-transform duration-300"></div>
  </button>
);
