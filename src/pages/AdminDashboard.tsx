import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Globe, TrendingUp, LogOut, Loader2, Eye, Clock, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import SEOHead from "@/components/SEOHead";

interface AnalyticsSummary {
  totalPageViews: number;
  todayPageViews: number;
  totalChecks: number;
  todayChecks: number;
  topPages: { path: string; count: number }[];
  topDomains: { domain: string; count: number }[];
  dailyViews: { date: string; views: number }[];
  dailyChecks: { date: string; checks: number }[];
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      await fetchAnalytics();
    };

    checkAuth();
  }, [navigate]);

  const fetchAnalytics = async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all analytics data in parallel
    const [
      { count: totalPageViews },
      { count: todayPageViews },
      { count: totalChecks },
      { count: todayChecks },
      { data: recentViews },
      { data: recentChecks },
    ] = await Promise.all([
      supabase.from("site_analytics").select("*", { count: "exact", head: true }),
      supabase.from("site_analytics").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("website_checks").select("*", { count: "exact", head: true }),
      supabase.from("website_checks").select("*", { count: "exact", head: true }).gte("checked_at", todayStart),
      supabase.from("site_analytics").select("page_path, created_at").gte("created_at", thirtyDaysAgo).order("created_at", { ascending: false }).limit(1000),
      supabase.from("website_checks").select("domain, checked_at").gte("checked_at", thirtyDaysAgo).order("checked_at", { ascending: false }).limit(1000),
    ]);

    // Aggregate top pages
    const pageCounts: Record<string, number> = {};
    recentViews?.forEach((v) => {
      pageCounts[v.page_path] = (pageCounts[v.page_path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Aggregate top domains
    const domainCounts: Record<string, number> = {};
    recentChecks?.forEach((c) => {
      domainCounts[c.domain] = (domainCounts[c.domain] || 0) + 1;
    });
    const topDomains = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Daily views (last 7 days)
    const dailyViewCounts: Record<string, number> = {};
    const dailyCheckCounts: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyViewCounts[key] = 0;
      dailyCheckCounts[key] = 0;
    }
    recentViews?.forEach((v) => {
      const key = v.created_at.slice(0, 10);
      if (key in dailyViewCounts) dailyViewCounts[key]++;
    });
    recentChecks?.forEach((c) => {
      const key = c.checked_at.slice(0, 10);
      if (key in dailyCheckCounts) dailyCheckCounts[key]++;
    });

    setData({
      totalPageViews: totalPageViews ?? 0,
      todayPageViews: todayPageViews ?? 0,
      totalChecks: totalChecks ?? 0,
      todayChecks: todayChecks ?? 0,
      topPages,
      topDomains,
      dailyViews: Object.entries(dailyViewCounts).map(([date, views]) => ({ date, views })),
      dailyChecks: Object.entries(dailyCheckCounts).map(([date, checks]) => ({ date, checks })),
    });
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Admin Dashboard – Website Status Checker"
        description="Analytics dashboard for Website Status Checker."
        path="/admin/dashboard"
      />

      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="font-bold text-lg">Admin Panel</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Logout
          </button>
        </div>
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-1 -mb-px">
            {[
              { key: "dashboard", label: "Dashboard", icon: BarChart3 },
              { key: "pages", label: "Pages", icon: Eye },
              { key: "domains", label: "Domains", icon: Globe },
              { key: "settings", label: "Settings", icon: Clock },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <tab.icon className="h-4 w-4" aria-hidden="true" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "dashboard" && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Eye} label="Total Page Views" value={data?.totalPageViews ?? 0} />
              <StatCard icon={Eye} label="Today's Views" value={data?.todayPageViews ?? 0} />
              <StatCard icon={Globe} label="Total Checks" value={data?.totalChecks ?? 0} />
              <StatCard icon={TrendingUp} label="Today's Checks" value={data?.todayChecks ?? 0} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-bold mb-4">Page Views (Last 7 Days)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data?.dailyViews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </section>
              <section className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-bold mb-4">Website Checks (Last 7 Days)</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.dailyChecks}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="checks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            </div>
          </>
        )}

        {activeTab === "pages" && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold mb-4">Top Pages (Last 30 Days)</h2>
            <div className="space-y-2">
              {data?.topPages.map((p) => (
                <div key={p.path} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                  <span className="font-mono text-xs truncate max-w-[70%]">{p.path}</span>
                  <span className="text-muted-foreground font-mono text-xs">{p.count} views</span>
                </div>
              ))}
              {(!data?.topPages || data.topPages.length === 0) && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </section>
        )}

        {activeTab === "domains" && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold mb-4">Most Checked Domains (Last 30 Days)</h2>
            <div className="space-y-2">
              {data?.topDomains.map((d) => (
                <div key={d.domain} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                  <span className="font-mono text-xs">{d.domain}</span>
                  <span className="text-muted-foreground font-mono text-xs">{d.count} checks</span>
                </div>
              ))}
              {(!data?.topDomains || data.topDomains.length === 0) && (
                <p className="text-sm text-muted-foreground">No data yet</p>
              )}
            </div>
          </section>
        )}

        {activeTab === "settings" && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-bold mb-4">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Admin Email</p>
                  <p className="text-xs text-muted-foreground">omarbangla24@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div>
                  <p className="text-sm font-medium">Site URL</p>
                  <p className="text-xs text-muted-foreground">checksiteisonlinecom.lovable.app</p>
                </div>
                <a href="/" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Visit <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className="text-2xl font-extrabold font-mono">{value.toLocaleString()}</p>
  </div>
);

export default AdminDashboard;
