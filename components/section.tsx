import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  cta = "View all",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={href}>
            {cta} <ArrowRight />
          </Link>
        </Button>
      )}
    </div>
  );
}

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-4 py-16 sm:px-6 ${className}`}>
      {children}
    </section>
  );
}

export function ToolCard({
  tool,
}: {
  tool: import("@/types").Tool;
}) {
  const Icon = tool.icon;
  return (
    <Link href={tool.href} className="group block h-full">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <span className="grid size-10 place-items-center rounded-lg border border-border bg-secondary text-primary transition-colors group-hover:border-primary/40">
            <Icon className="size-5" />
          </span>
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-snug group-hover:text-foreground">
                {tool.name}
              </h3>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {tool.description}
            </p>
          </div>
          <Badge variant="secondary" className="mt-auto w-fit">
            {tool.category}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center py-12 text-center">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="max-w-md">{description}</CardDescription>
        {action && <div className="pt-2">{action}</div>}
      </CardHeader>
    </Card>
  );
}
