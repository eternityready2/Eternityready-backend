import { Request, Response } from "express";
import { KeystoneContext } from "@keystone-6/core/types";
import { z } from "zod";
import { configDotenv } from "dotenv";

configDotenv();
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE KEY not defined at .env");

const VerifyVideosSchema = z.object({
  videos: z.array(
    z.object({
      id: z.string(),
      sourceType: z.enum(["youtube", "embed", "upload"]),
      videoId: z.string().nullable(),
      embedCode: z.string().nullable().optional(),
    })
  ),
});

function extractYouTubeId(input: string): string | null {
  const match = input.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function isBlockedInUS(regionRestriction: any): boolean {
  if (!regionRestriction) return false;
  if (regionRestriction.blocked && regionRestriction.blocked.includes("US")) {
    return true;
  }
  if (regionRestriction.allowed && !regionRestriction.allowed.includes("US")) {
    return true;
  }
  return false;
}

type VerifyResult = {
  isPublic: boolean;
  isRestricted: boolean;
  videoStatus: string;
  message: string;
};

export const verifyVideosHandler = async (
  req: Request,
  res: Response,
  context: KeystoneContext
) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const parse = VerifyVideosSchema.safeParse(req.body);
  if (!parse.success) {
    const errorMessage = parse.error.issues[0].message;
    console.log(`Error: ${errorMessage}`);
    return res.status(400).json({ error: errorMessage });
  }

  const { videos } = parse.data;
  const results: Record<string, VerifyResult> = {};

  for (const video of videos) {
    // Resolve YouTube video ID from videoId field or embed code
    let ytId = video.videoId || null;
    if (!ytId && video.sourceType === "embed" && video.embedCode) {
      ytId = extractYouTubeId(video.embedCode);
    }

    if (!ytId) {
      const result: VerifyResult = {
        isPublic: false,
        isRestricted: false,
        videoStatus: "unknown",
        message: "Not a YouTube video or could not extract video ID.",
      };
      results[video.id] = result;
      await context.db.Video.updateOne({
        where: { id: video.id },
        data: {
          isPublic: result.isPublic,
          isRestricted: result.isRestricted,
          videoStatus: result.videoStatus,
          verificationMessage: result.message,
        },
      });
      continue;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${ytId}&part=status,contentDetails&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();

      let result: VerifyResult;

      if (!data.items || data.items.length === 0) {
        result = {
          isPublic: false,
          isRestricted: false,
          videoStatus: "deleted",
          message: "❌ Video deleted from YouTube or does not exist.",
        };
      } else {
        const details = data.items[0];
        const privacyStatus = details.status?.privacyStatus;
        const embeddable = details.status?.embeddable;
        const regionRestriction = details.contentDetails?.regionRestriction;
        const ageRestricted =
          details.contentDetails?.contentRating?.ytRating === "ytAgeRestricted";
        const blockedInUS = isBlockedInUS(regionRestriction);

        // Priority: private > deleted (already handled) > age-restricted > geo-restricted > not embeddable > public
        // Collect all issues for the message
        const issues: string[] = [];

        if (privacyStatus === "private") {
          result = {
            isPublic: false,
            isRestricted: false,
            videoStatus: "private",
            message: "🔒 Video is set to private on YouTube.",
          };
        } else {
          if (ageRestricted) issues.push("age-restricted");
          if (blockedInUS) issues.push("geo-restricted in the USA");
          if (embeddable === false) issues.push("embedding disabled");

          if (issues.length === 0) {
            result = {
              isPublic: true,
              isRestricted: false,
              videoStatus: "public",
              message: "✅ Video is public, embeddable, and available in the USA.",
            };
          } else {
            // Pick the primary status based on severity
            let videoStatus: string;
            if (ageRestricted) videoStatus = "age_restricted";
            else if (blockedInUS) videoStatus = "geo_restricted";
            else videoStatus = "not_embeddable";

            result = {
              isPublic: privacyStatus === "public",
              isRestricted: blockedInUS || ageRestricted,
              videoStatus,
              message: `⚠️ Issues: ${issues.join(", ")}.`,
            };
          }
        }
      }

      results[video.id] = result;
      await context.db.Video.updateOne({
        where: { id: video.id },
        data: {
          isPublic: result.isPublic,
          isRestricted: result.isRestricted,
          videoStatus: result.videoStatus,
          verificationMessage: result.message,
        },
      });
    } catch (err) {
      const result: VerifyResult = {
        isPublic: false,
        isRestricted: false,
        videoStatus: "unknown",
        message: "❌ Failed fetching YouTube API.",
      };
      results[video.id] = result;
      await context.db.Video.updateOne({
        where: { id: video.id },
        data: {
          isPublic: result.isPublic,
          isRestricted: result.isRestricted,
          videoStatus: result.videoStatus,
          verificationMessage: result.message,
        },
      });
    }
  }

  return res.status(200).json({ results });
};
