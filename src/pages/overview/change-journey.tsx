import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useChangesByKind } from "./use-changes-by-kind";
import { KIND_META } from "./kind-meta";
import type { ChangeRequest } from "../../state/slices/changes-slice";

const STAGES = ["Draft", "Submitted", "Approved", "Deployed"];

const stageIndex = (status: string): number => {
  if (status === "Draft") return 0;
  if (["Submitted", "Under Review"].includes(status)) return 1;
  if (
    ["Approved", "In Testing", "Testing Complete", "Awaiting Deployment"].includes(
      status,
    )
  )
    return 2;
  if (["Deployed", "Post-Deployment Review", "Closed"].includes(status)) return 3;
  return -1; // Rejected / Rolled Back — off the happy path
};

export const ChangeJourney: React.FC = () => {
  const navigate = useNavigate();
  const { ordered } = useChangesByKind();

  return (
    <div className="flex flex-1 flex-col">
      <div className="card flex flex-1 flex-col space-y-2 p-6 pb-8">
        {/* Stage header */}
        <div className="mb-4 flex items-center">
          <div className="w-40 shrink-0" />
          <div className="relative flex-1 px-2">
            {STAGES.map((s, i) => (
              <span
                key={s}
                className="text-fade-2 absolute -translate-x-1/2 text-[10px] font-bold tracking-wider uppercase"
                style={{
                  left: `calc(${(i / (STAGES.length - 1)) * 100}%)`,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* One track per kind */}
        <div className="flex flex-1 flex-col justify-around pt-4">
          {ordered.map((data, rowIdx) => {
            const meta = KIND_META[data.kind];
            const Icon = meta.icon;
            // group changes by stage for clustering
            const onPath = data.recent.length ? data.recent : [];
            const allChanges = data.count > 0 ? onPath : [];
            return (
              <div key={data.kind} className="flex items-center">
                {/* Station label */}
                <div className="flex w-40 shrink-0 items-center gap-2">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-primary-alpha truncate text-xs font-bold">
                      {data.label}
                    </div>
                    <div className="text-fade-2 text-[10px] font-semibold">
                      {data.count} total
                    </div>
                  </div>
                </div>

                {/* Track */}
                <div className="relative h-12 flex-1 px-2">
                  {/* base line */}
                  <div className="bg-border-muted absolute top-1/2 right-2 left-2 h-0.5 -translate-y-1/2 rounded-full" />
                  <motion.div
                    className="absolute top-1/2 left-2 h-0.5 -translate-y-1/2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                    initial={{ width: 0 }}
                    animate={{ width: "calc(100% - 16px)" }}
                    transition={{ duration: 0.8, delay: rowIdx * 0.1 }}
                  />
                  {/* stage nodes */}
                  {STAGES.map((_, i) => (
                    <span
                      key={i}
                      className="border-bg absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                      style={{
                        left: `calc(${(i / (STAGES.length - 1)) * 100}% )`,
                        backgroundColor: meta.color,
                        opacity: 0.4,
                      }}
                    />
                  ))}
                  {/* moving change dots */}
                  {allChanges.map((c: ChangeRequest, i: number) => {
                    const si = stageIndex(c.status);
                    if (si < 0) return null;
                    const targetLeft = (si / (STAGES.length - 1)) * 100;
                    return (
                      <motion.button
                        key={c.id}
                        onClick={() => navigate(`/changes/${c.id}`)}
                        title={`${c.title} — ${c.status}`}
                        className="absolute top-1/2 z-10 h-4 w-4 -translate-y-1/2 cursor-pointer rounded-full shadow"
                        style={{
                          backgroundColor: meta.color,
                          border: "2px solid var(--color-bg, #fff)",
                          marginTop: i % 2 === 0 ? -8 : 8,
                        }}
                        initial={{ left: "0%", opacity: 0 }}
                        animate={{ left: `${targetLeft}%`, opacity: 1 }}
                        transition={{
                          duration: 1.1,
                          delay: rowIdx * 0.1 + i * 0.12,
                          ease: "easeInOut",
                        }}
                        whileHover={{ scale: 1.4 }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-fade-2 mt-6 text-center text-xs">
          Click any dot to open the change. Rejected or rolled-back changes leave
          the track and aren't shown.
        </p>
      </div>
    </div>
  );
};

export default ChangeJourney;
