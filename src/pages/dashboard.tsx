import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppSelector } from "../state/store";
import { useTheme } from "../hooks";
import { Select } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  AlertCircle,
  Clock,
  Rocket,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
} from "lucide-react";
import { Utils } from "../utils";
import CustomChartTooltip from "../components/ui/custom-chart-tooltip";

// Status color map
const STATUS_COLORS: Record<string, string> = {
  Draft: "#6b7280",
  Submitted: "#2563EB",
  "Under Review": "#D97706",
  Approved: "#10B981",
  Rejected: "#EF4444",
  "In Testing": "#9333EA",
  "Testing Complete": "#7C3AED",
  "Awaiting Deployment": "#0EA5E9",
  Deployed: "#059669",
  "Post-Deployment Review": "#14B8A6",
  Closed: "#475569",
  "Rolled Back": "#DC2626",
};

const CATEGORY_COLORS: string[] = [
  "#A4343A",
  "#2563EB",
  "#D97706",
  "#10B981",
  "#9333EA",
  "#0EA5E9",
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { changes } = useAppSelector((state) => state.changes);
  const { riskLevels } = useAppSelector((state) => state.settings);
  const sortedRiskLevels = useMemo(
    () => [...riskLevels].sort((a, b) => a.severity - b.severity),
    [riskLevels],
  );

  // ── Metric calculations ──────────────────────────────────────────────

  const openRequests = useMemo(
    () =>
      changes.filter(
        (c) =>
          c.status !== "Closed" &&
          c.status !== "Deployed" &&
          c.status !== "Rolled Back" &&
          c.status !== "Draft",
      ),
    [changes],
  );

  const overdueApprovals = useMemo(() => {
    const now = new Date();
    return changes.filter((c) => {
      if (c.status !== "Submitted" && c.status !== "Under Review") return false;
      const submitted = new Date(c.createdAt);
      const daysSinceSubmit =
        (now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceSubmit > 5;
    });
  }, [changes]);

  const deployedThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return changes.filter((c) => {
      if (c.status !== "Deployed" && c.status !== "Closed") return false;
      if (!c.deployment?.deployedAt) return false;
      return new Date(c.deployment.deployedAt) >= startOfMonth;
    });
  }, [changes]);

  const avgDaysToDeploy = useMemo(() => {
    const deployed = changes.filter(
      (c) => c.deployment?.deployedAt && c.createdAt,
    );
    if (deployed.length === 0) return 0;
    const totalDays = deployed.reduce((sum, c) => {
      const created = new Date(c.createdAt).getTime();
      const deployedAt = new Date(c.deployment!.deployedAt).getTime();
      return sum + (deployedAt - created) / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / deployed.length);
  }, [changes]);

  const slaCompliance = useMemo(() => {
    const completedChanges = changes.filter(
      (c) =>
        c.status === "Deployed" ||
        c.status === "Closed" ||
        c.status === "Rolled Back",
    );
    if (completedChanges.length === 0) return 100;
    const withinSla = completedChanges.filter((c) => {
      if (!c.deployment?.deployedAt) return true;
      const created = new Date(c.createdAt).getTime();
      const deployedAt = new Date(c.deployment.deployedAt).getTime();
      const daysTaken = (deployedAt - created) / (1000 * 60 * 60 * 24);
      return daysTaken <= 14;
    });
    return Math.round((withinSla.length / completedChanges.length) * 100);
  }, [changes]);

  // ── Chart data ───────────────────────────────────────────────────────

  // Trend: submitted vs deployed over last 6 months
  const trendData = useMemo(() => {
    const now = new Date();
    const months: { label: string; submitted: number; deployed: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const submitted = changes.filter(
        (c) => c.createdAt.startsWith(monthStr) && c.status !== "Draft",
      ).length;
      const deployed = changes.filter(
        (c) =>
          c.deployment?.deployedAt?.startsWith(monthStr) !== undefined &&
          c.deployment?.deployedAt?.startsWith(monthStr),
      ).length;
      months.push({ label, submitted, deployed });
    }
    return months;
  }, [changes]);

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

  // Pie: by status
  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    changes
      .filter((c) => c.status !== "Draft")
      .forEach((c) => {
        const changeMonth = c.createdAt.substring(0, 7);
        if (
          selectedMonths.length === 0 ||
          selectedMonths.includes(changeMonth)
        ) {
          counts[c.status] = (counts[c.status] || 0) + 1;
        }
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [changes, selectedMonths]);

  // Bar: by risk level
  const riskBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    sortedRiskLevels.forEach((r) => {
      counts[r.name] = 0;
    });
    changes
      .filter((c) => c.status !== "Draft")
      .forEach((c) => {
        const changeMonth = c.createdAt.substring(0, 7);
        if (
          selectedMonths.length === 0 ||
          selectedMonths.includes(changeMonth)
        ) {
          counts[c.riskLevel] = (counts[c.riskLevel] || 0) + 1;
        }
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [changes, sortedRiskLevels, selectedMonths]);

  // Bar: by category
  const categoryBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    changes
      .filter((c) => c.status !== "Draft")
      .forEach((c) => {
        const changeMonth = c.createdAt.substring(0, 7);
        if (
          selectedMonths.length === 0 ||
          selectedMonths.includes(changeMonth)
        ) {
          counts[c.category] = (counts[c.category] || 0) + 1;
        }
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [changes, selectedMonths]);

  // Stacked bar: by department
  const departmentData = useMemo(() => {
    const deptStatus: Record<string, Record<string, number>> = {};
    changes
      .filter((c) => c.status !== "Draft")
      .forEach((c) => {
        const changeMonth = c.createdAt.substring(0, 7);
        if (
          selectedMonths.length === 0 ||
          selectedMonths.includes(changeMonth)
        ) {
          if (!deptStatus[c.submitterDepartment]) {
            deptStatus[c.submitterDepartment] = {};
          }
          deptStatus[c.submitterDepartment][c.status] =
            (deptStatus[c.submitterDepartment][c.status] || 0) + 1;
        }
      });
    return Object.entries(deptStatus).map(([dept, statuses]) => ({
      department: dept,
      ...statuses,
    }));
  }, [changes, selectedMonths]);

  const allStatuses = useMemo(
    () =>
      Array.from(
        new Set(
          changes.filter((c) => c.status !== "Draft").map((c) => c.status),
        ),
      ),
    [changes],
  );

  // Recent activity feed
  const recentActivity = useMemo(() => {
    const events: {
      id: string;
      changeId: string;
      title: string;
      actor: string;
      action: string;
      timestamp: string;
    }[] = [];
    changes.forEach((c) => {
      c.timeline.forEach((ev) => {
        events.push({
          id: `${c.id}-${ev.timestamp}`,
          changeId: c.id,
          title: c.title,
          actor: ev.actorName,
          action: ev.action,
          timestamp: ev.timestamp,
        });
      });
    });
    return events
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 8);
  }, [changes]);



  const gridStroke = isDarkMode ? "#2d2d2d" : "#F1F5F9";
  const axisStroke = isDarkMode ? "#6b7280" : "#94A3B8";

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCardInline
          title="Open Requests"
          value={openRequests.length}
          color={openRequests.length > 0 ? "#D97706" : "#10B981"}
          icon={AlertCircle}
          description={
            openRequests.length > 0
              ? "Active change requests"
              : "No open requests"
          }
        />
        <MetricCardInline
          title="Overdue Approvals"
          value={overdueApprovals.length}
          color={overdueApprovals.length > 0 ? "#EF4444" : "#10B981"}
          icon={Clock}
          description={
            overdueApprovals.length > 0
              ? "Pending > 5 days"
              : "All approvals on track"
          }
        />
        <MetricCardInline
          title="Deployed This Month"
          value={deployedThisMonth.length}
          color="#2563EB"
          icon={Rocket}
          description="Changes deployed"
        />
        <MetricCardInline
          title="Avg Days to Deploy"
          value={avgDaysToDeploy}
          color="#9333EA"
          icon={TrendingUp}
          description="From submission to deploy"
        />
        <MetricCardInline
          title="SLA Compliance"
          value={`${slaCompliance}%`}
          color={slaCompliance >= 80 ? "#10B981" : "#EF4444"}
          icon={ShieldCheck}
          description="Within 14-day target"
        />
      </div>

      {/* Trend Line Chart */}
      <div className="card space-y-4 p-6">
        <div>
          <h2 className="card-title">Request Trend</h2>
          <p className="card-description">
            Requests submitted vs deployed over the last 6 months.
          </p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={gridStroke}
              />
              <XAxis
                dataKey="label"
                stroke={axisStroke}
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke={axisStroke}
                fontSize={11}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomChartTooltip isDarkMode={isDarkMode} />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="submitted"
                stroke="#A4343A"
                strokeWidth={2}
                dot={{ r: 4, fill: "#A4343A" }}
                name="Submitted"
              />
              <Line
                type="monotone"
                dataKey="deployed"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 4, fill: "#10B981" }}
                name="Deployed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie: by Status */}
        <div className="card space-y-4 p-6">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-3">
            <div>
              <h2 className="card-title">By Status</h2>
              <p className="card-description">
                Distribution of change requests by current status.
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
          <div className="flex h-56 w-full items-center">
            <div className="h-full w-1/2">
              {statusPieData.length === 0 ? (
                <div className="text-body-sm text-fade-2 flex h-full items-center justify-center">
                  No change data for selected period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.name] || "#6b7280"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <CustomChartTooltip
                          isDarkMode={isDarkMode}
                          getColor={(name) => STATUS_COLORS[name] || "#6b7280"}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="w-1/2 space-y-1.5">
              {statusPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: STATUS_COLORS[item.name] || "#6b7280",
                    }}
                  />
                  <span className="text-fade text-[11px] flex-1 font-medium">
                    {item.name}
                  </span>
                  <span className="text-primary-alpha text-[11px] font-bold">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar: by Risk Level */}
        <div className="card space-y-4 p-6">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-3">
            <div>
              <h2 className="card-title">By Risk Level</h2>
              <p className="card-description">
                Change requests grouped by assessed risk.
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
          <div className="h-56 w-full">
            {riskBarData.length === 0 ? (
              <div className="text-body-sm text-fade-2 flex h-full items-center justify-center">
                No change data for selected period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={riskBarData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={gridStroke}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={
                      <CustomChartTooltip
                        isDarkMode={isDarkMode}
                        getColor={(name) =>
                          Utils.resolveRiskColor(riskLevels, name)
                        }
                      />
                    }
                    cursor={{
                      fill: isDarkMode
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(0, 0, 0, 0.03)",
                    }}
                  />
                  <Bar
                    name="Changes"
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  >
                    {riskBarData.map((entry, index) => (
                      <Cell
                        key={`risk-${index}`}
                        fill={Utils.resolveRiskColor(riskLevels, entry.name)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar: by Category */}
        <div className="card space-y-4 p-6">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-3">
            <div>
              <h2 className="card-title">By Category</h2>
              <p className="card-description">
                Breakdown of requests by change category.
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
          <div className="h-56 w-full">
            {categoryBarData.length === 0 ? (
              <div className="text-body-sm text-fade-2 flex h-full items-center justify-center">
                No change data for selected period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBarData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={gridStroke}
                  />
                  <XAxis
                    dataKey="name"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={
                      <CustomChartTooltip
                        isDarkMode={isDarkMode}
                        getColor={(name) =>
                          CATEGORY_COLORS[
                            categoryBarData.findIndex(
                              (item) => item.name === name,
                            ) % CATEGORY_COLORS.length
                          ]
                        }
                      />
                    }
                    cursor={{
                      fill: isDarkMode
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(0, 0, 0, 0.03)",
                    }}
                  />
                  <Bar
                    name="Changes"
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    barSize={36}
                  >
                    {categoryBarData.map((_, index) => (
                      <Cell
                        key={`cat-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stacked Bar: by Department */}
        <div className="card space-y-4 p-6">
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-3">
            <div>
              <h2 className="card-title">By Department</h2>
              <p className="card-description">
                Requests per department, broken down by status.
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
          <div className="h-56 w-full">
            {departmentData.length === 0 ? (
              <div className="text-body-sm text-fade-2 flex h-full items-center justify-center">
                No change data for selected period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={departmentData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={gridStroke}
                  />
                  <XAxis
                    dataKey="department"
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke={axisStroke}
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={
                      <CustomChartTooltip
                        isDarkMode={isDarkMode}
                        getColor={(name) => STATUS_COLORS[name] || "#6b7280"}
                      />
                    }
                    cursor={{
                      fill: isDarkMode
                        ? "rgba(255, 255, 255, 0.06)"
                        : "rgba(0, 0, 0, 0.03)",
                    }}
                  />
                  {allStatuses.map((status) => (
                    <Bar
                      key={status}
                      dataKey={status}
                      stackId="dept"
                      fill={STATUS_COLORS[status] || "#6b7280"}
                      radius={[2, 2, 0, 0]}
                      barSize={40}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="card-title">Recent Activity</h2>
            <p className="card-description">
              Timeline events across all change requests in the organization.
            </p>
          </div>
          {changes.reduce((sum, c) => sum + (c.timeline?.length || 0), 0) > 8 && (
            <Link
              to="/changes"
              className="text-body-sm text-primary hover:text-primary/80 font-bold underline transition-colors"
            >
              See all
            </Link>
          )}
        </div>
        <div className="space-y-4">
          {recentActivity.map((event) => {
            const initials = event.actor
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            const formattedTime = new Date(event.timestamp).toLocaleString(
              undefined,
              {
                dateStyle: "short",
                timeStyle: "short",
              },
            );

            return (
              <div
                key={event.id}
                className="text-body-sm border-border-muted/30 flex items-start gap-3 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <div className="bg-bg-muted text-fade border-border text-body-xs mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-bold">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-primary cursor-pointer font-bold hover:underline"
                        onClick={() => navigate(`/changes/${event.changeId}`)}
                      >
                        {event.changeId}
                      </span>
                      <span className="text-fade-2 font-medium">by</span>
                      <span className="text-primary-alpha max-w-[120px] truncate font-bold">
                        {event.actor}
                      </span>
                    </div>
                    <span className="text-fade-2 shrink-0 text-[10px] font-medium">
                      {formattedTime}
                    </span>
                  </div>
                  <div className="text-fade max-w-xl truncate text-xs font-light">
                    {event.action} &mdash;{" "}
                    <span className="italic">"{event.title}"</span>
                  </div>
                </div>
              </div>
            );
          })}
          {recentActivity.length === 0 && (
            <div className="text-body-sm text-fade-2 py-8 text-center">
              No activity to display.
            </div>
          )}
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

export default Dashboard;
