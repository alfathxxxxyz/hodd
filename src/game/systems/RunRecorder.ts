import { RunEvent, RunStats } from "../types";

export class RunRecorder {
  private readonly startedAt = performance.now();
  private readonly events: RunEvent[] = [];

  public constructor(private readonly runId: string) {}

  public record(type: RunEvent["type"], value?: number): void {
    this.events.push({ atMs: Math.round(performance.now() - this.startedAt), type, value });
  }

  public stats(data: Omit<RunStats, "runId" | "durationMs" | "events">): RunStats {
    return {
      ...data,
      runId: this.runId,
      durationMs: Math.round(performance.now() - this.startedAt),
      events: [...this.events]
    };
  }
}
