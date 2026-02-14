import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  structuredData?: Record<string, unknown>;
}

const SEOHead = ({ title, description, path, structuredData }: SEOHeadProps) => {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setOgMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setOgMeta("og:title", title);
    setOgMeta("og:description", description);
    setOgMeta("og:type", "website");

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + path;

    // Structured data
    if (structuredData) {
      let script = document.getElementById("structured-data") as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.id = "structured-data";
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    return () => {
      const script = document.getElementById("structured-data");
      if (script) script.remove();
    };
  }, [title, description, path, structuredData]);

  return null;
};

export default SEOHead;
