import React, { useState, useMemo } from 'react';
import { RotateCcw, Pause, Play, Sliders } from 'lucide-react';
import { IsometricSimulation } from '../Simulation/IsometricSimulation';
import { LatencyCurveChart } from '../Simulation/LatencyCurveChart';
import { SimulationConfig, ThemeMode } from '../../types/course';

interface DesignLabViewProps {
  theme: ThemeMode;
}

export const DesignLabView: React.FC<DesignLabViewProps> = ({ theme }) => {
  const [users, setUsers] = useState(7200);
  const [servers, setServers] = useState(1);
  const [fanOut, setFanOut] = useState(0);
  const [longLink, setLongLink] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const simConfig: SimulationConfig = useMemo(() => {
    const reqPerSec = Math.round(users * 0.05);
    const totalCapacity = servers * 500;
    const rawUtil = Math.min(99, Math.round((reqPerSec / totalCapacity) * 100));

    // Queueing curve approximation: base + hockey-stick explosion near 100%
    const loadFactor = rawUtil / 100;
    const baseMs = longLink ? 120 : 38;
    const fanOutPenalty = fanOut * 28;
    const queueDelay = Math.round(22 * Math.pow(loadFactor / Math.max(0.04, 1 - loadFactor), 1.35));
    const p50Ms = baseMs + fanOutPenalty + queueDelay;
    const p99Ms = Math.round(p50Ms * (1.8 + 3.2 * Math.pow(loadFactor, 3)));

    const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`);
    const queueCount = rawUtil >= 92 ? 6 : rawUtil >= 80 ? 4 : rawUtil >= 65 ? 2 : 0;

    return {
      usersCount: Math.max(4, Math.min(15, Math.round(users / 640))),
      usersLabel: `${users.toLocaleString()} users`,
      utilization: rawUtil,
      queueCount,
      serverCount: servers >= 2 ? 2 : 1,
      fanOutCount: fanOut,
      linkLength: longLink ? 'long' : 'normal',
      batchMode: false,
      p50Label: fmtMs(p50Ms),
      p99Label: fmtMs(p99Ms),
      throughputLabel: `${Math.min(reqPerSec, totalCapacity)} req/s`,
      utilizationLabel: `${rawUtil}%`,
      particleSpeed: Math.max(0.55, 1.15 - loadFactor * 0.45),
      slowRatio: rawUtil >= 85 ? 0.65 : rawUtil >= 65 ? 0.25 : 0.05,
    };
  }, [users, servers, fanOut, longLink]);

  return (
    <div className="secondary-view">
      <div className="view-container">
        <div
          className="view-card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) 290px',
            gap: 18,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>
                  Interactive Design Lab
                </h1>
                <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  Adjust traffic, server capacity, distance, and fan-out live to observe queueing behavior.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="tactile-btn"
                  onClick={() => setReplayKey((k) => k + 1)}
                >
                  <RotateCcw size={13} />
                  <span>Replay</span>
                </button>
                <button
                  type="button"
                  className={`tactile-btn ${isPaused ? 'primary' : ''}`}
                  onClick={() => setIsPaused((p) => !p)}
                >
                  {isPaused ? <Play size={13} /> : <Pause size={13} />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
              </div>
            </div>

            <div className="metrics-strip" style={{ marginBottom: 10 }}>
              <div className={`metric-card ${simConfig.utilization >= 85 ? 'severity-danger' : 'severity-neutral'}`}>
                <div className="metric-label">P50 LATENCY</div>
                <div className="metric-value">{simConfig.p50Label}</div>
              </div>
              <div className={`metric-card ${simConfig.utilization >= 80 ? 'severity-danger' : 'severity-warn'}`}>
                <div className="metric-label">P99 LATENCY</div>
                <div className="metric-value">{simConfig.p99Label}</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">THROUGHPUT</div>
                <div className="metric-value">{simConfig.throughputLabel}</div>
              </div>
              <div
                className={`metric-card ${
                  simConfig.utilization >= 85
                    ? 'severity-danger'
                    : simConfig.utilization >= 65
                    ? 'severity-warn'
                    : 'severity-good'
                }`}
              >
                <div className="metric-label">UTILIZATION</div>
                <div className="metric-value">{simConfig.utilizationLabel}</div>
              </div>
            </div>

            <div className="sim-stage-wrap" style={{ minHeight: 340 }}>
              <LatencyCurveChart
                utilization={simConfig.utilization}
                theme={theme}
                transitionKey={`lab-${users}-${servers}-${fanOut}-${longLink}-${replayKey}`}
                isPaused={isPaused}
              />
              <IsometricSimulation
                config={simConfig}
                isPaused={isPaused}
                replayKey={replayKey}
                theme={theme}
                transitionKey={`lab-${users}-${servers}-${fanOut}-${longLink}-${replayKey}`}
              />
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-inset)',
              border: '1px solid var(--border-card)',
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700 }}>
              <Sliders size={14} style={{ color: 'var(--olive-text)' }} />
              <span>SYSTEM PARAMETERS</span>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Active Users</span>
                <strong>{users.toLocaleString()}</strong>
              </div>
              <input
                type="range"
                min={1000}
                max={12000}
                step={200}
                value={users}
                onChange={(e) => setUsers(Number(e.target.value))}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>App Servers (500 req/s each)</span>
                <strong>{servers}</strong>
              </div>
              <input
                type="range"
                min={1}
                max={3}
                step={1}
                value={servers}
                onChange={(e) => setServers(Number(e.target.value))}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Downstream Fan-out Services</span>
                <strong>{fanOut}</strong>
              </div>
              <input
                type="range"
                min={0}
                max={3}
                step={1}
                value={fanOut}
                onChange={(e) => setFanOut(Number(e.target.value))}
              />
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11.5,
                cursor: 'pointer',
              }}
            >
              <span>Cross-Region Distance (+80 ms)</span>
              <input
                type="checkbox"
                checked={longLink}
                onChange={(e) => setLongLink(e.target.checked)}
              />
            </label>

            <button
              type="button"
              className="tactile-btn primary"
              style={{ marginTop: 'auto', justifyContent: 'center' }}
              onClick={() => {
                setUsers(9600);
                setServers(1);
                setFanOut(0);
                setLongLink(false);
              }}
            >
              Load "Hockey Stick" Preset (96%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
