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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the site base URL from request or fallback
    const url = new URL(req.url);
    const siteUrl = url.searchParams.get("base_url") || "https://checksiteisonlinecom.lovable.app";

    // Fetch unique domains from website_checks
    const { data: checks } = await supabase
      .from("website_checks")
      .select("domain, checked_at")
      .order("checked_at", { ascending: false })
      .limit(1000);

    // Deduplicate domains, keep latest checked_at
    const domainMap = new Map<string, string>();
    checks?.forEach((check) => {
      if (!domainMap.has(check.domain)) {
        domainMap.set(check.domain, check.checked_at);
      }
    });

    const today = new Date().toISOString().slice(0, 10);

    // Build sitemap XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/recent</loc>
    <lastmod>${today}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>`;

    for (const [domain, checkedAt] of domainMap) {
      const slug = domain.replace(/\./g, "-");
      const lastmod = checkedAt.slice(0, 10);
      xml += `
  <url>
    <loc>${siteUrl}/website/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
        },
      }
    );
  }
});
