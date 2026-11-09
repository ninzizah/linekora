import { next } from '@vercel/functions';

/**
 * Routing Middleware: job link previews for social crawlers.
 *
 * WhatsApp, Facebook, Telegram, etc. do not execute JavaScript, so they only
 * see the static Open Graph tags in index.html. For `/jobs/:id` we detect those
 * crawlers and return a tiny HTML page with job-specific OG tags (including the
 * employer/company avatar). Everyone else continues to the React app unchanged.
 */

const SITE_ORIGIN = 'https://linekora.com';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/linekora-logo.png`;
const API_BASE =
  process.env.JOB_PREVIEW_API_URL ||
  process.env.VITE_API_URL ||
  'https://linekora-backend.vercel.app/api';

const CRAWLER_RE =
  /whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterestbot|redditbot|embedly|quora link preview|vkShare|W3C_Validator|Snapchat|viber|linebot/i;

interface PreviewJob {
  id: number;
  title?: string;
  description?: string;
  salary?: string;
  location?: string;
  category?: string;
  employer?: {
    displayName?: string;
    avatarUrl?: string;
  };
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });

const absoluteImage = (value?: string): string => {
  if (!value) return DEFAULT_IMAGE;
  // Only public, reasonably short URLs work for link previews. Data URLs and
  // private/auth-gated URLs are ignored so we fall back to the brand logo.
  if (value.length > 2048) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/')) return `${SITE_ORIGIN}${value}`;
  return DEFAULT_IMAGE;
};

const renderPreview = (job: PreviewJob): string => {
  const company = job.employer?.displayName || 'LINEKORA';
  const title = job.title || 'Job opportunity';
  const meta = [job.location, job.salary, job.category].filter(Boolean).join(' • ');
  const description = `${title} at ${company}${meta ? ` — ${meta}` : ''}. Apply on LINEKORA.`;
  const url = `${SITE_ORIGIN}/jobs/${job.id}`;
  const image = absoluteImage(job.employer?.avatarUrl);
  const fullTitle = `${title} | LINEKORA`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(fullTitle)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="robots" content="noindex, nofollow" />
<link rel="canonical" href="${escapeHtml(url)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="LINEKORA" />
<meta property="og:title" content="${escapeHtml(fullTitle)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:alt" content="${escapeHtml(company)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(fullTitle)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body>
<h1>${escapeHtml(fullTitle)}</h1>
<p>${escapeHtml(description)}</p>
<p><a href="${escapeHtml(url)}">View this job on LINEKORA</a></p>
</body>
</html>`;
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';

  if (!CRAWLER_RE.test(userAgent)) {
    return next();
  }

  const match = url.pathname.match(/^\/jobs\/(\d+)\/?$/);
  if (!match) {
    return next();
  }

  const jobId = match[1];

  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
      headers: { accept: 'application/json' },
    });
    if (!res.ok) return next();

    const job = (await res.json()) as PreviewJob;
    if (!job || !job.id) return next();

    return new Response(renderPreview(job), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    console.error('[job-preview] failed to render preview', err);
    return next();
  }
}

export const config = {
  matcher: '/jobs/:path*',
};
