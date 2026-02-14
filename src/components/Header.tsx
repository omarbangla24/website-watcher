import { Link, useLocation } from "react-router-dom";
import { Activity, List } from "lucide-react";

const Header = () => {
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="rounded-lg bg-primary p-1.5">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">StatusChecker</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1">
          <Link
            to="/"
            aria-current={location.pathname === "/" ? "page" : undefined}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === "/"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            Check
          </Link>
          <Link
            to="/recent"
            aria-current={location.pathname === "/recent" ? "page" : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === "/recent"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            <List className="h-3.5 w-3.5" aria-hidden="true" />
            Recent
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
