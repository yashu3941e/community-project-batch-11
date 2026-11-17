import {
  Check,
  Droplets,
  FlaskConical,
  Pencil,
  Scissors,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { ActivityLog, ActivityType, Plant } from '../types/plant';
import {
  formatHumanDate,
  getRelativeDueLabel,
  getTaskStatus,
} from '../lib/dateUtils';
import { PlantImage } from './PlantImage';
import { StatusLabel } from './StatusLabel';

interface PlantDetailModalProps {
  plant: Plant | null;
  activities: ActivityLog[];
  completingKey: string | null;
  onClose: () => void;
  onEdit: (plant: Plant) => void;
  onDelete: (plant: Plant) => void;
  onCompleteTask: (plant: Plant, activityType: ActivityType) => Promise<void>;
}

export function PlantDetailModal({
  plant,
  activities,
  completingKey,
  onClose,
  onEdit,
  onDelete,
  onCompleteTask,
}: PlantDetailModalProps) {
  if (!plant) return null;

  const plantLogs = activities.filter((a) => a.plantId === plant.id).slice(0, 6);

  const schedules: Array<{
    type: ActivityType;
    icon: typeof Droplets;
    frequencyLabel: string;
    lastDate: string;
    nextDate: string;
  }> = [
    {
      type: 'Watering',
      icon: Droplets,
      frequencyLabel: `Every ${plant.wateringFrequencyDays} days`,
      lastDate: plant.lastWateredDate,
      nextDate: plant.nextWateringDate,
    },
    {
      type: 'Fertilizing',
      icon: FlaskConical,
      frequencyLabel: `Every ${plant.fertilizerFrequencyDays} days`,
      lastDate: plant.lastFertilizedDate,
      nextDate: plant.nextFertilizingDate,
    },
    {
      type: 'Pruning',
      icon: Scissors,
      frequencyLabel: plant.pruningScheduleLabel,
      lastDate: plant.lastPrunedDate,
      nextDate: plant.nextPruningDate,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plant-detail-title"
    >
      <div className="bg-white border border-[#DDE7DF] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white px-6 py-4 border-b border-[#EDF2EE] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 id="plant-detail-title" className="text-xl font-bold text-[#143624] truncate">
              {plant.name}
            </h2>
            <p className="text-xs text-[#556E5E] mt-0.5 tabular-nums">
              {plant.plantType} plant · Planted {formatHumanDate(plant.plantingDate)}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(plant)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4E2D7] text-xs font-medium text-[#244432] hover:bg-[#F4F8F5] cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(plant)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#F2D5D5] text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close plant details"
              className="p-1.5 rounded-lg text-[#556E5E] hover:bg-[#F2F7F3] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overview Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            <div className="sm:col-span-5 aspect-[4/3] rounded-lg overflow-hidden border border-[#DDE7DF]">
              <PlantImage
                src={plant.imageUrl}
                alt={plant.name}
                className="w-full h-full"
              />
            </div>

            <div className="sm:col-span-7 space-y-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#143624]">
                  <Sun className="w-4 h-4 text-[#D97706]" />
                  <span>{plant.sunlightRequirement}</span>
                </div>
                <p className="text-sm text-[#425A4C] mt-1 leading-relaxed">
                  {plant.sunlightNotes || 'Follow standard light exposure guidelines for this plant category.'}
                </p>
              </div>

              {plant.notes && (
                <div className="pt-3 border-t border-[#EDF2EE]">
                  <div className="text-xs font-semibold text-[#2F5E43] mb-1">
                    Care Notes
                  </div>
                  <p className="text-sm text-[#425A4C] leading-relaxed">
                    {plant.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Care Schedules */}
          <div>
            <h3 className="text-sm font-semibold text-[#143624] mb-3">
              Active Care Schedules
            </h3>
            <div className="divide-y divide-[#EDF2EE] border border-[#DDE7DF] rounded-xl overflow-hidden">
              {schedules.map((item) => {
                const Icon = item.icon;
                const { status, daysDelta } = getTaskStatus(item.nextDate);
                const taskKey = `${plant.id}-${item.type}`;
                const isBusy = completingKey === taskKey;

                return (
                  <div
                    key={item.type}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Icon className="w-4 h-4 text-[#15803D]" />
                        <span className="text-sm font-semibold text-[#143624]">
                          {item.type}
                        </span>
                        <span className="text-[#9AB0A2]" aria-hidden="true">·</span>
                        <span className="text-xs text-[#556E5E]">{item.frequencyLabel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#556E5E] tabular-nums flex-wrap">
                        <span>Last done {formatHumanDate(item.lastDate)}</span>
                        <span aria-hidden="true">·</span>
                        <span>Next due {formatHumanDate(item.nextDate)} ({getRelativeDueLabel(daysDelta)})</span>
                        <span aria-hidden="true">·</span>
                        <StatusLabel status={status} />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onCompleteTask(plant, item.type)}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#15803D] text-white text-xs font-medium hover:bg-[#166534] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isBusy ? 'Updating...' : `Mark ${item.type} Done`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plant Activity History */}
          <div>
            <h3 className="text-sm font-semibold text-[#143624] mb-3">
              Recent Completed History for {plant.name}
            </h3>
            {plantLogs.length === 0 ? (
              <p className="text-xs text-[#556E5E] py-3 border-t border-[#EDF2EE]">
                No completed care entries logged yet for this plant.
              </p>
            ) : (
              <div className="divide-y divide-[#EDF2EE] border border-[#DDE7DF] rounded-xl overflow-hidden">
                {plantLogs.map((log) => (
                  <div
                    key={log.id}
                    className="px-4 py-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#143624]">
                        {log.activityType}
                      </span>
                      <span className="text-[#556E5E] ml-2">
                        {log.notes}
                      </span>
                    </div>
                    <span className="text-[#425A4C] tabular-nums whitespace-nowrap shrink-0">
                      {formatHumanDate(log.completedDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
