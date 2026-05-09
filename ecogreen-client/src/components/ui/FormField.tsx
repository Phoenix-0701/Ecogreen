interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#1d2420]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-[1.2rem] border border-[#e4e9e5] bg-[#f5f7f6] px-4 py-4 text-[#1d2420] outline-none transition focus:border-[#0b7a50] focus:bg-white ${className}`}
      />
    </label>
  );
}
