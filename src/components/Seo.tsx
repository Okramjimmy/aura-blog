/**
 * Seo — React 19 native metadata hoisting
 *
 * React 19 automatically moves <title>, <meta>, and <link> rendered anywhere
 * in the component tree into <head>. No react-helmet needed.
 *
 * JSON-LD is rendered inline (Google supports it in <body>).
 */

const SITE_NAME = 'Aura';
const SITE_URL = 'https://aura.okram.co.in';
const AUTHOR = 'Okram Jimmy Singh';
const TWITTER_HANDLE = '@okramjimmy';
const DEFAULT_DESCRIPTION =
  'Personal blog and portfolio of Okram Jimmy Singh — essays on software engineering, machine learning, design, and building with intention.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export { SITE_URL, SITE_NAME, AUTHOR };

interface ArticleMeta {
  publishedTime: string;
  modifiedTime?: string;
  tags?: string[];
}

interface SeoProps {
  title?: string;           // page title — gets appended "| Aura"
  description?: string;
  canonical?: string;       // path only, e.g. "/blog/my-post"
  ogType?: 'website' | 'article';
  ogImage?: string;         // full URL
  article?: ArticleMeta;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

export default function Seo({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage,
  article,
  noindex = false,
  jsonLd,
}: SeoProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — ${AUTHOR}`;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const image = ogImage || DEFAULT_OG_IMAGE;

  return (
    <>
      {/* Core */}
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta name="author" content={AUTHOR} />
      <meta name="robots" content={noindex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large'} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />

      {/* Article-specific OG */}
      {article && ogType === 'article' && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          <meta property="article:author" content={AUTHOR} />
          {article.tags?.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* JSON-LD structured data — Google supports inline in <body> */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  );
}
