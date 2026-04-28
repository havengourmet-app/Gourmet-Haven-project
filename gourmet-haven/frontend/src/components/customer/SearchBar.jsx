export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder="Search restaurants..."
        className="w-full rounded-2xl border border-black/10 bg-white px-5 py-4 pr-12 text-sm text-[#1a1a1a] outline-none transition focus:border-[#01de1a]"
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange?.("")}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label="Clear search"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
