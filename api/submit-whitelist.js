import { createClient } from "@supabase/supabase-js";

const requiredMissionIds = [
  "follow-twitter",
  "like-post",
  "reply-post",
  "repost-post"
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({
      error: "Missing Supabase environment variables",
      hasUrl: Boolean(supabaseUrl),
      hasServiceRoleKey: Boolean(serviceRoleKey)
    });
  }

  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false
      }
    }
  );

  try {
    const {
      twitterUsername,
      walletAddress,
      completedMissions
    } = req.body ?? {};

    if (
      typeof twitterUsername !== "string" ||
      typeof walletAddress !== "string" ||
      !Array.isArray(completedMissions)
    ) {
      return res.status(400).json({
        error: "Invalid request"
      });
    }

    const handle = twitterUsername
      .trim()
      .replace(/^@+/, "")
      .toLowerCase();

    const wallet = walletAddress.trim().toLowerCase();

    if (!/^[a-z0-9_]{1,15}$/.test(handle)) {
      return res.status(400).json({
        error: "Invalid Twitter username"
      });
    }

    if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
      return res.status(400).json({
        error: "Invalid wallet address"
      });
    }

    const completedSet = new Set(
      completedMissions.filter((missionId) =>
        typeof missionId === "string"
      )
    );

    const completedAllMissions = requiredMissionIds.every((missionId) =>
      completedSet.has(missionId)
    );

    if (!completedAllMissions) {
      return res.status(400).json({
        error: "Complete all missions first"
      });
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("social_whitelist_entries")
      .upsert(
        {
          wallet_address: wallet,
          twitter_username: handle,
          completed_missions: requiredMissionIds,
          source: "h00dle-whitelist",
          updated_at: now
        },
        {
          onConflict: "wallet_address"
        }
      );

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to submit whitelist entry"
    });
  }
}
