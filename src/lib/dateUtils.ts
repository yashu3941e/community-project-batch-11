import { CareTask, Plant, TaskStatus } from '../types/plant';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseLocalDate(dateStr: string): Date {
  if (!ISO_DATE_RE.test(dateStr)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayIso(): string {
  return formatIsoDate(new Date());
}

export function addDaysIso(dateStr: string, days: number): string {
  const base = parseLocalDate(dateStr);
  base.setDate(base.getDate() + Math.round(days));
  return formatIsoDate(base);
}

export function daysBetweenIso(fromDateStr: string, toDateStr: string): number {
  const from = parseLocalDate(fromDateStr);
  const to = parseLocalDate(toDateStr);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((to.getTime() - from.getTime()) / msPerDay);
}

export function formatHumanDate(dateStr: string): string {
  if (!ISO_DATE_RE.test(dateStr)) return dateStr;
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getRelativeDueLabel(daysDelta: number): string {
  if (daysDelta < -1) return `${Math.abs(daysDelta)} days overdue`;
  if (daysDelta === -1) return '1 day overdue';
  if (daysDelta === 0) return 'Due today';
  if (daysDelta === 1) return 'Due tomorrow';
  return `In ${daysDelta} days`;
}

export function getTaskStatus(dueDate: string, todayIso: string = getTodayIso()): {
  status: TaskStatus;
  daysDelta: number;
} {
  const daysDelta = daysBetweenIso(todayIso, dueDate);
  if (daysDelta < 0) return { status: 'Overdue', daysDelta };
  if (daysDelta === 0) return { status: 'Due Today', daysDelta };
  return { status: 'Upcoming', daysDelta };
}

export function buildAllCareTasks(plants: Plant[], todayIso: string = getTodayIso()): CareTask[] {
  const tasks: CareTask[] = [];

  for (const plant of plants) {
    const waterState = getTaskStatus(plant.nextWateringDate, todayIso);
    tasks.push({
      taskKey: `${plant.id}-Watering`,
      plant,
      activityType: 'Watering',
      dueDate: plant.nextWateringDate,
      lastDoneDate: plant.lastWateredDate,
      frequencyDays: plant.wateringFrequencyDays,
      scheduleLabel: `Every ${plant.wateringFrequencyDays} ${plant.wateringFrequencyDays === 1 ? 'day' : 'days'}`,
      status: waterState.status,
      daysDelta: waterState.daysDelta,
    });

    const fertState = getTaskStatus(plant.nextFertilizingDate, todayIso);
    tasks.push({
      taskKey: `${plant.id}-Fertilizing`,
      plant,
      activityType: 'Fertilizing',
      dueDate: plant.nextFertilizingDate,
      lastDoneDate: plant.lastFertilizedDate,
      frequencyDays: plant.fertilizerFrequencyDays,
      scheduleLabel: `Every ${plant.fertilizerFrequencyDays} days`,
      status: fertState.status,
      daysDelta: fertState.daysDelta,
    });

    const pruneState = getTaskStatus(plant.nextPruningDate, todayIso);
    tasks.push({
      taskKey: `${plant.id}-Pruning`,
      plant,
      activityType: 'Pruning',
      dueDate: plant.nextPruningDate,
      lastDoneDate: plant.lastPrunedDate,
      frequencyDays: plant.pruningFrequencyDays,
      scheduleLabel: plant.pruningScheduleLabel,
      status: pruneState.status,
      daysDelta: pruneState.daysDelta,
    });
  }

  return tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
