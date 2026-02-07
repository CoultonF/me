import { githubContributions, githubRepos, githubEvents, githubLanguages } from '../db/schema';
import { fetchContributions, fetchRepos, fetchRepoLanguages, fetchEvents } from './client';
import type { GitHubEvent } from './client';
import type { Database } from '../db/client';

interface GitHubSyncEnv {
  GITHUB_TOKEN: string;
  GITHUB_USERNAME: string;
}

interface SyncResult {
  contributions: number;
  repos: number;
  events: number;
  languages: number;
  error?: string;
}

function parseEventType(event: GitHubEvent): { type: string; message: string | null; ref: string | null } {
  switch (event.type) {
    case 'PushEvent':
      return {
        type: 'push',
        message: event.payload.commits?.[0]?.message?.split('\n')[0] ?? null,
        ref: event.payload.ref ?? null,
      };
    case 'PullRequestEvent':
      return {
        type: 'pr',
        message: `${event.payload.action}: ${event.payload.pull_request?.title ?? ''}`,
        ref: null,
      };
    case 'IssuesEvent':
      return {
        type: 'issue',
        message: `${event.payload.action}: ${event.payload.issue?.title ?? ''}`,
        ref: null,
      };
    case 'PullRequestReviewEvent':
      return {
        type: 'review',
        message: `${event.payload.review?.state}: ${event.payload.pull_request?.title ?? ''}`,
        ref: null,
      };
    case 'CreateEvent':
      return {
        type: 'create',
        message: `Created ${event.payload.ref_type ?? 'ref'}`,
        ref: event.payload.ref ?? null,
      };
    case 'DeleteEvent':
      return {
        type: 'delete',
        message: `Deleted ${event.payload.ref_type ?? 'ref'}`,
        ref: event.payload.ref ?? null,
      };
    default:
      return { type: event.type.replace('Event', '').toLowerCase(), message: null, ref: null };
  }
}

export async function syncGitHub(db: Database, env: GitHubSyncEnv): Promise<SyncResult> {
  const { GITHUB_TOKEN: token, GITHUB_USERNAME: username } = env;

  if (!token || !username) {
    return { contributions: 0, repos: 0, events: 0, languages: 0, error: 'Missing GITHUB_TOKEN or GITHUB_USERNAME' };
  }

  let contribCount = 0;
  let repoCount = 0;
  let eventCount = 0;
  let langCount = 0;

  try {
    // Sync contributions
    const contributions = await fetchContributions(token, username);
    const CONTRIB_BATCH = 25; // 3 bindings per row
    for (let i = 0; i < contributions.length; i += CONTRIB_BATCH) {
      const batch = contributions.slice(i, i + CONTRIB_BATCH);
      await db
        .insert(githubContributions)
        .values(batch.map((c) => ({ date: c.date, count: c.contributionCount })))
        .onConflictDoUpdate({
          target: githubContributions.date,
          set: { count: githubContributions.count },
        });
      contribCount += batch.length;
    }

    // Sync repos
    const repos = await fetchRepos(token, username);
    for (const r of repos) {
      await db
        .insert(githubRepos)
        .values({
          name: r.name,
          fullName: r.full_name,
          description: r.description,
          url: r.html_url,
          language: r.language,
          stars: r.stargazers_count,
          forks: r.forks_count,
          isArchived: r.archived,
          isFork: r.fork,
          updatedAt: r.updated_at,
          pushedAt: r.pushed_at,
        })
        .onConflictDoUpdate({
          target: githubRepos.fullName,
          set: {
            description: githubRepos.description,
            url: githubRepos.url,
            language: githubRepos.language,
            stars: githubRepos.stars,
            forks: githubRepos.forks,
            isArchived: githubRepos.isArchived,
            isFork: githubRepos.isFork,
            updatedAt: githubRepos.updatedAt,
            pushedAt: githubRepos.pushedAt,
          },
        });
      repoCount++;
    }

    // Sync languages per repo (non-fork, non-archived only)
    const activeRepos = repos.filter((r) => !r.fork && !r.archived);
    for (const r of activeRepos) {
      const [owner] = r.full_name.split('/');
      const languages = await fetchRepoLanguages(token, owner!, r.name);
      for (const [lang, bytes] of Object.entries(languages)) {
        await db
          .insert(githubLanguages)
          .values({ repoName: r.full_name, language: lang, bytes })
          .onConflictDoUpdate({
            target: [githubLanguages.repoName, githubLanguages.language],
            set: { bytes: githubLanguages.bytes },
          });
        langCount++;
      }
    }

    // Sync events
    const events = await fetchEvents(token, username);
    const EVENTS_BATCH = 12; // 5 bindings per row
    for (let i = 0; i < events.length; i += EVENTS_BATCH) {
      const batch = events.slice(i, i + EVENTS_BATCH);
      const rows = batch.map((e) => {
        const parsed = parseEventType(e);
        return {
          type: parsed.type,
          repo: e.repo.name,
          message: parsed.message,
          ref: parsed.ref,
          timestamp: e.created_at,
        };
      });
      await db.insert(githubEvents).values(rows).onConflictDoNothing();
      eventCount += rows.length;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[sync-github]', msg);
    return { contributions: contribCount, repos: repoCount, events: eventCount, languages: langCount, error: msg };
  }

  console.log(`[sync-github] contributions=${contribCount} repos=${repoCount} events=${eventCount} languages=${langCount}`);
  return { contributions: contribCount, repos: repoCount, events: eventCount, languages: langCount };
}
