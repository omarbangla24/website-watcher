import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const domain = parsedUrl.hostname.replace(/^www\./, "");
    const startTime = Date.now();
    let status = "down";
    let statusCode: number | null = null;
    let errorMessage: string | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(targetUrl, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      
      clearTimeout(timeout);
      statusCode = response.status;
      status = response.ok || response.status < 400 ? "up" : "down";
    } catch (err) {
      // Try GET as fallback (some servers block HEAD)
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(targetUrl, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
        });
        
        clearTimeout(timeout);
        statusCode = response.status;
        status = response.ok || response.status < 400 ? "up" : "down";
      } catch (getErr) {
        errorMessage = getErr instanceof Error ? getErr.message : "Connection failed";
        status = "down";
      }
    }

    const responseTimeMs = Date.now() - startTime;

    // Store in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("website_checks")
      .insert({
        url: targetUrl,
        domain,
        status,
        status_code: statusCode,
        response_time_ms: responseTimeMs,
        error_message: errorMessage,
      })
      .select()
      .single();

    if (error) {
      console.error("DB insert error:", error);
    }

    return new Response(
      JSON.stringify({
        id: data?.id,
        url: targetUrl,
        domain,
        status,
        status_code: statusCode,
        response_time_ms: responseTimeMs,
        error_message: errorMessage,
        checked_at: data?.checked_at || new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
