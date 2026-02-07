import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Language {
  language: string;
  bytes: number;
  percentage: number;
}

interface Props {
  languages: Language[];
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Rust: '#dea584',
  Go: '#00add8',
  Java: '#b07219',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Ruby: '#701516',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Astro: '#ff5d01',
  SCSS: '#c6538c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

const FALLBACK_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd',
  '#818cf8', '#93c5fd', '#7dd3fc', '#67e8f9',
];

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)}MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)}KB`;
  return `${bytes}B`;
}

export default function LanguageBreakdown({ languages }: Props) {
  if (languages.length === 0) {
    return (
      <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
        <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Languages</div>
        <div className="text-sm text-dim text-center py-8">No language data</div>
      </div>
    );
  }

  // Top 8 + "Other" bucket
  const top = languages.slice(0, 8);
  const rest = languages.slice(8);
  const data = [...top];
  if (rest.length > 0) {
    const otherBytes = rest.reduce((s, l) => s + l.bytes, 0);
    const otherPct = rest.reduce((s, l) => s + l.percentage, 0);
    data.push({ language: 'Other', bytes: otherBytes, percentage: Math.round(otherPct * 10) / 10 });
  }

  const chartData = data.map((d, i) => ({
    name: d.language,
    value: d.bytes,
    percentage: d.percentage,
    color: LANG_COLORS[d.language] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]!,
  }));

  return (
    <div className="bg-tile border border-stroke rounded-lg p-4 md:p-6">
      <div className="text-xs font-medium text-dim uppercase tracking-wide mb-4">Languages</div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="w-[160px] h-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={72}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ payload }) => {
                  const d = payload?.[0]?.payload as (typeof chartData)[0] | undefined;
                  if (!d) return null;
                  return (
                    <div className="bg-tile border border-stroke rounded-lg px-3 py-2 shadow-lg text-xs">
                      <div className="font-medium text-body">{d.name}</div>
                      <div className="text-subtle">{d.percentage}% &middot; {formatBytes(d.value)}</div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 grid grid-cols-1 gap-1.5 min-w-0">
          {chartData.map((d) => (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <div className="size-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-body truncate">{d.name}</span>
              <span className="text-dim ml-auto">{d.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
