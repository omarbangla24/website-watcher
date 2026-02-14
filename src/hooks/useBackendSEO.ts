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

const useBackendSEO = () => {
  const location = useLocation();
  const [meta, setMeta] = useState<SEOMeta | null>(null);

  useEffect(() => {
    // Skip admin pages
    if (location.pathname.startsWith("/admin")) return;

    const fetchMeta = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("seo-meta", {
          body: { path: location.pathname },
        });
        if (!error && data && !data.error) {
          setMeta(data as SEOMeta);
          applyMeta(data as SEOMeta);
        }
      } catch {
        // Silently fail - client-side SEOHead is fallback
      }
    };

    fetchMeta();
  }, [location.pathname]);

  return meta;
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
