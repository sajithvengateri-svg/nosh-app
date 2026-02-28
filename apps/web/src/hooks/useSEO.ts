import { useEffect } from "react";

interface SEOConfig {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
  hreflang?: { lang: string; href: string }[];
}

const ATTR = "data-seo";
const DEFAULT_OG_IMAGE = "https://chefos.ai/chefos-og.png";

function setTag(tag: string, attrs: Record<string, string>) {
  const selector = Object.entries(attrs)
    .map(([k, v]) => `[${k}="${v}"]`)
    .join("");
  let el = document.head.querySelector<HTMLElement>(`${tag}${selector}[${ATTR}]`);
  if (!el) {
    el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    el.setAttribute(ATTR, "managed");
    document.head.appendChild(el);
  }
  return el;
}

function setMeta(property: string, content: string) {
  const isName = property.startsWith("twitter:");
  const attrKey = isName ? "name" : "property";
  const el = setTag("meta", { [attrKey]: property });
  el.setAttribute("content", content);
}

function cleanup() {
  document.head.querySelectorAll(`[${ATTR}]`).forEach((el) => el.remove());
}

export function useSEO(config: SEOConfig) {
  useEffect(() => {
    const { title, description, ogTitle, ogDescription, ogImage, canonical, noindex, jsonLd, hreflang } = config;

    document.title = title;

    setMeta("description", description);
    setMeta("og:title", ogTitle || title);
    setMeta("og:description", ogDescription || description);
    setMeta("og:image", ogImage || DEFAULT_OG_IMAGE);
    setMeta("og:type", "website");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", ogTitle || title);
    setMeta("twitter:description", ogDescription || description);
    setMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE);

    if (canonical) {
      setMeta("og:url", canonical);
      const link = setTag("link", { rel: "canonical" });
      link.setAttribute("href", canonical);
    }

    if (noindex) {
      setMeta("robots", "noindex, nofollow");
    }

    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(ATTR, "managed");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    if (hreflang) {
      hreflang.forEach(({ lang, href }) => {
        const link = setTag("link", { rel: "alternate", hreflang: lang });
        link.setAttribute("href", href);
      });
    }

    return cleanup;
  }, [config.title, config.description, config.canonical]);
}
