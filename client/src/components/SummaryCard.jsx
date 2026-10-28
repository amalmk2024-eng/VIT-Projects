const GRADE_CONFIG = {
  A: {
    color: '#3D5A45',
    bg: '#EBF2ED',
    stroke: '#4D6A56',
    label: 'Exceptional',
    track: '#E2EBE4',
  },
  B: {
    color: '#2F6575',
    bg: '#EBF4F7',
    stroke: '#3E7E91',
    label: 'Good Standing',
    track: '#E1EDF1',
  },
  C: {
    color: '#9E7432',
    bg: '#FAF4EA',
    stroke: '#BFA067',
    label: 'Needs Attention',
    track: '#F5EBD7',
  },
  D: {
    color: '#B0592E',
    bg: '#FAF0EA',
    stroke: '#C76E40',
    label: 'Substandard',
    track: '#F6E6DC',
  },
  F: {
    color: '#9E3F49',
    bg: '#FDF0F2',
    stroke: '#B85C65',
    label: 'Critical Non-Compliance',
    track: '#F8E2E5',
  },
};

export default function SummaryCard({ summary }) {
  const grade = GRADE_CONFIG[summary.grade] || GRADE_CONFIG.F;

  // SVG ring progress (A=100%, B=80%, C=60%, D=40%, F=20%)
  const progressMap = { A: 100, B: 80, C: 60, D: 40, F: 20 };
  const progress = progressMap[summary.grade] || 20;
  const circumference = 2 * Math.PI * 36; // r=36
  const offset = circumference - (progress / 100) * circumference;

  const stats = [
    {
      label: 'Violations Detected',
      value: summary.totalErrors,
      color: 'text-rose-700',
      badge: summary.totalErrors > 0 ? 'Failing WCAG' : 'Compliant',
      badgeColor: summary.totalErrors > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-sage-50 text-sage-700 border-sage-200',
    },
    {
      label: 'Programmatic Patches',
      value: summary.totalFixed,
      color: 'text-sage-700',
      badge: 'Auto-Remediated',
      badgeColor: 'bg-sage-50 text-sage-700 border-sage-200',
    },
    {
      label: 'Compliance Level',
      value: `Grade ${summary.grade}`,
      color: 'text-charcoal-900',
      note: grade.label,
      badge: 'WCAG 2.2 AA',
      badgeColor: 'bg-stone-100 text-stone-700 border-stone-200',
    },
  ];

  return (
    <div className="glass-card p-6 sm:p-8 animate-fade-in shadow-float" id="summary-card">
      {/* Target Page Info Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" className="text-stone-400">
            <path
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
          <span className="font-mono text-charcoal-800 font-medium truncate max-w-sm sm:max-w-md">
            {summary.url}
          </span>
          {summary.pageTitle && (
            <>
              <span className="text-stone-300">•</span>
              <span className="truncate max-w-xs text-stone-600 italic">
                "{summary.pageTitle}"
              </span>
            </>
          )}
        </div>
        <span className="rounded-full bg-stone-100 border border-stone-200/80 px-3 py-1 text-[11px] font-medium text-stone-600">
          Executive Remediation Report
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Grade Ring */}
        <div className="flex flex-col items-center gap-2.5 shrink-0">
          <div className="grade-ring" style={{ width: 92, height: 92 }}>
            <svg width="92" height="92" viewBox="0 0 92 92">
              <circle
                cx="46"
                cy="46"
                r="36"
                fill="none"
                stroke={grade.track}
                strokeWidth="7"
              />
              <circle
                cx="46"
                cy="46"
                r="36"
                fill="none"
                stroke={grade.stroke}
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </svg>
            <span
              className="grade-letter font-serif"
              style={{ color: grade.color, fontSize: '2.25rem' }}
            >
              {summary.grade}
            </span>
          </div>
          <div className="text-center">
            <span
              className="text-xs font-semibold uppercase tracking-wider block"
              style={{ color: grade.color }}
            >
              {grade.label}
            </span>
            <span className="text-[10px] text-stone-400">Score Rating</span>
          </div>
        </div>

        {/* Stat Counters */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-stone-200/80 bg-stone-50/50 p-5 transition-all duration-300 hover:bg-white hover:border-stone-300/80 hover:shadow-subtle"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-500">{stat.label}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stat.badgeColor}`}
                >
                  {stat.badge}
                </span>
              </div>
              <p className={`font-serif text-3xl font-bold tracking-tight ${stat.color}`}>
                {stat.value}
              </p>
              {stat.note && (
                <p className="mt-1 text-xs text-stone-500 font-medium">{stat.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
