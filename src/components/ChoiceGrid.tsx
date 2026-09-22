interface Item<T extends string> {
  value: T;
  label: string;
  blurb?: string;
}

interface Props<T extends string> {
  items: Item<T>[];
  value: T | T[] | undefined;
  onChange: (v: T) => void;
  compact?: boolean;
}

/** Big, tappable choice cards. Works for single or multi-select depending on `value`. */
export function ChoiceGrid<T extends string>({ items, value, onChange, compact }: Props<T>) {
  const selected = (v: T) => (Array.isArray(value) ? value.includes(v) : value === v);
  return (
    <div className="choices" role="group">
      {items.map((it) => (
        <button
          type="button"
          key={it.value}
          className={`choice ${selected(it.value) ? "selected" : ""} ${compact ? "compact" : ""}`}
          onClick={() => onChange(it.value)}
          aria-pressed={selected(it.value)}
        >
          <span className="choice-label">{it.label}</span>
          {it.blurb ? <span className="choice-blurb">{it.blurb}</span> : null}
        </button>
      ))}
    </div>
  );
}
