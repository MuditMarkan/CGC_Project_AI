"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const routes = [
  { href: "/", label: "Dashboard", short: "Home", mark: "▦" },
  { href: "/analysis", label: "New Analysis", short: "Analyze", mark: "■" },
  { href: "/audit", label: "Audit Results", short: "Audit", mark: "▥" },
  { href: "/orbit", label: "Growth Plan", short: "Plan", mark: "▤" },
  { href: "/experiments", label: "Experiment Results", short: "Results", mark: "▧" },
  { href: "/reports", label: "Export", short: "Export", mark: "■" },
];

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({
  title,
  eyebrow,
  subtitle,
  children,
}: {
  title: string;
  eyebrow: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreIsCurrent = pathname.startsWith("/experiments") || pathname.startsWith("/reports");
  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="Creator Growth Copilot home">
          <span><strong>Creator Copilot</strong><small>PRODUCT ANALYTICS</small></span>
        </Link>
        <nav className="desktop-nav">
          {routes.map((route) => (
            <Link
              href={route.href}
              key={route.href}
              className={isCurrent(pathname, route.href) ? "nav-link active" : "nav-link"}
              aria-current={isCurrent(pathname, route.href) ? "page" : undefined}
            >
              <span aria-hidden="true">{route.mark}</span>{route.label}
            </Link>
          ))}
        </nav>
        <div className="system-card"><span className="avatar" aria-hidden="true" /> <span><b>@trinity.narrative</b><small>Settings & Help</small></span></div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <Link className="mobile-brand" href="/" aria-label="Creator Growth Copilot home"><strong>Creator Copilot</strong></Link>
          <div className="page-heading">
            <p>{eyebrow}</p>
            <h1>{title}</h1>
            <span>{subtitle}</span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>

      {moreOpen ? <div className="mobile-more-panel" id="mobile-more-menu">
        <Link href="/experiments" aria-current={pathname.startsWith("/experiments") ? "page" : undefined}><span aria-hidden="true">▧</span><span><b>Experiment Results</b><small>Review measured outcomes</small></span></Link>
        <Link href="/reports" aria-current={pathname.startsWith("/reports") ? "page" : undefined}><span aria-hidden="true">■</span><span><b>Export</b><small>Download the evidence</small></span></Link>
      </div> : null}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {routes.slice(0, 4).map((route) => (
          <Link
            href={route.href}
            key={route.href}
            className={isCurrent(pathname, route.href) ? "active" : ""}
            aria-current={isCurrent(pathname, route.href) ? "page" : undefined}
          >
            <span aria-hidden="true">{route.mark}</span>{route.short}
          </Link>
        ))}
        <button
          type="button"
          className={moreIsCurrent || moreOpen ? "active" : ""}
          aria-expanded={moreOpen}
          aria-controls="mobile-more-menu"
          aria-current={moreIsCurrent ? "page" : undefined}
          onClick={() => setMoreOpen((open) => !open)}
        ><span aria-hidden="true">•••</span>More</button>
      </nav>
    </div>
  );
}
