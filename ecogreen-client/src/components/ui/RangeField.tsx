import * as React from "react";
import { Minus, Plus } from "lucide-react";

interface RangeFieldProps {
  label: string;
  hint: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  suffix: string | React.ReactNode;
  formatValue?: (value: number) => React.ReactNode;
  onChange: (value: number) => void;
}

export function RangeField({
  label,
  hint,
  min,
  max,
  step = 1,
  value,
  suffix,
  formatValue,
  onChange,
}: RangeFieldProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-[#18241c]">{label}</h3>
          <p className="mt-1 text-sm text-[#66756b]">{hint}</p>
        </div>
        <div className="text-right">
          <div
            className="text-4xl text-[#0b7a50]"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {formatValue ? formatValue(value) : (Number.isInteger(value) ? value : value.toFixed(1))}
          </div>
          <div className="text-sm text-[#66756b]">{suffix}</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, Number((value - step).toFixed(2))))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#475569] shadow-sm hover:bg-[#f8fafc] hover:text-[#0b7a50] hover:border-[#0b7a50]/30 active:scale-95 transition-all select-none cursor-pointer"
          title="Giảm"
        >
          <Minus size={13} strokeWidth={3} />
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          style={{
            background: `linear-gradient(to right, #19c08b 0%, #19c08b ${percentage}%, #e7ece9 ${percentage}%, #e7ece9 100%)`
          }}
          className="h-3 flex-1 cursor-pointer appearance-none rounded-full accent-[#19c08b] outline-none"
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(max, Number((value + step).toFixed(2))))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#475569] shadow-sm hover:bg-[#f8fafc] hover:text-[#0b7a50] hover:border-[#0b7a50]/30 active:scale-95 transition-all select-none cursor-pointer"
          title="Tăng"
        >
          <Plus size={13} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
