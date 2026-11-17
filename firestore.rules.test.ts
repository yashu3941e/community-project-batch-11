/**
 * Security Rules Payload Verification Suite (Phase 0 TDD)
 * Mirrors the exact invariants enforced in firestore.rules and firebase-blueprint.json.
 */

const VALID_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const PLANT_TYPES = new Set(['Flowering', 'Succulent', 'Indoor', 'Herb', 'Foliage', 'Outdoor']);
const SUNLIGHT_LEVELS = new Set(['Direct Sunlight', 'Indirect Sunlight', 'Shade']);

const PLANT_REQUIRED_KEYS = [
  'id',
  'gardenId',
  'name',
  'plantType',
  'plantingDate',
  'wateringFrequencyDays',
  'lastWateredDate',
  'nextWateringDate',
  'fertilizerFrequencyDays',
  'lastFertilizedDate',
  'nextFertilizingDate',
  'pruningFrequencyDays',
  'pruningScheduleLabel',
  'lastPrunedDate',
  'nextPruningDate',
  'sunlightRequirement',
  'sunlightNotes',
  'imageUrl',
  'notes',
  'createdAt',
  'updatedAt',
];

export function validatePlantRuleContract(
  data: Record<string, unknown>,
  gardenId: string,
  plantId: string
): boolean {
  if (!VALID_ID_RE.test(gardenId) || !VALID_ID_RE.test(plantId)) return false;
  const keys = Object.keys(data);
  if (keys.length !== PLANT_REQUIRED_KEYS.length) return false;
  if (!PLANT_REQUIRED_KEYS.every((k) => keys.includes(k))) return false;
  if (data.id !== plantId || data.gardenId !== gardenId) return false;
  if (typeof data.name !== 'string' || data.name.length < 1 || data.name.length > 100) return false;
  if (typeof data.plantType !== 'string' || !PLANT_TYPES.has(data.plantType)) return false;
  if (typeof data.sunlightRequirement !== 'string' || !SUNLIGHT_LEVELS.has(data.sunlightRequirement)) return false;

  const dateFields = [
    'plantingDate',
    'lastWateredDate',
    'nextWateringDate',
    'lastFertilizedDate',
    'nextFertilizingDate',
    'lastPrunedDate',
    'nextPruningDate',
  ];
  for (const field of dateFields) {
    const val = data[field];
    if (typeof val !== 'string' || !ISO_DATE_RE.test(val)) return false;
  }

  const freqFields = ['wateringFrequencyDays', 'fertilizerFrequencyDays', 'pruningFrequencyDays'];
  for (const field of freqFields) {
    const val = data[field];
    if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 365) return false;
  }

  if (typeof data.pruningScheduleLabel !== 'string' || data.pruningScheduleLabel.length < 1 || data.pruningScheduleLabel.length > 120) return false;
  if (typeof data.sunlightNotes !== 'string' || data.sunlightNotes.length > 240) return false;
  if (typeof data.imageUrl !== 'string' || data.imageUrl.length > 500) return false;
  if (typeof data.notes !== 'string' || data.notes.length > 500) return false;
  if (typeof data.createdAt !== 'string' || data.createdAt.length < 10 || data.createdAt.length > 64) return false;
  if (typeof data.updatedAt !== 'string' || data.updatedAt.length < 10 || data.updatedAt.length > 64) return false;

  return true;
}

export const dirtyDozenPayloads: Array<{ name: string; gardenId: string; plantId: string; payload: Record<string, unknown> }> = [
  {
    name: '1. Path ID Poisoning',
    gardenId: 'bad$garden',
    plantId: 'plant-1',
    payload: { id: 'plant-1', gardenId: 'bad$garden' },
  },
  {
    name: '2. Shadow Field Injection',
    gardenId: 'community-garden',
    plantId: 'plant-1',
    payload: {
      id: 'plant-1',
      gardenId: 'community-garden',
      name: 'Rose',
      plantType: 'Flowering',
      plantingDate: '2026-10-01',
      wateringFrequencyDays: 2,
      lastWateredDate: '2026-11-15',
      nextWateringDate: '2026-11-17',
      fertilizerFrequencyDays: 14,
      lastFertilizedDate: '2026-11-05',
      nextFertilizingDate: '2026-11-19',
      pruningFrequencyDays: 30,
      pruningScheduleLabel: 'Every 30 days',
      lastPrunedDate: '2026-10-20',
      nextPruningDate: '2026-11-19',
      sunlightRequirement: 'Direct Sunlight',
      sunlightNotes: 'Full sun',
      imageUrl: '/src/assets/images/plant_rose.jpg',
      notes: 'Healthy',
      createdAt: '2026-11-17T00:00:00.000Z',
      updatedAt: '2026-11-17T00:00:00.000Z',
      isAdmin: true,
    },
  },
  {
    name: '3. Invalid Frequency Zero',
    gardenId: 'community-garden',
    plantId: 'plant-1',
    payload: {
      id: 'plant-1',
      gardenId: 'community-garden',
      name: 'Rose',
      plantType: 'Flowering',
      plantingDate: '2026-10-01',
      wateringFrequencyDays: 0,
      lastWateredDate: '2026-11-15',
      nextWateringDate: '2026-11-17',
      fertilizerFrequencyDays: 14,
      lastFertilizedDate: '2026-11-05',
      nextFertilizingDate: '2026-11-19',
      pruningFrequencyDays: 30,
      pruningScheduleLabel: 'Every 30 days',
      lastPrunedDate: '2026-10-20',
      nextPruningDate: '2026-11-19',
      sunlightRequirement: 'Direct Sunlight',
      sunlightNotes: '',
      imageUrl: '',
      notes: '',
      createdAt: '2026-11-17T00:00:00.000Z',
      updatedAt: '2026-11-17T00:00:00.000Z',
    },
  },
];
