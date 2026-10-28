import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: '✦' },
  { path: '/audit', label: 'Auditor', icon: '◎' },
  { path: '/history', label: 'History', icon: '◷' },
  { path: '/rules', label: 'Rules', icon: '⚙' },
  { path: '/export', label: 'Export', icon: '↗' },
  { path: '/docs', label: 'Guidelines', icon: '§' },
  { path: '/settings', label: 'Settings', icon: '⚿' },
];

export default function Header({ activeRuleCount, hasResults }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#E8E3DA] bg-[#FAF9F5]/85 backdrop-blur-xl transition-all">
      {/* Delicate hairline gradient highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] w-3/4 bg-gradient-to-r from-transparent via-sage-400/40 to-transparent pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Logo + Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 transition-transform duration-200 hover:scale-[1.01] shrink-0"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#18181B] to-[#2E3C33] shadow-md shadow-stone-900/10 text-white">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif text-lg font-bold tracking-tight text-charcoal-900">
                  A11yFix
                </h1>
                <span className="rounded-full bg-sage-100 border border-sage-200/80 px-2 py-0.2 text-[10px] font-medium text-sage-800">
                  v2.2
                </span>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-stone-500">
                Automated WCAG Remediation
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav
            className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 lg:pb-0"
            aria-label="Main Navigation"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-charcoal-900 border border-stone-200/90 shadow-sm font-semibold'
                      : 'text-stone-600 hover:text-charcoal-900 hover:bg-stone-200/40 border border-transparent'
                  }`
                }
              >
                <span className="text-[11px] opacity-70">{item.icon}</span>
                <span>{item.label}</span>
                {item.path === '/rules' && typeof activeRuleCount === 'number' && (
                  <span className="ml-0.5 rounded-full bg-sage-100 px-1.5 py-0.2 text-[10px] text-sage-800 font-semibold border border-sage-200/60">
                    {activeRuleCount}
                  </span>
                )}
                {item.path === '/export' && hasResults && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-sage-500 animate-pulse"
                    title="Audit report ready to export"
                  />
                )}
              </NavLink>
            ))}
          </nav>

          {/* Auth & Status Area */}
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl bg-white border border-stone-200/80 px-3 py-1.5 text-xs shadow-sm">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sage-600 text-[10px] font-bold text-white">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="font-medium text-charcoal-800 max-w-[100px] truncate">
                    {user?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-stone-200/80 hover:border-rose-300 bg-white hover:bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-rose-700 transition-all shadow-sm"
                  title="Log out"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-1.5 text-xs font-medium text-stone-600 hover:text-charcoal-900 hover:bg-stone-200/50 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-stone-900 hover:bg-stone-800 px-3.5 py-1.5 text-xs font-medium text-white transition-all shadow-sm hover:shadow"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Badges */}
            <div className="hidden xl:flex items-center gap-2 border-l border-stone-200 pl-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-50 border border-sage-200/80 px-2.5 py-1 text-[11px] font-medium text-sage-800">
                <span className="h-1.5 w-1.5 rounded-full bg-sage-500 animate-pulse" />
                Gemini AI
              </span>
              <span className="rounded-full bg-stone-100 border border-stone-200/70 px-2.5 py-1 text-[11px] font-medium text-stone-600">
                WCAG 2.2 AA
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
