import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/Header";

interface WebsiteCheck {
  id: string;
  url: string;
  domain: string;
  status: string;
  status_code: number | null;
  response_time_ms: number | null;
  checked_at: string;
}

const RecentChecks = () => {
  const [checks, setChecks] = useState<WebsiteCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChecks = async () => {
    const { data } = await supabase
      .from("website_checks")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(20);

    if (data) setChecks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchChecks();
    const interval = setInterval(fetchChecks, 300000); // 5 min
    return () => clearInterval(interval);
  }, []);

  const domainToSlug = (domain: string) => domain.replace(/\./g, "-");

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Recent Website Checks – Website Status Checker"
        description="View recently checked websites and their current status, response times, and HTTP codes."
        path="/recent"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Recent Website Checks",
          description: "Recently checked websites and their availability status.",
        }}
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold mb-6">Recent Checks</h1>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : checks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No checks yet. Go check a website!</p>
            <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">
              Check a website →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {checks.map((check) => {
              const isUp = check.status === "up";
              return (
                <Link
                  key={check.id}
                  to={`/website/${domainToSlug(check.domain)}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isUp ? (
                      <CheckCircle2 className="h-5 w-5 text-status-up shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-status-down shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium truncate">
                        {check.domain}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(check.checked_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground font-mono">
                      <span>{check.status_code ?? "—"}</span>
                      <span>{check.response_time_ms ?? "—"}ms</span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isUp
                          ? "bg-status-up-bg text-status-up"
                          : "bg-status-down-bg text-status-down"
                      }`}
                    >
                      {isUp ? "Up" : "Down"}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>Website Status Checker — Check any site's availability instantly</p>
      </footer>
    </div>
  );
};

export default RecentChecks;
