import { useMemo, useState } from 'react';
import { CloudSun, Moon, Plus, Sprout, Sun } from 'lucide-react';
import { Plant, SunlightLevel } from '../types/plant';
import { PlantImage } from './PlantImage';

interface SunlightViewProps {
  plants: Plant[];
  onUpdateSunlight: (plant: Plant, level: SunlightLevel) => Promise<void>;
  onSelectPlant: (plant: Plant) => void;
  onAddPlant: () => void;
}

const ZONES: Array<{
  level: SunlightLevel;
  title: string;
  guidance: string;
  icon: typeof Sun;
}> = [
  {
    level: 'Direct Sunlight',
    title: 'Direct Sunlight',
    guidance: '6+ hours of unfiltered sun daily. Best for south-facing windows, sunny balconies, or patios.',
    icon: Sun,
  },
  {
    level: 'Indirect Sunlight',
    title: 'Indirect Sunlight',
    guidance: 'Bright, filtered room light without harsh midday glare. Ideal for living rooms and east windows.',
    icon: CloudSun,
  },
  {
    level: 'Shade',
    title: 'Shade',
    guidance: 'Gentle ambient light away from direct rays. Suitable for north-facing rooms and shaded corners.',
    icon: Moon,
  },
];

export function SunlightView({
  plants,
  onUpdateSunlight,
  onSelectPlant,
  onAddPlant,
}: SunlightViewProps) {
  const [filterZone, setFilterZone] = useState<'All' | SunlightLevel>('All');

  const counts = useMemo(() => {
    return {
      'Direct Sunlight': plants.filter((p) => p.sunlightRequirement === 'Direct Sunlight').length,
      'Indirect Sunlight': plants.filter((p) => p.sunlightRequirement === 'Indirect Sunlight').length,
      Shade: plants.filter((p) => p.sunlightRequirement === 'Shade').length,
    };
  }, [plants]);

  const filteredPlants = useMemo(() => {
    if (filterZone === 'All') return plants;
    return plants.filter((p) => p.sunlightRequirement === filterZone);
  }, [plants, filterZone]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#143624]">Sunlight Requirements</h1>
        <p className="text-sm text-[#425A4C] mt-1">
          Review whether each plant needs direct sunlight, indirect sunlight, or shade for optimal growth.
        </p>
      </div>

      {/* Zone Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ZONES.map((zone) => {
          const Icon = zone.icon;
          const active = filterZone === zone.level;
          return (
            <button
              key={zone.level}
              type="button"
              onClick={() => setFilterZone(active ? 'All' : zone.level)}
              className={`text-left bg-white rounded-xl p-5 border transition-colors cursor-pointer ${
                active
                  ? 'border-[#15803D] ring-2 ring-[#15803D]/15'
                  : 'border-[#DDE7DF] hover:border-[#B6CEBC]'
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#143624]">
                  <Icon className="w-4 h-4 text-[#D97706]" />
                  {zone.title}
                </span>
                <span className="text-xl font-bold text-[#143624] tabular-nums">
                  {counts[zone.level]}
                </span>
              </div>
              <p className="text-xs text-[#556E5E] leading-relaxed">
                {zone.guidance}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-white border border-[#DDE7DF] rounded-lg overflow-x-auto">
          {(['All', 'Direct Sunlight', 'Indirect Sunlight', 'Shade'] as const).map((zone) => {
            const active = filterZone === zone;
            return (
              <button
                key={zone}
                type="button"
                onClick={() => setFilterZone(zone)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#EAF5ED] text-[#14532D]'
                    : 'text-[#4C6556] hover:text-[#143624]'
                }`}
              >
                {zone}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plant Sunlight Table / List */}
      {plants.length === 0 ? (
        <div className="bg-white border border-[#DDE7DF] rounded-xl p-10 text-center">
          <Sprout className="w-10 h-10 text-[#15803D] mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[#143624]">No plants tracked yet</h2>
          <p className="text-sm text-[#556E5E] mt-1 mb-4">
            Add plants to view and organize their sunlight placement requirements.
          </p>
          <button
            type="button"
            onClick={onAddPlant}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#15803D] text-white text-sm font-medium hover:bg-[#166534] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Plant
          </button>
        </div>
      ) : filteredPlants.length === 0 ? (
        <div className="bg-white border border-[#DDE7DF] rounded-xl p-8 text-center text-sm text-[#556E5E]">
          No plants currently assigned to <strong>{filterZone}</strong>.
        </div>
      ) : (
        <div className="bg-white border border-[#DDE7DF] rounded-xl divide-y divide-[#EDF2EE] overflow-hidden">
          {filteredPlants.map((plant) => (
            <div
              key={plant.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#FAFDFB] transition-colors"
            >
              <div className="flex items-start sm:items-center gap-4 min-w-0">
                <PlantImage
                  src={plant.imageUrl}
                  alt={plant.name}
                  className="w-14 h-14 rounded-lg shrink-0 border border-[#E3ECE5]"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelectPlant(plant)}
                      className="text-base font-semibold text-[#143624] hover:text-[#15803D] cursor-pointer"
                    >
                      {plant.name}
                    </button>
                    <span className="text-[#9AB0A2]" aria-hidden="true">·</span>
                    <span className="text-xs text-[#556E5E]">{plant.plantType} plant</span>
                  </div>
                  <p className="text-xs text-[#425A4C] mt-1 leading-relaxed">
                    {plant.sunlightNotes || `Requires ${plant.sunlightRequirement.toLowerCase()}.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="sr-only" htmlFor={`sunlight-select-${plant.id}`}>
                  Sunlight requirement for {plant.name}
                </label>
                <select
                  id={`sunlight-select-${plant.id}`}
                  value={plant.sunlightRequirement}
                  onChange={(e) =>
                    onUpdateSunlight(plant, e.target.value as SunlightLevel)
                  }
                  className="px-3 py-2 rounded-lg border border-[#C9DBD0] bg-white text-xs font-medium text-[#143624] focus:outline-none focus:ring-2 focus:ring-[#15803D]/30 cursor-pointer"
                >
                  <option value="Direct Sunlight">Direct Sunlight</option>
                  <option value="Indirect Sunlight">Indirect Sunlight</option>
                  <option value="Shade">Shade</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
