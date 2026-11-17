import { useEffect, useMemo, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import {
  ActivityLog,
  ActivityType,
  NavigationPage,
  Plant,
  PlantFormInput,
  StorageMode,
  SunlightLevel,
} from './types/plant';
import { buildAllCareTasks } from './lib/dateUtils';
import {
  completeCareTaskRecord,
  createPlantRecord,
  deletePlantRecord,
  initializeDataConnection,
  rescheduleCareTaskRecord,
  resetDemoWorkspaceRecord,
  updatePlantRecord,
  updatePlantSunlightRecord,
} from './lib/plantService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MyPlantsView } from './components/MyPlantsView';
import { PlantFormView } from './components/PlantFormView';
import { CareReminderView } from './components/CareReminderView';
import { SunlightView } from './components/SunlightView';
import { UpcomingTasksView } from './components/UpcomingTasksView';
import { CompletedActivitiesView } from './components/CompletedActivitiesView';
import { PlantDetailModal } from './components/PlantDetailModal';
import { ConfirmDialog } from './components/ConfirmDialog';

const PAGE_TITLES: Record<NavigationPage, string> = {
  dashboard: 'Dashboard',
  'my-plants': 'My Plants',
  'add-plant': 'Add Plant',
  watering: 'Watering Reminders',
  fertilizer: 'Fertilizer Reminders',
  pruning: 'Pruning Reminders',
  sunlight: 'Sunlight Requirements',
  upcoming: 'Upcoming Tasks',
  completed: 'Completed Activities',
};

function PlantCareApp() {
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [storageMode, setStorageMode] = useState<StorageMode>('connecting');
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<Error | null>(null);

  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [detailPlantId, setDetailPlantId] = useState<string | null>(null);
  const [plantPendingDelete, setPlantPendingDelete] = useState<Plant | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [completingKey, setCompletingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let active = true;

    initializeDataConnection({
      onPlants: (nextPlants) => {
        if (!active) return;
        setPlants(nextPlants);
        setLoading(false);
      },
      onActivities: (nextActivities) => {
        if (!active) return;
        setActivities(nextActivities);
      },
      onModeChange: (mode) => {
        if (!active) return;
        setStorageMode(mode);
      },
      onError: (err) => {
        if (!active) return;
        setFatalError(err);
      },
    })
      .then((unsub) => {
        if (!active) {
          unsub();
        } else {
          cleanup = unsub;
        }
      })
      .catch((err) => {
        if (active) setFatalError(err as Error);
      });

    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  if (fatalError) {
    throw fatalError;
  }

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const allTasks = useMemo(() => buildAllCareTasks(plants), [plants]);
  const overdueCount = useMemo(
    () => allTasks.filter((t) => t.status === 'Overdue').length,
    [allTasks]
  );

  const detailPlant = useMemo(
    () => plants.find((p) => p.id === detailPlantId) ?? null,
    [plants, detailPlantId]
  );

  const handleNavigate = (page: NavigationPage) => {
    if (page !== 'add-plant') {
      setEditingPlant(null);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAddPlant = () => {
    setEditingPlant(null);
    setActivePage('add-plant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditPlant = (plant: Plant) => {
    setDetailPlantId(null);
    setEditingPlant(plant);
    setActivePage('add-plant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePlant = async (
    input: PlantFormInput,
    existing: Plant | null
  ) => {
    if (existing) {
      const updated = await updatePlantRecord(existing, input, storageMode);
      if (storageMode === 'local-fallback') {
        setPlants((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
      setEditingPlant(null);
      setActivePage('my-plants');
      showToast(`Updated ${updated.name} schedule.`);
    } else {
      const created = await createPlantRecord(input, storageMode);
      if (storageMode === 'local-fallback') {
        setPlants((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
      }
      setActivePage('my-plants');
      showToast(`Added ${created.name} to your collection.`);
    }
  };

  const handleConfirmDeletePlant = async () => {
    if (!plantPendingDelete) return;
    const target = plantPendingDelete;
    setPlantPendingDelete(null);
    if (detailPlantId === target.id) {
      setDetailPlantId(null);
    }
    await deletePlantRecord(target.id, storageMode);
    if (storageMode === 'local-fallback') {
      setPlants((prev) => prev.filter((p) => p.id !== target.id));
    }
    showToast(`Removed ${target.name} from My Plants.`);
  };

  const handleCompleteTask = async (
    plant: Plant,
    activityType: ActivityType
  ) => {
    const key = `${plant.id}-${activityType}`;
    setCompletingKey(key);
    try {
      const { updatedPlant, activityLog } = await completeCareTaskRecord(
        plant,
        activityType,
        storageMode
      );
      if (storageMode === 'local-fallback') {
        setPlants((prev) =>
          prev.map((p) => (p.id === updatedPlant.id ? updatedPlant : p))
        );
        setActivities((prev) => [activityLog, ...prev]);
      }
      showToast(
        `${activityType} marked completed for ${plant.name}. Next due ${activityLog.nextDueDate}.`
      );
    } finally {
      setCompletingKey(null);
    }
  };

  const handleReschedule = async (
    plant: Plant,
    activityType: ActivityType,
    newDate: string,
    newFrequencyDays?: number
  ) => {
    const updated = await rescheduleCareTaskRecord(
      plant,
      activityType,
      newDate,
      newFrequencyDays,
      storageMode
    );
    if (storageMode === 'local-fallback') {
      setPlants((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    }
    showToast(`Updated ${activityType.toLowerCase()} date for ${plant.name}.`);
  };

  const handleUpdateSunlight = async (
    plant: Plant,
    level: SunlightLevel
  ) => {
    const updated = await updatePlantSunlightRecord(plant, level, storageMode);
    if (storageMode === 'local-fallback') {
      setPlants((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    }
    showToast(`${plant.name} set to ${level}.`);
  };

  const handleResetDemo = async () => {
    setResetConfirmOpen(false);
    const res = await resetDemoWorkspaceRecord(plants, activities, storageMode);
    if (storageMode === 'local-fallback') {
      setPlants(res.plants);
      setActivities(res.activities);
    }
    setActivePage('dashboard');
    showToast('Restored sample plants (Rose, Aloe Vera, Money Plant).');
  };

  return (
    <div className="min-h-screen flex bg-[#F4F8F5] text-[#14281D]">
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        overdueCount={overdueCount}
        storageMode={storageMode}
        onRequestResetDemo={() => setResetConfirmOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean 3-zone Top Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#DDE7DF] px-4 sm:px-8 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-[#244432] hover:bg-[#F2F7F3] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="text-sm font-semibold text-[#143624] truncate whitespace-nowrap">
              {activePage === 'add-plant' && editingPlant
                ? `Edit Plant · ${editingPlant.name}`
                : PAGE_TITLES[activePage]}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activePage !== 'add-plant' && (
              <button
                type="button"
                onClick={handleOpenAddPlant}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#15803D] text-white text-xs font-medium hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Plant
              </button>
            )}
          </div>
        </header>

        {/* Local Storage Limitation Notice (only shown if fallback is active) */}
        {storageMode === 'local-fallback' && (
          <div className="bg-[#FFFBEB] border-b border-[#FDE68A] px-4 sm:px-8 py-2.5 text-xs text-[#92400E]">
            Cloud Firestore is currently unavailable. Running in Local Storage fallback mode — your plant schedules are saved in this browser only and will not sync across devices.
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardView
              plants={plants}
              tasks={allTasks}
              activities={activities}
              loading={loading}
              onNavigate={handleNavigate}
              onCompleteTask={handleCompleteTask}
              onSelectPlant={(p) => setDetailPlantId(p.id)}
              completingKey={completingKey}
            />
          )}

          {activePage === 'my-plants' && (
            <MyPlantsView
              plants={plants}
              onAddPlant={handleOpenAddPlant}
              onEditPlant={handleOpenEditPlant}
              onDeletePlant={(p) => setPlantPendingDelete(p)}
              onViewPlant={(p) => setDetailPlantId(p.id)}
            />
          )}

          {activePage === 'add-plant' && (
            <PlantFormView
              key={editingPlant ? editingPlant.id : 'new-plant'}
              editingPlant={editingPlant}
              onSave={handleSavePlant}
              onCancel={() => {
                setEditingPlant(null);
                handleNavigate('my-plants');
              }}
            />
          )}

          {activePage === 'watering' && (
            <CareReminderView
              activityType="Watering"
              plants={plants}
              tasks={allTasks}
              completingKey={completingKey}
              onCompleteTask={handleCompleteTask}
              onReschedule={handleReschedule}
              onAddPlant={handleOpenAddPlant}
              onSelectPlant={(p) => setDetailPlantId(p.id)}
            />
          )}

          {activePage === 'fertilizer' && (
            <CareReminderView
              activityType="Fertilizing"
              plants={plants}
              tasks={allTasks}
              completingKey={completingKey}
              onCompleteTask={handleCompleteTask}
              onReschedule={handleReschedule}
              onAddPlant={handleOpenAddPlant}
              onSelectPlant={(p) => setDetailPlantId(p.id)}
            />
          )}

          {activePage === 'pruning' && (
            <CareReminderView
              activityType="Pruning"
              plants={plants}
              tasks={allTasks}
              completingKey={completingKey}
              onCompleteTask={handleCompleteTask}
              onReschedule={handleReschedule}
              onAddPlant={handleOpenAddPlant}
              onSelectPlant={(p) => setDetailPlantId(p.id)}
            />
          )}

          {activePage === 'sunlight' && (
            <SunlightView
              plants={plants}
              onUpdateSunlight={handleUpdateSunlight}
              onSelectPlant={(p) => setDetailPlantId(p.id)}
              onAddPlant={handleOpenAddPlant}
            />
          )}

          {activePage === 'upcoming' && (
            <UpcomingTasksView
              tasks={allTasks}
              activities={activities}
              completingKey={completingKey}
              onCompleteTask={handleCompleteTask}
              onSelectPlant={(p) => setDetailPlantId(p.id)}
            />
          )}

          {activePage === 'completed' && (
            <CompletedActivitiesView activities={activities} />
          )}
        </main>
      </div>

      {/* Detail Modal */}
      <PlantDetailModal
        plant={detailPlant}
        activities={activities}
        completingKey={completingKey}
        onClose={() => setDetailPlantId(null)}
        onEdit={handleOpenEditPlant}
        onDelete={(p) => setPlantPendingDelete(p)}
        onCompleteTask={handleCompleteTask}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(plantPendingDelete)}
        title={`Delete ${plantPendingDelete?.name ?? 'Plant'}?`}
        description="This removes the plant and its upcoming reminders from your collection. Past completed activity logs remain preserved in history."
        confirmLabel="Delete Plant"
        destructive
        onConfirm={handleConfirmDeletePlant}
        onCancel={() => setPlantPendingDelete(null)}
      />

      {/* Restore Sample Data Confirmation Modal */}
      <ConfirmDialog
        open={resetConfirmOpen}
        title="Restore Sample Plants?"
        description="This resets the plant collection and activity history back to the three sample plants (Rose, Aloe Vera, and Money Plant) with default care schedules."
        confirmLabel="Restore Samples"
        onConfirm={handleResetDemo}
        onCancel={() => setResetConfirmOpen(false)}
      />

      {/* Subtle Toast Confirmation */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-[#143624] text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-[#1E4D35] max-w-sm"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PlantCareApp />
    </ErrorBoundary>
  );
}
