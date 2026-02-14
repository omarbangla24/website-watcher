import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import StatusResult from "@/components/StatusResult";
import Header from "@/components/Header";

interface WebsiteCheck {
  id: string;
  url: string;
  domain: string;
  status: string;
  status_code: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: string;
}

const WebsiteStatus = () => {
  const { domain: domainSlug } = useParams<{ domain: string }>();
  const [checks, setChecks] = useState<WebsiteCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const domain = domainSlug?.replace(/-/g, ".") || "";

  useEffect(() => {
    const fetchChecks = async () => {
      // Try exact match, then try with dots replaced
      const { data } = await supabase
        .from("website_checks")
        .select("*")
        .eq("domain", domain)
        .order("checked_at", { ascending: false })
        .limit(10);

      if (data) setChecks(data);
      setLoading(false);
    };

    if (domain) fetchChecks();
  }, [domain]);

  const latest = checks[0];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title={`Check Status of ${domain} – Website Status Checker`}
        description={`Current status of ${domain}. ${
          latest
            ? latest.status === "up"
              ? `${domain} is up with HTTP ${latest.status_code}.`
              : `${domain} appears to be down.`
            : `Check if ${domain} is up or down.`
        }`}
        path={`/website/${domainSlug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `Status of ${domain}`,
          description: `Check the current status and availability of ${domain}.`,
          mainEntity: {
            "@type": "WebSite",
            name: domain,
            url: `https://${domain}`,
          },
        }}
      />
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10 max-w-2xl">
        <Link
          to="/recent"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to recent checks
        </Link>

        <h1 className="text-3xl font-extrabold mb-6">
          Status of <span className="font-mono text-primary">{domain}</span>
        </h1>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : checks.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>No checks found for this domain.</p>
            <Link to="/" className="text-primary hover:underline text-sm mt-2 inline-block">
              Check it now →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Latest */}
            {latest && (
              <StatusResult
                url={latest.url}
                domain={latest.domain}
                status={latest.status as "up" | "down"}
                statusCode={latest.status_code}
                responseTimeMs={latest.response_time_ms ?? 0}
                checkedAt={latest.checked_at}
                errorMessage={latest.error_message}
              />
            )}

            {/* History */}
            {checks.length > 1 && (
              <section>
                <h2 className="text-lg font-bold mb-3">Check History</h2>
                <div className="space-y-2" role="list" aria-label="Previous check results">
                  {checks.slice(1).map((check) => (
                    <article
                      key={check.id}
                      role="listitem"
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            check.status === "up" ? "bg-status-up" : "bg-status-down"
                          }`}
                        />
                        <span className="font-mono text-xs">
                          {check.status_code ?? "—"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {check.response_time_ms ?? "—"}ms
                        </span>
                      </div>
                      <time className="text-xs text-muted-foreground" dateTime={check.checked_at}>
                        {new Date(check.checked_at).toLocaleString()}
                      </time>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>Website Status Checker — Check any site's availability instantly</p>
      </footer>
    </div>
  );
};

export default WebsiteStatus;
