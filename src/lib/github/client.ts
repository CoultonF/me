const HEADERS = (token: string) => ({
  Authorization: `token ${token}`,
  Accept: 'application/vnd.github.v3+json',
  'User-Agent': 'coultonf-site/1.0',
});

interface ContributionDay {
  date: string;
  contributionCount: number;
}

interface GraphQLResponse {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          weeks?: { contributionDays: ContributionDay[] }[];
        };
      };
    };
  };
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  archived: boolean;
  fork: boolean;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubEvent {
  type: string;
  repo: { name: string };
  payload: {
    commits?: { message: string }[];
    action?: string;
    pull_request?: { title: string };
    issue?: { title: string };
    review?: { state: string };
    ref?: string;
    ref_type?: string;
  };
  created_at: string;
}

/**
 * Fetch contributions via GraphQL (requires classic PAT with `read:user` scope).
 * Falls back to building contribution data from events if GraphQL fails.
 */
export async function fetchContributions(token: string, username: string): Promise<ContributionDay[]> {
  // Try GraphQL first (classic PATs)
  try {
    const query = `
      query($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }
    `;

    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'coultonf-site/1.0',
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });

    if (res.ok) {
      const json = await res.json() as GraphQLResponse;
      const weeks = json.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
      if (weeks && weeks.length > 0) {
        return weeks.flatMap((w) => w.contributionDays);
      }
    }
  } catch {
    // GraphQL not available — fall through to events-based approach
  }

  // Fallback: derive contribution counts from events (last ~90 days)
  console.log('[github] GraphQL unavailable, deriving contributions from events');
  const events = await fetchEvents(token, username);
  const byDate = new Map<string, number>();
  for (const e of events) {
    const date = e.created_at.slice(0, 10);
    byDate.set(date, (byDate.get(date) ?? 0) + 1);
  }
  return Array.from(byDate.entries())
    .map(([date, count]) => ({ date, contributionCount: count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchRepos(token: string, username: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=100&page=${page}`,
      { headers: HEADERS(token) },
    );
    if (!res.ok) throw new Error(`GitHub repos: ${res.status}`);
    const batch = await res.json() as GitHubRepo[];
    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  return repos;
}

export async function fetchRepoLanguages(
  token: string,
  owner: string,
  repo: string,
): Promise<Record<string, number>> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
    headers: HEADERS(token),
  });
  if (!res.ok) return {};
  return res.json() as Promise<Record<string, number>>;
}

export async function fetchEvents(token: string, username: string): Promise<GitHubEvent[]> {
  const res = await fetch(
    `https://api.github.com/users/${username}/events?per_page=100`,
    { headers: HEADERS(token) },
  );
  if (!res.ok) throw new Error(`GitHub events: ${res.status}`);
  return res.json() as Promise<GitHubEvent[]>;
}
