import React from "react";

interface SensorCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
}

export function SensorCard({
  title,
  value,
  icon,
  colorClass,
}: SensorCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4 transition-transform hover:scale-105">
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center ${colorClass}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      </div>
    </div>
  );
}
