import { useLauncherStore } from '../../store/useLauncherStore';
import { MainDashboard } from '../dashboard/MainDashboard';
import { ModStoreView } from '../dashboard/ModStoreView';
import { SettingsView } from '../dashboard/SettingsView';

export const ViewSwitcher = () => {
  const { activeView } = useLauncherStore();

  switch (activeView) {
    case 'home':
      return <MainDashboard onLaunch={() => {}} />;
    case 'store':
      return <ModStoreView />;
    case 'settings':
      return <SettingsView />;
    default:
      return (
        <div className="flex-1 flex items-center justify-center text-white text-2xl font-bold opacity-50">
          {activeView.toUpperCase()} VIEW (Coming Soon)
        </div>
      );
  }
};
