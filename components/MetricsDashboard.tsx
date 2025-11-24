
import React, { useEffect, useState } from 'react';

export function MetricsDashboard({ orchestratorStats, cortexStats, circuitBreakerState }: { orchestratorStats: any, cortexStats: any, circuitBreakerState: string }) {
  if (!orchestratorStats || !cortexStats) return <div>Loading metrics...</div>;

  return (
    <div className="metrics-dashboard">
      <h2>System Metrics</h2>

      <section>
        <h3>Cortex Learning</h3>
        <p>Total Experiences: {cortexStats.totalExperiences}</p>
        <p>Success Rate: {(cortexStats.successRate * 100).toFixed(1)}%</p>
        <p>Avg Quality: {(cortexStats.avgQuality * 100).toFixed(1)}%</p>
      </section>

      <section>
        <h3>Orchestrator Performance</h3>
        {orchestratorStats.capabilityPerformance.map((perf: any) => (
          <div key={perf.capability}>
            <strong>{perf.capability}</strong>: {(perf.successRate * 100).toFixed(1)}%
          </div>
        ))}
      </section>

      <section>
        <h3>Circuit Breaker</h3>
        <p>State: {circuitBreakerState}</p>
      </section>
    </div>
  );
}
