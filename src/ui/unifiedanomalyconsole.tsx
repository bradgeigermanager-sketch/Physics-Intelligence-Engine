// src/ui/UnifiedAnomalyConsole.tsx

import React, { useMemo, useState } from "react";
import {
  RegimeTimeline,
  RegimeTimelineEntry,
} from "../runtime/regime_timeline_engine";
import {
  RegimeClassification,
  RegimeExplanation,
} from "../core/types";

export interface AnomalyEvent {
  id: string;
  timestamp: string;
  stateId?: string;
  severity: "info" | "warning" | "critical";
  label: string;
  description?: string;
  regimeIds?: string[];
  tags?: string[];
}

export interface PlaybookTrigger {
  id: string;
  name: string;
  description?: string;
  version: string;
  active: boolean;
  lastFiredAt?: string;
  linkedAnomalyIds?: string[];
}

export interface UnifiedAnomalyConsoleProps {
  timeline: RegimeTimeline;
  anomalies: AnomalyEvent[];
  playbooks: PlaybookTrigger[];
  versions: string[];
  selectedVersion?: string;
  onVersionChange?: (version: string) => void;
  onSelectAnomaly?: (anomaly: AnomalyEvent) => void;
  onSelectPlaybook?: (playbook: PlaybookTrigger) => void;
}

/**
 * Small helpers
 */
function formatTs(ts: string) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function severityColor(sev: AnomalyEvent["severity"]): string {
  switch (sev) {
    case "critical":
      return "#b91c1c";
    case "warning":
      return "#b45309";
    case "info":
    default:
      return "#0369a1";
  }
}

function confidenceColor(c: number): string {
  if (c >= 0.8) return "#16a34a";
  if (c >= 0.5) return "#eab308";
  return "#6b7280";
}

/**
 * Timeline strip for regimes + anomalies.
 */
const TimelineStrip: React.FC<{
  entries: RegimeTimelineEntry[];
  anomalies: AnomalyEvent[];
  onSelectEntry?: (entry: RegimeTimelineEntry) => void;
  onSelectAnomaly?: (anomaly: AnomalyEvent) => void;
}> = ({ entries, anomalies, onSelectEntry, onSelectAnomaly }) => {
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [entries]
  );

  const anomalyByTs = useMemo(() => {
    const map = new Map<string, AnomalyEvent[]>();
    for (const a of anomalies) {
      const arr = map.get(a.timestamp) ?? [];
      arr.push(a);
      map.set(a.timestamp, arr);
    }
    return map;
  }, [anomalies]);

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 8 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Regime Timeline</div>
      <div
        style={{
          maxHeight: 260,
          overflowY: "auto",
          fontSize: 12,
        }}
      >
        {sortedEntries.map((e) => {
          const tsAnoms = anomalyByTs.get(e.timestamp) ?? [];
          const dominant = e.regimes.reduce<RegimeClassification | null>(
            (best, r) => (!best || r.confidence > best.confidence ? r : best),
            null
          );
          return (
            <div
              key={e.timestamp + (e.stateId ?? "")}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "4px 6px",
                borderRadius: 4,
                cursor: "pointer",
                marginBottom: 2,
                background: "#f9fafb",
              }}
              onClick={() => onSelectEntry?.(e)}
            >
              <div style={{ width: 160, color: "#4b5563" }}>
                {formatTs(e.timestamp)}
              </div>
              <div style={{ flex: 1 }}>
                {dominant ? (
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: "#eef2ff",
                      color: confidenceColor(dominant.confidence),
                      fontWeight: 500,
                    }}
                  >
                    {dominant.label} ({dominant.confidence.toFixed(2)})
                  </span>
                ) : (
                  <span style={{ color: "#9ca3af" }}>No regimes</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {tsAnoms.map((a) => (
                  <span
                    key={a.id}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onSelectAnomaly?.(a);
                    }}
                    style={{
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: severityColor(a.severity),
                      color: "white",
                      fontSize: 11,
                    }}
                  >
                    {a.label}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Explanation panel for a selected timestamp.
 */
const ExplanationPanel: React.FC<{
  explanation?: RegimeExplanation;
}> = ({ explanation }) => {
  if (!explanation) {
    return (
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 8,
          minHeight: 140,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          Regime Explanation
        </div>
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          Select a timeline entry to view its explanation.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 8,
        minHeight: 140,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        Regime Explanation
      </div>
      <div style={{ fontSize: 13, marginBottom: 4 }}>{explanation.summary}</div>
      <div style={{ fontSize: 12, color: "#4b5563", whiteSpace: "pre-wrap" }}>
        {explanation.detailed}
      </div>
      {explanation.drivers?.length ? (
        <div style={{ marginTop: 6 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            Key Drivers
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {explanation.drivers.map((d) => (
              <span
                key={d.capability}
                style={{
                  padding: "2px 6px",
                  borderRadius: 999,
                  background: "#f3f4f6",
                  fontSize: 11,
                }}
              >
                {d.capability} ({d.value.toFixed(2)})
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/**
 * Anomaly list panel.
 */
const AnomalyList: React.FC<{
  anomalies: AnomalyEvent[];
  onSelect?: (a: AnomalyEvent) => void;
}> = ({ anomalies, onSelect }) => {
  const sorted = useMemo(
    () =>
      [...anomalies].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [anomalies]
  );

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 8,
        maxHeight: 260,
        overflowY: "auto",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Anomalies</div>
      {sorted.length === 0 ? (
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          No anomalies in this view.
        </div>
      ) : (
        sorted.map((a) => (
          <div
            key={a.id}
            onClick={() => onSelect?.(a)}
            style={{
              padding: "4px 6px",
              borderRadius: 4,
              marginBottom: 4,
              cursor: "pointer",
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: severityColor(a.severity),
                  color: "white",
                  fontWeight: 500,
                }}
              >
                {a.label}
              </span>
              <span style={{ color: "#6b7280" }}>{formatTs(a.timestamp)}</span>
            </div>
            {a.description ? (
              <div
                style={{
                  fontSize: 12,
                  color: "#4b5563",
                  marginTop: 2,
                }}
              >
                {a.description}
              </div>
            ) : null}
            {a.tags && a.tags.length ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  marginTop: 2,
                }}
              >
                {a.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      padding: "1px 4px",
                      borderRadius: 999,
                      background: "#e5e7eb",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
};

/**
 * Playbook panel.
 */
const PlaybookPanel: React.FC<{
  playbooks: PlaybookTrigger[];
  onSelect?: (p: PlaybookTrigger) => void;
}> = ({ playbooks, onSelect }) => {
  const sorted = useMemo(
    () =>
      [...playbooks].sort((a, b) => a.name.localeCompare(b.name)),
    [playbooks]
  );

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 8,
        maxHeight: 260,
        overflowY: "auto",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Playbooks</div>
      {sorted.length === 0 ? (
        <div style={{ fontSize: 13, color: "#9ca3af" }}>
          No playbooks registered.
        </div>
      ) : (
        sorted.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelect?.(p)}
            style={{
              padding: "4px 6px",
              borderRadius: 4,
              marginBottom: 4,
              cursor: "pointer",
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 500 }}>{p.name}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: p.active ? "#16a34a" : "#9ca3af",
                  color: "white",
                }}
              >
                v{p.version} {p.active ? "active" : "inactive"}
              </span>
            </div>
            {p.description ? (
              <div
                style={{
                  fontSize: 12,
                  color: "#4b5563",
                  marginTop: 2,
                }}
              >
                {p.description}
              </div>
            ) : null}
            {p.lastFiredAt ? (
              <div
                style={{
                  fontSize: 11,
                  color: "#6b7280",
                  marginTop: 2,
                }}
              >
                Last fired: {formatTs(p.lastFiredAt)}
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
};

/**
 * Version selector bar.
 */
const VersionBar: React.FC<{
  versions: string[];
  selected?: string;
  onChange?: (v: string) => void;
}> = ({ versions, selected, onChange }) => {
  if (!versions.length) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 12, color: "#6b7280" }}>Version:</span>
      <select
        value={selected ?? versions[0]}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          fontSize: 12,
          padding: "2px 6px",
          borderRadius: 4,
          border: "1px solid #d1d5db",
        }}
      >
        {versions.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * Unified Anomaly Console root component.
 */
export const UnifiedAnomalyConsole: React.FC<
  UnifiedAnomalyConsoleProps
> = ({
  timeline,
  anomalies,
  playbooks,
  versions,
  selectedVersion,
  onVersionChange,
  onSelectAnomaly,
  onSelectPlaybook,
}) => {
  const [selectedTs, setSelectedTs] = useState<string | undefined>(undefined);

  const explanationForTs: RegimeExplanation | undefined = useMemo(() => {
    if (!selectedTs) return undefined;
    return timeline.explanations[selectedTs];
  }, [selectedTs, timeline.explanations]);

  const handleEntrySelect = (entry: RegimeTimelineEntry) => {
    setSelectedTs(entry.timestamp);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 13,
        color: "#111827",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          Unified Anomaly Console
        </div>
        <VersionBar
          versions={versions}
          selected={selectedVersion}
          onChange={onVersionChange}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr", gap: 8 }}>
        <TimelineStrip
          entries={timeline.entries}
          anomalies={anomalies}
          onSelectEntry={handleEntrySelect}
          onSelectAnomaly={onSelectAnomaly}
        />
        <ExplanationPanel explanation={explanationForTs} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr", gap: 8 }}>
        <AnomalyList anomalies={anomalies} onSelect={onSelectAnomaly} />
        <PlaybookPanel playbooks={playbooks} onSelect={onSelectPlaybook} />
      </div>
    </div>
  );
};
