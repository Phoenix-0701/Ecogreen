interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}

export function ToggleSwitch({ checked, onChange, className = "" }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-9 w-16 overflow-hidden rounded-full transition-colors ${
        checked ? "bg-[#0b7a50]" : "bg-[#d8dfdb]"
      } ${className}`}
      aria-pressed={checked}
    >
      <span
        className={`absolute left-1 top-1 size-7 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-7" : "translate-x-0"
        }`}
      />
    </button>
  );
}
