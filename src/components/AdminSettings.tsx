import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, Upload, Loader2, Image, Search, Share2, FileText, Code, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SiteSettings {
  [key: string]: string;
}

const SETTING_KEYS = [
  // SEO Meta
  "site_title",
  "site_description",
  "site_keywords",
  "robots_meta",
  // Google Search Console
  "google_verification",
  "bing_verification",
  "google_analytics_id",
  // Branding
  "logo_url",
  "favicon_url",
  "site_name",
  // Open Graph / Social
  "og_image_url",
  "og_type",
  "twitter_handle",
  "twitter_card_type",
  // Custom Head Code
  "custom_head_code",
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("seo");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value");
    
    if (data) {
      const mapped: SiteSettings = {};
      data.forEach((row) => {
        mapped[row.key] = row.value || "";
      });
      setSettings(mapped);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Upsert all settings
      const upserts = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      }));

      for (const item of upserts) {
        // Check if key exists
        const { data: existing } = await supabase
          .from("site_settings")
          .select("id")
          .eq("key", item.key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("site_settings")
            .update({ value: item.value, updated_by: item.updated_by, updated_at: item.updated_at })
            .eq("key", item.key);
        } else {
          await supabase.from("site_settings").insert(item);
        }
      }

      toast({ title: "Settings saved!", description: "Your changes have been saved successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, settingKey: string) => {
    setUploading(settingKey);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${settingKey}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("branding")
        .getPublicUrl(fileName);

      updateSetting(settingKey, urlData.publicUrl);
      toast({ title: "Uploaded!", description: `${settingKey.replace("_", " ")} uploaded successfully.` });
    } catch (err) {
      toast({ title: "Upload failed", description: "Could not upload file.", variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  const sections = [
    { key: "seo", label: "SEO Meta", icon: Search },
    { key: "google", label: "Search Console", icon: Code },
    { key: "branding", label: "Logo & Branding", icon: Image },
    { key: "social", label: "Social / OG Tags", icon: Share2 },
    { key: "advanced", label: "Advanced", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSection === s.key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* SEO Meta */}
      {activeSection === "seo" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" /> SEO Meta Tags
          </h3>
          <SettingField
            label="Site Title"
            placeholder="Website Status Checker – Is It Down Right Now?"
            value={settings.site_title || ""}
            onChange={(v) => updateSetting("site_title", v)}
            hint="Max 60 characters for best SEO"
          />
          <SettingTextarea
            label="Meta Description"
            placeholder="Free website status checker..."
            value={settings.site_description || ""}
            onChange={(v) => updateSetting("site_description", v)}
            hint="Max 160 characters recommended"
          />
          <SettingField
            label="Keywords"
            placeholder="website status checker, is it down, ..."
            value={settings.site_keywords || ""}
            onChange={(v) => updateSetting("site_keywords", v)}
            hint="Comma separated keywords"
          />
          <SettingField
            label="Robots Meta"
            placeholder="index, follow"
            value={settings.robots_meta || ""}
            onChange={(v) => updateSetting("robots_meta", v)}
            hint="e.g. index, follow, noindex, nofollow"
          />
        </div>
      )}

      {/* Google Search Console */}
      {activeSection === "google" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" /> Search Console & Analytics
          </h3>
          <SettingField
            label="Google Site Verification"
            placeholder="Google verification code (content value only)"
            value={settings.google_verification || ""}
            onChange={(v) => updateSetting("google_verification", v)}
            hint='Paste the "content" value from Google Search Console'
          />
          <SettingField
            label="Bing Site Verification"
            placeholder="Bing verification code"
            value={settings.bing_verification || ""}
            onChange={(v) => updateSetting("bing_verification", v)}
            hint='Paste from Bing Webmaster Tools'
          />
          <SettingField
            label="Google Analytics ID"
            placeholder="G-XXXXXXXXXX"
            value={settings.google_analytics_id || ""}
            onChange={(v) => updateSetting("google_analytics_id", v)}
            hint="Your GA4 Measurement ID"
          />
        </div>
      )}

      {/* Logo & Branding */}
      {activeSection === "branding" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Image className="h-4 w-4 text-primary" /> Logo & Branding
          </h3>

          <SettingField
            label="Site Name"
            placeholder="Website Status Checker"
            value={settings.site_name || ""}
            onChange={(v) => updateSetting("site_name", v)}
          />

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Site Logo</label>
            <div className="flex items-center gap-3">
              {settings.logo_url ? (
                <div className="relative">
                  <img src={settings.logo_url} alt="Logo" className="h-12 w-auto rounded border border-border" />
                  <button
                    onClick={() => updateSetting("logo_url", "")}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="h-12 w-12 rounded border border-dashed border-border flex items-center justify-center">
                  <Image className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "logo_url");
                }}
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === "logo_url"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors"
              >
                {uploading === "logo_url" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload Logo
              </button>
            </div>
            <SettingField
              label=""
              placeholder="Or paste logo URL"
              value={settings.logo_url || ""}
              onChange={(v) => updateSetting("logo_url", v)}
            />
          </div>

          {/* Favicon Upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">Favicon</label>
            <div className="flex items-center gap-3">
              {settings.favicon_url ? (
                <img src={settings.favicon_url} alt="Favicon" className="h-8 w-8 rounded border border-border" />
              ) : (
                <div className="h-8 w-8 rounded border border-dashed border-border flex items-center justify-center">
                  <Image className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "favicon_url");
                }}
              />
              <button
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploading === "favicon_url"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors"
              >
                {uploading === "favicon_url" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload Favicon
              </button>
            </div>
            <SettingField
              label=""
              placeholder="Or paste favicon URL"
              value={settings.favicon_url || ""}
              onChange={(v) => updateSetting("favicon_url", v)}
            />
          </div>
        </div>
      )}

      {/* Social / OG Tags */}
      {activeSection === "social" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" /> Social Media & Open Graph
          </h3>

          {/* OG Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">OG Image (1200×630 recommended)</label>
            <div className="flex items-center gap-3">
              {settings.og_image_url ? (
                <img src={settings.og_image_url} alt="OG Image" className="h-16 w-auto rounded border border-border" />
              ) : (
                <div className="h-16 w-28 rounded border border-dashed border-border flex items-center justify-center">
                  <Image className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <input
                ref={ogImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "og_image_url");
                }}
              />
              <button
                onClick={() => ogImageInputRef.current?.click()}
                disabled={uploading === "og_image_url"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs font-medium hover:bg-accent transition-colors"
              >
                {uploading === "og_image_url" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload OG Image
              </button>
            </div>
            <SettingField
              label=""
              placeholder="Or paste OG image URL"
              value={settings.og_image_url || ""}
              onChange={(v) => updateSetting("og_image_url", v)}
            />
          </div>

          <SettingField
            label="OG Type"
            placeholder="website"
            value={settings.og_type || ""}
            onChange={(v) => updateSetting("og_type", v)}
            hint="Usually 'website' or 'article'"
          />
          <SettingField
            label="Twitter Handle"
            placeholder="@yourhandle"
            value={settings.twitter_handle || ""}
            onChange={(v) => updateSetting("twitter_handle", v)}
          />
          <SettingField
            label="Twitter Card Type"
            placeholder="summary_large_image"
            value={settings.twitter_card_type || ""}
            onChange={(v) => updateSetting("twitter_card_type", v)}
            hint="summary, summary_large_image, app, player"
          />
        </div>
      )}

      {/* Advanced */}
      {activeSection === "advanced" && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Advanced / Custom Code
          </h3>
          <SettingTextarea
            label="Custom Head Code"
            placeholder='<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXX"></script>'
            value={settings.custom_head_code || ""}
            onChange={(v) => updateSetting("custom_head_code", v)}
            hint="HTML/JS injected into <head>. Use for analytics, verification tags, etc."
            rows={6}
          />
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Settings
        </button>
      </div>
    </div>
  );
};

// Reusable field components
const SettingField = ({
  label,
  placeholder,
  value,
  onChange,
  hint,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) => (
  <div className="space-y-1">
    {label && <label className="text-xs font-medium text-foreground">{label}</label>}
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
    />
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

const SettingTextarea = ({
  label,
  placeholder,
  value,
  onChange,
  hint,
  rows = 3,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
}) => (
  <div className="space-y-1">
    {label && <label className="text-xs font-medium text-foreground">{label}</label>}
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y font-mono text-xs"
    />
    {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
  </div>
);

export default AdminSettings;
