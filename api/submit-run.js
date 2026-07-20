import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables");
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const {
      runId,
      walletAddress,
      twitterHandle,
      score,
      sparks,
      rareSparks,
      captures,
      damageTaken,
      durationMs
    } = req.body ?? {};

    if (
      typeof runId !== "string" ||
      typeof walletAddress !== "string" ||
      typeof score !== "number"
    ) {
      return res.status(400).json({
        error: "Invalid request"
      });
    }

    const wallet = walletAddress.trim().toLowerCase();

    if (!/^0x[a-f0-9]{40}$/.test(wallet)) {
      return res.status(400).json({
        error: "Invalid wallet address"
      });
    }

    const cleanScore = Math.floor(score);
    const cleanSparks = Math.floor(Number(sparks) || 0);
    const cleanRareSparks = Math.floor(Number(rareSparks) || 0);
    const cleanCaptures = Math.floor(Number(captures) || 0);
    const cleanDamageTaken = Math.floor(Number(damageTaken) || 0);
    const cleanDuration = Math.floor(Number(durationMs) || 0);

    const valid =
      cleanScore >= 0 &&
      cleanScore <= 100000 &&
      cleanSparks >= 0 &&
      cleanSparks <= 80 &&
      cleanRareSparks >= 0 &&
      cleanRareSparks <= 10 &&
      cleanCaptures >= 0 &&
      cleanCaptures <= 100 &&
      cleanDamageTaken >= 0 &&
      cleanDamageTaken <= 20 &&
      cleanDuration >= 1000 &&
      cleanDuration <= 125000;

    if (!valid) {
      return res.status(400).json({
        error: "Invalid run data"
      });
    }

    const { error: runError } = await supabase
      .from("game_runs")
      .insert({
        run_id: runId,
        wallet_address: wallet,
        score: cleanScore,
        sparks: cleanSparks,
        rare_sparks: cleanRareSparks,
        captures: cleanCaptures,
        damage_taken: cleanDamageTaken,
        duration_ms: cleanDuration,
        valid: true
      });

    if (runError) {
      if (runError.code === "23505") {
        return res.status(409).json({
          error: "Run already submitted"
        });
      }

      throw runError;
    }

    const { data: currentEntry } = await supabase
      .from("whitelist_entries")
      .select("best_score")
      .eq("wallet_address", wallet)
      .maybeSingle();

    const bestScore = Math.max(
      currentEntry?.best_score ?? 0,
      cleanScore
    );

    const qualified = bestScore >= 10000;

    const { error: whitelistError } = await supabase
      .from("whitelist_entries")
      .upsert(
        {
          wallet_address: wallet,
          twitter_handle:
            typeof twitterHandle === "string"
              ? twitterHandle.trim()
              : null,
          best_score: bestScore,
          qualified,
          run_id: runId,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "wallet_address"
        }
      );

    if (whitelistError) {
      throw whitelistError;
    }

    return res.status(200).json({
      success: true,
      qualified,
      bestScore
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}
