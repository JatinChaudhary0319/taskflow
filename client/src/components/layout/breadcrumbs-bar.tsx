import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function BreadcrumbsBar({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <li className="flex items-center gap-1">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-accent hover:text-accent-foreground"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            Projects
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
            {item.href ? (
              <Link
                to={item.href}
                className={cn(
                  "rounded-md px-1 py-0.5 hover:bg-accent hover:text-accent-foreground",
                  i === items.length - 1 && "pointer-events-none font-medium text-foreground",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "px-1 py-0.5",
                  i === items.length - 1 && "font-medium text-foreground",
                )}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
