const SEOFooterContent = () => {
  return (
    <section className="container mx-auto px-4 py-12 border-t border-border">
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-xl font-bold">
          Website Status Checker – Is It Down Right Now?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Use our free <strong>Website Status Checker</strong> tool to instantly find out if a website is
          down or up. Whether you're wondering <strong>"Is Facebook down?"</strong>,{" "}
          <strong>"Is YouTube down?"</strong>, <strong>"Is Instagram down today?"</strong>, or{" "}
          <strong>"Is WhatsApp not working?"</strong> — we check it for you in real-time and give you
          the HTTP status code, response time, and availability report.
        </p>

        <h3 className="text-lg font-semibold">
          Check Popular Websites Status
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Quickly check if the most popular websites and services are experiencing downtime.
          Our tool monitors the top websites including{" "}
          <strong>Facebook, YouTube, Instagram, Twitter (X), WhatsApp, TikTok, Reddit, Netflix, Amazon,</strong>{" "}
          and <strong>Google</strong>. Get instant answers to questions like{" "}
          <em>"Is Facebook down right now?"</em>, <em>"Is Netflix not loading?"</em>,{" "}
          <em>"Is Twitter having issues today?"</em>, and <em>"Is Google down?"</em>
        </p>

        <h3 className="text-lg font-semibold">
          How Does the Website Down Checker Work?
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Simply enter any website URL in the search bar above and click <strong>"Check Status"</strong>.
          Our server sends an HTTP request to the website and measures the response time, HTTP status code,
          and overall availability. Results are displayed instantly with a clear{" "}
          <strong className="text-status-up">green ✅ for UP</strong> or{" "}
          <strong className="text-status-down">red ❌ for DOWN</strong> indicator.
          All checks are stored so you can view the <strong>recent check history</strong> and track uptime trends.
        </p>

        <h3 className="text-lg font-semibold">
          Why Use Our Website Status Checker?
        </h3>
        <ul className="text-sm text-muted-foreground leading-relaxed list-disc list-inside space-y-1">
          <li><strong>100% Free</strong> – No registration or login required</li>
          <li><strong>Real-time Results</strong> – Instant website availability check</li>
          <li><strong>HTTP Status Codes</strong> – See the exact server response (200, 403, 500, etc.)</li>
          <li><strong>Response Time</strong> – Measure website speed in milliseconds</li>
          <li><strong>Check History</strong> – View all recently checked websites</li>
          <li><strong>Mobile Friendly</strong> – Works perfectly on any device</li>
        </ul>

        <h3 className="text-lg font-semibold">
          Frequently Searched Queries
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Is Facebook down? · Is YouTube not working? · Is Instagram down right now? ·
          Is Twitter down today? · Is WhatsApp down? · Is TikTok not loading? ·
          Is Reddit having issues? · Is Netflix server down? · Is Amazon website down? ·
          Is Google down right now? · Website down checker · Is it down or just me? ·
          Check if website is up · Website uptime checker · Server status checker ·
          Is my website down? · Website availability test · HTTP status code checker
        </p>
      </div>
    </section>
  );
};

export default SEOFooterContent;
