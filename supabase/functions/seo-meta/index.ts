import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { path } = await req.json();
    const siteUrl = "https://checksiteisonlinecom.lovable.app";
    const siteName = "Website Status Checker";

    // Default meta
    let title = `${siteName} – Is It Down Right Now?`;
    let description = "Free website status checker. Instantly check if Facebook, YouTube, Instagram or any website is down or up right now. Get HTTP status codes & response times.";
    let ogType = "website";
    let canonical = siteUrl + "/";
    let structuredData: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: siteName,
      description,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Web",
    };

    if (path === "/recent") {
      title = `Recent Website Checks – ${siteName}`;
      description = "View recently checked websites and their current status, response times, and HTTP codes. Real-time website downtime monitoring.";
      canonical = siteUrl + "/recent";
      structuredData = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Recent Website Checks",
        description,
        url: canonical,
      };
    } else if (path?.startsWith("/website/")) {
      const slug = path.replace("/website/", "");
      const domain = slug.replace(/-/g, ".");

      // Fetch latest status from DB
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: checks } = await supabase
        .from("website_checks")
        .select("status, status_code, checked_at")
        .eq("domain", domain)
        .order("checked_at", { ascending: false })
        .limit(1);

      const latest = checks?.[0];
      const statusText = latest
        ? latest.status === "up"
          ? `${domain} is UP (HTTP ${latest.status_code})`
          : `${domain} appears to be DOWN`
        : `Check if ${domain} is up or down`;

      title = `Is ${domain} Down? Check Status – ${siteName}`;
      description = `${statusText}. Check the current status and availability of ${domain}. Free real-time website downtime checker with HTTP status codes and response times.`;
      canonical = `${siteUrl}/website/${slug}`;
      ogType = "article";
      structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Status of ${domain}`,
        description,
        url: canonical,
        mainEntity: {
          "@type": "WebSite",
          name: domain,
          url: `https://${domain}`,
        },
      };
    }

    return new Response(
      JSON.stringify({
        title,
        description,
        ogType,
        canonical,
        structuredData,
        ogImage: `${siteUrl}/og-default.png`,
        siteName,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300, s-maxage=300",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
