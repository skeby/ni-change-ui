import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip } from "antd";
import chroma from "chroma-js";
import { useChangesByKind } from "./use-changes-by-kind";
import { KIND_META } from "./kind-meta";

interface MatrixRow {
  kind: ReturnType<typeof useChangesByKind>["ordered"][number];
  countsBySystem: Record<string, number>;
}

export const ChangeGraph: React.FC = () => {
  const navigate = useNavigate();
  const { ordered, totalCount } = useChangesByKind();

  const { rows, systems, matrixMax } = useMemo(() => {
    const systemTotals: Record<string, number> = {};

    const rows: MatrixRow[] = ordered.map((kindData) => {
      const countsBySystem: Record<string, number> = {};
      kindData.all.forEach((change) => {
        const sys = change.systemAffected || "Unassigned";
        countsBySystem[sys] = (countsBySystem[sys] || 0) + 1;
        systemTotals[sys] = (systemTotals[sys] || 0) + 1;
      });
      return { kind: kindData, countsBySystem };
    });

    const systems = Object.keys(systemTotals).sort((a, b) => {
      const diff = systemTotals[b] - systemTotals[a];
      return diff !== 0 ? diff : a.localeCompare(b);
    });

    const matrixMax = Math.max(
      1,
      ...rows.flatMap((r) => Object.values(r.countsBySystem)),
    );

    return { rows, systems, matrixMax };
  }, [ordered]);

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        {rows.map(({ kind }) => (
          <div key={kind.kind} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: KIND_META[kind.kind].color }}
            />
            <span className="text-fade text-[11px] font-semibold">
              {kind.label}
            </span>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden p-0">
        {systems.length === 0 ? (
          <div className="text-fade-2 py-20 text-center text-sm font-medium">
            No submitted requests yet — the graph will appear as changes are
            created across the organization.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="bg-bg border-border-muted sticky left-0 z-10 border-b px-4 py-3" />
                  {systems.map((sys) => (
                    <th
                      key={sys}
                      className="border-border-muted text-fade-2 min-w-[110px] border-b px-3 py-3 text-[11px] font-bold tracking-wide uppercase"
                    >
                      {sys}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ kind, countsBySystem }) => {
                  const meta = KIND_META[kind.kind];
                  const Icon = meta.icon;
                  return (
                    <tr
                      key={kind.kind}
                      className="border-border-muted border-b last:border-b-0"
                    >
                      <th
                        onClick={() => navigate("/changes")}
                        className="bg-bg hover:bg-bg-muted sticky left-0 z-10 cursor-pointer px-4 py-3 text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                            style={{
                              backgroundColor: `${meta.color}1a`,
                              color: meta.color,
                            }}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-primary-alpha text-xs font-bold whitespace-nowrap">
                              {kind.label}
                            </div>
                            <div className="text-fade-2 text-[10px] font-semibold">
                              {kind.count} total
                            </div>
                          </div>
                        </div>
                      </th>
                      {systems.map((sys) => {
                        const count = countsBySystem[sys] || 0;
                        const alpha = count
                          ? 0.12 + 0.68 * (count / matrixMax)
                          : 0;
                        return (
                          <td
                            key={sys}
                            className="px-3 py-3 text-center"
                          >
                            <Tooltip
                              title={`${kind.label} × ${sys}: ${count} request${count === 1 ? "" : "s"}`}
                            >
                              <div
                                className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold"
                                style={{
                                  backgroundColor: count
                                    ? chroma(meta.color).alpha(alpha).css()
                                    : undefined,
                                  color: count ? meta.color : undefined,
                                }}
                              >
                                {count ? (
                                  count
                                ) : (
                                  <span className="text-fade-2">·</span>
                                )}
                              </div>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <p className="text-fade-2 text-center text-[11px]">
          Click a request kind to view all requests · hover a cell for the
          exact count
        </p>
      )}
    </div>
  );
};

export default ChangeGraph;
