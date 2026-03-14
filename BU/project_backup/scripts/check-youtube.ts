import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkYoutubeData() {
  try {
    const videoCount = await prisma.youtubeVideo.count();
    const syncStates = await prisma.youtubeSyncState.findMany();
    
    console.log('--- YouTube Data Status ---');
    console.log(`Total Videos: ${videoCount}`);
    console.log('Sync States:', JSON.stringify(syncStates, null, 2));
    
    if (videoCount > 0) {
      const latestVideos = await prisma.youtubeVideo.findMany({
        orderBy: { publishedAt: 'desc' },
        take: 5
      });
      console.log('Latest Videos:', JSON.stringify(latestVideos, null, 2));
    }
  } catch (error) {
    console.error('Error checking YouTube data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkYoutubeData();
