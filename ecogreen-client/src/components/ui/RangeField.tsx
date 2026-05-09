interface RangeFieldProps {
  label: string;
  hint: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  suffix: string;
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
  onChange,
}: RangeFieldProps) {
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
            {Number.isInteger(value) ? value : value.toFixed(1)}
          </div>
          <div className="text-sm text-[#66756b]">{suffix}</div>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-3 w-full cursor-pointer appearance-none rounded-full bg-[#e7ece9] accent-[#19c08b]"
      />
    </div>
  );
}
