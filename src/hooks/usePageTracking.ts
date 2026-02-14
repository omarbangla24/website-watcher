import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Don't track admin pages
    if (location.pathname.startsWith("/admin")) return;

    supabase.from("site_analytics").insert({
      page_path: location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    }).then(() => {
      // fire and forget
    });
  }, [location.pathname]);
};

export default usePageTracking;
