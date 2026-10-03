"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ActiveLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/15 text-foreground shadow-sm ring-1 ring-primary/30"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {label}
    </Link>
  );
}
