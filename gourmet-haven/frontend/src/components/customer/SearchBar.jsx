export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ color: "var(--ink-muted)" }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Search restaurants by name or cuisine..."
        className="input pl-11 pr-10 py-3.5"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange?.("")}
          className="absolute inset-y-0 right-3 flex items-center justify-center h-8 w-8 my-auto rounded-lg transition hover:bg-slate-100"
          style={{ color: "var(--ink-muted)" }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}