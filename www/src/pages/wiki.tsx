import { useEffect, useCallback } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { WikiSidebar } from '@/components/wiki/wiki-sidebar';
import { WikiContent } from '@/components/wiki/wiki-content';

export function WikiPage() {
  const { section } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // URL is the single source of truth
  const activeSection = section || 'getting-started';

  // Handle section change from sidebar
  const handleSectionChange = useCallback((newSection: string) => {
    navigate(`/docs/${newSection}`, { replace: true });
  }, [navigate]);

  // Handle hash navigation on page load and when hash changes
  useEffect(() => {
    const hash = location.hash.slice(1);
    if (hash) {
      const timer = setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash, activeSection]);

  return (
    <div className="fixed inset-0 z-50 flex bg-[#fffaf5] text-zinc-900">
      {/* Sidebar */}
      <WikiSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {/* Header - minimal */}
        <header className="flex h-12 items-center justify-between px-8 border-b border-zinc-200">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-zinc-600 transition-colors hover:text-zinc-900"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} strokeWidth={2} />
            Home
          </Link>
          <span className="text-xs text-zinc-600">Localflare Docs</span>
        </header>

        {/* Content area */}
        <div className="h-[calc(100%-3rem)] overflow-y-auto">
          <div className="mx-auto max-w-2xl px-8 py-12">
            <WikiContent activeSection={activeSection} />
          </div>
        </div>
      </main>
    </div>
  );
}
