"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/**
 * Slug → client component map for every tool.
 *
 * Every entry is dynamically imported so tool pages only ship the code they
 * actually use (`next build` splits each chunk automatically).
 */

const loading = () => null;

const map: Record<string, () => Promise<{ default: ComponentType }>> = {
  // Roblox
  "roblox-profile-lookup": () =>
    import("./roblox").then((m) => ({ default: m.RobloxProfileLookup })),
  "roblox-avatar-viewer": () =>
    import("./roblox").then((m) => ({ default: m.RobloxAvatarViewer })),
  "roblox-user-id-lookup": () =>
    import("./roblox").then((m) => ({ default: m.RobloxUserIdLookup })),
  "roblox-group-lookup": () =>
    import("./roblox").then((m) => ({ default: m.RobloxGroupLookup })),
  "roblox-game-lookup": () =>
    import("./roblox").then((m) => ({ default: m.RobloxGameLookup })),
  "roblox-game-thumbnail-viewer": () =>
    import("./roblox").then((m) => ({ default: m.RobloxGameThumbnailViewer })),
  "roblox-game-icon-viewer": () =>
    import("./roblox").then((m) => ({ default: m.RobloxGameIconViewer })),
  "roblox-group-icon-viewer": () =>
    import("./roblox").then((m) => ({ default: m.RobloxGroupIconViewer })),
  "roblox-presence-lookup": () =>
    import("./roblox").then((m) => ({ default: m.RobloxPresenceLookup })),
  "roblox-server-status": () =>
    import("./roblox").then((m) => ({ default: m.RobloxServerStatus })),
  "roblox-username-lookup": () =>
    import("./roblox").then((m) => ({ default: m.RobloxUsernameLookup })),
  "roblox-outfit-viewer": () =>
    import("./roblox").then((m) => ({ default: m.RobloxOutfitViewer })),

  // Discord
  "discord-timestamp-generator": () =>
    import("./discord").then((m) => ({ default: m.DiscordTimestampGenerator })),
  "discord-embed-builder": () =>
    import("./discord").then((m) => ({ default: m.DiscordEmbedBuilder })),
  "discord-webhook-builder": () =>
    import("./discord").then((m) => ({ default: m.DiscordWebhookBuilder })),
  "discord-snowflake-decoder": () =>
    import("./discord").then((m) => ({ default: m.DiscordSnowflakeDecoder })),
  "discord-invite-info": () =>
    import("./discord").then((m) => ({ default: m.DiscordInviteInfo })),
  "discord-color-converter": () =>
    import("./discord").then((m) => ({ default: m.DiscordColorConverter })),
  "discord-avatar-preview": () =>
    import("./discord").then((m) => ({ default: m.DiscordAvatarPreview })),
  "discord-banner-preview": () =>
    import("./discord").then((m) => ({ default: m.DiscordBannerPreview })),

  // Creator
  "username-generator": () =>
    import("./creator").then((m) => ({ default: m.UsernameGenerator })),
  "discord-bio-generator": () =>
    import("./creator").then((m) => ({ default: m.DiscordBioGenerator })),
  "roblox-game-description-formatter": () =>
    import("./creator").then((m) => ({ default: m.RobloxGameDescriptionFormatter })),
  "text-formatter": () =>
    import("./creator").then((m) => ({ default: m.TextFormatter })),
  "color-palette-generator": () =>
    import("./creator").then((m) => ({ default: m.ColorPaletteGenerator })),
  "gradient-generator": () =>
    import("./creator").then((m) => ({ default: m.GradientGenerator })),

  // YouTube
  "youtube-title-generator": () =>
    import("./creator").then((m) => ({ default: m.YoutubeTitleGenerator })),
  "youtube-description-formatter": () =>
    import("./creator").then((m) => ({ default: m.YoutubeDescriptionFormatter })),
  "youtube-tags-generator": () =>
    import("./creator").then((m) => ({ default: m.YoutubeTagsGenerator })),

  // Images
  "image-resizer": () =>
    import("./images").then((m) => ({ default: m.ImageResizer })),
  "image-cropper": () =>
    import("./images").then((m) => ({ default: m.ImageCropper })),
  "image-compressor": () =>
    import("./images").then((m) => ({ default: m.ImageCompressor })),
  "image-converter": () =>
    import("./images").then((m) => ({ default: m.ImageConverter })),
  "image-dimensions-viewer": () =>
    import("./images").then((m) => ({ default: m.ImageDimensionsViewer })),
  "file-size-viewer": () =>
    import("./images").then((m) => ({ default: m.FileSizeViewer })),

  // Utilities
  "character-counter": () =>
    import("./utilities").then((m) => ({ default: m.CharacterCounter })),
  "word-counter": () => import("./utilities").then((m) => ({ default: m.WordCounter })),
  "json-formatter": () =>
    import("./utilities").then((m) => ({ default: m.JsonFormatter })),
  "timestamp-generator": () =>
    import("./utilities").then((m) => ({ default: m.TimestampGenerator })),
  "qr-code-generator": () =>
    import("./utilities").then((m) => ({ default: m.QrCodeGenerator })),
  "code-snippet-formatter": () =>
    import("./utilities").then((m) => ({ default: m.CodeSnippetFormatter })),
  "random-picker": () =>
    import("./utilities").then((m) => ({ default: m.RandomPicker })),
  "base64-tool": () => import("./utilities").then((m) => ({ default: m.Base64Tool })),
};

/**
 * Resolves a tool slug to its lazily-loaded interface.
 *
 * This must be a component (not a helper function) because `map` lives in a
 * client module: the server page renders `<ToolRenderer slug={…} />` and the
 * actual tool code is loaded in the browser only.
 */
export function ToolRenderer({ slug }: { slug: string }) {
  const Component = React.useMemo(() => {
    const loader = map[slug];
    if (!loader) return null;
    return dynamic(loader, { loading, ssr: false });
  }, [slug]);

  if (!Component) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        This tool&apos;s interface isn&apos;t part of this build. Pick another
        tool or refresh the page.
      </div>
    );
  }

  return <Component />;
}
