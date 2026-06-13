import { Loader2 } from "lucide-react";

interface LoadingPanelProps {
  message: string;
}

export function LoadingPanel({ message }: LoadingPanelProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center rounded-[2rem] bg-white shadow-sm">
      <div className="flex items-center gap-3 text-sm font-medium text-[#5d6c63]">
        <Loader2 className="size-4 animate-spin" />
        {message}
      </div>
    </div>
  );
}
