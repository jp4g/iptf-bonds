"use client";

interface Tab {
  key: string;
  label: string;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export default function TabBar({ tabs, active, onChange }: TabBarProps) {
  return (
    <div className="flex border-b border-neutral-200 gap-6">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`pb-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
              isActive
                ? "text-orange-600 border-orange-500"
                : "text-neutral-500 border-transparent hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
