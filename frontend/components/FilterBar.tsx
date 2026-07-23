"use client";

type Props = {
  activeTags: string[];
  onTagToggle: (tag: string) => void;
  sort: string;
  onSortChange: (sort: string) => void;
};

const TAGS = [
  { id: "spicy", label: "Острое" },
  { id: "vegetarian", label: "Вегги" },
  { id: "new", label: "Новинка" },
];

const SORTS = [
  { id: "popularity", label: "Популярные" },
  { id: "price_asc", label: "Дешевле" },
  { id: "price_desc", label: "Дороже" },
];

export default function FilterBar({ activeTags, onTagToggle, sort, onSortChange }: Props) {
  return (
    <div className="eda-filters">
      <div className="eda-filters__tags">
        {TAGS.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => onTagToggle(tag.id)}
            className={`eda-filter-chip ${activeTags.includes(tag.id) ? "is-active" : ""}`}
          >
            {tag.label}
          </button>
        ))}
      </div>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="eda-filters__sort"
        aria-label="Сортировка"
      >
        {SORTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
