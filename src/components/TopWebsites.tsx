import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface SiteStatus {
  domain: string;
  label: string;
  status: "up" | "down" | "checking" | "idle";
  statusCode: number | null;
  responseTimeMs: number | null;
}

const TOP_SITES: { domain: string; label: string }[] = [
  { domain: "facebook.com", label: "Is Facebook Down?" },
  { domain: "youtube.com", label: "Is YouTube Down?" },
  { domain: "instagram.com", label: "Is Instagram Down?" },
  { domain: "twitter.com", label: "Is Twitter/X Down?" },
  { domain: "whatsapp.com", label: "Is WhatsApp Down?" },
  { domain: "tiktok.com", label: "Is TikTok Down?" },
  { domain: "reddit.com", label: "Is Reddit Down?" },
  { domain: "netflix.com", label: "Is Netflix Down?" },
  { domain: "amazon.com", label: "Is Amazon Down?" },
  { domain: "google.com", label: "Is Google Down?" },
];

const TopWebsites = () => {
  const [sites, setSites] = useState<SiteStatus[]>(
    TOP_SITES.map((s) => ({
      ...s,
      status: "idle",
      statusCode: null,
      responseTimeMs: null,
    }))
  );
  const [checkingAll, setCheckingAll] = useState(false);

  const checkSite = async (domain: string) => {
    setSites((prev) =>
      prev.map((s) =>
        s.domain === domain ? { ...s, status: "checking" } : s
      )
    );

    try {
      const { data, error } = await supabase.functions.invoke("check-website", {
        body: { url: domain },
      });

      if (error || data?.error) {
        setSites((prev) =>
          prev.map((s) =>
            s.domain === domain
              ? { ...s, status: "down", statusCode: null, responseTimeMs: null }
              : s
          )
        );
        return;
      }

      setSites((prev) =>
        prev.map((s) =>
          s.domain === domain
            ? {
                ...s,
                status: data.status as "up" | "down",
                statusCode: data.status_code,
                responseTimeMs: data.response_time_ms,
              }
            : s
        )
      );
    } catch {
      setSites((prev) =>
        prev.map((s) =>
          s.domain === domain
            ? { ...s, status: "down", statusCode: null, responseTimeMs: null }
            : s
        )
      );
    }
  };

  const checkAll = async () => {
    setCheckingAll(true);
    // Check sequentially to avoid overwhelming the edge function
    for (const site of TOP_SITES) {
      await checkSite(site.domain);
    }
    setCheckingAll(false);
  };

  useEffect(() => {
    checkAll();
  }, []);

  const domainToSlug = (d: string) => d.replace(/\./g, "-");

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold">Top 10 Website Status</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status of the most popular websites
          </p>
        </div>
        <button
          onClick={checkAll}
          disabled={checkingAll}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checkingAll ? "animate-spin" : ""}`} />
          Refresh All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sites.map((site) => (
          <Link
            key={site.domain}
            to={`/website/${domainToSlug(site.domain)}`}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all group"
          >
            <div className="flex items-center gap-3">
              {site.status === "checking" ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
              ) : site.status === "up" ? (
                <CheckCircle2 className="h-5 w-5 text-status-up shrink-0" />
              ) : site.status === "down" ? (
                <XCircle className="h-5 w-5 text-status-down shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-border shrink-0" />
              )}
              <div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {site.label}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {site.domain}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {site.status === "checking" ? (
                <span className="text-xs text-muted-foreground">Checking...</span>
              ) : site.status !== "idle" ? (
                <>
                  <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                    {site.responseTimeMs ?? "—"}ms
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      site.status === "up"
                        ? "bg-status-up-bg text-status-up"
                        : "bg-status-down-bg text-status-down"
                    }`}
                  >
                    {site.status === "up" ? "✅ Up" : "❌ Down"}
                  </span>
                </>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TopWebsites;
