import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
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
      error: "Missing Supabase environment variables"
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
    const { data: whitelist, error } =
      await supabase
        .from("whitelist_entries")
        .select(
          "wallet_address, twitter_handle, best_score, qualified, run_id"
        )
        .eq("qualified", true)
        .order("best_score", {
          ascending: false
        })
        .limit(100);

    if (error) {
      throw error;
    }

    const runIds = (whitelist ?? [])
      .map((entry) => entry.run_id)
      .filter(Boolean);

    let runMap = new Map();

    if (runIds.length > 0) {
      const { data: runs, error: runsError } =
        await supabase
          .from("game_runs")
          .select(
            "run_id, duration_ms"
          )
          .in("run_id", runIds);

      if (runsError) {
        throw runsError;
      }

      runMap = new Map(
        (runs ?? []).map((run) => [
          run.run_id,
          run
        ])
      );
    }

    const entries = (whitelist ?? []).map(
      (entry, index) => {
        const run = runMap.get(entry.run_id);

        const totalSeconds = Math.max(
          0,
          Math.floor(
            Number(run?.duration_ms ?? 0) / 1000
          )
        );

        const minutes = Math.floor(
          totalSeconds / 60
        );

        const seconds =
          totalSeconds % 60;

        const wallet =
          entry.wallet_address ?? "";

        const maskedWallet =
          wallet.length >= 10
            ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
            : wallet;

        const handle =
          typeof entry.twitter_handle === "string"
            ? entry.twitter_handle.trim()
            : "";

        return {
          rank: index + 1,
          player: handle || maskedWallet,
          score: Number(entry.best_score) || 0,
          completionTime:
            totalSeconds > 0
              ? `${minutes}:${String(
                  seconds
                ).padStart(2, "0")}`
              : "--",
          completed: true
        };
      }
    );

    res.setHeader(
      "Cache-Control",
      "s-maxage=15, stale-while-revalidate=30"
    );

    return res.status(200).json({
      entries
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to load leaderboard"
    });
  }
}
