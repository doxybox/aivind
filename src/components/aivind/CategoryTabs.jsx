import React from "react";

const categories = ["Alle", "AI", "Gaming", "Elbil", "Gadgets", "Tester", "Guider"];

export default function CategoryTabs({ active, onSelect }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 ${
            active === cat
              ? "category-active"
              : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}