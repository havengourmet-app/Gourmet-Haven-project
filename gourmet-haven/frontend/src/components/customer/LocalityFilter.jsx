export default function LocalityFilter({ localities, selectedLocality, onSelect }) {
  const items = ["All", ...(Array.isArray(localities) ? localities : [])];

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-3 pb-1">
        {items.map((locality) => {
          const isAll = locality === "All";
          const isActive = isAll ? !selectedLocality : selectedLocality === locality;

          return (
            <button
              key={locality}
              type="button"
              onClick={() => onSelect?.(isAll ? "" : locality)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-[#01de1a] text-black"
                  : "border border-black/10 bg-white text-slate-600 hover:border-[#01de1a] hover:text-[#01de1a]"
              }`}
            >
              {locality}
            </button>
          );
        })}
      </div>
    </div>
  );
}
