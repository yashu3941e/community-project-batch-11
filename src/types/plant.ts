export type PlantType =
  | 'Flowering'
  | 'Succulent'
  | 'Indoor'
  | 'Herb'
  | 'Foliage'
  | 'Outdoor';

export type SunlightLevel =
  | 'Direct Sunlight'
  | 'Indirect Sunlight'
  | 'Shade';

export type ActivityType = 'Watering' | 'Fertilizing' | 'Pruning';

export type TaskStatus = 'Overdue' | 'Due Today' | 'Upcoming';

export type NavigationPage =
  | 'dashboard'
  | 'my-plants'
  | 'add-plant'
  | 'watering'
  | 'fertilizer'
  | 'pruning'
  | 'sunlight'
  | 'upcoming'
  | 'completed';

export type StorageMode = 'connecting' | 'firestore' | 'local-fallback';

export interface Plant {
  id: string;
  gardenId: string;
  name: string;
  plantType: PlantType;
  plantingDate: string; // YYYY-MM-DD
  wateringFrequencyDays: number;
  lastWateredDate: string; // YYYY-MM-DD
  nextWateringDate: string; // YYYY-MM-DD
  fertilizerFrequencyDays: number;
  lastFertilizedDate: string; // YYYY-MM-DD
  nextFertilizingDate: string; // YYYY-MM-DD
  pruningFrequencyDays: number;
  pruningScheduleLabel: string;
  lastPrunedDate: string; // YYYY-MM-DD
  nextPruningDate: string; // YYYY-MM-DD
  sunlightRequirement: SunlightLevel;
  sunlightNotes: string;
  imageUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlantFormInput {
  name: string;
  plantType: PlantType;
  plantingDate: string;
  wateringFrequencyDays: number;
  lastWateredDate: string;
  nextWateringDate?: string;
  fertilizerFrequencyDays: number;
  lastFertilizedDate: string;
  nextFertilizingDate?: string;
  pruningFrequencyDays: number;
  pruningScheduleLabel: string;
  lastPrunedDate: string;
  nextPruningDate?: string;
  sunlightRequirement: SunlightLevel;
  sunlightNotes: string;
  imageUrl: string;
  notes: string;
}

export interface ActivityLog {
  id: string;
  gardenId: string;
  plantId: string;
  plantName: string;
  plantType: PlantType;
  activityType: ActivityType;
  scheduledDate: string; // YYYY-MM-DD
  completedDate: string; // YYYY-MM-DD
  completedAt: string; // ISO timestamp
  nextDueDate: string; // YYYY-MM-DD
  notes: string;
}

export interface CareTask {
  taskKey: string;
  plant: Plant;
  activityType: ActivityType;
  dueDate: string; // YYYY-MM-DD
  lastDoneDate: string; // YYYY-MM-DD
  frequencyDays: number;
  scheduleLabel: string;
  status: TaskStatus;
  daysDelta: number; // negative = overdue days, 0 = due today, positive = days until due
}
