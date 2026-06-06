import { useEffect, useState } from "react";
import { fetchOwnerAnalytics } from "../../services/analyticsService";
import { formatPaise } from "../../lib/orderPresentation";

const RANGE_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" }
];

const STATUS_COLORS = {
  pending: "#f59e0b",
  accepted: "#38bdf8",
  preparing: "#a78bfa",
  picked_up: "#818cf8",
  on_the_way: "#34d399",
  delivered: "#01de1a",
  cancelled: "#f87171"
};

const STATUS_LABELS = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

function BarChart({ data, valueKey, labelKey, color = "#01de1a", formatValue }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No data for this period
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d[valueKey] || 0));

  return (
    <div className="flex h-48 items-end gap-1 overflow-x-auto pb-2">
      {data.map((item, i) => {
        const pct = max > 0 ? ((item[valueKey] || 0) / max) * 100 : 0;
        return (
          <div key={i} className="group relative flex flex-1 min-w-[28px] flex-col items-center gap-1">
            {/* tooltip */}
            <div className="absolute bottom-full mb-2 hidden whitespace-nowrap rounded-xl bg-[#1a1a1a] px-2 py-1 text-xs text-white group-hover:block z-10">
              <div>{item[labelKey]}</div>
              <div className="font-semibold">{formatValue ? formatValue(item[valueKey]) : item[valueKey]}</div>
            </div>
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: color, minHeight: "4px" }}
            />
            <span className="text-[9px] text-slate-400 truncate w-full text-center">
              {String(item[labelKey]).slice(-5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        No data yet
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return null;

  let cumulativeAngle = -90; // start from top

  const slices = data.map((item) => {
    const angle = (item.count / total) * 360;
    const start = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...item, angle, start };
  });

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function slicePath(cx, cy, r, startAngle, sweepAngle) {
    if (sweepAngle >= 360) sweepAngle = 359.99;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, startAngle + sweepAngle);
    const largeArc = sweepAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  }

  const cx = 80, cy = 80, r = 70, innerR = 42;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slicePath(cx, cy, r, slice.start, slice.angle)}
            fill={STATUS_COLORS[slice.status] || "#94a3b8"}
            opacity="0.9"
          />
        ))}
        <circle cx={cx} cy={cy} r={innerR} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="600" fill="#1a1a1a">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8">ORDERS</text>
      </svg>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {slices.map((slice, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[slice.status] || "#94a3b8" }}
            />
            <span className="text-slate-600">
              {STATUS_LABELS[slice.status] || slice.status}
            </span>
            <span className="font-semibold text-[#1a1a1a]">{slice.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopItemsTable({ items }) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-slate-400">No orders yet to calculate popular items.</p>;
  }

  const max = items[0]?.count || 1;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e8f9eb] text-xs font-semibold text-[#01de1a]">
                {i + 1}
              </span>
              <span className="font-medium text-[#1a1a1a]">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <span>{item.count} sold</span>
              <span className="font-semibold text-[#1a1a1a]">{formatPaise(item.revenue_paise)}</span>
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className="h-1.5 rounded-full bg-[#01de1a] transition-all duration-500"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OwnerAnalytics() {
  const [range, setRange] = useState("monthly");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    fetchOwnerAnalytics(range)
      .then((data) => { if (isMounted) setAnalytics(data); })
      .catch((err) => { if (isMounted) setError(err.message || "Failed to load analytics."); })
      .finally(() => { if (isMounted) setLoading(false); });

    return () => { isMounted = false; };
  }, [range]);

  return (
    <div className="space-y-6">
      {/* header + range picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#01de1a]">Performance</p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1a1a1a]">Owner analytics</h2>
          <p className="mt-1 text-sm text-slate-500">Last 90 days of activity across all your restaurants.</p>
        </div>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRange(opt.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                range === opt.value
                  ? "bg-[#01de1a] text-black"
                  : "border border-black/10 text-slate-600 hover:border-[#01de1a] hover:text-[#01de1a]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-surface h-64 animate-pulse bg-slate-100 p-6" />
          ))}
        </div>
      ) : error ? (
        <div className="card-surface p-6 text-sm text-rose-700">{error}</div>
      ) : !analytics ? (
        <div className="card-surface p-6 text-sm text-slate-500">No analytics available yet.</div>
      ) : (
        <>
          {/* summary stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card-surface p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total revenue (90 days)</p>
              <p className="mt-3 text-3xl font-semibold text-[#1a1a1a]">
                {formatPaise(analytics.totalRevenuePaise)}
              </p>
              <p className="mt-1 text-sm text-slate-500">Excluding cancelled orders</p>
            </div>
            <div className="card-surface p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total orders (90 days)</p>
              <p className="mt-3 text-3xl font-semibold text-[#1a1a1a]">{analytics.totalOrders}</p>
              <p className="mt-1 text-sm text-slate-500">All statuses included</p>
            </div>
          </div>

          {/* charts grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* orders over time */}
            <div className="card-surface p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Orders over time</p>
              <h3 className="mt-2 text-lg font-semibold text-[#1a1a1a]">
                {range.charAt(0).toUpperCase() + range.slice(1)} order count
              </h3>
              <div className="mt-5">
                <BarChart
                  data={analytics.timeline}
                  valueKey="orders"
                  labelKey="period"
                  color="#01de1a"
                />
              </div>
            </div>

            {/* revenue over time */}
            <div className="card-surface p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Revenue over time</p>
              <h3 className="mt-2 text-lg font-semibold text-[#1a1a1a]">
                {range.charAt(0).toUpperCase() + range.slice(1)} revenue
              </h3>
              <div className="mt-5">
                <BarChart
                  data={analytics.timeline}
                  valueKey="revenue_paise"
                  labelKey="period"
                  color="#818cf8"
                  formatValue={(v) => formatPaise(v)}
                />
              </div>
            </div>

            {/* order status breakdown */}
            <div className="card-surface p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Order breakdown</p>
              <h3 className="mt-2 text-lg font-semibold text-[#1a1a1a]">Status distribution</h3>
              <div className="mt-5">
                <DonutChart data={analytics.statusBreakdown} />
              </div>
            </div>

            {/* top items */}
            <div className="card-surface p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Menu performance</p>
              <h3 className="mt-2 text-lg font-semibold text-[#1a1a1a]">Top 5 items by orders</h3>
              <div className="mt-5">
                <TopItemsTable items={analytics.topItems} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}