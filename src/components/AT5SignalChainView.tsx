import React, { useMemo } from "react";
import { getAt5Catalog } from "../services/at5Catalog";
import { getVerifiedCabs, getVerifiedSpeakers, getVerifiedMics } from "../services/at5VerifiedProtocols";

import { AT5_VERIFIED_GEAR } from "../services/at5VerifiedParameterOverrides";

type ExportDebugItem = {
  original_name: string;
  normalized_name: string;
  type: string;
  resolved_guid: string;
  slot_section: string;
  slot_index: number;
  original_index: number;
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
  onJumpToCatalogue?: (guid: string) => void;
};


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

const normalizeGuid = (guid: any) => {
  if (typeof guid !== 'string') return String(guid);
  return guid.toLowerCase().replace(/-/g, '').trim();
};

const isGuid = (val: any) => {
  if (typeof val !== 'string') return false;
  // Standard UUID format: 8-4-4-4-12 hex chars or 32 hex chars
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const hex32Regex = /^[0-9a-f]{32}$/i;
  return uuidRegex.test(val.trim()) || hex32Regex.test(val.trim());
};

const resolveGuidName = (guid: any, paramName?: string) => {
  if (!isGuid(guid)) return String(guid);
  const normalizedGuid = normalizeGuid(guid);

  const catalog = getAt5Catalog();
  const known = catalog.find(i => normalizeGuid(i.guid) === normalizedGuid);
  if (known) return known.displayName;
  
  // Also check verified overrides
  const verified = AT5_VERIFIED_GEAR.find(v => v.realId && normalizeGuid(v.realId) === normalizedGuid);
  if (verified) return verified.name;
  
  // Check protocols - match first alias if found
  const mic = getVerifiedMics().find(m => normalizeGuid(m.guid) === normalizedGuid);
  if (mic) return mic.aliases[0] || "Verified Mic";

  const speaker = getVerifiedSpeakers().find(m => normalizeGuid(m.guid) === normalizedGuid);
  if (speaker) return speaker.aliases[0] || "Verified Speaker";

  const cab = getVerifiedCabs().find(m => normalizeGuid(m.guid) === normalizedGuid);
  if (cab) return cab.aliases[0] || "Verified Cabinet";
  
  const cleanGuid = guid.trim();
  const short = cleanGuid.includes("-") ? cleanGuid.split("-")[0] : cleanGuid.substring(0, 8);
  let type = "Gear";
  const pName = paramName?.toLowerCase() || "";
  if (pName.includes("speaker")) type = "Speaker";
  else if (pName.includes("mic")) type = "Mic";
  else if (pName.includes("cab")) type = "Cab/Model";

  return `Unknown ${type} (${short})`;
};

const isUnknown = (name: string) => name.toLowerCase().includes("unknown");

const SettingsTable = ({
  title,
  data,
  onJumpToCatalogue,
}: {
  title: string;
  data: Record<string, unknown>;
  onJumpToCatalogue?: (guid: string) => void;
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
        {entries.map(([key, value]) => {
          const valStr = String(value ?? "");
          // Support both 8-4-4-4-12 (36 chars) and hyphenless 32 charshex
          const isGuidDef = valStr.length >= 30 && (valStr.includes("-") || /^[a-fA-F0-9]{32}$/.test(valStr));
          const resolvedName = isGuidDef ? resolveGuidName(valStr, key) : null;

          return (
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
                className="break-all font-mono font-semibold flex flex-col"
                style={readableValueStyle}
              >
                {isGuidDef ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col">
                      <span className={`font-bold ${resolvedName && isUnknown(resolvedName) ? 'text-amber-400' : 'text-blue-400'}`}>
                        {resolvedName}
                      </span>
                      <span className="text-[10px] opacity-60 text-slate-400">{valStr}</span>
                    </div>
                    {onJumpToCatalogue && (
                      <button
                        onClick={() => onJumpToCatalogue(valStr)}
                        className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 hover:text-purple-300 text-[8px] font-mono border border-purple-500/20 hover:bg-purple-500/20 transition-all uppercase tracking-tighter shrink-0"
                        title={`Manage catalogue entry for ${resolvedName}`}
                      >
                        Manage entry
                      </button>
                    )}
                  </div>
                ) : (
                  <span>{formatValue(value)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GearCard = ({ item, onJumpToCatalogue }: { item: ExportDebugItem; onJumpToCatalogue?: (guid: string) => void }) => {
  const exportedAttrs = parseAttrString(item.exported_settings ?? "");

  const isCheck = 
    item.exported && (
      item.reason.toLowerCase().includes("check") ||
      item.reason.toLowerCase().includes("warning") ||
      item.reason.toLowerCase().includes("caution") ||
      item.reason.toLowerCase().includes("fallback") ||
      item.exported_settings.includes("undefined") ||
      (!item.exported_settings && item.type !== "cab")
    );

  const cardId = `at5-chain-card-${item.slot_section}-${item.slot_index}-${item.normalized_name}`;

  const cardHasUnknown = Object.entries(exportedAttrs).some(([k, v]) => {
    const val = String(v ?? "");
    const isGuid = val.length >= 30 && (val.includes("-") || /^[a-fA-F0-9]{32}$/.test(val));
    if (!isGuid) return false;
    return isUnknown(resolveGuidName(val, k));
  }) || (item.resolved_guid && isGuid(item.resolved_guid) && isUnknown(resolveGuidName(item.resolved_guid)));

  return (
    <div
      id={cardId}
      className={`rounded-2xl border p-4 shadow-xl transition-all duration-500 target:ring-2 target:ring-gear-accent target:ring-offset-4 target:ring-offset-black scroll-mt-24 ${
        isCheck || cardHasUnknown ? 'border-amber-950/50' : 'border-slate-800'
      }`}
      style={readableCardStyle}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <div className="text-lg font-bold" style={readableValueStyle}>
              {item.normalized_name}
            </div>
            <div className="text-sm" style={readableMutedStyle}>
              Original: {item.original_name}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!item.exported ? (
              <span
                className="rounded-full bg-red-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#f87171" }}
              >
                Skipped
              </span>
            ) : cardHasUnknown ? (
              <span
                className="rounded-full bg-amber-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-amber-500/50 animate-pulse"
                style={{ color: "#fbbf24" }}
              >
                Partial / Needs Review
              </span>
            ) : isCheck ? (
              <span
                className="rounded-full bg-amber-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#fbbf24" }}
              >
                Restricted / Fallback
              </span>
            ) : (
              <span
                className="rounded-full bg-green-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#4ade80" }}
              >
                Pass
              </span>
            )}

            {isCheck && !cardHasUnknown && (
              <span
                className="rounded-full bg-slate-800/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30"
                style={{ color: "#fbbf24" }}
              >
                Check
              </span>
            )}

            {/* Removed redundant cardHasUnknown badge as it is now the primary status if present */}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 ml-auto">
          <span
             className="rounded-full bg-slate-800 px-3 py-1 text-[10px] font-mono tracking-wider font-semibold"
            style={{ color: "#cbd5e1" }}
          >
            {item.slot_section}
            {item.slot_index >= 0 ? ` / Slot ${item.slot_index}` : ""}
          </span>
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
          {onJumpToCatalogue && item.resolved_guid && isGuid(item.resolved_guid) && (
            <button 
              onClick={() => onJumpToCatalogue(item.resolved_guid)}
              className="ml-3 px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[9px] font-mono border border-purple-500/20 hover:bg-purple-500/20 transition-all uppercase tracking-tighter"
            >
              Manage entry
            </button>
          )}
        </div>

        <div>
          <span className="font-bold" style={{ color: "#94a3b8" }}>
            Reason:
          </span>{" "}
          <span style={readableValueStyle}>{item.reason}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <SettingsTable title="Original settings" data={item.original_settings} onJumpToCatalogue={onJumpToCatalogue} />
        <SettingsTable
          title="Normalised settings"
          data={item.normalized_settings}
          onJumpToCatalogue={onJumpToCatalogue}
        />
        <SettingsTable title="Exported XML settings" data={exportedAttrs} onJumpToCatalogue={onJumpToCatalogue} />
      </div>
    </div>
  );
};


export const AT5SignalChainView: React.FC<Props> = ({ debugData, onJumpToCatalogue }) => {
  const sortedItems = useMemo(() => {
    const all = [
      ...(debugData.exported_chain || []),
      ...(debugData.skipped_gear || [])
    ];
    // Sort by original index to match signal chain path sequence
    return all.sort((a, b) => a.original_index - b.original_index);
  }, [debugData]);

  const stats = useMemo(() => {
    const exported = debugData.exported_chain || [];
    const skipped = debugData.skipped_gear || [];
    
    const checkItems = exported.filter(item => 
      item.reason.toLowerCase().includes("check") ||
      item.reason.toLowerCase().includes("warning") ||
      item.reason.toLowerCase().includes("caution") ||
      item.reason.toLowerCase().includes("fallback") ||
      item.exported_settings.includes("undefined") ||
      (!item.exported_settings && item.type !== "cab")
    );

    const skippedCount = skipped.length;
    const checkCount = checkItems.length;
    const totalCount = exported.length + skippedCount;
    const passCount = exported.length - checkCount;

    return { totalCount, passCount, checkCount, skippedCount };
  }, [debugData]);

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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tight" style={readableValueStyle}>
              AT5 Export Signal Chain
            </h2>
            
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Total: {stats.totalCount}
              </span>

              {stats.checkCount === 0 && stats.skippedCount === 0 ? (
                <span className="rounded-md bg-green-900/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green-400">
                  Pass
                </span>
              ) : (
                <>
                  <span className="rounded-md bg-green-900/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-green-400">
                    Pass: {stats.passCount}
                  </span>
                  {stats.checkCount > 0 && (
                    <span className="rounded-md bg-amber-900/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-400">
                      Check: {stats.checkCount}
                    </span>
                  )}
                  {stats.skippedCount > 0 && (
                    <span className="rounded-md bg-red-900/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-400">
                      Skipped: {stats.skippedCount}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          <p className="text-sm" style={readableMutedStyle}>
            Visual view of the actual exported AmpliTube chain.
          </p>
          <p className="text-[10px] font-mono uppercase tracking-widest opacity-60" style={readableMutedStyle}>
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

      <div className="space-y-6">
        {sortedItems.map((item, index) => (
          <GearCard
            key={`${item.slot_section}-${item.slot_index}-${item.normalized_name}-${index}`}
            item={item}
            onJumpToCatalogue={onJumpToCatalogue}
          />
        ))}

        {/* Input/Output/Room Info info if not in list */}
        <div className="pt-8 border-t border-white/5 space-y-4">
          <div
            className="rounded-2xl border border-dashed border-slate-800 p-6 text-sm italic"
            style={readableCardStyle}
          >
            <p className="text-gray-500 mb-2 font-mono text-[10px] uppercase tracking-widest">Routing Context</p>
            Input/Output and Room micro-environments are part of the global AT5 preset wrapper. 
            Room and mic details are shown within the CabA card under Exported XML settings.
          </div>
        </div>
      </div>
    </section>
  );
};

export default AT5SignalChainView;
