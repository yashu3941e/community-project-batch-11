import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { TaskStatus } from '../types/plant';

interface StatusLabelProps {
  status: TaskStatus | 'Completed';
}

export function StatusLabel({ status }: StatusLabelProps) {
  if (status === 'Overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C] whitespace-nowrap shrink-0">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Overdue</span>
      </span>
    );
  }
  if (status === 'Due Today') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309] whitespace-nowrap shrink-0">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>Due Today</span>
      </span>
    );
  }
  if (status === 'Completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] whitespace-nowrap shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Completed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2F5E43] whitespace-nowrap shrink-0">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>Pending</span>
    </span>
  );
}
