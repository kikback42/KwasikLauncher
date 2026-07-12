import { useLauncherStore } from '../../store/useLauncherStore';
import { MainDashboard } from '../dashboard/MainDashboard';
import { ModStoreView } from '../dashboard/ModStoreView';
import { SettingsView } from '../dashboard/SettingsView';
import { InstancesView } from '../dashboard/InstancesView';

export const ViewSwitcher = () => {
  const { activeView } = useLauncherStore();

  switch (activeView) {
    case 'home':
      return <MainDashboard />;
    case 'instances':
      return <InstancesView />;
    case 'store':
      return <ModStoreView />;
    case 'mods':
      return <InstalledModsView />;
    case 'settings':
      return <SettingsView />;
    default:
      return (
        <div className="flex-1 flex items-center justify-center text-white text-2xl font-bold opacity-50">
          Экран недоступен
        </div>
      );
  }
};

const InstalledModsView = () => {
  const { installedMods, setActiveView } = useLauncherStore();
  return <div className="flex-1 p-8 text-white">
    <h2 className="text-3xl font-bold text-purple-400">Мои моды</h2>
    <p className="text-gray-400 mt-2">Установленные в текущем сеансе моды сохраняются в папке <code>.minecraft/mods</code>.</p>
    {installedMods.length ? <div className="mt-6 grid gap-3">{installedMods.map((id) => <div key={id} className="bg-gray-900 border border-gray-800 rounded-lg p-4">{id}</div>)}</div> : <button onClick={() => setActiveView('store')} className="mt-6 bg-purple-600 px-4 py-3 rounded-lg">Открыть каталог модов</button>}
  </div>;
};
