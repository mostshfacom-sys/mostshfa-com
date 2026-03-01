import prisma from '@/lib/db/prisma';

const parseIsoDurationToSeconds = (value: string) => {
  const match = value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = match[2] ? Number(match[2]) : 0;
  const seconds = match[3] ? Number(match[3]) : 0;
  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return hours * 3600 + minutes * 60 + seconds;
};

export const formatDuration = (totalSeconds: number | null | undefined) => {
  if (!totalSeconds || totalSeconds <= 0) return undefined;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
};

export async function syncYoutubeVideosOnce(channelId: string, maxResults = 12) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return;

  const now = new Date();
  const [existingCount, state] = await Promise.all([
    prisma.youtubeVideo.count({ where: { channelId } }),
    prisma.youtubeSyncState.findUnique({ where: { channelId } }),
  ]);

  if (state?.lastAttemptAt) {
    const diffMs = now.getTime() - state.lastAttemptAt.getTime();
    if (diffMs < 15 * 60 * 1000) return;
  }

  if (existingCount > 0 && state?.lastSuccessAt) {
    const diffMs = now.getTime() - state.lastSuccessAt.getTime();
    if (diffMs < 24 * 60 * 60 * 1000) return;
  }

  try {
    await prisma.youtubeSyncState.upsert({
      where: { channelId },
      create: { channelId, lastAttemptAt: now, lastError: null, lastSuccessAt: null },
      update: { lastAttemptAt: now, lastError: null },
    });
  } catch {
    return;
  }

  try {
    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&id=${encodeURIComponent(
      channelId
    )}&key=${encodeURIComponent(apiKey)}`;
    const channelsRes = await fetch(channelsUrl, { cache: 'no-store' });
    if (!channelsRes.ok) throw new Error(`youtube_channels_${channelsRes.status}`);
    const channelsJson = (await channelsRes.json()) as any;
    const channelItem = channelsJson?.items?.[0];
    const uploadsPlaylistId = channelItem?.contentDetails?.relatedPlaylists?.uploads as string | undefined;
    const channelTitle = channelItem?.snippet?.title as string | undefined;
    if (!uploadsPlaylistId) throw new Error('youtube_missing_uploads_playlist');

    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(
      uploadsPlaylistId
    )}&maxResults=${maxResults}&key=${encodeURIComponent(apiKey)}`;
    const playlistRes = await fetch(playlistUrl, { cache: 'no-store' });
    if (!playlistRes.ok) throw new Error(`youtube_playlist_${playlistRes.status}`);
    const playlistJson = (await playlistRes.json()) as any;
    const items = (playlistJson?.items ?? []) as any[];

    const videos = items
      .map((item) => {
        const videoId = item?.contentDetails?.videoId as string | undefined;
        const snippet = item?.snippet;
        const title = snippet?.title as string | undefined;
        const description = snippet?.description as string | undefined;
        const publishedAtRaw = snippet?.publishedAt as string | undefined;
        const thumbnailUrl =
          (snippet?.thumbnails?.maxres?.url as string | undefined) ??
          (snippet?.thumbnails?.high?.url as string | undefined) ??
          (snippet?.thumbnails?.medium?.url as string | undefined) ??
          (snippet?.thumbnails?.default?.url as string | undefined);
        if (!videoId || !title) return null;
        const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null;
        return {
          channelId,
          videoId,
          title,
          description: description?.trim() ? description : null,
          thumbnailUrl: thumbnailUrl ?? null,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          channelTitle: channelTitle ?? null,
          publishedAt,
        };
      })
      .filter(Boolean) as Array<{
      channelId: string;
      videoId: string;
      title: string;
      description: string | null;
      thumbnailUrl: string | null;
      videoUrl: string;
      channelTitle: string | null;
      publishedAt: Date | null;
    }>;

    const ids = videos.map((v) => v.videoId);
    const durationsById = new Map<string, number>();

    if (ids.length) {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${encodeURIComponent(
        ids.join(',')
      )}&key=${encodeURIComponent(apiKey)}`;
      const detailsRes = await fetch(detailsUrl, { cache: 'no-store' });
      if (detailsRes.ok) {
        const detailsJson = (await detailsRes.json()) as any;
        const detailItems = (detailsJson?.items ?? []) as any[];
        for (const detail of detailItems) {
          const id = detail?.id as string | undefined;
          const iso = detail?.contentDetails?.duration as string | undefined;
          if (!id || !iso) continue;
          const sec = parseIsoDurationToSeconds(iso);
          if (sec !== null) durationsById.set(id, sec);
        }
      }
    }

    const writes = videos.map((v) => {
      const durationSec = durationsById.get(v.videoId) ?? null;
      return prisma.youtubeVideo.upsert({
        where: { videoId: v.videoId },
        create: {
          channelId: v.channelId,
          videoId: v.videoId,
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          channelTitle: v.channelTitle,
          publishedAt: v.publishedAt,
          durationSec,
        },
        update: {
          channelId: v.channelId,
          title: v.title,
          description: v.description,
          thumbnailUrl: v.thumbnailUrl,
          videoUrl: v.videoUrl,
          channelTitle: v.channelTitle,
          publishedAt: v.publishedAt,
          durationSec,
        },
      });
    });

    if (writes.length) {
      await prisma.$transaction(writes);
    }

    await prisma.youtubeSyncState.upsert({
      where: { channelId },
      create: { channelId, lastAttemptAt: now, lastSuccessAt: now, lastError: null },
      update: { lastSuccessAt: now, lastError: null },
    });
  } catch (error) {
    try {
      await prisma.youtubeSyncState.upsert({
        where: { channelId },
        create: {
          channelId,
          lastAttemptAt: now,
          lastSuccessAt: null,
          lastError: String(error).slice(0, 800),
        },
        update: { lastError: String(error).slice(0, 800) },
      });
    } catch {
    }
  }
}
