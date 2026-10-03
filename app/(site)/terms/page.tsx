import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, ContentSection } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig, communityLinks } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms",
  description: "Acceptable use and disclaimers for DarkUniverse Hub.",
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    title: "Acceptable use",
    body: "Use the tools for personal and community projects. Don't abuse rate-limited APIs, attempt to overload the service, or use our webhook proxy to send spam or unlawful content.",
  },
  {
    title: "No warranty",
    body: "The site is provided as-is. Codes, game details and third-party availability change frequently — always confirm on the official Roblox or Discord surface before acting on information here.",
  },
  {
    title: "Not affiliated",
    body: `${siteConfig.name} is an independent fan/community project. Roblox and the Roblox logo are trademarks of Roblox Corporation. Discord is a trademark of Discord Inc.`,
  },
  {
    title: "Your content",
    body: "Anything you paste into client-side tools stays on your device and is not licensed to us. Content you submit through Discord sign-in (such as a profile bio) remains yours.",
  },
  {
    title: "Termination",
    body: "We may restrict access if the service is being abused. You can ask for your account data to be deleted at any time — see the privacy policy.",
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal"
        title="Terms of use"
        description="The ground rules for using this site and its tools."
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
          <div className="flex flex-wrap gap-3 pt-4">
            <Link href="/privacy" className="text-sm text-primary hover:underline">
              Privacy policy
            </Link>
            <Link href="/about" className="text-sm text-primary hover:underline">
              About the project
            </Link>
            {communityLinks.discord ? (
              <a
                href={communityLinks.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Contact via Discord
              </a>
            ) : (
              <Link href="/community" className="text-sm text-primary hover:underline">
                Contact us
              </Link>
            )}
          </div>
        </div>
      </ContentSection>
    </>
  );
}
