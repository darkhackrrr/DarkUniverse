import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Wrench, ChevronRight, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTool, tools, categories } from "@/lib/tools/registry";
import { ToolRenderer } from "@/components/tools/registry";
import { SaveToolButton } from "@/components/tools/save-tool-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return { title: "Tool not found" };
  return {
    title: tool.name,
    description: tool.description,
    alternates: { canonical: tool.href },
    openGraph: {
      title: tool.name,
      description: tool.description,
      type: "website",
    },
  };
}

const HOW_IT_WORKS: Record<string, string[]> = {
  Roblox: [
    "We call Roblox's public APIs from our server — no API key required.",
    "Responses are cached for one to five minutes so repeat lookups are instant.",
    "Nothing is stored: we never keep the IDs or profiles you look up.",
  ],
  Discord: [
    "The computation runs in your browser, so your data never leaves your device.",
    "Where Discord data is needed, our server calls Discord's API with a bot token kept private.",
    "Copy the output straight into your client, bot or server settings.",
  ],
  Images: [
    "Your file is loaded with the browser's FileReader API and drawn onto a canvas.",
    "Processing happens locally — the image is never uploaded to a server.",
    "The result is offered as a download link generated on the fly.",
  ],
  Creator: [
    "Templates and rules run locally against your input.",
    "You can edit every output before copying it.",
    "Nothing you write is logged or stored.",
  ],
  YouTube: [
    "Character budgets and platform limits are checked live as you type.",
    "Suggestions are templates you can freely reword.",
    "Copy the result straight into YouTube Studio.",
  ],
  Utilities: [
    "Pure client-side processing — inputs stay on your device.",
    "Results update instantly as you type or change options.",
    "Copy buttons let you move output into any app.",
  ],
};

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const related = tools
    .filter((t) => t.category === tool.category && t.slug !== tool.slug)
    .slice(0, 4);
  const steps = HOW_IT_WORKS[tool.category] ?? HOW_IT_WORKS.Utilities;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/tools" className="inline-flex items-center gap-1.5 hover:text-foreground">
          <ArrowLeft className="size-4" /> All tools
        </Link>
        <ChevronRight className="size-3.5" />
        <span>{tool.category}</span>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">{tool.name}</span>
      </nav>

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-primary">
            <tool.icon className="size-6" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.name}</h1>
              <Badge variant="secondary">{tool.category}</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {tool.description}
            </p>
            {tool.keywords && tool.keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {tool.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded border border-border bg-surface px-2 py-0.5 text-[0.7rem] text-muted-foreground"
                  >
                    {k}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <SaveToolButton slug={tool.slug} />
          <Button variant="outline" size="sm" asChild>
            <Link href="/tools">
              <Wrench /> More tools
            </Link>
          </Button>
        </div>
      </header>

      <div className="mb-10">
        <ToolRenderer slug={tool.slug} />
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-4 text-warning" /> How this tool works
            </CardTitle>
            <CardDescription>
              What happens between your input and the result you copy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border bg-secondary text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related {tool.category} tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {related.map((t) => (
              <Link
                key={t.slug}
                href={t.href}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 transition-colors hover:border-primary/40"
              >
                <t.icon className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
            <p className="pt-2 text-xs text-muted-foreground">
              {categories.length} categories · {tools.length} tools in total.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
