export const PlayButton = ({ onClick, disabled }: { onClick: () => void, disabled: boolean }) => (
  <button 
    className={`relative group px-12 py-4 bg-cyan-600 rounded-lg text-white font-bold text-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)] ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-cyan-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.8)]'}`}
    onClick={onClick}
    disabled={disabled}
  >
    {disabled ? 'DOWNLOADING...' : 'PLAY'}
    {!disabled && <div className="absolute inset-0 rounded-lg border-2 border-cyan-400 group-hover:scale-105 transition-transform duration-300"></div>}
  </button>
);
