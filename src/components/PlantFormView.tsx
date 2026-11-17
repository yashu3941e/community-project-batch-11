import React, { useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Droplets, FlaskConical, Save, Scissors, Sun } from 'lucide-react';
import {
  Plant,
  PlantFormInput,
  PlantType,
  SunlightLevel,
} from '../types/plant';
import { addDaysIso, formatHumanDate, getTodayIso } from '../lib/dateUtils';
import {
  BOTANICAL_IMAGE_PRESETS,
  getDefaultImageForType,
} from '../lib/sampleData';
import { PlantImage } from './PlantImage';

interface PlantFormViewProps {
  editingPlant: Plant | null;
  onSave: (input: PlantFormInput, existingPlant: Plant | null) => Promise<void>;
  onCancel: () => void;
}

const PLANT_TYPES: PlantType[] = [
  'Flowering',
  'Succulent',
  'Indoor',
  'Herb',
  'Foliage',
  'Outdoor',
];

const SUNLIGHT_OPTIONS: Array<{
  value: SunlightLevel;
  hint: string;
}> = [
  {
    value: 'Direct Sunlight',
    hint: '6+ hours of unfiltered sun (balcony, south window)',
  },
  {
    value: 'Indirect Sunlight',
    hint: 'Bright filtered indoor light without harsh midday glare',
  },
  {
    value: 'Shade',
    hint: 'Low light corners, shaded patios, north-facing rooms',
  },
];

export function PlantFormView({
  editingPlant,
  onSave,
  onCancel,
}: PlantFormViewProps) {
  const today = getTodayIso();

  const [name, setName] = useState(editingPlant?.name ?? '');
  const [plantType, setPlantType] = useState<PlantType>(
    editingPlant?.plantType ?? 'Indoor'
  );
  const [plantingDate, setPlantingDate] = useState(
    editingPlant?.plantingDate ?? today
  );

  const [wateringFrequencyDays, setWateringFrequencyDays] = useState<number>(
    editingPlant?.wateringFrequencyDays ?? 3
  );
  const [lastWateredDate, setLastWateredDate] = useState(
    editingPlant?.lastWateredDate ?? today
  );

  const [fertilizerFrequencyDays, setFertilizerFrequencyDays] = useState<number>(
    editingPlant?.fertilizerFrequencyDays ?? 30
  );
  const [lastFertilizedDate, setLastFertilizedDate] = useState(
    editingPlant?.lastFertilizedDate ?? today
  );

  const [pruningFrequencyDays, setPruningFrequencyDays] = useState<number>(
    editingPlant?.pruningFrequencyDays ?? 45
  );
  const [pruningScheduleLabel, setPruningScheduleLabel] = useState(
    editingPlant?.pruningScheduleLabel ?? 'Every 45 days · Trim dry leaves & stems'
  );
  const [lastPrunedDate, setLastPrunedDate] = useState(
    editingPlant?.lastPrunedDate ?? today
  );

  const [sunlightRequirement, setSunlightRequirement] = useState<SunlightLevel>(
    editingPlant?.sunlightRequirement ?? 'Indirect Sunlight'
  );
  const [sunlightNotes, setSunlightNotes] = useState(
    editingPlant?.sunlightNotes ??
      'Place near a bright east-facing window with filtered morning sun.'
  );

  const [imageUrl, setImageUrl] = useState(
    editingPlant?.imageUrl ?? getDefaultImageForType('Indoor')
  );
  const [customImageTouched, setCustomImageTouched] = useState(
    Boolean(editingPlant)
  );
  const [notes, setNotes] = useState(editingPlant?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const calculatedNextWatering = useMemo(
    () => addDaysIso(lastWateredDate, Math.max(1, wateringFrequencyDays)),
    [lastWateredDate, wateringFrequencyDays]
  );
  const calculatedNextFertilizer = useMemo(
    () => addDaysIso(lastFertilizedDate, Math.max(1, fertilizerFrequencyDays)),
    [lastFertilizedDate, fertilizerFrequencyDays]
  );
  const calculatedNextPruning = useMemo(
    () => addDaysIso(lastPrunedDate, Math.max(1, pruningFrequencyDays)),
    [lastPrunedDate, pruningFrequencyDays]
  );

  const handleTypeChange = (nextType: PlantType) => {
    setPlantType(nextType);
    if (!customImageTouched) {
      setImageUrl(getDefaultImageForType(nextType));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a plant name before saving.');
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          plantType,
          plantingDate,
          wateringFrequencyDays: Math.max(1, Math.min(365, Number(wateringFrequencyDays) || 1)),
          lastWateredDate,
          nextWateringDate: calculatedNextWatering,
          fertilizerFrequencyDays: Math.max(1, Math.min(365, Number(fertilizerFrequencyDays) || 14)),
          lastFertilizedDate,
          nextFertilizingDate: calculatedNextFertilizer,
          pruningFrequencyDays: Math.max(1, Math.min(365, Number(pruningFrequencyDays) || 30)),
          pruningScheduleLabel:
            pruningScheduleLabel.trim() || `Every ${pruningFrequencyDays} days`,
          lastPrunedDate,
          nextPruningDate: calculatedNextPruning,
          sunlightRequirement,
          sunlightNotes: sunlightNotes.trim(),
          imageUrl: imageUrl.trim() || getDefaultImageForType(plantType),
          notes: notes.trim(),
        },
        editingPlant
      );
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save plant right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2F5E43] hover:text-[#143624] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-[#143624]">
            {editingPlant ? `Edit ${editingPlant.name}` : 'Add New Plant'}
          </h1>
          <p className="text-sm text-[#425A4C] mt-1">
            Configure plant details, care frequencies, and sunlight requirements to generate automated reminders.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#DDE7DF] rounded-xl p-6 sm:p-8 space-y-8"
      >
        {formError && (
          <div className="p-3.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#B91C1C]">
            {formError}
          </div>
        )}

        {/* Section 1: Identity & Photo */}
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-[#143624] pb-2 border-b border-[#EDF2EE]">
            01. Plant Profile
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label
                  htmlFor="plant-name"
                  className="block text-sm font-medium text-[#244432] mb-1.5"
                >
                  Plant Name
                </label>
                <input
                  id="plant-name"
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Jasmine, Snake Plant, Peace Lily"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm text-[#14281D] focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="plant-type"
                    className="block text-sm font-medium text-[#244432] mb-1.5"
                  >
                    Plant Type
                  </label>
                  <select
                    id="plant-type"
                    value={plantType}
                    onChange={(e) => handleTypeChange(e.target.value as PlantType)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm text-[#14281D] bg-white focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
                  >
                    {PLANT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t} plant
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="planting-date"
                    className="block text-sm font-medium text-[#244432] mb-1.5"
                  >
                    Planting Date
                  </label>
                  <input
                    id="planting-date"
                    type="date"
                    required
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm text-[#14281D] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
                  />
                </div>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-[#244432] mb-1.5">
                Preview Photo
              </span>
              <PlantImage
                src={imageUrl}
                alt={name || `${plantType} plant`}
                className="w-full aspect-[4/3] rounded-lg border border-[#DDE7DF]"
              />
            </div>
          </div>

          {/* Preset Photo Selector */}
          <div>
            <span className="block text-xs font-medium text-[#425A4C] mb-2">
              Choose a botanical studio photo or paste an image URL
            </span>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {BOTANICAL_IMAGE_PRESETS.map((preset) => {
                const selected = imageUrl === preset.url;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setImageUrl(preset.url);
                      setCustomImageTouched(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                      selected
                        ? 'bg-[#EAF5ED] border-[#15803D] text-[#14532D]'
                        : 'bg-white border-[#D4E2D7] text-[#395343] hover:bg-[#F4F8F5]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              maxLength={500}
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setCustomImageTouched(true);
              }}
              aria-label="Custom plant image URL"
              placeholder="/src/assets/images/... or https://..."
              className="w-full px-3.5 py-2 rounded-lg border border-[#C9DBD0] text-xs font-mono text-[#425A4C] focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
            />
          </div>
        </div>

        {/* Section 2: Care Frequencies & Schedules */}
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-[#143624] pb-2 border-b border-[#EDF2EE]">
            02. Care Frequencies & Schedules
          </h2>

          {/* Watering */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            <div>
              <label
                htmlFor="watering-freq"
                className="flex items-center gap-1.5 text-sm font-medium text-[#244432] mb-1.5"
              >
                <Droplets className="w-4 h-4 text-[#15803D]" />
                Watering Frequency (days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="watering-freq"
                  type="number"
                  min={1}
                  max={365}
                  required
                  value={wateringFrequencyDays}
                  onChange={(e) => setWateringFrequencyDays(Number(e.target.value))}
                  className="w-28 px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[2, 3, 5, 7, 14].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setWateringFrequencyDays(d)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        wateringFrequencyDays === d
                          ? 'bg-[#15803D] border-[#15803D] text-white'
                          : 'bg-white border-[#D4E2D7] text-[#395343] hover:bg-[#F4F8F5]'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="last-watered"
                className="block text-sm font-medium text-[#244432] mb-1.5"
              >
                Last Watered Date
              </label>
              <input
                id="last-watered"
                type="date"
                required
                value={lastWateredDate}
                onChange={(e) => setLastWateredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
              />
            </div>
          </div>

          {/* Fertilizing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-[#F0F5F1]">
            <div>
              <label
                htmlFor="fertilizer-freq"
                className="flex items-center gap-1.5 text-sm font-medium text-[#244432] mb-1.5"
              >
                <FlaskConical className="w-4 h-4 text-[#1E4D35]" />
                Fertilizer Frequency (days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="fertilizer-freq"
                  type="number"
                  min={1}
                  max={365}
                  required
                  value={fertilizerFrequencyDays}
                  onChange={(e) => setFertilizerFrequencyDays(Number(e.target.value))}
                  className="w-28 px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[14, 30, 45, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFertilizerFrequencyDays(d)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                        fertilizerFrequencyDays === d
                          ? 'bg-[#15803D] border-[#15803D] text-white'
                          : 'bg-white border-[#D4E2D7] text-[#395343] hover:bg-[#F4F8F5]'
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="last-fertilized"
                className="block text-sm font-medium text-[#244432] mb-1.5"
              >
                Last Fertilized Date
              </label>
              <input
                id="last-fertilized"
                type="date"
                required
                value={lastFertilizedDate}
                onChange={(e) => setLastFertilizedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
              />
            </div>
          </div>

          {/* Pruning */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-[#F0F5F1]">
            <div>
              <label
                htmlFor="pruning-freq"
                className="flex items-center gap-1.5 text-sm font-medium text-[#244432] mb-1.5"
              >
                <Scissors className="w-4 h-4 text-[#2F5E43]" />
                Pruning Interval (days)
              </label>
              <input
                id="pruning-freq"
                type="number"
                min={1}
                max={365}
                required
                value={pruningFrequencyDays}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPruningFrequencyDays(val);
                  if (!editingPlant) {
                    setPruningScheduleLabel(`Every ${val || 30} days · Light maintenance trim`);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
              />
            </div>

            <div>
              <label
                htmlFor="pruning-label"
                className="block text-sm font-medium text-[#244432] mb-1.5"
              >
                Pruning Schedule Note
              </label>
              <input
                id="pruning-label"
                type="text"
                required
                maxLength={120}
                value={pruningScheduleLabel}
                onChange={(e) => setPruningScheduleLabel(e.target.value)}
                placeholder="e.g., Every 30 days · Deadhead blooms"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
              />
            </div>

            <div>
              <label
                htmlFor="last-pruned"
                className="block text-sm font-medium text-[#244432] mb-1.5"
              >
                Last Pruned Date
              </label>
              <input
                id="last-pruned"
                type="date"
                required
                value={lastPrunedDate}
                onChange={(e) => setLastPrunedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Sunlight & Notes */}
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-[#143624] pb-2 border-b border-[#EDF2EE]">
            03. Sunlight Requirement & Care Notes
          </h2>

          <div>
            <span className="flex items-center gap-1.5 text-sm font-medium text-[#244432] mb-2.5">
              <Sun className="w-4 h-4 text-[#D97706]" />
              Sunlight Requirement
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SUNLIGHT_OPTIONS.map((opt) => {
                const selected = sunlightRequirement === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSunlightRequirement(opt.value)}
                    className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#EAF5ED] border-[#15803D] text-[#143624]'
                        : 'bg-white border-[#D4E2D7] text-[#395343] hover:bg-[#F7FAF8]'
                    }`}
                  >
                    <div className="text-sm font-semibold">{opt.value}</div>
                    <div className="text-xs text-[#556E5E] mt-1 leading-snug">
                      {opt.hint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="sunlight-notes"
                className="block text-sm font-medium text-[#244432] mb-1.5"
              >
                Placement Tip (optional)
              </label>
              <input
                id="sunlight-notes"
                type="text"
                maxLength={240}
                value={sunlightNotes}
                onChange={(e) => setSunlightNotes(e.target.value)}
                placeholder="e.g., East window sill, 4-5 hrs morning sun"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
              />
            </div>

            <div>
              <label
                htmlFor="care-notes"
                className="block text-sm font-medium text-[#244432] mb-1.5"
              >
                General Care Notes (optional)
              </label>
              <input
                id="care-notes"
                type="text"
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Soil mix, drainage, misting preference..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#C9DBD0] text-sm focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
              />
            </div>
          </div>
        </div>

        {/* Calculated Next Schedule Preview */}
        <div className="bg-[#F4F8F5] border border-[#DDE7DF] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#244432]">
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-[#15803D] shrink-0" />
            <span>Calculated Next Due Dates:</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 tabular-nums">
            <span>Watering: <strong>{formatHumanDate(calculatedNextWatering)}</strong></span>
            <span>Fertilizing: <strong>{formatHumanDate(calculatedNextFertilizer)}</strong></span>
            <span>Pruning: <strong>{formatHumanDate(calculatedNextPruning)}</strong></span>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EDF2EE]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-[#D4E2D7] text-sm font-medium text-[#244432] hover:bg-[#F4F8F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#15803D] text-white text-sm font-medium hover:bg-[#166534] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {submitting
              ? 'Saving...'
              : editingPlant
                ? 'Update Plant'
                : 'Save Plant'}
          </button>
        </div>
      </form>
    </div>
  );
}
