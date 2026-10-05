/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Runtime <head> manager for the SPA.
 *
 * The static tags in index.html cover crawlers that never execute JavaScript.
 * This component re-writes them per route so every page gets its own title,
 * description, canonical URL and Open Graph payload, and so the signed-in
 * application surface is explicitly noindexed.
 */

export const SITE_ORIGIN = 'https://linekora.com';

/** Absolute URL for a route path, used for canonical + og:url. */
export const absoluteUrl = (path: string) =>
  `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;

type Attr = 'name' | 'property';

/**
 * Creates the tag if missing, otherwise updates it in place so we never
 * accumulate duplicate meta elements across client-side navigations.
 */
const setMeta = (attr: Attr, key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

interface SeoProps {
  /** Page title. Appended to the brand unless it is the home page. */
  title: string;
  description: string;
  /** Route path used for the canonical URL. Defaults to the current location. */
  path?: string;
  /** Keep the page out of the index — used for auth, dashboard and admin. */
  noindex?: boolean;
  /** Extra structured data merged into a JSON-LD script tag. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Absolute or root-relative social share image. */
  image?: string;
}

export default function Seo({
  title,
  description,
  path,
  noindex = false,
  jsonLd,
  image = '/linekora-logo.png',
}: SeoProps) {
  const routePath = path ?? `${window.location.pathname}${window.location.search}`;

  useEffect(() => {
    const url = absoluteUrl(routePath);
    const fullTitle = routePath === '/' ? title : `${title} | LINEKORA`;
    const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

    document.title = fullTitle;

    setMeta('name', 'description', description);
    setLink('canonical', url);

    setMeta(
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', imageUrl);
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);
  }, [title, description, routePath, noindex, image]);

  // Structured data is rendered per page, so the tag is replaced rather than
  // merged — otherwise navigating around would stack duplicate JSON-LD blocks.
  useEffect(() => {
    const ID = 'linekora-page-jsonld';
    document.getElementById(ID)?.remove();
    if (!jsonLd) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = ID;
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }, [jsonLd]);

  return null;
}

/** Routes that belong in search results. Everything else is application surface. */
const PUBLIC_PATHS = new Set(['/', '/about', '/pricing', '/contact', '/scams', '/legal']);

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.has(pathname.replace(/\/+$/, '') || '/');

/**
 * Keeps auth, dashboard and admin routes out of the index.
 *
 * Rendering `<Seo noindex>` on ~40 individual routes is easy to forget when a
 * route is added later, so this watches the location once and covers the whole
 * signed-in surface. Public pages are left alone so the per-page `<Seo>`
 * components keep their own directives.
 */
export function RouteIndexGuard() {
  const location = useLocation();

  useEffect(() => {
    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!robots || isPublicPath(location.pathname)) return;

    robots.setAttribute('content', 'noindex, nofollow');
  }, [location.pathname]);

  return null;
}