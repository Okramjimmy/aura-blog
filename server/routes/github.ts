import { Router, Request, Response } from 'express';

const router = Router();
const GITHUB_USER = 'Okramjimmy';
const GITHUB_API = 'https://api.github.com';
const CACHE_TTL_MS = 5 * 60 * 1000;        // 5 minutes for REST data
const CONTRIB_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour for contributions

// Simple in-memory cache
const cache: Record<string, { data: any; ts: number }> = {};

function bustAllCaches() {
  Object.keys(cache).forEach(k => delete cache[k]);
}

// ─── Authenticated REST fetch with per-path cache ─────────────────────────────
async function ghFetch(
  path: string,
): Promise<{ data: any; status: number; rateLimitRemaining: number }> {
  const cached = cache[path];
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { data: cached.data, status: 200, rateLimitRemaining: -1 };
  }

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'organic-minimalism-blog',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${GITHUB_API}${path}`, { headers });
  const rateLimitRemaining = parseInt(res.headers.get('x-ratelimit-remaining') ?? '60', 10);

  if (res.status === 403 || res.status === 429) {
    const reset = res.headers.get('x-ratelimit-reset');
    const resetAt = reset ? new Date(parseInt(reset, 10) * 1000).toLocaleTimeString() : 'soon';
    throw Object.assign(
      new Error(`GitHub rate limit exceeded. Resets at ${resetAt}. Set GITHUB_TOKEN for 5,000 req/hr.`),
      { status: 429 },
    );
  }
  if (res.status === 404) {
    throw Object.assign(new Error(`GitHub user "${GITHUB_USER}" not found.`), { status: 404 });
  }
  if (!res.ok) {
    throw Object.assign(
      new Error(`GitHub API error: ${res.status} ${res.statusText}`),
      { status: res.status },
    );
  }

  const data = await res.json();
  cache[path] = { data, ts: Date.now() };
  return { data, status: res.status, rateLimitRemaining };
}

// ─── Paginate through all repos (caches assembled result) ─────────────────────
async function fetchAllRepos(bust = false): Promise<{ repos: any[]; rateLimitRemaining: number }> {
  const cacheKey = `__all_repos_${GITHUB_USER}`;
  if (!bust) {
    const cached = cache[cacheKey];
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return { repos: cached.data, rateLimitRemaining: -1 };
    }
  }

  const allRepos: any[] = [];
  let page = 1;
  let rateLimitRemaining = 60;

  while (true) {
    const path = `/users/${GITHUB_USER}/repos?sort=updated&per_page=100&page=${page}&type=public`;
    const { data, rateLimitRemaining: rl } = await ghFetch(path);
    rateLimitRemaining = rl;
    if (!Array.isArray(data) || data.length === 0) break;
    allRepos.push(...data);
    if (data.length < 100) break; // last page
    page++;
  }

  cache[cacheKey] = { data: allRepos, ts: Date.now() };
  return { repos: allRepos, rateLimitRemaining };
}

// ─── GET /api/v1/github — profile + all repos + events ───────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const bust = req.query.bust === '1';
    if (bust) bustAllCaches();

    const [profileRes, eventsRes, { repos: rawRepos, rateLimitRemaining }] = await Promise.all([
      ghFetch(`/users/${GITHUB_USER}`),
      ghFetch(`/users/${GITHUB_USER}/events/public?per_page=30`),
      fetchAllRepos(bust),
    ]);

    const repos: any[] = rawRepos
      .filter((r: any) => !r.fork)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        html_url: r.html_url,
        language: r.language,
        stargazers_count: r.stargazers_count,
        forks_count: r.forks_count,
        open_issues_count: r.open_issues_count,
        topics: r.topics ?? [],
        updated_at: r.updated_at,
        created_at: r.created_at,
        is_fork: r.fork,
        visibility: r.visibility,
        default_branch: r.default_branch,
      }));

    const languages = [...new Set(repos.map((r) => r.language).filter(Boolean))].sort() as string[];

    const highlights = [...repos]
      .sort(
        (a, b) =>
          b.stargazers_count - a.stargazers_count ||
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      .slice(0, 6);

    const activity = (eventsRes.data as any[]).slice(0, 20).map((e: any) => {
      let summary = '';
      switch (e.type) {
        case 'PushEvent':
          summary = `Pushed ${e.payload?.commits?.length ?? 1} commit(s) to ${e.repo?.name}`;
          break;
        case 'CreateEvent':
          summary = `Created ${e.payload?.ref_type} in ${e.repo?.name}`;
          break;
        case 'PullRequestEvent':
          summary = `${e.payload?.action} PR in ${e.repo?.name}: "${e.payload?.pull_request?.title}"`;
          break;
        case 'IssuesEvent':
          summary = `${e.payload?.action} issue in ${e.repo?.name}: "${e.payload?.issue?.title}"`;
          break;
        case 'WatchEvent':
          summary = `Starred ${e.repo?.name}`;
          break;
        case 'ForkEvent':
          summary = `Forked ${e.repo?.name}`;
          break;
        case 'ReleaseEvent':
          summary = `Released ${e.payload?.release?.tag_name} in ${e.repo?.name}`;
          break;
        default:
          summary = `${e.type.replace('Event', '')} on ${e.repo?.name}`;
      }
      return {
        id: e.id,
        type: e.type,
        repo: e.repo?.name,
        repo_url: `https://github.com/${e.repo?.name}`,
        summary,
        created_at: e.created_at,
      };
    });

    res.json({
      profile: {
        login: profileRes.data.login,
        name: profileRes.data.name,
        bio: profileRes.data.bio,
        avatar_url: profileRes.data.avatar_url,
        html_url: profileRes.data.html_url,
        public_repos: profileRes.data.public_repos,
        followers: profileRes.data.followers,
        following: profileRes.data.following,
        location: profileRes.data.location,
        blog: profileRes.data.blog,
        created_at: profileRes.data.created_at,
      },
      repos,
      highlights,
      activity,
      languages,
      total_repos: repos.length,
      cached: rateLimitRemaining === -1,
      rate_limit_remaining: rateLimitRemaining,
    });
  } catch (err: any) {
    console.error('[github]', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── GET /api/v1/github/contributions — GraphQL contribution calendar ─────────
router.get('/contributions', async (req: Request, res: Response) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      res.status(403).json({
        error:
          'GITHUB_TOKEN environment variable is required for contribution data. ' +
          'The GitHub GraphQL API requires authentication. ' +
          'Add GITHUB_TOKEN=ghp_... to your .env.local file.',
      });
      return;
    }

    const bust = req.query.bust === '1';
    const cacheKey = `__contributions_${GITHUB_USER}`;
    if (!bust) {
      const cached = cache[cacheKey];
      if (cached && Date.now() - cached.ts < CONTRIB_CACHE_TTL_MS) {
        res.json({ ...cached.data, cached: true });
        return;
      }
    }

    const to = new Date();
    const from = new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);

    const query = `
      query($login: String!, $from: DateTime!, $to: DateTime!) {
        user(login: $login) {
          contributionsCollection(from: $from, to: $to) {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
              }
            }
          }
        }
      }
    `;

    const gqlRes = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'organic-minimalism-blog',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        query,
        variables: { login: GITHUB_USER, from: from.toISOString(), to: to.toISOString() },
      }),
    });

    if (!gqlRes.ok) {
      throw Object.assign(
        new Error(`GitHub GraphQL error: ${gqlRes.status} ${gqlRes.statusText}`),
        { status: gqlRes.status },
      );
    }

    const json = await gqlRes.json();
    if (json.errors?.length) {
      throw Object.assign(new Error(json.errors[0].message), { status: 422 });
    }

    const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
    if (!calendar) {
      throw new Error('No contribution data returned from GitHub GraphQL API.');
    }

    cache[cacheKey] = { data: calendar, ts: Date.now() };
    res.json({ ...calendar, cached: false });
  } catch (err: any) {
    console.error('[github/contributions]', err.message);
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
