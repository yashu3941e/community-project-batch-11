import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Droplets,
  FlaskConical,
  Scissors,
  Search,
} from 'lucide-react';
import { ActivityLog, ActivityType } from '../types/plant';
import { formatHumanDate } from '../lib/dateUtils';
import { StatusLabel } from './StatusLabel';

interface CompletedActivitiesViewProps {
  activities: ActivityLog[];
}

type TypeFilter = 'All' | ActivityType;

function TypeIcon({ type }: { type: ActivityType }) {
  if (type === 'Watering') return <Droplets className="w-4 h-4 text-[#15803D] shrink-0" />;
  if (type === 'Fertilizing') return <FlaskConical className="w-4 h-4 text-[#1E4D35] shrink-0" />;
  return <Scissors className="w-4 h-4 text-[#2F5E43] shrink-0" />;
}

export function CompletedActivitiesView({
  activities,
}: CompletedActivitiesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');

  const counts = useMemo(
    () => ({
      total: activities.length,
      watering: activities.filter((a) => a.activityType === 'Watering').length,
      fertilizing: activities.filter((a) => a.activityType === 'Fertilizing').length,
      pruning: activities.filter((a) => a.activityType === 'Pruning').length,
    }),
    [activities]
  );

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return activities.filter((log) => {
      const matchesType =
        typeFilter === 'All' || log.activityType === typeFilter;
      const matchesQuery =
        !q ||
        log.plantName.toLowerCase().includes(q) ||
        log.activityType.toLowerCase().includes(q) ||
        log.notes.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [activities, searchTerm, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#EAF5ED] text-[#15803D] flex items-center justify-center shrink-0 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#143624]">Completed Activities</h1>
          <p className="text-sm text-[#425A4C] mt-1">
            Historical record of completed watering, fertilizing, and pruning actions with calculated next due dates.
          </p>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DDE7DF] rounded-xl p-4">
          <div className="text-xs font-medium text-[#556E5E]">Total Completed</div>
          <div className="text-2xl font-bold text-[#143624] tabular-nums mt-1">
            {counts.total}
          </div>
        </div>
        <div className="bg-white border border-[#DDE7DF] rounded-xl p-4">
          <div className="text-xs font-medium text-[#556E5E]">Watering Logged</div>
          <div className="text-2xl font-bold text-[#143624] tabular-nums mt-1">
            {counts.watering}
          </div>
        </div>
        <div className="bg-white border border-[#DDE7DF] rounded-xl p-4">
          <div className="text-xs font-medium text-[#556E5E]">Fertilizing Logged</div>
          <div className="text-2xl font-bold text-[#143624] tabular-nums mt-1">
            {counts.fertilizing}
          </div>
        </div>
        <div className="bg-white border border-[#DDE7DF] rounded-xl p-4">
          <div className="text-xs font-medium text-[#556E5E]">Pruning Logged</div>
          <div className="text-2xl font-bold text-[#143624] tabular-nums mt-1">
            {counts.pruning}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#DDE7DF] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#5C7766] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plant or notes..."
            aria-label="Search completed activities"
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#C9DBD0] text-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]/30"
          />
        </div>

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
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-[#DDE7DF] rounded-xl overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-9 h-9 text-[#15803D] mx-auto mb-2.5" />
            <h2 className="text-base font-semibold text-[#143624]">
              No completed activities recorded
            </h2>
            <p className="text-xs text-[#556E5E] mt-1">
              Mark any watering, fertilizer, or pruning reminder as completed to log it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EDF2EE] bg-[#F8FBF9] text-xs font-semibold text-[#425A4C]">
                  <th className="py-3.5 px-5">Plant</th>
                  <th className="py-3.5 px-5">Activity</th>
                  <th className="py-3.5 px-5">Completed Date</th>
                  <th className="py-3.5 px-5">Next Calculated Due</th>
                  <th className="py-3.5 px-5">Notes</th>
                  <th className="py-3.5 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2EE] text-sm">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAFDFB] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#143624] whitespace-nowrap">
                      {log.plantName}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#244432]">
                        <TypeIcon type={log.activityType} />
                        {log.activityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#425A4C] tabular-nums whitespace-nowrap">
                      {formatHumanDate(log.completedDate)}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#425A4C] tabular-nums whitespace-nowrap">
                      {formatHumanDate(log.nextDueDate)}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-[#556E5E] max-w-xs truncate">
                      {log.notes}
                    </td>
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <StatusLabel status="Completed" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
