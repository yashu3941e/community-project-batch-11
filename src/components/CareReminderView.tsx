import { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Droplets,
  FlaskConical,
  Plus,
  Scissors,
  Sprout,
} from 'lucide-react';
import { ActivityType, CareTask, Plant } from '../types/plant';
import { formatHumanDate, getRelativeDueLabel } from '../lib/dateUtils';
import { PlantImage } from './PlantImage';
import { StatusLabel } from './StatusLabel';

interface CareReminderViewProps {
  activityType: ActivityType;
  plants: Plant[];
  tasks: CareTask[];
  completingKey: string | null;
  onCompleteTask: (plant: Plant, activityType: ActivityType) => Promise<void>;
  onReschedule: (
    plant: Plant,
    activityType: ActivityType,
    newDate: string,
    newFrequencyDays?: number
  ) => Promise<void>;
  onAddPlant: () => void;
  onSelectPlant: (plant: Plant) => void;
}

const VIEW_META: Record<
  ActivityType,
  {
    title: string;
    subtitle: string;
    actionLabel: string;
    dateFieldLabel: string;
    icon: typeof Droplets;
  }
> = {
  Watering: {
    title: 'Watering Reminders',
    subtitle:
      'Set watering dates, monitor overdue hydration tasks, and mark watering sessions completed.',
    actionLabel: 'Mark Watered',
    dateFieldLabel: 'Set Watering Date',
    icon: Droplets,
  },
  Fertilizing: {
    title: 'Fertilizer Reminders',
    subtitle:
      'Schedule nutrient feedings, track upcoming fertilizer dates, and log completed applications.',
    actionLabel: 'Mark Fertilized',
    dateFieldLabel: 'Schedule Fertilizer Date',
    icon: FlaskConical,
  },
  Pruning: {
    title: 'Pruning Reminders',
    subtitle:
      'Schedule trimming and deadheading routines, review upcoming pruning dates, and record completions.',
    actionLabel: 'Mark Pruned',
    dateFieldLabel: 'Schedule Pruning Date',
    icon: Scissors,
  },
};

export function CareReminderView({
  activityType,
  plants,
  tasks,
  completingKey,
  onCompleteTask,
  onReschedule,
  onAddPlant,
  onSelectPlant,
}: CareReminderViewProps) {
  const meta = VIEW_META[activityType];
  const HeaderIcon = meta.icon;

  const filteredTasks = useMemo(
    () => tasks.filter((t) => t.activityType === activityType),
    [tasks, activityType]
  );

  const overdueTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Overdue'),
    [filteredTasks]
  );

  const upcomingTasks = useMemo(
    () => filteredTasks.filter((t) => t.status !== 'Overdue'),
    [filteredTasks]
  );

  // Quick scheduler bar state
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [customFreq, setCustomFreq] = useState<string>('');
  const [savingSchedule, setSavingSchedule] = useState(false);

  const targetPlant =
    plants.find((p) => p.id === selectedPlantId) ?? plants[0] ?? null;

  const activeDateValue =
    scheduledDate ||
    (targetPlant
      ? activityType === 'Watering'
        ? targetPlant.nextWateringDate
        : activityType === 'Fertilizing'
          ? targetPlant.nextFertilizingDate
          : targetPlant.nextPruningDate
      : '');

  const activeFreqValue =
    customFreq ||
    (targetPlant
      ? String(
          activityType === 'Watering'
            ? targetPlant.wateringFrequencyDays
            : activityType === 'Fertilizing'
              ? targetPlant.fertilizerFrequencyDays
              : targetPlant.pruningFrequencyDays
        )
      : '7');

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlant || !activeDateValue) return;
    setSavingSchedule(true);
    try {
      const parsedFreq = Number(activeFreqValue);
      await onReschedule(
        targetPlant,
        activityType,
        activeDateValue,
        Number.isFinite(parsedFreq) && parsedFreq >= 1 ? parsedFreq : undefined
      );
      setScheduledDate('');
      setCustomFreq('');
    } finally {
      setSavingSchedule(false);
    }
  };

  const renderTaskRow = (task: CareTask) => {
    const isBusy = completingKey === task.taskKey;
    return (
      <div
        key={task.taskKey}
        className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAFDFB] transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <PlantImage
            src={task.plant.imageUrl}
            alt={task.plant.name}
            className="w-14 h-14 rounded-lg shrink-0 border border-[#E3ECE5]"
          />
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onSelectPlant(task.plant)}
                className="text-base font-semibold text-[#143624] hover:text-[#15803D] cursor-pointer"
              >
                {task.plant.name}
              </button>
              <span className="text-[#9AB0A2]" aria-hidden="true">·</span>
              <span className="text-xs text-[#556E5E]">{task.plant.plantType}</span>
              <span className="text-[#9AB0A2]" aria-hidden="true">·</span>
              <StatusLabel status={task.status} />
            </div>

            <div className="flex items-center gap-2 text-xs text-[#425A4C] flex-wrap tabular-nums">
              <span>Scheduled: <strong>{formatHumanDate(task.dueDate)}</strong></span>
              <span aria-hidden="true">·</span>
              <span>{getRelativeDueLabel(task.daysDelta)}</span>
              <span aria-hidden="true">·</span>
              <span>Cadence: {task.scheduleLabel}</span>
              <span aria-hidden="true">·</span>
              <span>Last done: {formatHumanDate(task.lastDoneDate)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <label className="sr-only" htmlFor={`reschedule-${task.taskKey}`}>
            Reschedule {task.plant.name} {activityType}
          </label>
          <input
            id={`reschedule-${task.taskKey}`}
            type="date"
            value={task.dueDate}
            onChange={(e) => {
              if (e.target.value) {
                onReschedule(task.plant, activityType, e.target.value);
              }
            }}
            title="Change scheduled date"
            className="px-2.5 py-2 rounded-lg border border-[#D4E2D7] text-xs text-[#244432] tabular-nums bg-white focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
          />

          <button
            type="button"
            disabled={isBusy}
            onClick={() => onCompleteTask(task.plant, activityType)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#15803D] text-white text-xs font-medium hover:bg-[#166534] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            {isBusy ? 'Saving...' : meta.actionLabel}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EAF5ED] text-[#15803D] flex items-center justify-center shrink-0 mt-0.5">
            <HeaderIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#143624]">{meta.title}</h1>
            <p className="text-sm text-[#425A4C] mt-1">{meta.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Quick Date Scheduler Form */}
      {plants.length > 0 && (
        <form
          onSubmit={handleScheduleSubmit}
          className="bg-white border border-[#DDE7DF] rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
        >
          <div className="md:col-span-4">
            <label
              htmlFor={`select-plant-${activityType}`}
              className="block text-xs font-semibold text-[#244432] mb-1.5"
            >
              Select Plant
            </label>
            <select
              id={`select-plant-${activityType}`}
              value={targetPlant?.id ?? ''}
              onChange={(e) => {
                setSelectedPlantId(e.target.value);
                setScheduledDate('');
                setCustomFreq('');
              }}
              className="w-full px-3 py-2 rounded-lg border border-[#C9DBD0] text-sm bg-white text-[#14281D] focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
            >
              {plants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.plantType})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor={`schedule-date-${activityType}`}
              className="block text-xs font-semibold text-[#244432] mb-1.5"
            >
              {meta.dateFieldLabel}
            </label>
            <input
              id={`schedule-date-${activityType}`}
              type="date"
              required
              value={activeDateValue}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#C9DBD0] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
            />
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor={`schedule-freq-${activityType}`}
              className="block text-xs font-semibold text-[#244432] mb-1.5"
            >
              Repeat Every (days)
            </label>
            <input
              id={`schedule-freq-${activityType}`}
              type="number"
              min={1}
              max={365}
              required
              value={activeFreqValue}
              onChange={(e) => setCustomFreq(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#C9DBD0] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={savingSchedule}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#143624] text-white text-sm font-medium hover:bg-[#1E4D35] disabled:opacity-60 transition-colors whitespace-nowrap cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              {savingSchedule ? 'Saving...' : 'Save Date'}
            </button>
          </div>
        </form>
      )}

      {plants.length === 0 ? (
        <div className="bg-white border border-[#DDE7DF] rounded-xl p-10 text-center">
          <Sprout className="w-10 h-10 text-[#15803D] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#143624]">
            No plants available to schedule
          </h2>
          <p className="text-sm text-[#556E5E] mt-1 mb-5">
            Add a plant first to set up {activityType.toLowerCase()} reminders.
          </p>
          <button
            type="button"
            onClick={onAddPlant}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#15803D] text-white text-sm font-medium hover:bg-[#166534] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Plant
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueTasks.length > 0 && (
            <section className="bg-white border border-[#F5C2C2] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#F9DADA] bg-[#FEF7F7] flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-[#991B1B]">
                    Overdue {activityType} Tasks ({overdueTasks.length})
                  </h2>
                  <p className="text-xs text-[#B91C1C] mt-0.5">
                    These plants have passed their scheduled {activityType.toLowerCase()} date.
                  </p>
                </div>
              </div>
              <div className="divide-y divide-[#EDF2EE]">
                {overdueTasks.map(renderTaskRow)}
              </div>
            </section>
          )}

          {/* Upcoming Section */}
          <section className="bg-white border border-[#DDE7DF] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#EDF2EE] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-[#143624]">
                  Upcoming {activityType} Schedule ({upcomingTasks.length})
                </h2>
                <p className="text-xs text-[#556E5E] mt-0.5">
                  Completing a task automatically records today&apos;s date and calculates the next due date.
                </p>
              </div>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="p-6 text-sm text-[#556E5E]">
                All {activityType.toLowerCase()} tasks are currently listed in the overdue section above.
              </div>
            ) : (
              <div className="divide-y divide-[#EDF2EE]">
                {upcomingTasks.map(renderTaskRow)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
