import Link from "next/link";

export default function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 shadow-sm">
      <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-700">
        Coming Soon
      </span>
      <h1 className="mt-4 text-3xl font-bold text-gray-900">{title}</h1>
      <p className="mt-3 max-w-2xl text-base text-gray-600">{description}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-green-700"
        >
          Về Dashboard
        </Link>
        <Link
          href="/devices"
          className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          Mở trang Device
        </Link>
      </div>
    </div>
  );
}
