import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEOHead from "@/components/SEOHead";
import StatusResult from "@/components/StatusResult";
import Header from "@/components/Header";

interface CheckResult {
  id: string;
  url: string;
  domain: string;
  status: "up" | "down";
  status_code: number | null;
  response_time_ms: number;
  checked_at: string;
  error_message?: string | null;
}

const EXAMPLE_URLS = ["google.com", "github.com", "example.com"];

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (targetUrl?: string) => {
    const checkUrl = targetUrl || url;
    if (!checkUrl.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("check-website", {
        body: { url: checkUrl.trim() },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setResult(data as CheckResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check website");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Website Status Checker – Is Your Site Up?"
        description="Instantly check if any website is up or down. Get HTTP status codes, response times, and real-time availability reports."
        path="/"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Website Status Checker",
          description: "Check if any website is up or down instantly.",
          applicationCategory: "UtilityApplication",
          operatingSystem: "Web",
        }}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 pt-16 pb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Is it down right now?
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto mb-10">
            Check any website's status instantly. Get response codes, latency, and uptime info.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheck();
            }}
            className="max-w-xl mx-auto flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter a website URL (e.g. google.com)"
                className="w-full rounded-xl border border-input bg-card pl-10 pr-4 py-3.5 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Check Status"
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Try:</span>
            {EXAMPLE_URLS.map((ex) => (
              <button
                key={ex}
                onClick={() => {
                  setUrl(ex);
                  handleCheck(ex);
                }}
                className="text-xs font-mono text-primary hover:underline"
              >
                {ex}
              </button>
            ))}
          </div>
        </section>

        {/* Result */}
        <section className="container mx-auto px-4 pb-16 max-w-xl">
          {error && (
            <div className="rounded-xl border-2 border-status-down/30 bg-status-down-bg p-4 text-center text-sm text-status-down">
              {error}
            </div>
          )}
          {result && (
            <StatusResult
              url={result.url}
              domain={result.domain}
              status={result.status}
              statusCode={result.status_code}
              responseTimeMs={result.response_time_ms}
              checkedAt={result.checked_at}
              errorMessage={result.error_message}
            />
          )}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>Website Status Checker — Check any site's availability instantly</p>
      </footer>
    </div>
  );
};

export default Index;
