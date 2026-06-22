import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { X } from "lucide-react";
import { useTheme } from "../../hooks";
import { useAppSelector } from "../../state/store";
import { Utils } from "../../utils";
import { COUNTRY_COORDINATES } from "../../utils/country-coordinates";
import CountryFlag from "../../components/ui/country-flag";
import Tag from "../../components/ui/tag";
import { useChangesByOffice } from "./use-changes-by-office";
import { KIND_META } from "./kind-meta";
import { CATEGORY_KIND_LABELS } from "../../state/slices/settings-slice";
import { KIND_ORDER } from "./use-changes-by-kind";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const ACCENT = "#A4343A";

export const ChangeMap: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { riskLevels } = useAppSelector((state) => state.settings);
  const { countries, totalCount } = useChangesByOffice();

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const countryByName = useMemo(() => {
    const map: Record<string, (typeof countries)[number]> = {};
    countries.forEach((c) => (map[c.country] = c));
    return map;
  }, [countries]);

  const maxCount = Math.max(1, ...countries.map((c) => c.count));
  const radiusFor = (count: number) => 6 + 14 * (count / maxCount);

  const selected = selectedCountry ? countryByName[selectedCountry] : null;

  const geographyStyles = isDarkMode
    ? { fill: "#27272a", stroke: "#3f3f46", hoverFill: "#3f3f46" }
    : { fill: "#2d3e50", stroke: "#3d5165", hoverFill: "#3a5068" };

  return (
    <div className="space-y-6">
      <div className="card relative h-[600px] overflow-hidden p-0">
        {totalCount === 0 ? (
          <div className="text-fade-2 flex h-full items-center justify-center text-sm font-medium">
            No submitted requests yet — the map will populate as changes are
            created across the organization.
          </div>
        ) : (
          <div className="relative h-full w-full">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{ scale: 140, center: [15, 20] }}
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={geographyStyles.fill}
                      stroke={geographyStyles.stroke}
                      strokeWidth={0.5}
                      onClick={() => setSelectedCountry(null)}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: geographyStyles.hoverFill, outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {countries.map((data) => {
                const coords = COUNTRY_COORDINATES[data.country];
                if (!coords) return null;
                const r = radiusFor(data.count);
                const isSelected = data.country === selectedCountry;
                return (
                  <Marker key={data.country} coordinates={coords}>
                    <g
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCountry(data.country);
                      }}
                      style={{ cursor: "pointer" }}
                    >
                      <circle
                        r={r}
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth={2}
                        opacity={0.5}
                      >
                        <animate
                          attributeName="r"
                          from={String(r)}
                          to={String(r + 10)}
                          dur="2s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          from="0.6"
                          to="0"
                          dur="2s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        r={r}
                        fill={ACCENT}
                        stroke={isDarkMode ? "var(--color-border)" : "#fff"}
                        strokeWidth={1.5}
                        style={{
                          transform: isSelected ? "scale(1.1)" : "scale(1)",
                          transformOrigin: "0 0",
                          transition: "transform 0.2s ease",
                        }}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="middle"
                        style={{ fontSize: 11, fontWeight: 700, fill: "#fff" }}
                      >
                        {data.count}
                      </text>
                    </g>
                  </Marker>
                );
              })}
            </ComposableMap>

            {/* Legend */}
            <div className="border-border bg-bg/90 absolute bottom-4 left-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 shadow-sm backdrop-blur-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: ACCENT }}
              />
              <span className="text-fade text-xs font-semibold">
                Pin size = number of requests submitted from that country
              </span>
            </div>
          </div>
        )}

        {/* Slide-in detail panel */}
        {selected && (
          <div className="animate-slide-in-right border-border bg-bg absolute top-0 right-0 z-20 h-full w-[380px] overflow-y-auto border-l shadow-2xl">
            <div className="space-y-6 p-6">
              <button
                onClick={() => setSelectedCountry(null)}
                className="text-fade-2 hover:bg-bg-muted hover:text-primary-alpha absolute top-4 right-4 cursor-pointer rounded-lg p-1.5 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <div className="mb-1 flex items-center gap-2.5">
                  <CountryFlag
                    country={selected.country}
                    size={28}
                    className="border-border/50 rounded-xs border shadow-xs"
                  />
                  <h3 className="text-h2 text-primary-alpha leading-none font-bold">
                    {selected.country}
                  </h3>
                </div>
                <p className="text-body-sm text-fade-2 mt-1">
                  {selected.count} request{selected.count === 1 ? "" : "s"}{" "}
                  submitted from this country
                </p>
              </div>

              {/* Kind breakdown */}
              <div className="space-y-2">
                <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                  By Request Kind
                </span>
                <div className="space-y-2">
                  {KIND_ORDER.map((kind) => {
                    const count = selected.kindCounts[kind];
                    if (!count) return null;
                    const meta = KIND_META[kind];
                    const Icon = meta.icon;
                    return (
                      <div key={kind} className="flex items-center gap-2.5">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${meta.color}1a`,
                            color: meta.color,
                          }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-body-sm text-fade flex-1 font-medium">
                          {CATEGORY_KIND_LABELS[kind]}
                        </span>
                        <span className="text-primary-alpha text-body-sm font-bold">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk breakdown */}
              {Object.keys(selected.riskCounts).length > 0 && (
                <div className="space-y-2">
                  <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                    By Risk Level
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(selected.riskCounts).map(([risk, count]) => (
                      <Tag key={risk} color={Utils.resolveRiskColor(riskLevels, risk)}>
                        {risk} ({count})
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {/* Office breakdown */}
              <div className="space-y-2">
                <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                  By Office
                </span>
                <div className="bg-bg-muted border-border-muted space-y-2 rounded-2xl border p-4">
                  {selected.offices.map((o) => (
                    <div
                      key={o.office}
                      className="text-body-sm flex items-center justify-between"
                    >
                      <span className="text-fade font-medium">{o.office}</span>
                      <span className="text-primary-alpha font-bold">
                        {o.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent requests */}
              <div className="space-y-2">
                <span className="text-fade-2 block text-[10px] font-bold tracking-wider uppercase">
                  Recent Requests
                </span>
                <div className="space-y-2">
                  {selected.recent.map((change) => (
                    <button
                      key={change.id}
                      onClick={() => navigate(`/changes/${change.id}`)}
                      className="bg-bg-muted border-border-muted hover:border-primary/50 block w-full rounded-2xl border p-3.5 text-left transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-primary-alpha text-body-sm truncate font-bold">
                          {change.title}
                        </span>
                        <Tag
                          color={Utils.resolveRiskColor(riskLevels, change.riskLevel)}
                          format={false}
                          className="rounded! px-1.5! py-0.5! text-[10px]! leading-tight!"
                        >
                          {change.riskLevel}
                        </Tag>
                      </div>
                      <span className="text-fade-2 text-[11px] font-semibold">
                        {change.status}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeMap;
