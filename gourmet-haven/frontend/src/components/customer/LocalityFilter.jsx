export default function LocalityFilter({ localities, selectedLocality, onSelect }) {
  const items = ["All", ...(Array.isArray(localities) ? localities : [])];

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {items.map((locality) => {
          const isAll = locality === "All";
          const isActive = isAll ? !selectedLocality : selectedLocality === locality;

          return (
            <button
              key={locality}
              type="button"
              onClick={() => onSelect?.(isAll ? "" : locality)}
              className={`nav-pill whitespace-nowrap text-sm ${isActive ? "nav-pill-active" : ""}`}
            >
              {locality}
            </button>
          );
        })}
      </div>
    </div>
  );
}