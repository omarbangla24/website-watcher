import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SEOMeta {
  title: string;
  description: string;
  ogType: string;
  canonical: string;
  structuredData: Record<string, unknown>;
  ogImage: string;
  siteName: string;
}

interface SiteSettings {
  [key: string]: string;
}

const useBackendSEO = () => {
  const location = useLocation();
  const [meta, setMeta] = useState<SEOMeta | null>(null);

  useEffect(() => {
    // Skip admin pages
    if (location.pathname.startsWith("/admin")) return;

    const fetchAll = async () => {
      // Fetch site_settings and backend SEO meta in parallel
      const [settingsResult, metaResult] = await Promise.all([
        supabase.from("site_settings").select("key, value"),
        supabase.functions.invoke("seo-meta", { body: { path: location.pathname } }).catch(() => ({ data: null, error: true })),
      ]);

      // Apply site_settings (verification tags, favicon, analytics, custom code)
      if (settingsResult.data) {
        const settings: SiteSettings = {};
        settingsResult.data.forEach((row: { key: string; value: string | null }) => {
          if (row.value) settings[row.key] = row.value;
        });
        applySiteSettings(settings);
      }

      // Apply backend SEO meta
      if (metaResult.data && !metaResult.error) {
        const seoData = metaResult.data as SEOMeta;
        setMeta(seoData);
        applyMeta(seoData);
      }
    };

    fetchAll();
  }, [location.pathname]);

  return meta;
};

const applySiteSettings = (settings: SiteSettings) => {
  const setMetaTag = (attr: string, key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  // Google verification
  if (settings.google_verification) {
    setMetaTag("name", "google-site-verification", settings.google_verification);
  }

  // Bing verification
  if (settings.bing_verification) {
    setMetaTag("name", "msvalidate.01", settings.bing_verification);
  }

  // Override keywords if set
  if (settings.site_keywords) {
    setMetaTag("name", "keywords", settings.site_keywords);
  }

  // Override robots if set
  if (settings.robots_meta) {
    setMetaTag("name", "robots", settings.robots_meta);
  }

  // Favicon
  if (settings.favicon_url) {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.appendChild(favicon);
    }
    favicon.href = settings.favicon_url;
  }

  // Google Analytics
  if (settings.google_analytics_id) {
    const gaId = settings.google_analytics_id;
    if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${gaId}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      const inlineScript = document.createElement("script");
      inlineScript.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
      document.head.appendChild(inlineScript);
    }
  }

  // Custom head code
  if (settings.custom_head_code) {
    let customEl = document.getElementById("admin-custom-head");
    if (!customEl) {
      customEl = document.createElement("div");
      customEl.id = "admin-custom-head";
      document.head.appendChild(customEl);
    }
    customEl.innerHTML = settings.custom_head_code;
  }
};

const applyMeta = (meta: SEOMeta) => {
  document.title = meta.title;

  const setMetaTag = (attr: string, key: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  setMetaTag("name", "description", meta.description);
  setMetaTag("property", "og:title", meta.title);
  setMetaTag("property", "og:description", meta.description);
  setMetaTag("property", "og:type", meta.ogType);
  setMetaTag("property", "og:image", meta.ogImage);
  setMetaTag("property", "og:site_name", meta.siteName);
  setMetaTag("property", "og:url", meta.canonical);
  setMetaTag("name", "twitter:title", meta.title);
  setMetaTag("name", "twitter:description", meta.description);
  setMetaTag("name", "twitter:image", meta.ogImage);

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = meta.canonical;

  // Structured data
  let script = document.getElementById("backend-structured-data") as HTMLScriptElement;
  if (!script) {
    script = document.createElement("script");
    script.id = "backend-structured-data";
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(meta.structuredData);
};

export default useBackendSEO;
