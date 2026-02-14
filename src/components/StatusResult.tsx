import { CheckCircle2, XCircle, Clock, Globe, Copy, Check } from "lucide-react";
import { useState } from "react";

interface StatusResultProps {
  url: string;
  domain: string;
  status: "up" | "down";
  statusCode: number | null;
  responseTimeMs: number;
  checkedAt: string;
  errorMessage?: string | null;
}

const StatusResult = ({
  url,
  domain,
  status,
  statusCode,
  responseTimeMs,
  checkedAt,
  errorMessage,
}: StatusResultProps) => {
  const [copied, setCopied] = useState(false);
  const isUp = status === "up";

  const copyReport = () => {
    const report = `Website Status Report
URL: ${url}
Status: ${isUp ? "✅ Up" : "❌ Down"}
HTTP Code: ${statusCode ?? "N/A"}
Response Time: ${responseTimeMs}ms
Checked: ${new Date(checkedAt).toLocaleString()}
${errorMessage ? `Error: ${errorMessage}` : ""}`;

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      aria-label={`Status of ${domain}: ${isUp ? "Up" : "Down"}`}
      itemScope
      itemType="https://schema.org/WebSite"
      className={`rounded-xl border-2 p-6 transition-all ${
        isUp
          ? "border-status-up/30 bg-status-up-bg"
          : "border-status-down/30 bg-status-down-bg"
      }`}
    >
      <meta itemProp="name" content={domain} />
      <meta itemProp="url" content={url} />
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {isUp ? (
            <CheckCircle2 className="h-10 w-10 text-status-up shrink-0" aria-hidden="true" />
          ) : (
            <XCircle className="h-10 w-10 text-status-down shrink-0" aria-hidden="true" />
          )}
          <div>
            <h2 className="text-xl font-bold">
              {isUp ? "Website is running" : "Website is down"}
            </h2>
            <p className="text-sm text-muted-foreground font-mono mt-0.5 break-all">
              {url}
            </p>
          </div>
        </div>
        <button
          onClick={copyReport}
          className="shrink-0 rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copy status report to clipboard"
        >
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      <dl className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-card/80 border border-border p-3">
          <Globe className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <dt className="text-xs text-muted-foreground">HTTP Status</dt>
            <dd className="font-mono font-semibold text-sm">
              {statusCode ?? "N/A"}
            </dd>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-card/80 border border-border p-3">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <dt className="text-xs text-muted-foreground">Response Time</dt>
            <dd className="font-mono font-semibold text-sm">{responseTimeMs}ms</dd>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-card/80 border border-border p-3">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <div>
            <dt className="text-xs text-muted-foreground">Last Checked</dt>
            <dd className="font-mono font-semibold text-sm">
              <time dateTime={checkedAt}>
                {new Date(checkedAt).toLocaleTimeString()}
              </time>
            </dd>
          </div>
        </div>
      </dl>

      {errorMessage && (
        <p className="mt-3 text-sm text-status-down font-mono bg-card/50 rounded-lg p-2 border border-status-down/20" role="alert">
          Error: {errorMessage}
        </p>
      )}
    </article>
  );
};

export default StatusResult;
