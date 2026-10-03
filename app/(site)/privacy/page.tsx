import type { Metadata } from "next";
import { PageHeader, ContentSection } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What DarkUniverse Hub collects, what it doesn't, and your choices.",
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "What we store",
    body: "When you sign in with Discord we store your Discord user ID, username, display name, avatar URL and (if Discord provides it) your email address, plus a signed session cookie that expires after 14 days. Saved tools, points and badge progress are tied to that record.",
  },
  {
    title: "What we never receive",
    body: "Image tools and text tools run entirely in your browser — files you resize, crop, compress or convert are never uploaded to our servers. We don't run advertising or third-party analytics scripts.",
  },
  {
    title: "Rate limiting & logs",
    body: "Public API endpoints apply per-IP rate limits and process requests in memory. We keep no persistent request logs containing your inputs; hosting provider logs (Vercel) may retain IP and timing data for operational security.",
  },
  {
    title: "Third parties",
    body: "Data required by a tool is fetched from the official Roblox and Discord APIs. Those providers apply their own privacy policies. External resources you open from /resources leave our site and are governed by their owners.",
  },
  {
    title: "Cookies",
    body: "We use two functional cookies: du_session (authentication) and du_oauth_state/du_oauth_next (short-lived, during sign-in). No tracking or advertising cookies are set.",
  },
  {
    title: "Deleting your data",
    body: `Email ${siteConfig.studio} through the Discord server and we will delete your account record, saved tools and activity history.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Privacy policy"
        description="Short, specific and accurate — what this site actually does with your data."
      />
      <ContentSection>
        <div className="mx-auto max-w-3xl space-y-4">
          {sections.map((section) => (
            <Card key={section.title}>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </CardContent>
            </Card>
          ))}
          <p className="pt-4 text-xs text-muted-foreground">
            Last updated {new Date().getFullYear()} — this policy may change as
            features are added; material changes will be announced on the
            updates page.
          </p>
        </div>
      </ContentSection>
    </>
  );
}
