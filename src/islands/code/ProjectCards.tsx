interface Repo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  isArchived: boolean;
  isFork: boolean;
  pushedAt: string | null;
}

interface Props {
  repos: Repo[];
}

const LANG_DOTS: Record<string, string> = {
  TypeScript: 'bg-[#3178c6]',
  JavaScript: 'bg-[#f1e05a]',
  Python: 'bg-[#3572a5]',
  Rust: 'bg-[#dea584]',
  Go: 'bg-[#00add8]',
  Java: 'bg-[#b07219]',
  HTML: 'bg-[#e34c26]',
  CSS: 'bg-[#563d7c]',
  Shell: 'bg-[#89e051]',
  Astro: 'bg-[#ff5d01]',
  Swift: 'bg-[#f05138]',
};

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const days = Math.floor((now - then) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ProjectCards({ repos }: Props) {
  if (repos.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Projects</div>
        <div className="text-sm text-dim text-center py-8">No repositories</div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-3">Projects</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {repos.map((repo) => (
          <a
            key={repo.fullName}
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-tile border border-stroke rounded-lg p-4 hover:border-accent transition-colors no-underline block group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-heading group-hover:text-accent truncate">
                  {repo.name}
                </div>
                {repo.description && (
                  <div className="text-xs text-subtle mt-1 line-clamp-2">{repo.description}</div>
                )}
              </div>
              {repo.isArchived && (
                <span className="text-[10px] border border-stroke rounded px-1.5 py-0.5 text-dim shrink-0">archived</span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-3 text-xs text-dim">
              {repo.language && (
                <span className="flex items-center gap-1">
                  <span className={`size-2 rounded-full ${LANG_DOTS[repo.language] ?? 'bg-dim'}`} />
                  {repo.language}
                </span>
              )}
              {(repo.stars ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {repo.stars}
                </span>
              )}
              {repo.pushedAt && (
                <span className="ml-auto">Updated {relativeDate(repo.pushedAt)}</span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
