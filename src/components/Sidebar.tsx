import {
  CalendarClock,
  CheckCircle2,
  Droplets,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  PlusCircle,
  RotateCcw,
  Scissors,
  Sprout,
  Sun,
  X,
} from 'lucide-react';
import { NavigationPage, StorageMode } from '../types/plant';

interface SidebarProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  overdueCount: number;
  storageMode: StorageMode;
  onRequestResetDemo: () => void;
}

const NAV_ITEMS: Array<{
  id: NavigationPage;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-plants', label: 'My Plants', icon: Sprout },
  { id: 'add-plant', label: 'Add Plant', icon: PlusCircle },
  { id: 'watering', label: 'Watering Reminders', icon: Droplets },
  { id: 'fertilizer', label: 'Fertilizer Reminders', icon: FlaskConical },
  { id: 'pruning', label: 'Pruning Reminders', icon: Scissors },
  { id: 'sunlight', label: 'Sunlight Requirements', icon: Sun },
  { id: 'upcoming', label: 'Upcoming Tasks', icon: CalendarClock },
  { id: 'completed', label: 'Completed Activities', icon: CheckCircle2 },
];

export function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  overdueCount,
  storageMode,
  onRequestResetDemo,
}: SidebarProps) {
  const handleSelect = (page: NavigationPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#DDE7DF]">
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#EDF2EE]">
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="flex items-center gap-2.5 text-left cursor-pointer"
        >
          <div className="w-9 h-9 rounded-lg bg-[#15803D] text-white flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-base font-bold tracking-tight text-[#143624] leading-tight">
              Plant Care
            </span>
            <span className="block text-xs text-[#556E5E]">
              Reminder Studio
            </span>
          </div>
        </button>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-[#556E5E] hover:bg-[#F2F7F3] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const showOverdue = item.id === 'upcoming' && overdueCount > 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#EAF5ED] text-[#14532D]'
                  : 'text-[#395343] hover:bg-[#F4F8F5] hover:text-[#143624]'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-[#15803D]' : 'text-[#5C7766]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </span>
              {showOverdue && (
                <span className="text-xs font-semibold text-[#B91C1C] tabular-nums shrink-0">
                  {overdueCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#EDF2EE] space-y-3">
        <div className="text-xs text-[#4C6556] leading-relaxed">
          <div className="font-medium text-[#1E4D35]">
            {storageMode === 'firestore'
              ? 'Cloud Firestore Synced'
              : storageMode === 'local-fallback'
                ? 'Local Browser Storage'
                : 'Connecting Storage...'}
          </div>
          {storageMode === 'local-fallback' && (
            <p className="mt-1 text-[11px] text-[#7A5923]">
              Saved only in this browser. Clearing site data resets schedules.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onRequestResetDemo}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[#D4E2D7] text-xs font-medium text-[#244432] hover:bg-[#F4F8F5] transition-colors whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restore Sample Plants
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/35"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{navContent}</div>
        </div>
      )}
    </>
  );
}
