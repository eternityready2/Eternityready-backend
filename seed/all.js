const API_BASE_URL = 'http://127.0.0.1:3000';
const ETERNITY_BASE_URL = 'http://127.0.0.1:8000';

function normalizeDataForPlayer(item, origin) {
  const normalized = {
    id: item.id,
    title: item.title || item.name || "Title Unavailable",
    description: item.description || "No description provided for the given media.",
    author: item.author || "Eternity Ready",
    embedCode: item.embed,
    sourceType: "unknown",
    videoId: null,
    thumbnailUrl: item.logo || item.thumbnail || null,
    origin: origin,
    categories: item.categories,
  };

  if (
    item.embed &&
    item.embed.includes("googleusercontent.com/youtube.com")
  ) {
    const parts = item.embed.split("/");
    normalized.videoId = parts.pop();
    normalized.sourceType = "youtube";
  } else if (item.embed) {
    normalized.sourceType = "embed";
  }
  return normalized;
}

async function publishVideo(videoData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/create-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...videoData,
        categories: videoData.categories || []
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw result.error;
    }

    return result.video;
  } catch (error) {
    console.error('Error creating video:', error);
    throw error;
  }
}

async function seedAll() {
  const data = {
    'channels': `${ETERNITY_BASE_URL}/data/channels.json`,
    'music': `${ETERNITY_BASE_URL}/data/music.json`,
    'movies': `${ETERNITY_BASE_URL}/data/movies.json`,
  };

  try {
    for (const origin in data) {
      const response = await fetch(data[origin]);
      if (!response.ok) {
        throw new Error("Failed to load one or more JSON files.");
      }
      const responseData = await response.json();
      const items = responseData[origin];
      for (const item of items) {
        const normalizedItem = normalizeDataForPlayer(item, origin);
        console.log('Creating video: ', normalizedItem.title);
        try {
          await publishVideo(normalizedItem);
        } catch (err) {
          console.error('Failed to publish video:', normalizedItem.title, err);
        }
      }
    }
  } catch (e) {
    console.error("Error loading or processing local JSON files:", e);
  }
}

seedAll();
