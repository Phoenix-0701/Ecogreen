"use client";

import React, { useState } from "react";
import { Droplets, Wind, AlertCircle, Activity, Clock, Filter } from "lucide-react";

export function LogsView() {
  const [filter, setFilter] = useState<string>("all");
  const [logs, setLogs] = useState<any[]>([]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "success":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "warning":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "error":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "PUMP_ON":
      case "PUMP_OFF":
        return <Droplets size={16} className="text-blue-500" />;
      case "FAN_ON":
      case "FAN_OFF":
        return <Wind size={16} className="text-cyan-500" />;
      case "THRESHOLD_ALERT":
        return <AlertCircle size={16} className="text-red-500" />;
      case "DEVICE_CONNECTED":
        return <Activity size={16} className="text-green-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleString("vi-VN");
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success": return "Thành công";
      case "warning": return "Cảnh báo";
      case "error": return "Lỗi";
      default: return "Thông tin";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nhật ký hoạt động</h2>
            <p className="text-sm text-gray-500 mt-1">
              Tra cứu các sự kiện vận hành hệ thống
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả</option>
              <option value="success">Thành công</option>
              <option value="warning">Cảnh báo</option>
              <option value="error">Lỗi</option>
              <option value="info">Thông tin</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Sự kiện</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Mô tả</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    Đang chờ dữ liệu từ backend...
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{formatTime(log.time)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getEventIcon(log.eventType)}
                        <span className="text-sm font-medium text-gray-900">{log.eventType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{log.description}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(log.status)}`}>
                        {getStatusLabel(log.status)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Hiển thị {logs.length} sự kiện
        </div>
      </div>
    </div>
  );
}