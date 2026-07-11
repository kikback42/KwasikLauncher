import { PlayButton } from './PlayButton';

export const MainDashboard = ({ onLaunch }: { onLaunch: () => void }) => (
  <div className="flex-1 flex gap-6 p-6">
    <div className="w-1/3 bg-gray-950/50 backdrop-blur-sm border border-cyan-900/30 rounded-2xl p-6 flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-white">Minecraft Launcher</h2>
      <div className="h-48 bg-gray-800 rounded-xl"></div>
      <p className="text-gray-400">Latest version: 1.21.5 Fabric</p>
    </div>
    
    <div className="flex-1 bg-gradient-to-br from-purple-900/40 to-cyan-900/40 border border-cyan-500/30 rounded-2xl p-8 flex flex-col justify-end gap-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000')] bg-cover bg-center opacity-30"></div>
      <h1 className="text-6xl font-black text-white relative z-10">KwasikLauncher</h1>
      <PlayButton onClick={onLaunch} />
    </div>
  </div>
);
