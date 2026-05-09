"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { PackageCheck, TrendingUp } from "lucide-react";
import { getAdminDashboardData } from "@/services/admin-dashboard.service";
import { AdminDashboardData } from "@/types/admin-dashboard";

export function AdminDashboardView() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getAdminDashboardData();
        setData(response);
      } catch {
        setError("Khong the tai du lieu dashboard.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl rounded-2xl bg-white p-6 text-slate-600 shadow-sm">
          Dang tai dashboard...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="mx-auto max-w-7xl rounded-2xl bg-red-50 p-6 text-red-700 shadow-sm">
          {error || "Khong co du lieu dashboard."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col justify-between gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 md:text-3xl">
              Dashboard Admin
            </h1>
            <p className="mt-1 text-sm text-slate-500 md:text-base">
              Tong quan quan ly cay xanh, doanh thu va don hang EcoGreen.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            <TrendingUp className="h-4 w-4" />
            Cap nhat theo du lieu thang hien tai
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {data.stats.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{item.title}</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-800">
                    {item.value}
                  </h2>
                </div>
                <div className={`rounded-xl p-3 ${item.bgColor}`}>
                  {item.icon ? (
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-green-600">
                {item.change} so voi thang truoc
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Doanh thu va don hang theo thang
              </h3>
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                6 thang gan nhat
              </span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Doanh thu (trieu VND)"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    name="Don hang"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              Trang thai don hang
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {data.orderStatusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {data.orderStatusData.map((status) => (
                <div
                  key={status.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                  </div>
                  <span className="font-semibold text-slate-800">
                    {status.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              Top cay ban chay
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500">
                    <th className="py-3 pr-4 font-medium">Ma don</th>
                    <th className="py-3 pr-4 font-medium">Ten cay</th>
                    <th className="py-3 pr-4 font-medium">Da ban</th>
                    <th className="py-3 pr-4 font-medium">Ton kho</th>
                    <th className="py-3 font-medium">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topTreeProducts.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50">
                      <td className="py-3 pr-4 font-medium text-slate-700">
                        {item.id}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{item.name}</td>
                      <td className="py-3 pr-4 text-slate-700">{item.sold}</td>
                      <td className="py-3 pr-4 text-slate-700">{item.stock}</td>
                      <td className="py-3 font-semibold text-green-600">
                        {item.revenue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              Hieu suat vuon theo khu vuc
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.gardenPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="area" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="score" fill="#22c55e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              <PackageCheck className="h-4 w-4" />
              {data.insight}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
