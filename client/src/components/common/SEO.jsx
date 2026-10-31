import { useEffect } from 'react';

const DEFAULT_TITLE = 'HIND TYRES AND ACCESSORIES – Top Brands | Best Prices | Expert Fitting';
const DEFAULT_DESCRIPTION = 'Authorized dealer for MRF, Apollo, Bridgestone, Michelin, Goodyear, CEAT & JK Tyre in Ramgarh Cantt, Jharkhand. 100% genuine tyres, 5-year warranty, 3D laser wheel alignment & express fitting.';
const BASE_URL = 'https://hind-tyre.vercel.app';
const DEFAULT_IMAGE = `${BASE_URL}/images/hero_tyre_workshop.jpg`;

/**
 * Reusable SEO Manager Component
 * Dynamically synchronizes document head, canonicals, social meta tags, and JSON-LD schema
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalUrl,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  structuredData = null,
}) {
  useEffect(() => {
    // 1. Title
    const fullTitle = title
      ? title.includes('HIND TYRES')
        ? title
        : `${title} | HIND TYRES AND ACCESSORIES`
      : DEFAULT_TITLE;
    document.title = fullTitle;

    // Helper to update or create meta tags
    const setMeta = (attr, key, content) => {
      let tag = document.querySelector(`meta[${attr}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 2. Primary Meta Tags
    setMeta('name', 'description', description);
    setMeta(
      'name',
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // 3. Canonical URL
    const canonicalHref = canonicalUrl || (window.location.origin + window.location.pathname);
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', canonicalHref);

    // 4. Open Graph Tags
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalHref);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:site_name', 'HIND TYRES AND ACCESSORIES');
    setMeta('property', 'og:locale', 'en_IN');

    // 5. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);

    // 6. Structured Data (JSON-LD)
    const existingScript = document.getElementById('dynamic-jsonld-schema');
    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.id = 'dynamic-jsonld-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      // Clean up dynamic schema when unmounting
      const toRemove = document.getElementById('dynamic-jsonld-schema');
      if (toRemove) toRemove.remove();
    };
  }, [title, description, canonicalUrl, image, type, noindex, structuredData]);

  return null;
}

