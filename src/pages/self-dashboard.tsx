import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppSelector } from "../state/store";
import { useTheme } from "../hooks";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  HelpCircle,
  Rocket,
} from "lucide-react";
import Tag from "../components/ui/tag";
import { Utils } from "../utils";
import { Select } from "antd";
import CustomChartTooltip from "../components/ui/custom-chart-tooltip";

export const SelfDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { currentUserId, activeRoles } = useAppSelector((state) => state.auth);
  const { changes } = useAppSelector((state) => state.changes);
  const { riskLevels } = useAppSelector((state) => state.settings);

  // My changes
  const myChanges = useMemo(
    () => changes.filter((c) => c.submitterId === currentUserId),
    [changes, currentUserId],
  );

  // Needs attention: changes awaiting current user's action
  const needsAttention = useMemo(() => {
    return changes.filter((c) => {
      // If queried and user is submitter, needs response
      if (c.isQueried && c.submitterId === currentUserId) return true;

      // If Submitted or Under Review, and user has Approver/Admin role
      if (
        (c.status === "Submitted" || c.status === "Under Review") &&
        (activeRoles.includes("Approver") || activeRoles.includes("Admin")) &&
        c.submitterId !== currentUserId
      ) {
        return true;
      }

      return false;
    });
  }, [changes, currentUserId, activeRoles]);

  // Status counts for my open changes
  const statusCounts = useMemo(() => {
    const counts = {
      Draft: 0,
      "Under Review": 0,
      "In Testing": 0,
      Deployed: 0,
      Submitted: 0,
    };
    myChanges.forEach((c) => {
      if (c.status in counts) {
        counts[c.status as keyof typeof counts]++;
      }
    });
    return counts;
  }, [myChanges]);

  // Recent submissions
  const recentSubmissions = useMemo(() => {
    return [...myChanges]
      .filter((c) => c.status !== "Draft")
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [myChanges]);

  // Helper for generating month options (Jan 2026 to current month)
  const monthOptions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const options = [];
    for (let m = 0; m <= currentMonth; m++) {
      const monthStr = `${currentYear}-${String(m + 1).padStart(2, "0")}`;
      options.push({
        value: monthStr,
        label: `${monthNames[m]} ${currentYear}`,
      });
    }
    return options;
  }, []);

  const currentMonthValue = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [selectedMonths, setSelectedMonths] = useState<string[]>([
    currentMonthValue,
  ]);

  // Chart data: my changes by system
  const systemBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    myChanges
      .filter((c) => c.status !== "Draft")
      .forEach((c) => {
        const changeMonth = c.createdAt.substring(0, 7);
        if (
          selectedMonths.length === 0 ||
          selectedMonths.includes(changeMonth)
        ) {
          counts[c.systemAffected] = (counts[c.systemAffected] || 0) + 1;
        }
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [myChanges, selectedMonths]);

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCardInline
          title="Needs Your Attention"
          value={needsAttention.length}
          color={needsAttention.length > 0 ? "#D97706" : "#10B981"}
          icon={AlertCircle}
          description={
            needsAttention.length > 0 ? "Requires your action" : "All caught up"
          }
        />
        <MetricCardInline
          title="My Open Requests"
          value={
            myChanges.filter(
              (c) =>
                c.status !== "Closed" &&
                c.status !== "Deployed" &&
                c.status !== "Rolled Back" &&
                c.status !== "Draft",
            ).length
          }
          color="#2563EB"
          icon={FileText}
          description="Active change requests"
        />
        <MetricCardInline
          title="Queries Pending"
          value={myChanges.filter((c) => c.isQueried).length}
          color="#9333EA"
          icon={HelpCircle}
          description="Awaiting your response"
        />
        <MetricCardInline
          title="Deployed (Total)"
          value={
            myChanges.filter(
              (c) => c.status === "Deployed" || c.status === "Closed",
            ).length
          }
          color="#10B981"
          icon={Rocket}
          description="Successfully deployed"
        />
      </div>

      {/* Main Two-Column Panel */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Needs Your Attention */}
          <div className="card space-y-6 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="card-title">Needs Your Attention</h2>
                <p className="card-description">
                  Changes awaiting your approval, review, or query response.
                </p>
              </div>
              {needsAttention.length > 4 && (
                <Link
                  to="/self/approvals"
                  className="text-body-sm text-primary hover:text-primary/80 font-bold underline transition-colors"
                >
                  See all
                </Link>
              )}
            </div>

            {needsAttention.length === 0 ? (
              <div className="space-y-3 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="space-y-1">
                  <div className="text-body-md text-primary-alpha font-bold">
                    No Action Required
                  </div>
                  <p className="text-body-sm text-fade-2 mx-auto max-w-sm">
                    You have no change requests pending your action right now.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-border-muted divide-y">
                {needsAttention.slice(0, 4).map((change) => (
                  <div
                    key={change.id}
                    className="flex cursor-pointer flex-col justify-between gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                    onClick={() => {
                      if (change.status === "Draft") {
                        navigate(
                          `/self/changes/new/${change.draftStep || "general"}?draftId=${change.id}`,
                        );
                      } else {
                        navigate(`/self/changes/${change.id}`);
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Tag
                          color="primary"
                          format={false}
                          className="rounded! px-1.5! py-0.5! text-[10px]! leading-tight!"
                        >
                          {change.id}
                        </Tag>
                        {change.isQueried && (
                          <Tag
                            value="queried"
                            className="rounded! px-1.5! py-0.5! text-[10px]! leading-tight!"
                          >
                            Queried
                          </Tag>
                        )}
                        <Tag
                          value={change.status}
                          format={false}
                          className="rounded! px-1.5! py-0.5! text-[10px]! leading-tight!"
                        >
                          {change.status}
                        </Tag>
                      </div>
                      <div className="text-body-sm text-primary-alpha truncate font-bold">
                        {change.title}
                      </div>
                      <div className="text-body-xs text-fade flex items-center gap-1.5 font-medium">
                        <span>{change.systemAffected}</span>
                        <span className="text-border">|</span>
                        <span>By {change.submitterName}</span>
                        <span className="text-border">|</span>
                        <span>
                          Risk:{" "}
                          <span
                            style={{
                              color: Utils.resolveRiskColor(
                                riskLevels,
                                change.riskLevel,
                              ),
                            }}
                          >
                            {change.riskLevel}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="card-title">Recent Submissions</h2>
                <p className="card-description">
                  Your latest change request activity.
                </p>
              </div>
              {myChanges.filter((c) => c.status !== "Draft").length > 5 && (
                <Link
                  to="/self/changes"
                  className="text-body-sm text-primary hover:text-primary/80 font-bold underline transition-colors"
                >
                  See all
                </Link>
              )}
            </div>

            <div className="space-y-4">
              {recentSubmissions.map((change) => {
                const initials = change.submitterName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                const formattedDate = new Date(
                  change.updatedAt || change.createdAt,
                ).toLocaleString(undefined, {
                  dateStyle: "short",
                  timeStyle: "short",
                });

                return (
                  <div
                    key={change.id}
                    className="text-body-sm border-border-muted/30 flex cursor-pointer items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0"
                    onClick={() => {
                      if (change.status === "Draft") {
                        navigate(
                          `/self/changes/new/${change.draftStep || "general"}?draftId=${change.id}`,
                        );
                      } else {
                        navigate(`/self/changes/${change.id}`);
                      }
                    }}
                  >
                    <div className="bg-bg-muted text-fade border-border text-body-xs mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-primary font-bold hover:underline">
                            {change.id}
                          </span>
                          <Tag
                            value={change.isQueried ? "Queried" : change.status}
                            format={false}
                            className="rounded! px-1.5! py-0.5! text-[10px]! leading-tight!"
                          >
                            {change.isQueried ? "Queried" : change.status}
                          </Tag>
                        </div>
                        <span className="text-fade-2 shrink-0 text-[10px] font-medium">
                          {formattedDate}
                        </span>
                      </div>
                      <div className="text-primary-alpha max-w-lg truncate font-bold">
                        {change.title}
                      </div>
                      <div className="text-fade max-w-xl truncate text-xs font-light">
                        {change.systemAffected} &middot; {change.category}
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentSubmissions.length === 0 && (
                <div className="text-body-sm text-fade-2 py-8 text-center">
                  You have not submitted any change requests yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* My Open Requests Summary */}
          <div className="card space-y-4 p-6">
            <div>
              <h2 className="card-title font-sora">Request Summary</h2>
              <p className="card-description">
                Your overall change request breakdown.
              </p>
            </div>
            <div className="space-y-2">
              {[
                {
                  label: "Total Submitted",
                  value: myChanges.filter((c) => c.status !== "Draft").length,
                  color: "#6366f1",
                },
                {
                  label: "Draft",
                  value: statusCounts.Draft,
                  color: "#6b7280",
                },
                {
                  label: "Submitted",
                  value: statusCounts.Submitted,
                  color: "#2563EB",
                },
                {
                  label: "Under Review",
                  value: statusCounts["Under Review"],
                  color: "#D97706",
                },
                {
                  label: "In Testing",
                  value: statusCounts["In Testing"],
                  color: "#9333EA",
                },
                {
                  label: "Deployed",
                  value: statusCounts.Deployed,
                  color: "#059669",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-body-sm text-fade flex-1 font-medium">
                    {item.label}
                  </span>
                  <span className="text-body-sm text-primary-alpha font-bold">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* My Systems Chart */}
          <div className="card space-y-4 p-6">
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-3">
              <div>
                <h2 className="card-title font-sora">My Systems</h2>
                <p className="card-description">
                  Systems affected by your change requests.
                </p>
              </div>
              <Select
                mode="multiple"
                maxTagCount="responsive"
                placeholder="Select months"
                showSearch={{ optionFilterProp: "label" }}
                value={selectedMonths}
                onChange={setSelectedMonths}
                style={{ minWidth: 160, maxWidth: "100%" }}
                options={monthOptions}
                allowClear
              />
            </div>
            <div className="h-48 w-full">
              {systemBarData.length === 0 ? (
                <div className="text-body-sm text-fade-2 flex h-full items-center justify-center">
                  No change data for selected period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={systemBarData}
                    margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={isDarkMode ? "#2d2d2d" : "#F1F5F9"}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={isDarkMode ? "#6b7280" : "#94A3B8"}
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      stroke={isDarkMode ? "#6b7280" : "#94A3B8"}
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomChartTooltip isDarkMode={isDarkMode} />}
                      cursor={{
                        fill: isDarkMode
                          ? "rgba(255, 255, 255, 0.06)"
                          : "rgba(0, 0, 0, 0.03)",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#A4343A"
                      radius={[4, 4, 0, 0]}
                      barSize={28}
                      name="Changes"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Inline Metric Card ───────────────────────────────────────────────────

const MetricCardInline: React.FC<{
  title: string;
  value: React.ReactNode;
  color: string;
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  description: string;
}> = ({ title, value, color, icon: Icon, description }) => {
  return (
    <div className="card flex w-full justify-between gap-x-4 p-5">
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-fade text-sm leading-5 tracking-tight">{title}</p>
          <p className="text-secondary-alpha text-2xl leading-8 font-bold sm:text-[32px] sm:leading-10">
            {value}
          </p>
        </div>
        <p
          style={{ color }}
          className="flex items-center gap-1 text-xs leading-4 font-semibold"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          <span>{description}</span>
        </p>
      </div>
      <div
        style={{ backgroundColor: `${color}1a` }}
        className="flex size-12 shrink-0 items-center justify-center rounded-lg"
      >
        <Icon style={{ color }} className="size-6" />
      </div>
    </div>
  );
};

export default SelfDashboard;
