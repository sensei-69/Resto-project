import { ChevronRight } from "lucide-react";
import type { CategorySection } from "./types";

interface Props {
  sections: CategorySection[];
  openCategoryId: string;
  activeSubId: string;
  query: string;
  onSelectCategory: (id: string) => void;
  onSelectSub: (id: string) => void;
}

function hits(text: string, query: string) {
  return query.trim().length > 0 && text.toLowerCase().includes(query.trim().toLowerCase());
}

export function CategoryRail({
  sections,
  openCategoryId,
  activeSubId,
  query,
  onSelectCategory,
  onSelectSub,
}: Props) {
  return (
    <nav className="fs-roster" aria-label="Categories">
      {sections.map((section) => (
        <div className="fs-division" key={section.id}>
          {section.label && (
            <div className="fs-division-head">
              <span className="fs-division-label">{section.label}</span>
              <span className="fs-division-ar">{section.arabic}</span>
            </div>
          )}
          {section.categories.map((cat, i) => {
            const isOpen = cat.id === openCategoryId;
            const catHit =
              hits(cat.name, query) ||
              cat.subcategories.some(
                (s) => hits(s.name, query) || s.items.some((it) => hits(it.name, query)),
              );
            return (
              <div
                className="fs-cat-group"
                key={cat.id}
                style={{ animationDelay: `${40 + i * 60}ms` }}
              >
                <button
                  className={[
                    "fs-roster-card",
                    isOpen ? "fs-roster-card--selected" : "",
                    catHit ? "fs-hit" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onSelectCategory(cat.id)}
                  aria-expanded={isOpen}
                >
                  <div className="fs-avatar">
                    <img src={cat.image} alt="" className="fs-avatar-photo" />
                  </div>
                  <div className="fs-card-text">
                    <div className="fs-card-title">{cat.name}</div>
                    <div className="fs-card-subtitle">{cat.subtitle}</div>
                  </div>
                  <ChevronRight
                    className={isOpen ? "fs-cat-chevron fs-cat-chevron--open" : "fs-cat-chevron"}
                    strokeWidth={2}
                  />
                </button>

                {isOpen && (
                  <div className="fs-sub-list">
                    {cat.subcategories.map((sub, j) => {
                      const active = sub.id === activeSubId;
                      const subHit =
                        hits(sub.name, query) || sub.items.some((it) => hits(it.name, query));
                      return (
                        <button
                          key={sub.id}
                          className={[
                            "fs-sub-item",
                            active ? "fs-sub-item--active" : "",
                            subHit ? "fs-hit" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          style={{ animationDelay: `${j * 50}ms` }}
                          onClick={() => onSelectSub(sub.id)}
                        >
                          <span className="fs-sub-dot" />
                          <span className="fs-sub-name">{sub.name}</span>
                          <span className="fs-sub-count">{sub.items.length}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
