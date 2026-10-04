import {
  ChannelType,
  type Client,
  type NewsChannel,
  type TextChannel,
} from "discord.js";

export type SendableChannel = TextChannel | NewsChannel;

export async function resolveSendable(
  client: Client,
  id: string,
): Promise<SendableChannel | null> {
  const channel = await client.channels.fetch(id).catch(() => null);
  if (!channel) return null;
  if (
    channel.type === ChannelType.GuildText ||
    channel.type === ChannelType.GuildAnnouncement
  ) {
    return channel;
  }
  return null;
}
