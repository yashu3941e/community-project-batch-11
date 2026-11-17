import {
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  FlaskConical,
  Plus,
  Scissors,
  Sprout,
  Sun,
} from 'lucide-react';
import {
  ActivityLog,
  ActivityType,
  CareTask,
  NavigationPage,
  Plant,
} from '../types/plant';
import {
  formatHumanDate,
  getRelativeDueLabel,
  getTodayIso,
} from '../lib/dateUtils';
import { PlantImage } from './PlantImage';
import { StatusLabel } from './StatusLabel';

interface DashboardViewProps {
  plants: Plant[];
  tasks: CareTask[];
  activities: ActivityLog[];
  loading: boolean;
  onNavigate: (page: NavigationPage) => void;
  onCompleteTask: (plant: Plant, activityType: ActivityType) => Promise<void>;
  onSelectPlant: (plant: Plant) => void;
  completingKey: string | null;
}

function ActivityIcon({ type }: { type: ActivityType }) {
  if (type === 'Watering') return <Droplets className="w-4 h-4 text-[#15803D] shrink-0" />;
  if (type === 'Fertilizing') return <FlaskConical className="w-4 h-4 text-[#1E4D35] shrink-0" />;
  return <Scissors className="w-4 h-4 text-[#2F5E43] shrink-0" />;
}

export function DashboardView({
  plants,
  tasks,
  activities,
  loading,
  onNavigate,
  onCompleteTask,
  onSelectPlant,
  completingKey,
}: DashboardViewProps) {
  const todayIso = getTodayIso();
  const overdueTasks = tasks.filter((t) => t.status === 'Overdue');
  const upcomingSevenDays = tasks.filter((t) => t.daysDelta >= 0 && t.daysDelta <= 7);
  const priorityTasks = tasks.slice(0, 6);
  const recentActivities = activities.slice(0, 4);

  const kpis = [
    {
      label: 'Total Plants',
      value: plants.length,
      detail: 'Active in collection',
      icon: Sprout,
      target: 'my-plants' as NavigationPage,
    },
    {
      label: 'Upcoming Reminders',
      value: upcomingSevenDays.length,
      detail: 'Scheduled next 7 days',
      icon: CalendarClock,
      target: 'upcoming' as NavigationPage,
    },
    {
      label: 'Completed Activities',
      value: activities.length,
      detail: 'Logged care actions',
      icon: CheckCircle2,
      target: 'completed' as NavigationPage,
    },
    {
      label: 'Pending Activities',
      value: tasks.length,
      detail: overdueTasks.length > 0 ? `${overdueTasks.length} overdue attention` : 'All schedules active',
      icon: Clock,
      target: 'upcoming' as NavigationPage,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="bg-white border border-[#DDE7DF] rounded-xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-[#2F5E43]">
            {formatHumanDate(todayIso)} · Botanical Care Overview
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#143624] text-balance">
            Welcome to Plant Care Reminder Studio
          </h1>
          <p className="text-sm sm:text-base text-[#425A4C] leading-relaxed">
            Monitor watering, fertilizing, pruning schedules, and sunlight conditions across your plant collection in one organized workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('add-plant')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#15803D] text-white text-sm font-medium hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Plant
          </button>
        </div>
      </section>

      {/* KPI Metrics Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => onNavigate(kpi.target)}
              className="text-left bg-white border border-[#DDE7DF] hover:border-[#B6CEBC] rounded-xl p-5 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-sm font-medium text-[#3B5545]">{kpi.label}</span>
                <Icon className="w-4 h-4 text-[#15803D] shrink-0" />
              </div>
              <div className="text-3xl font-bold text-[#143624] tabular-nums leading-none mb-2">
                {loading ? '—' : kpi.value}
              </div>
              <p className="text-xs text-[#556E5E]">{kpi.detail}</p>
            </button>
          );
        })}
      </section>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Priority Reminders */}
        <section className="xl:col-span-7 bg-white border border-[#DDE7DF] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EDF2EE] flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#143624]">
                Upcoming & Overdue Care Tasks
              </h2>
              <p className="text-xs text-[#556E5E] mt-0.5">
                Sorted by earliest due date across watering, fertilizing, and pruning
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('upcoming')}
              className="text-xs font-medium text-[#15803D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              View All Tasks
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-[#F2F7F3] animate-pulse" />
              ))}
            </div>
          ) : priorityTasks.length === 0 ? (
            <div className="p-8 text-center">
              <Sprout className="w-9 h-9 text-[#15803D] mx-auto mb-2.5" />
              <p className="text-sm font-medium text-[#143624]">No plants scheduled yet</p>
              <p className="text-xs text-[#556E5E] mt-1 mb-4">
                Add your first plant to automatically generate watering, fertilizer, and pruning reminders.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('add-plant')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#15803D] text-white text-xs font-medium hover:bg-[#166534] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Plant
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EDF2EE]">
              {priorityTasks.map((task) => {
                const isBusy = completingKey === task.taskKey;
                return (
                  <div
                    key={task.taskKey}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFDFB] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <PlantImage
                        src={task.plant.imageUrl}
                        alt={task.plant.name}
                        className="w-12 h-12 rounded-lg shrink-0 border border-[#E3ECE5]"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onSelectPlant(task.plant)}
                            className="text-sm font-semibold text-[#143624] hover:text-[#15803D] truncate cursor-pointer"
                          >
                            {task.plant.name}
                          </button>
                          <span className="text-[#9AB0A2]" aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#244432]">
                            <ActivityIcon type={task.activityType} />
                            {task.activityType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#556E5E] mt-1 flex-wrap tabular-nums">
                          <span>Due {formatHumanDate(task.dueDate)}</span>
                          <span aria-hidden="true">·</span>
                          <span>{getRelativeDueLabel(task.daysDelta)}</span>
                          <span aria-hidden="true">·</span>
                          <StatusLabel status={task.status} />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onCompleteTask(task.plant, task.activityType)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#C7DCCD] bg-white text-xs font-medium text-[#14532D] hover:bg-[#EAF5ED] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isBusy ? 'Saving...' : 'Mark Completed'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Collection Snapshot & Recent Completed Activities */}
        <div className="xl:col-span-5 space-y-6">
          {/* Plants & Sunlight Snapshot */}
          <section className="bg-white border border-[#DDE7DF] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EDF2EE] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#143624]">My Plants</h2>
                <p className="text-xs text-[#556E5E] mt-0.5">
                  Quick access to sunlight & care profiles
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('my-plants')}
                className="text-xs font-medium text-[#15803D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Gallery
              </button>
            </div>

            {plants.length === 0 ? (
              <div className="p-6 text-xs text-[#556E5E]">No plants in collection.</div>
            ) : (
              <div className="divide-y divide-[#EDF2EE]">
                {plants.slice(0, 4).map((plant) => (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => onSelectPlant(plant)}
                    className="w-full px-6 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[#FAFDFB] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlantImage
                        src={plant.imageUrl}
                        alt={plant.name}
                        className="w-11 h-11 rounded-lg shrink-0 border border-[#E3ECE5]"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[#143624] truncate">
                          {plant.name}
                        </div>
                        <div className="text-xs text-[#556E5E] truncate">
                          {plant.plantType} · Water every {plant.wateringFrequencyDays}d
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2F5E43] shrink-0">
                      <Sun className="w-3.5 h-3.5 text-[#D97706]" />
                      <span className="hidden sm:inline">{plant.sunlightRequirement}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* Recent Completed Activities */}
          <section className="bg-white border border-[#DDE7DF] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EDF2EE] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#143624]">
                  Recent Completed Activities
                </h2>
                <p className="text-xs text-[#556E5E] mt-0.5">
                  Automatically updates next care schedules
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('completed')}
                className="text-xs font-medium text-[#15803D] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                History
              </button>
            </div>

            {recentActivities.length === 0 ? (
              <div className="p-6 text-xs text-[#556E5E]">
                Completed tasks will appear here as you check off reminders.
              </div>
            ) : (
              <div className="divide-y divide-[#EDF2EE]">
                {recentActivities.map((act) => (
                  <div key={act.id} className="px-6 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-[#143624]">
                        <ActivityIcon type={act.activityType} />
                        <span className="truncate">
                          {act.plantName} — {act.activityType}
                        </span>
                      </div>
                      <div className="text-xs text-[#556E5E] mt-0.5 tabular-nums">
                        Completed {formatHumanDate(act.completedDate)} · Next due {formatHumanDate(act.nextDueDate)}
                      </div>
                    </div>
                    <StatusLabel status="Completed" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
