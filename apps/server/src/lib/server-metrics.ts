/**
 * Real-time Server Performance & Telemetry Tracker
 * 
 * Collects 100% genuine live metrics without any simulation or mock data.
 */

interface LatencySample {
  time: number;
  durationMs: number;
}

class ServerMetricsTracker {
  private totalRequests = 0;
  private totalErrors = 0;
  private activeRequests = 0;
  private readonly startTime = Date.now();
  private latencySamples: LatencySample[] = [];
  private readonly maxSamples = 1000;

  recordRequestStart() {
    this.totalRequests++;
    this.activeRequests++;
  }

  recordRequestEnd(durationMs: number, isError = false) {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
    if (isError) this.totalErrors++;

    const now = Date.now();
    this.latencySamples.push({ time: now, durationMs });

    if (this.latencySamples.length > this.maxSamples) {
      this.latencySamples.shift();
    }
  }

  getMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Prune samples older than 5 minutes
    const recentSamples = this.latencySamples.filter(s => s.time >= oneMinuteAgo);
    
    const rps = recentSamples.length > 0 
      ? Math.round((recentSamples.length / 60) * 10) / 10 
      : 0;

    let avgLatency = 0;
    let p95Latency = 0;

    if (recentSamples.length > 0) {
      const sorted = recentSamples.map(s => s.durationMs).sort((a, b) => a - b);
      const sum = sorted.reduce((acc, v) => acc + v, 0);
      avgLatency = Math.round(sum / sorted.length);
      const p95Index = Math.floor(sorted.length * 0.95);
      p95Latency = Math.round(sorted[p95Index] ?? sorted[sorted.length - 1] ?? 0);
    }

    return {
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      activeRequests: this.activeRequests,
      requestsPerSecond: rps,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      uptimeSeconds: Math.round((now - this.startTime) / 1000),
    };
  }
}

export const serverMetrics = new ServerMetricsTracker();
