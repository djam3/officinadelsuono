import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Sliders, Palette, Box } from 'lucide-react';
import type { CabinetDesign } from '../../types/speaker';

interface StepCustomizeCabinetProps {
  cabinet: CabinetDesign;
  onUpdate: (updates: Partial<CabinetDesign>) => void;
}

const WOOD_TYPES = ['MDF', 'MDF-HDF'] as const;
const THICKNESSES = [18, 21, 25] as const;
const FINISHES = ['natural', 'black', 'white'] as const;

export function StepCustomizeCabinet({ cabinet, onUpdate }: StepCustomizeCabinetProps) {
  const { t } = useTranslation();
  const [customDims, setCustomDims] = useState({
    width: cabinet.externalDimensions?.width || 400,
    height: cabinet.externalDimensions?.height || 600,
    depth: cabinet.externalDimensions?.depth || 400,
  });

  const handleDimensionChange = (dimension: keyof typeof customDims, value: number) => {
    const newDims = { ...customDims, [dimension]: value };
    setCustomDims(newDims);
    onUpdate({
      externalDimensions: newDims,
    });
  };

  const handleMaterialChange = (type: string) => {
    onUpdate({ woodType: type as any });
  };

  const handleThicknessChange = (thickness: number) => {
    onUpdate({ woodThickness: thickness });
  };

  const handleFinishChange = (finish: string) => {
    onUpdate({ name: finish });
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-4xl font-bold mb-4">{t('configurator.customizeCabinet')}</h2>
        <p className="text-zinc-400 text-lg">{t('configurator.customizeDesc')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sinistra: Personalizzazione */}
        <div className="space-y-6">
          {/* Dimensioni */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Sliders className="w-6 h-6 text-brand-orange" />
              {t('configurator.dimensions')}
            </h3>

            <div className="space-y-6">
              {/* Larghezza */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  {t('configurator.width')}: <span className="text-brand-orange">{customDims.width}mm</span>
                </label>
                <input
                  type="range"
                  min={200}
                  max={800}
                  step={10}
                  value={customDims.width}
                  onChange={(e) => handleDimensionChange('width', parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                />
                <div className="text-xs text-zinc-500 mt-2 flex justify-between">
                  <span>200mm</span>
                  <span>800mm</span>
                </div>
              </div>

              {/* Altezza */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  {t('configurator.height')}: <span className="text-brand-orange">{customDims.height}mm</span>
                </label>
                <input
                  type="range"
                  min={300}
                  max={1200}
                  step={10}
                  value={customDims.height}
                  onChange={(e) => handleDimensionChange('height', parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                />
                <div className="text-xs text-zinc-500 mt-2 flex justify-between">
                  <span>300mm</span>
                  <span>1200mm</span>
                </div>
              </div>

              {/* Profondità */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  {t('configurator.depth')}: <span className="text-brand-orange">{customDims.depth}mm</span>
                </label>
                <input
                  type="range"
                  min={200}
                  max={800}
                  step={10}
                  value={customDims.depth}
                  onChange={(e) => handleDimensionChange('depth', parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-orange"
                />
                <div className="text-xs text-zinc-500 mt-2 flex justify-between">
                  <span>200mm</span>
                  <span>800mm</span>
                </div>
              </div>

              {/* Calcolato automaticamente */}
              <div className="bg-zinc-950/50 border border-white/5 rounded-lg p-3 text-xs text-zinc-400">
                <div className="font-mono">
                  {t('configurator.grossVolume')}: ~{Math.round((customDims.width * customDims.height * customDims.depth) / 1e6)} L
                </div>
              </div>
            </div>
          </motion.div>

          {/* Materiale */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Box className="w-6 h-6 text-brand-orange" />
              {t('configurator.material')}
            </h3>

            <div className="space-y-4">
              {/* Tipo di legno */}
              <div>
                <label className="block text-sm font-semibold mb-3">{t('configurator.woodType')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {WOOD_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleMaterialChange(type)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                        cabinet.woodType === type
                          ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                          : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      {type === 'MDF' ? 'MDF' : 'MDF-HDF'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spessore */}
              <div>
                <label className="block text-sm font-semibold mb-3">{t('configurator.thickness')}</label>
                <div className="grid grid-cols-3 gap-3">
                  {THICKNESSES.map((thickness) => (
                    <button
                      key={thickness}
                      onClick={() => handleThicknessChange(thickness)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all border ${
                        cabinet.woodThickness === thickness
                          ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                          : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      {thickness}mm
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Finitura */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8"
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <Palette className="w-6 h-6 text-brand-orange" />
              {t('configurator.finish')}
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {FINISHES.map((finish) => (
                <button
                  key={finish}
                  onClick={() => handleFinishChange(finish)}
                  className={`px-4 py-4 rounded-lg font-medium transition-all border flex items-center justify-center gap-2 ${
                    cabinet.name === finish
                      ? 'bg-brand-orange/20 border-brand-orange text-brand-orange'
                      : 'bg-zinc-900 border-white/10 text-zinc-300 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border ${
                      finish === 'natural'
                        ? 'bg-amber-700 border-amber-600'
                        : finish === 'black'
                        ? 'bg-black border-gray-700'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                  {t(`configurator.${finish}`)}
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Destra: Preview */}
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-8 h-fit sticky top-24">
          <h3 className="text-xl font-bold mb-6">Anteprima</h3>

          {/* Box 3D semplificato */}
          <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-lg mb-6 relative overflow-hidden flex items-center justify-center">
            <div
              className="border-4 border-brand-orange relative transform perspective"
              style={{
                width: Math.min(200, customDims.width / 4),
                height: Math.min(300, customDims.height / 4),
                backgroundColor:
                  cabinet.name === 'black' ? '#000' : cabinet.name === 'white' ? '#fff' : '#8B7355',
                transform: 'rotateX(20deg) rotateY(-30deg)',
              }}
            />
          </div>

          {/* Riepilogo */}
          <div className="space-y-4 text-sm">
            <div className="border-t border-white/5 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-zinc-400">Tipo di legno</span>
                <span className="font-bold">{cabinet.woodType}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-400">Spessore</span>
                <span className="font-bold">{cabinet.woodThickness}mm</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-400">Finitura</span>
                <span className="font-bold">{cabinet.name}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-zinc-400">Dimensioni esterne</span>
                <span className="font-bold text-brand-orange">
                  {customDims.width} × {customDims.height} × {customDims.depth}mm
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
