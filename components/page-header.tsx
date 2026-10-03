import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="border-b border-border bg-surface/40">
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16",
          className,
        )}
      >
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
          )}
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-2xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </div>
  );
}

export function ContentSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mx-auto max-w-7xl px-4 py-10 sm:px-6 ${className}`}>
      {children}
    </section>
  );
}
