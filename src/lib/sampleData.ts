import { ActivityLog, Plant, PlantType } from '../types/plant';
import { addDaysIso, getTodayIso } from './dateUtils';

export const BOTANICAL_IMAGE_PRESETS: Array<{
  label: string;
  plantType: PlantType;
  url: string;
}> = [
  {
    label: 'Garden Rose',
    plantType: 'Flowering',
    url: '/src/assets/images/plant_rose_1794928776278.jpg',
  },
  {
    label: 'Aloe Vera',
    plantType: 'Succulent',
    url: '/src/assets/images/plant_aloe_vera_1794928776388.jpg',
  },
  {
    label: 'Money Plant',
    plantType: 'Indoor',
    url: '/src/assets/images/plant_money_plant_1794928777019.jpg',
  },
  {
    label: 'Sweet Basil',
    plantType: 'Herb',
    url: '/src/assets/images/plant_herb_basil_1794928778454.jpg',
  },
  {
    label: 'Monstera Foliage',
    plantType: 'Foliage',
    url: '/src/assets/images/plant_foliage_monstera_1794928778378.jpg',
  },
];

export function getDefaultImageForType(plantType: PlantType): string {
  const match = BOTANICAL_IMAGE_PRESETS.find((p) => p.plantType === plantType);
  return match ? match.url : BOTANICAL_IMAGE_PRESETS[2].url;
}

export function createSamplePlants(gardenId: string): Plant[] {
  const today = getTodayIso();
  const nowIso = new Date().toISOString();

  return [
    {
      id: 'sample-rose',
      gardenId,
      name: 'Rose',
      plantType: 'Flowering',
      plantingDate: addDaysIso(today, -45),
      wateringFrequencyDays: 2,
      lastWateredDate: addDaysIso(today, -3),
      nextWateringDate: addDaysIso(today, -1), // 1 day overdue for realistic demo
      fertilizerFrequencyDays: 14,
      lastFertilizedDate: addDaysIso(today, -11),
      nextFertilizingDate: addDaysIso(today, 3),
      pruningFrequencyDays: 30,
      pruningScheduleLabel: 'Every 30 days · Deadhead spent blooms',
      lastPrunedDate: addDaysIso(today, -24),
      nextPruningDate: addDaysIso(today, 6),
      sunlightRequirement: 'Direct Sunlight',
      sunlightNotes: 'Needs 6+ hours of bright morning sunlight for healthy blooming.',
      imageUrl: '/src/assets/images/plant_rose_1794928776278.jpg',
      notes: 'Keep soil evenly moist at the root base and avoid wetting leaves late in the evening.',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'sample-aloe-vera',
      gardenId,
      name: 'Aloe Vera',
      plantType: 'Succulent',
      plantingDate: addDaysIso(today, -90),
      wateringFrequencyDays: 14,
      lastWateredDate: addDaysIso(today, -9),
      nextWateringDate: addDaysIso(today, 5),
      fertilizerFrequencyDays: 60,
      lastFertilizedDate: addDaysIso(today, -36),
      nextFertilizingDate: addDaysIso(today, 24),
      pruningFrequencyDays: 90,
      pruningScheduleLabel: 'Every 90 days · Trim dried outer leaves',
      lastPrunedDate: addDaysIso(today, -50),
      nextPruningDate: addDaysIso(today, 40),
      sunlightRequirement: 'Direct Sunlight',
      sunlightNotes: 'Thrives on a sunny south- or west-facing windowsill with warm light.',
      imageUrl: '/src/assets/images/plant_aloe_vera_1794928776388.jpg',
      notes: 'Allow topsoil to dry completely between deep waterings to prevent root rot.',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'sample-money-plant',
      gardenId,
      name: 'Money Plant',
      plantType: 'Indoor',
      plantingDate: addDaysIso(today, -60),
      wateringFrequencyDays: 5,
      lastWateredDate: addDaysIso(today, -5),
      nextWateringDate: today, // Due today
      fertilizerFrequencyDays: 30,
      lastFertilizedDate: addDaysIso(today, -20),
      nextFertilizingDate: addDaysIso(today, 10),
      pruningFrequencyDays: 45,
      pruningScheduleLabel: 'Every 45 days · Pinch trailing vine tips',
      lastPrunedDate: addDaysIso(today, -27),
      nextPruningDate: addDaysIso(today, 18),
      sunlightRequirement: 'Indirect Sunlight',
      sunlightNotes: 'Prefers bright filtered indoor light; avoid harsh midday sun.',
      imageUrl: '/src/assets/images/plant_money_plant_1794928777019.jpg',
      notes: 'Wipe dust from heart-shaped leaves monthly and trim long vines to encourage bushy growth.',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

export function createSampleActivities(gardenId: string): ActivityLog[] {
  const today = getTodayIso();
  const threeDaysAgo = addDaysIso(today, -3);
  const twentyDaysAgo = addDaysIso(today, -20);

  return [
    {
      id: 'sample-act-rose-water',
      gardenId,
      plantId: 'sample-rose',
      plantName: 'Rose',
      plantType: 'Flowering',
      activityType: 'Watering',
      scheduledDate: threeDaysAgo,
      completedDate: threeDaysAgo,
      completedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      nextDueDate: addDaysIso(threeDaysAgo, 2),
      notes: 'Watered base soil thoroughly in the morning.',
    },
    {
      id: 'sample-act-money-fert',
      gardenId,
      plantId: 'sample-money-plant',
      plantName: 'Money Plant',
      plantType: 'Indoor',
      activityType: 'Fertilizing',
      scheduledDate: twentyDaysAgo,
      completedDate: twentyDaysAgo,
      completedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      nextDueDate: addDaysIso(twentyDaysAgo, 30),
      notes: 'Applied diluted balanced liquid houseplant fertilizer.',
    },
  ];
}
