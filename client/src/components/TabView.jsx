const TABS = [
  { id: 'contrast', label: 'Color Contrast', key: 'contrastFixes', icon: '🎨' },
  { id: 'alttext', label: 'Image Alt-Text', key: 'altTextFixes', icon: '🖼️' },
  { id: 'forms', label: 'Form Labels', key: 'formLabelFixes', icon: '⌨️' },
  { id: 'links', label: 'Link Anchors', key: 'linkTextFixes', icon: '↗️' },
  { id: 'headings', label: 'Heading Structure', key: 'headingFixes', icon: '≡' },
];

export default function TabView({ activeTab, onTabChange, counts }) {
  return (
    <div
      className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-stone-100/60 p-1.5 backdrop-blur-md shadow-inner"
      id="results-tabs"
    >
      <div className="flex min-w-max items-center gap-1.5" role="tablist" aria-label="Audit categories">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = counts[tab.key] || 0;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-results`}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-charcoal-900 border border-stone-200/90 shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-charcoal-900 hover:bg-stone-200/50'
              }`}
              onClick={() => onTabChange(tab.id)}
              id={`tab-${tab.id}`}
            >
              <span className="text-xs opacity-70">{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors ${
                  isActive
                    ? count > 0
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-sage-100 text-sage-800'
                    : 'bg-stone-200/70 text-stone-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
