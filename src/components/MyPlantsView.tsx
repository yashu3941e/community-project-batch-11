import { useMemo, useState } from 'react';
import {
  Droplets,
  Eye,
  Pencil,
  Plus,
  Search,
  Sprout,
  Sun,
  Trash2,
} from 'lucide-react';
import { Plant, PlantType } from '../types/plant';
import { formatHumanDate } from '../lib/dateUtils';
import { PlantImage } from './PlantImage';

interface MyPlantsViewProps {
  plants: Plant[];
  onAddPlant: () => void;
  onEditPlant: (plant: Plant) => void;
  onDeletePlant: (plant: Plant) => void;
  onViewPlant: (plant: Plant) => void;
}

const TYPE_FILTERS: Array<'All' | PlantType> = [
  'All',
  'Flowering',
  'Succulent',
  'Indoor',
  'Herb',
  'Foliage',
  'Outdoor',
];

export function MyPlantsView({
  plants,
  onAddPlant,
  onEditPlant,
  onDeletePlant,
  onViewPlant,
}: MyPlantsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'All' | PlantType>('All');

  const filteredPlants = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return plants.filter((plant) => {
      const matchesType =
        selectedType === 'All' || plant.plantType === selectedType;
      const matchesQuery =
        !q ||
        plant.name.toLowerCase().includes(q) ||
        plant.plantType.toLowerCase().includes(q) ||
        plant.sunlightRequirement.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [plants, searchTerm, selectedType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#143624]">My Plants</h1>
          <p className="text-sm text-[#425A4C] mt-1">
            Browse your registered plants, review planting dates, or update care schedules.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPlant}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#15803D] text-white text-sm font-medium hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Plant
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#DDE7DF] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#5C7766] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, type, or sunlight..."
            aria-label="Search plants"
            className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-[#C9DBD0] text-sm text-[#14281D] focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 focus:border-[#15803D]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F2F7F3] rounded-lg overflow-x-auto">
          {TYPE_FILTERS.map((type) => {
            const active = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#143624] shadow-sm'
                    : 'text-[#4C6556] hover:text-[#143624]'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plants Grid */}
      {filteredPlants.length === 0 ? (
        <div className="bg-white border border-[#DDE7DF] rounded-xl p-10 text-center">
          <Sprout className="w-10 h-10 text-[#15803D] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#143624]">
            {plants.length === 0 ? 'No plants added yet' : 'No matching plants found'}
          </h2>
          <p className="text-sm text-[#556E5E] mt-1 max-w-md mx-auto mb-5">
            {plants.length === 0
              ? 'Start building your plant collection by adding a new plant and setting its watering and fertilizer schedule.'
              : 'Try clearing your search filter or switching plant categories.'}
          </p>
          {plants.length === 0 ? (
            <button
              type="button"
              onClick={onAddPlant}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#15803D] text-white text-sm font-medium hover:bg-[#166534] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Plant
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('All');
              }}
              className="px-4 py-2 rounded-lg border border-[#D4E2D7] text-sm font-medium text-[#244432] hover:bg-[#F4F8F5] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPlants.map((plant) => (
            <article
              key={plant.id}
              className="bg-white border border-[#DDE7DF] rounded-xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] w-full overflow-hidden border-b border-[#EDF2EE]">
                <PlantImage
                  src={plant.imageUrl}
                  alt={plant.name}
                  className="w-full h-full"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#143624] truncate">
                    {plant.name}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[#556E5E] mt-1 tabular-nums">
                    <span>{plant.plantType} plant</span>
                    <span aria-hidden="true">·</span>
                    <span>Planted {formatHumanDate(plant.plantingDate)}</span>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-[#EDF2EE] space-y-2 text-xs text-[#395343]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[#556E5E]">
                        <Droplets className="w-3.5 h-3.5 text-[#15803D]" />
                        Watering
                      </span>
                      <span className="font-medium text-[#143624] tabular-nums">
                        Every {plant.wateringFrequencyDays}d · Next {formatHumanDate(plant.nextWateringDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[#556E5E]">
                        <Sun className="w-3.5 h-3.5 text-[#D97706]" />
                        Sunlight
                      </span>
                      <span className="font-medium text-[#143624]">
                        {plant.sunlightRequirement}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#EDF2EE]">
                  <button
                    type="button"
                    onClick={() => onViewPlant(plant)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#EAF5ED] text-xs font-semibold text-[#14532D] hover:bg-[#DCFCE7] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditPlant(plant)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-[#D4E2D7] text-xs font-medium text-[#244432] hover:bg-[#F4F8F5] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePlant(plant)}
                    aria-label={`Delete ${plant.name}`}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-[#F2D5D5] text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
