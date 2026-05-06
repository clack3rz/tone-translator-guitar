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
  color: "#0f172a",
  backgroundColor: "#f8fafc",
};

const readableCardStyle: React.CSSProperties = {
  color: "#0f172a",
  backgroundColor: "#ffffff",
};

const readableMutedStyle: React.CSSProperties = {
  color: "#475569",
};

const readableValueStyle: React.CSSProperties = {
  color: "#020617",
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
        className="rounded-xl border border-slate-200 p-3"
        style={readableCardStyle}
      >
        <div className="text-sm font-bold" style={{ color: "#1e293b" }}>
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
      className="rounded-xl border border-slate-200 p-3"
      style={readableCardStyle}
    >
      <div className="mb-2 text-sm font-bold" style={{ color: "#1e293b" }}>
        {title}
      </div>
      <div className="space-y-1">
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="grid grid-cols-[170px_1fr] gap-2 border-b border-slate-100 pb-1 text-xs leading-tight last:border-0 last:pb-0"
          >
            <div
              className="font-mono font-semibold"
              style={{ color: "#334155" }}
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
      className="rounded-2xl border border-slate-200 p-4 shadow-sm"
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
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold"
            style={{ color: "#334155" }}
          >
            {item.slot_section}
            {item.slot_index >= 0 ? ` / Slot ${item.slot_index}` : ""}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              item.exported ? "bg-green-100" : "bg-red-100"
            }`}
            style={{ color: item.exported ? "#166534" : "#991b1b" }}
          >
            {item.exported ? "Exported" : "Skipped"}
          </span>

          {hasWarning && (
            <span
              className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold"
              style={{ color: "#92400e" }}
            >
              Check
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-sm" style={readableValueStyle}>
        <div>
          <span className="font-bold" style={{ color: "#334155" }}>
            Type:
          </span>{" "}
          <span className="font-mono font-semibold" style={readableValueStyle}>
            {item.type}
          </span>
        </div>

        <div>
          <span className="font-bold" style={{ color: "#334155" }}>
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
          <span className="font-bold" style={{ color: "#334155" }}>
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
      className="rounded-2xl border border-slate-200 p-4"
      style={readablePanelStyle}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold" style={readableValueStyle}>
            AT5 Export Signal Chain
          </h2>
          <p className="text-sm" style={readableMutedStyle}>
            Visual view of the actual exported AmpliTube chain.
          </p>
          <p className="mt-1 text-sm" style={readableMutedStyle}>
            {debugData.exported_xml_summary}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyJson}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold shadow-sm"
            style={{ color: "#ffffff" }}
          >
            Copy Chain JSON
          </button>

          <button
            type="button"
            onClick={exportJson}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-slate-200"
            style={{ color: "#0f172a" }}
          >
            Export Chain JSON
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {SECTION_ORDER.map((section) => {
          const items = grouped[section] ?? [];
          const showStatic =
            section === "Input" ||
            section === "Output" ||
            section === "Room / Mics";

          if (!items.length && !showStatic) return null;

          return (
            <div key={section} style={readableValueStyle}>
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="rounded-full bg-slate-900 px-3 py-1 text-sm font-bold"
                  style={{ color: "#ffffff" }}
                >
                  {section}
                </div>
                {items.length > 0 && (
                  <div className="text-sm" style={readableMutedStyle}>
                    {items.length} item{items.length === 1 ? "" : "s"}
                  </div>
                )}
              </div>

              {showStatic && !items.length ? (
                <div
                  className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm"
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
