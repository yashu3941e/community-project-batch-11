import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  ActivityLog,
  ActivityType,
  Plant,
  PlantFormInput,
  PlantType,
  StorageMode,
  SunlightLevel,
} from '../types/plant';
import { addDaysIso, getTodayIso } from './dateUtils';
import {
  db,
  handleFirestoreError,
  isPermissionError,
  OperationType,
  testConnection,
} from './firebase';
import {
  createSampleActivities,
  createSamplePlants,
  getDefaultImageForType,
} from './sampleData';

export const GARDEN_ID = 'community-garden';
const LOCAL_PLANTS_KEY = 'plant_care_plants_v1';
const LOCAL_ACTIVITIES_KEY = 'plant_care_activities_v1';
const LOCAL_SEEDED_KEY = 'plant_care_seeded_v1';

const VALID_PLANT_TYPES: PlantType[] = [
  'Flowering',
  'Succulent',
  'Indoor',
  'Herb',
  'Foliage',
  'Outdoor',
];

const VALID_SUNLIGHT: SunlightLevel[] = [
  'Direct Sunlight',
  'Indirect Sunlight',
  'Shade',
];

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned || `item-${Date.now()}`;
}

export function generateSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return sanitizeId(`${prefix}-${Date.now()}-${rand}`);
}

function clampFreq(val: number): number {
  const n = Math.round(Number(val));
  if (!Number.isFinite(n) || n < 1) return 1;
  if (n > 365) return 365;
  return n;
}

function ensureIsoDate(val: string | undefined, fallback: string): string {
  if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  return fallback;
}

function sanitizePlantPayload(
  id: string,
  gardenId: string,
  input: PlantFormInput,
  createdAt: string,
  updatedAt: string
): Plant {
  const today = getTodayIso();
  const plantType: PlantType = VALID_PLANT_TYPES.includes(input.plantType)
    ? input.plantType
    : 'Indoor';
  const sunlightRequirement: SunlightLevel = VALID_SUNLIGHT.includes(input.sunlightRequirement)
    ? input.sunlightRequirement
    : 'Indirect Sunlight';

  const wateringFrequencyDays = clampFreq(input.wateringFrequencyDays);
  const fertilizerFrequencyDays = clampFreq(input.fertilizerFrequencyDays);
  const pruningFrequencyDays = clampFreq(input.pruningFrequencyDays);

  const plantingDate = ensureIsoDate(input.plantingDate, today);
  const lastWateredDate = ensureIsoDate(input.lastWateredDate, plantingDate);
  const nextWateringDate = ensureIsoDate(
    input.nextWateringDate,
    addDaysIso(lastWateredDate, wateringFrequencyDays)
  );
  const lastFertilizedDate = ensureIsoDate(input.lastFertilizedDate, plantingDate);
  const nextFertilizingDate = ensureIsoDate(
    input.nextFertilizingDate,
    addDaysIso(lastFertilizedDate, fertilizerFrequencyDays)
  );
  const lastPrunedDate = ensureIsoDate(input.lastPrunedDate, plantingDate);
  const nextPruningDate = ensureIsoDate(
    input.nextPruningDate,
    addDaysIso(lastPrunedDate, pruningFrequencyDays)
  );

  const pruningLabelRaw = input.pruningScheduleLabel.trim();
  const pruningScheduleLabel = (
    pruningLabelRaw || `Every ${pruningFrequencyDays} days`
  ).slice(0, 120);

  return {
    id: sanitizeId(id),
    gardenId: sanitizeId(gardenId),
    name: input.name.trim().slice(0, 100) || 'Unnamed Plant',
    plantType,
    plantingDate,
    wateringFrequencyDays,
    lastWateredDate,
    nextWateringDate,
    fertilizerFrequencyDays,
    lastFertilizedDate,
    nextFertilizingDate,
    pruningFrequencyDays,
    pruningScheduleLabel,
    lastPrunedDate,
    nextPruningDate,
    sunlightRequirement,
    sunlightNotes: input.sunlightNotes.trim().slice(0, 240),
    imageUrl: (input.imageUrl.trim() || getDefaultImageForType(plantType)).slice(0, 500),
    notes: input.notes.trim().slice(0, 500),
    createdAt: createdAt.slice(0, 64),
    updatedAt: updatedAt.slice(0, 64),
  };
}

// --- LocalStorage Fallback Helpers ---
function readLocalPlants(): Plant[] {
  try {
    const raw = localStorage.getItem(LOCAL_PLANTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalPlants(plants: Plant[]): void {
  localStorage.setItem(LOCAL_PLANTS_KEY, JSON.stringify(plants));
}

function readLocalActivities(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalActivities(activities: ActivityLog[]): void {
  localStorage.setItem(LOCAL_ACTIVITIES_KEY, JSON.stringify(activities));
}

function ensureLocalSeeded(): { plants: Plant[]; activities: ActivityLog[] } {
  const alreadySeeded = localStorage.getItem(LOCAL_SEEDED_KEY) === 'true';
  if (!alreadySeeded) {
    const plants = createSamplePlants(GARDEN_ID);
    const activities = createSampleActivities(GARDEN_ID);
    writeLocalPlants(plants);
    writeLocalActivities(activities);
    localStorage.setItem(LOCAL_SEEDED_KEY, 'true');
    return { plants, activities };
  }
  return {
    plants: readLocalPlants(),
    activities: readLocalActivities(),
  };
}

// --- Firestore Seeding & Subscriptions ---
export async function initializeDataConnection(callbacks: {
  onPlants: (plants: Plant[]) => void;
  onActivities: (activities: ActivityLog[]) => void;
  onModeChange: (mode: StorageMode) => void;
  onError: (err: Error) => void;
}): Promise<() => void> {
  const connected = await testConnection();
  if (!connected) {
    const local = ensureLocalSeeded();
    callbacks.onModeChange('local-fallback');
    callbacks.onPlants(local.plants);
    callbacks.onActivities(local.activities);
    return () => {};
  }

  const gardenRef = doc(db, 'gardens', GARDEN_ID);
  const gardenPath = `gardens/${GARDEN_ID}`;

  try {
    const gardenSnap = await getDoc(gardenRef);
    if (!gardenSnap.exists()) {
      const nowIso = new Date().toISOString();
      await setDoc(gardenRef, {
        id: GARDEN_ID,
        name: 'Community Engineering Plant Care Garden',
        seeded: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const batch = writeBatch(db);
      const samplePlants = createSamplePlants(GARDEN_ID);
      for (const p of samplePlants) {
        batch.set(doc(db, 'gardens', GARDEN_ID, 'plants', p.id), p);
      }

      const sampleActivities = createSampleActivities(GARDEN_ID);
      for (const act of sampleActivities) {
        batch.set(doc(db, 'gardens', GARDEN_ID, 'activities', act.id), act);
      }

      await batch.commit();
    }
  } catch (error) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.WRITE, gardenPath);
    }
    const local = ensureLocalSeeded();
    callbacks.onModeChange('local-fallback');
    callbacks.onPlants(local.plants);
    callbacks.onActivities(local.activities);
    return () => {};
  }

  callbacks.onModeChange('firestore');

  const plantsPath = `gardens/${GARDEN_ID}/plants`;
  const plantsQuery = query(
    collection(db, 'gardens', GARDEN_ID, 'plants'),
    where('gardenId', '==', GARDEN_ID)
  );

  const unsubPlants = onSnapshot(
    plantsQuery,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as Plant);
      list.sort((a, b) => a.name.localeCompare(b.name));
      writeLocalPlants(list);
      localStorage.setItem(LOCAL_SEEDED_KEY, 'true');
      callbacks.onPlants(list);
    },
    (error) => {
      if (isPermissionError(error)) {
        try {
          handleFirestoreError(error, OperationType.LIST, plantsPath);
        } catch (err) {
          callbacks.onError(err as Error);
        }
      } else {
        callbacks.onModeChange('local-fallback');
        callbacks.onPlants(ensureLocalSeeded().plants);
      }
    }
  );

  const activitiesPath = `gardens/${GARDEN_ID}/activities`;
  const activitiesQuery = query(
    collection(db, 'gardens', GARDEN_ID, 'activities'),
    where('gardenId', '==', GARDEN_ID)
  );

  const unsubActivities = onSnapshot(
    activitiesQuery,
    (snapshot) => {
      const list = snapshot.docs.map((d) => d.data() as ActivityLog);
      list.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
      writeLocalActivities(list);
      callbacks.onActivities(list);
    },
    (error) => {
      if (isPermissionError(error)) {
        try {
          handleFirestoreError(error, OperationType.LIST, activitiesPath);
        } catch (err) {
          callbacks.onError(err as Error);
        }
      } else {
        callbacks.onModeChange('local-fallback');
        callbacks.onActivities(ensureLocalSeeded().activities);
      }
    }
  );

  return () => {
    unsubPlants();
    unsubActivities();
  };
}

// --- CRUD Operations ---
export async function createPlantRecord(
  input: PlantFormInput,
  mode: StorageMode
): Promise<Plant> {
  const id = generateSafeId('plant');
  const nowIso = new Date().toISOString();
  const payload = sanitizePlantPayload(id, GARDEN_ID, input, nowIso, nowIso);

  if (mode === 'local-fallback') {
    const existing = readLocalPlants();
    writeLocalPlants([...existing, payload]);
    return payload;
  }

  const path = `gardens/${GARDEN_ID}/plants/${id}`;
  try {
    await setDoc(doc(db, 'gardens', GARDEN_ID, 'plants', id), payload);
    return payload;
  } catch (error) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    const existing = readLocalPlants();
    writeLocalPlants([...existing, payload]);
    return payload;
  }
}

export async function updatePlantRecord(
  existingPlant: Plant,
  input: PlantFormInput,
  mode: StorageMode
): Promise<Plant> {
  const nowIso = new Date().toISOString();
  const payload = sanitizePlantPayload(
    existingPlant.id,
    existingPlant.gardenId,
    input,
    existingPlant.createdAt,
    nowIso
  );

  if (mode === 'local-fallback') {
    const list = readLocalPlants().map((p) => (p.id === payload.id ? payload : p));
    writeLocalPlants(list);
    return payload;
  }

  const path = `gardens/${GARDEN_ID}/plants/${existingPlant.id}`;
  try {
    await updateDoc(doc(db, 'gardens', GARDEN_ID, 'plants', existingPlant.id), {
      name: payload.name,
      plantType: payload.plantType,
      plantingDate: payload.plantingDate,
      wateringFrequencyDays: payload.wateringFrequencyDays,
      lastWateredDate: payload.lastWateredDate,
      nextWateringDate: payload.nextWateringDate,
      fertilizerFrequencyDays: payload.fertilizerFrequencyDays,
      lastFertilizedDate: payload.lastFertilizedDate,
      nextFertilizingDate: payload.nextFertilizingDate,
      pruningFrequencyDays: payload.pruningFrequencyDays,
      pruningScheduleLabel: payload.pruningScheduleLabel,
      lastPrunedDate: payload.lastPrunedDate,
      nextPruningDate: payload.nextPruningDate,
      sunlightRequirement: payload.sunlightRequirement,
      sunlightNotes: payload.sunlightNotes,
      imageUrl: payload.imageUrl,
      notes: payload.notes,
      updatedAt: payload.updatedAt,
    });
    return payload;
  } catch (error) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    const list = readLocalPlants().map((p) => (p.id === payload.id ? payload : p));
    writeLocalPlants(list);
    return payload;
  }
}

export async function deletePlantRecord(plantId: string, mode: StorageMode): Promise<void> {
  if (mode === 'local-fallback') {
    writeLocalPlants(readLocalPlants().filter((p) => p.id !== plantId));
    return;
  }

  const path = `gardens/${GARDEN_ID}/plants/${plantId}`;
  try {
    await deleteDoc(doc(db, 'gardens', GARDEN_ID, 'plants', plantId));
  } catch (error) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
    writeLocalPlants(readLocalPlants().filter((p) => p.id !== plantId));
  }
}

export async function completeCareTaskRecord(
  plant: Plant,
  activityType: ActivityType,
  mode: StorageMode,
  note?: string
): Promise<{ updatedPlant: Plant; activityLog: ActivityLog }> {
  const today = getTodayIso();
  const nowIso = new Date().toISOString();

  let scheduledDate = plant.nextWateringDate;
  let nextDueDate = addDaysIso(today, plant.wateringFrequencyDays);

  const patch: Partial<Plant> = { updatedAt: nowIso };
  if (activityType === 'Watering') {
    scheduledDate = plant.nextWateringDate;
    nextDueDate = addDaysIso(today, plant.wateringFrequencyDays);
    patch.lastWateredDate = today;
    patch.nextWateringDate = nextDueDate;
  } else if (activityType === 'Fertilizing') {
    scheduledDate = plant.nextFertilizingDate;
    nextDueDate = addDaysIso(today, plant.fertilizerFrequencyDays);
    patch.lastFertilizedDate = today;
    patch.nextFertilizingDate = nextDueDate;
  } else {
    scheduledDate = plant.nextPruningDate;
    nextDueDate = addDaysIso(today, plant.pruningFrequencyDays);
    patch.lastPrunedDate = today;
    patch.nextPruningDate = nextDueDate;
  }

  const updatedPlant: Plant = { ...plant, ...patch };
  const activityId = generateSafeId('act');
  const activityLog: ActivityLog = {
    id: activityId,
    gardenId: GARDEN_ID,
    plantId: plant.id,
    plantName: plant.name,
    plantType: plant.plantType,
    activityType,
    scheduledDate,
    completedDate: today,
    completedAt: nowIso,
    nextDueDate,
    notes: (note?.trim() || `${activityType} completed on schedule.`).slice(0, 300),
  };

  if (mode === 'local-fallback') {
    writeLocalPlants(readLocalPlants().map((p) => (p.id === plant.id ? updatedPlant : p)));
    writeLocalActivities([activityLog, ...readLocalActivities()]);
    return { updatedPlant, activityLog };
  }

  const plantPath = `gardens/${GARDEN_ID}/plants/${plant.id}`;
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'gardens', GARDEN_ID, 'plants', plant.id), patch);
    batch.set(doc(db, 'gardens', GARDEN_ID, 'activities', activityId), activityLog);
    await batch.commit();
    return { updatedPlant, activityLog };
  } catch (error) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.WRITE, plantPath);
    }
    writeLocalPlants(readLocalPlants().map((p) => (p.id === plant.id ? updatedPlant : p)));
    writeLocalActivities([activityLog, ...readLocalActivities()]);
    return { updatedPlant, activityLog };
  }
}

export async function rescheduleCareTaskRecord(
  plant: Plant,
  activityType: ActivityType,
  newDueDate: string,
  newFrequencyDays: number | undefined,
  mode: StorageMode
): Promise<Plant> {
  const nowIso = new Date().toISOString();
  const safeDate = ensureIsoDate(newDueDate, getTodayIso());
  const patch: Partial<Plant> = { updatedAt: nowIso };

  if (activityType === 'Watering') {
    patch.nextWateringDate = safeDate;
    if (newFrequencyDays !== undefined) {
      patch.wateringFrequencyDays = clampFreq(newFrequencyDays);
    }
  } else if (activityType === 'Fertilizing') {
    patch.nextFertilizingDate = safeDate;
    if (newFrequencyDays !== undefined) {
      patch.fertilizerFrequencyDays = clampFreq(newFrequencyDays);
    }
  } else {
    patch.nextPruningDate = safeDate;
    if (newFrequencyDays !== undefined) {
      patch.pruningFrequencyDays = clampFreq(newFrequencyDays);
    }
  }

  const updatedPlant: Plant = { ...plant, ...patch };

  if (mode === 'local-fallback') {
    writeLocalPlants(readLocalPlants().map((p) => (p.id === plant.id ? updatedPlant : p)));
    return updatedPlant;
  }

  const path = `gardens/${GARDEN_ID}/plants/${plant.id}`;
  try {
    await updateDoc(doc(db, 'gardens', GARDEN_ID, 'plants', plant.id), patch);
    return updatedPlant;
  } catch (error) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    writeLocalPlants(readLocalPlants().map((p) => (p.id === plant.id ? updatedPlant : p)));
    return updatedPlant;
  }
}

export async function updatePlantSunlightRecord(
  plant: Plant,
  sunlightRequirement: SunlightLevel,
  mode: StorageMode
): Promise<Plant> {
  const nowIso = new Date().toISOString();
  const updatedPlant: Plant = { ...plant, sunlightRequirement, updatedAt: nowIso };

  if (mode === 'local-fallback') {
    writeLocalPlants(readLocalPlants().map((p) => (p.id === plant.id ? updatedPlant : p)));
    return updatedPlant;
  }

  const path = `gardens/${GARDEN_ID}/plants/${plant.id}`;
  try {
    await updateDoc(doc(db, 'gardens', GARDEN_ID, 'plants', plant.id), {
      sunlightRequirement,
      updatedAt: nowIso,
    });
    return updatedPlant;
  } catch (error) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    writeLocalPlants(readLocalPlants().map((p) => (p.id === plant.id ? updatedPlant : p)));
    return updatedPlant;
  }
}

export async function resetDemoWorkspaceRecord(
  currentPlants: Plant[],
  currentActivities: ActivityLog[],
  mode: StorageMode
): Promise<{ plants: Plant[]; activities: ActivityLog[] }> {
  const samplePlants = createSamplePlants(GARDEN_ID);
  const sampleActivities = createSampleActivities(GARDEN_ID);

  if (mode === 'local-fallback') {
    writeLocalPlants(samplePlants);
    writeLocalActivities(sampleActivities);
    localStorage.setItem(LOCAL_SEEDED_KEY, 'true');
    return { plants: samplePlants, activities: sampleActivities };
  }

  try {
    const batch = writeBatch(db);
    for (const p of currentPlants) {
      batch.delete(doc(db, 'gardens', GARDEN_ID, 'plants', p.id));
    }
    for (const a of currentActivities) {
      batch.delete(doc(db, 'gardens', GARDEN_ID, 'activities', a.id));
    }
    for (const p of samplePlants) {
      batch.set(doc(db, 'gardens', GARDEN_ID, 'plants', p.id), p);
    }
    for (const a of sampleActivities) {
      batch.set(doc(db, 'gardens', GARDEN_ID, 'activities', a.id), a);
    }
    await batch.commit();
    return { plants: samplePlants, activities: sampleActivities };
  } catch (error) {
    if (isPermissionError(error)) {
      handleFirestoreError(error, OperationType.WRITE, `gardens/${GARDEN_ID}`);
    }
    writeLocalPlants(samplePlants);
    writeLocalActivities(sampleActivities);
    return { plants: samplePlants, activities: sampleActivities };
  }
}
