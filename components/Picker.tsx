'use client';

import { motion } from 'framer-motion';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Comparte el id de layout para que el indicador se deslice entre opciones. */
  layoutId: string;
}

export default function Picker<T extends string>({
  label,
  options,
  value,
  onChange,
  layoutId,
}: Props<T>) {
  return (
    <div className="flex flex-col gap-2">
      <span className="label">{label}</span>
      <div className="flex gap-1.5 rounded-2xl border border-white/10 bg-black/25 p-1.5">
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className="relative flex-1 rounded-xl px-2 py-2.5 text-center transition-colors"
            >
              {selected && (
                <motion.span
                  layoutId={layoutId}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-honey to-honey-deep"
                />
              )}
              <span
                className={`relative block font-display text-base font-semibold ${
                  selected ? 'text-ink' : 'text-cream/60'
                }`}
              >
                {option.label}
              </span>
              {option.hint && (
                <span
                  className={`relative block text-[0.62rem] leading-tight ${
                    selected ? 'text-ink/65' : 'text-cream/30'
                  }`}
                >
                  {option.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
