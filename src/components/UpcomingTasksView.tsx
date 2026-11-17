import { useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  Droplets,
  FlaskConical,
  Scissors,
  Sprout,
} from 'lucide-react';
import {
  ActivityLog,
  ActivityType,
  CareTask,
  Plant,
} from '../types/plant';
import { formatHumanDate, getRelativeDueLabel } from '../lib/dateUtils';
import { PlantImage } from './PlantImage';
import { StatusLabel } from './StatusLabel';

interface UpcomingTasksViewProps {
  tasks: CareTask[];
  activities: ActivityLog[];
  completingKey: string | null;
  onCompleteTask: (plant: Plant, activityType: ActivityType) => Promise<void>;
  onSelectPlant: (plant: Plant) => void;
}

type StatusFilter = 'All' | 'Overdue' | 'Pending' | 'Completed';
type TypeFilter = 'All' | ActivityType;

function TypeIcon({ type }: { type: ActivityType }) {
  if (type === 'Watering') return <Droplets className="w-4 h-4 text-[#15803D]" />;
  if (type === 'Fertilizing') return <FlaskConical className="w-4 h-4 text-[#1E4D35]" />;
  return <Scissors className="w-4 h-4 text-[#2F5E43]" />;
}

export function UpcomingTasksView({
  tasks,
  activities,
  completingKey,
  onCompleteTask,
  onSelectPlant,
}: UpcomingTasksViewProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const filteredActiveTasks = useMemo(() => {
    if (statusFilter === 'Completed') return [];
    return tasks.filter((t) => {
      const matchesType = typeFilter === 'All' || t.activityType === typeFilter;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Overdue' && t.status === 'Overdue') ||
        (statusFilter === 'Pending' && t.status !== 'Overdue');
      return matchesType && matchesStatus;
    });
  }, [tasks, typeFilter, statusFilter]);

  const filteredCompletedLogs = useMemo(() => {
    if (statusFilter === 'Overdue' || statusFilter === 'Pending') return [];
    return activities.filter(
      (a) => typeFilter === 'All' || a.activityType === typeFilter
    );
  }, [activities, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#EAF5ED] text-[#15803D] flex items-center justify-center shrink-0 mt-0.5">
          <CalendarClock className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#143624]">Upcoming Tasks</h1>
          <p className="text-sm text-[#425A4C] mt-1">
            All scheduled plant-care activities organized chronologically by date, activity type, and status.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#DDE7DF] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F2F7F3] rounded-lg overflow-x-auto">
          {(['All', 'Watering', 'Fertilizing', 'Pruning'] as TypeFilter[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                typeFilter === type
                  ? 'bg-white text-[#143624] shadow-sm'
                  : 'text-[#4C6556] hover:text-[#143624]'
              }`}
            >
              {type === 'All' ? 'All Types' : type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F2F7F3] rounded-lg overflow-x-auto">
          {(['All', 'Overdue', 'Pending', 'Completed'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === status
                  ? 'bg-white text-[#143624] shadow-sm'
                  : 'text-[#4C6556] hover:text-[#143624]'
              }`}
            >
              {status === 'All' ? 'All Statuses' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Scheduled Active Tasks */}
      {statusFilter !== 'Completed' && (
        <section className="bg-white border border-[#DDE7DF] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EDF2EE]">
            <h2 className="text-base font-semibold text-[#143624]">
              Scheduled & Overdue Tasks ({filteredActiveTasks.length})
            </h2>
          </div>

          {filteredActiveTasks.length === 0 ? (
            <div className="p-8 text-center">
              <Sprout className="w-8 h-8 text-[#15803D] mx-auto mb-2" />
              <p className="text-sm text-[#556E5E]">
                No tasks match the selected filters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EDF2EE]">
              {filteredActiveTasks.map((task) => {
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
                            className="text-sm font-semibold text-[#143624] hover:text-[#15803D] cursor-pointer"
                          >
                            {task.plant.name}
                          </button>
                          <span className="text-[#9AB0A2]" aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#244432]">
                            <TypeIcon type={task.activityType} />
                            {task.activityType}
                          </span>
                          <span className="text-[#9AB0A2]" aria-hidden="true">·</span>
                          <StatusLabel status={task.status} />
                        </div>
                        <div className="text-xs text-[#556E5E] mt-1 tabular-nums">
                          Due {formatHumanDate(task.dueDate)} · {getRelativeDueLabel(task.daysDelta)} · {task.scheduleLabel}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onCompleteTask(task.plant, task.activityType)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#15803D] text-white text-xs font-medium hover:bg-[#166534] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
      )}

      {/* Completed section when viewing All or Completed */}
      {(statusFilter === 'All' || statusFilter === 'Completed') && (
        <section className="bg-white border border-[#DDE7DF] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EDF2EE]">
            <h2 className="text-base font-semibold text-[#143624]">
              Completed Tasks ({filteredCompletedLogs.length})
            </h2>
          </div>

          {filteredCompletedLogs.length === 0 ? (
            <div className="p-6 text-xs text-[#556E5E]">
              No completed tasks match the current activity filter.
            </div>
          ) : (
            <div className="divide-y divide-[#EDF2EE]">
              {filteredCompletedLogs.map((log) => (
                <div
                  key={log.id}
                  className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#143624] flex-wrap">
                      <TypeIcon type={log.activityType} />
                      <span>{log.plantName}</span>
                      <span className="text-[#9AB0A2]" aria-hidden="true">·</span>
                      <span className="text-xs text-[#425A4C]">{log.activityType}</span>
                    </div>
                    <div className="text-xs text-[#556E5E] mt-0.5 tabular-nums">
                      Completed {formatHumanDate(log.completedDate)} · Next due {formatHumanDate(log.nextDueDate)}
                    </div>
                  </div>
                  <StatusLabel status="Completed" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
