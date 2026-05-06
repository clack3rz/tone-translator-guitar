import React, { useMemo } from "react";

type ExportDebugItem = {
  original_name: string;
  normalized_name: string;
  type: string;
  resolved_guid: string;
  slot_section: string;
  slot_index: number;
  original_settings: Record<string, unknown>;
  normalized_settings: Record<string, unknown>;
  exported_settings: string;
  exported: boolean;
  reason: string;
};

type ExportDebugData = {
  raw_input_chain: unknown[];
  exported_chain: ExportDebugItem[];
  skipped_gear: ExportDebugItem[];
  exported_xml_summary: string;
};

type Props = {
  debugData: ExportDebugData;
};

const SECTION_ORDER = [
  "Input",
  "StompA1",
  "StompA2",
  "StompStereo",
  "StompB1",
  "StompB2",
  "StompB3",
  "AmpA",
  "AmpB",
  "AmpC",
  "CabA",
  "Room / Mics",
  "RackA",
  "RackB",
  "RackC",
  "RackDI",
  "RackMaster",
  "Output",
  "Skipped",
];

const readablePanelStyle: React.CSSProperties = {
  color: "#f1f5f9",
  backgroundColor: "#05070a",
};

const readableCardStyle: React.CSSProperties = {
  color: "#f1f5f9",
  backgroundColor: "#0f172a",
};

const readableMutedStyle: React.CSSProperties = {
  color: "#94a3b8",
};

const readableValueStyle: React.CSSProperties = {
  color: "#f8fafc",
};

const parseAttrString = (value: string): Record<string, string> => {
  const result: Record<string, string> = {};
  const regex = /([A-Za-z0-9_]+)="([^"]*)"/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(value ?? "")) !== null) {
    result[match[1]] = match[2];
  }

  return result;
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const SettingsTable = ({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown>;
}) => {
  const entries = Object.entries(data ?? {});

  if (!entries.length) {
    return (
      <div
        className="rounded-xl border border-slate-800 p-3"
        style={readableCardStyle}
      >
        <div className="text-sm font-bold" style={{ color: "#f1f5f9" }}>
          {title}
        </div>
        <div className="mt-1 text-sm" style={readableMutedStyle}>
          No values
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-slate-800 p-3"
      style={readableCardStyle}
    >
      <div className="mb-2 text-sm font-bold" style={{ color: "#f1f5f9" }}>
        {title}
      </div>
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="grid grid-cols-[170px_1fr] gap-2 border-b border-white/5 pb-1 text-xs leading-tight last:border-0 last:pb-0"
          >
            <div
              className="font-mono font-semibold"
              style={{ color: "#94a3b8" }}
            >
              {key}
            </div>
            <div
              className="break-all font-mono font-semibold"
              style={readableValueStyle}
            >
              {formatValue(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const GearCard = ({ item }: { item: ExportDebugItem }) => {
  const exportedAttrs = parseAttrString(item.exported_settings ?? "");

  const hasWarning =
    !item.exported ||
    item.reason.toLowerCase().includes("warning") ||
    item.reason.toLowerCase().includes("caution") ||
    item.reason.toLowerCase().includes("fallback") ||
    item.exported_settings.includes("undefined") ||
    (item.exported && !item.exported_settings && item.type !== "cab");

  return (
    <div
      className="rounded-2xl border border-slate-800 p-4 shadow-xl"
      style={readableCardStyle}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold" style={readableValueStyle}>
            {item.normalized_name}
          </div>
          <div className="text-sm" style={readableMutedStyle}>
            Original: {item.original_name}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
             className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold"
            style={{ color: "#cbd5e1" }}
          >
            {item.slot_section}
            {item.slot_index >= 0 ? ` / Slot ${item.slot_index}` : ""}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              item.exported ? "bg-green-950/40" : "bg-red-950/40"
            }`}
            style={{ color: item.exported ? "#4ade80" : "#f87171" }}
          >
            {item.exported ? "Exported" : "Skipped"}
          </span>

          {hasWarning && (
            <span
              className="rounded-full bg-amber-950/40 px-3 py-1 text-xs font-semibold"
              style={{ color: "#fbbf24" }}
            >
              Check
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-sm" style={readableValueStyle}>
        <div>
          <span className="font-bold" style={{ color: "#94a3b8" }}>
            Type:
          </span>{" "}
          <span className="font-mono font-semibold" style={readableValueStyle}>
            {item.type}
          </span>
        </div>

        <div>
          <span className="font-bold" style={{ color: "#94a3b8" }}>
            GUID:
          </span>{" "}
          <span
            className="break-all font-mono font-semibold"
            style={readableValueStyle}
          >
            {item.resolved_guid}
          </span>
        </div>

        <div>
          <span className="font-bold" style={{ color: "#94a3b8" }}>
            Reason:
          </span>{" "}
          <span style={readableValueStyle}>{item.reason}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <SettingsTable title="Original settings" data={item.original_settings} />
        <SettingsTable
          title="Normalised settings"
          data={item.normalized_settings}
        />
        <SettingsTable title="Exported XML settings" data={exportedAttrs} />
      </div>
    </div>
  );
};

const buildGroupedChain = (debugData: ExportDebugData) => {
  const groups: Record<string, ExportDebugItem[]> = {};

  for (const section of SECTION_ORDER) {
    groups[section] = [];
  }

  for (const item of debugData.exported_chain ?? []) {
    const section = item.slot_section || "Other";
    if (!groups[section]) groups[section] = [];
    groups[section].push(item);
  }

  for (const item of debugData.skipped_gear ?? []) {
    groups["Skipped"].push(item);
  }

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.slot_index - b.slot_index);
  }

  return groups;
};

export const AT5SignalChainView: React.FC<Props> = ({ debugData }) => {
  const grouped = useMemo(() => buildGroupedChain(debugData), [debugData]);

  const copyJson = async () => {
    await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(debugData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "tt-at5-signal-chain-debug.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="rounded-2xl border border-slate-800 p-6 shadow-2xl"
      style={readablePanelStyle}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight" style={readableValueStyle}>
            AT5 Export Signal Chain
          </h2>
          <p className="text-sm mt-1" style={readableMutedStyle}>
            Visual view of the actual exported AmpliTube chain.
          </p>
          <p className="mt-2 text-[10px] font-mono uppercase tracking-widest opacity-60" style={readableMutedStyle}>
            {debugData.exported_xml_summary}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={copyJson}
            className="rounded-xl bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border border-white/10 transition-all shadow-lg active:scale-95"
            style={{ color: "#ffffff" }}
          >
            Copy Chain JSON
          </button>

          <button
            type="button"
            onClick={exportJson}
            className="rounded-xl bg-white/5 hover:bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest border border-white/10 transition-all shadow-lg active:scale-95"
            style={{ color: "#ffffff" }}
          >
            Export Chain JSON
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {SECTION_ORDER.map((section) => {
          const items = grouped[section] ?? [];
          const showStatic =
            section === "Input" ||
            section === "Output" ||
            section === "Room / Mics";

          if (!items.length && !showStatic) return null;

          return (
            <div key={section} style={readableValueStyle}>
              <div className="mb-3 flex items-center gap-3">
                <div
                  className="rounded-lg bg-black px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.2em] border border-white/10"
                  style={{ color: "#ffffff" }}
                >
                  {section}
                </div>
                {items.length > 0 && (
                  <div className="text-[10px] font-mono uppercase tracking-widest" style={readableMutedStyle}>
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </div>
                )}
              </div>

              {showStatic && !items.length ? (
                <div
                  className="rounded-2xl border border-dashed border-slate-800 p-6 text-sm italic"
                  style={readableCardStyle}
                >
                  {section === "Input" &&
                    "Input section is part of the AT5 preset wrapper."}
                  {section === "Output" &&
                    "Output section is part of the AT5 preset wrapper."}
                  {section === "Room / Mics" &&
                    "Room and mic details are shown inside the CabA card under Exported XML settings."}
                </div>
              ) : (
                <div className="grid gap-3">
                  {items.map((item, index) => (
                    <GearCard
                      key={`${section}-${item.slot_index}-${item.normalized_name}-${index}`}
                      item={item}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AT5SignalChainView;
