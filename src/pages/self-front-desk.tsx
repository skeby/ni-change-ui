import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Modal } from "antd";
import {
  ArrowRight,
  Info,
  KeyRound,
  MessageCircle,
  Send,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { useAppSelector } from "../state/store";
import { Utils } from "../utils";
import type { ChangeCategoryKind } from "../state/slices/settings-slice";

dayjs.extend(relativeTime);

type StepKey =
  | "root"
  | "license"
  | "register"
  | "change"
  | "changeType"
  | "other";

interface Turn {
  role: "bot" | "user";
  text: string;
}

interface LeafResult {
  message: string;
  cta: string;
  categoryName: string;
  title: string;
  description: string;
  systemAffected?: string;
}

const ROOT_BOT_MESSAGE = "Pick what you came to do.";

const LICENSE_TOOLS: [string, string][] = [
  ["ChatGPT Enterprise", "~1d"],
  ["Claude", "~1d"],
  ["GitHub Copilot", "~2d"],
  ["Midjourney", "~2d"],
  ["Another tool", "review"],
];

const BUILD_TYPES = [
  "A script or automation",
  "An agent or model",
  "A data pipeline",
  "A prototype app",
];

const CHANGE_TYPES = [
  "New feature",
  "Fix something broken",
  "Access or permissions",
  "Config update",
];

const SelfFrontDesk: React.FC = () => {
  const navigate = useNavigate();
  const { currentUserId, users } = useAppSelector((state) => state.auth);
  const { changes } = useAppSelector((state) => state.changes);
  const { systems, categories, riskLevels, approvalRules } = useAppSelector(
    (state) => state.settings,
  );
  const currentUser = users.find((u) => u.id === currentUserId);

  const categoryByKind = (kind: ChangeCategoryKind) =>
    categories.find((c) => c.active && c.kind === kind)?.name || "";

  const activeSystems = useMemo(
    () => systems.filter((s) => s.active),
    [systems],
  );

  /* ── conversation state ── */
  const [turns, setTurns] = useState<Turn[]>([
    { role: "bot", text: ROOT_BOT_MESSAGE },
  ]);
  const [step, setStep] = useState<StepKey>("root");
  const [selectedSystem, setSelectedSystem] = useState("");
  const [leaf, setLeaf] = useState<LeafResult | null>(null);
  const [otherText, setOtherText] = useState("");

  const pushTurn = (turn: Turn) => setTurns((prev) => [...prev, turn]);

  const restart = () => {
    setTurns([{ role: "bot", text: ROOT_BOT_MESSAGE }]);
    setStep("root");
    setSelectedSystem("");
    setLeaf(null);
    setOtherText("");
  };

  const chooseRoot = (key: StepKey, label: string, botMessage: string) => {
    pushTurn({ role: "user", text: label });
    pushTurn({ role: "bot", text: botMessage });
    setStep(key);
  };

  const chooseLicense = (tool: string) => {
    pushTurn({ role: "user", text: tool });
    setLeaf({
      message: `Got it — a license for ${tool}. This usually clears in about a day.`,
      cta: "Start license request",
      categoryName: categoryByKind("ai_license"),
      title: `AI License Request — ${tool}`,
      description: `Requesting access to ${tool}.`,
    });
  };

  const chooseBuild = (type: string) => {
    pushTurn({ role: "user", text: type });
    setLeaf({
      message: `Great — let's put ${type.toLowerCase()} on the record so it's covered.`,
      cta: "Log this build",
      categoryName: categoryByKind("ai_build"),
      title: `AI Build — ${type}`,
      description: `Registering ${type.toLowerCase()} built with AI.`,
    });
  };

  const chooseSystem = (system: string) => {
    pushTurn({ role: "user", text: system });
    pushTurn({ role: "bot", text: "And what kind of change?" });
    setSelectedSystem(system);
    setStep("changeType");
  };

  const chooseChangeType = (type: string) => {
    pushTurn({ role: "user", text: type });
    setLeaf({
      message: `Understood — a "${type.toLowerCase()}" change to ${selectedSystem}. We'll loop in the right owner.`,
      cta: "Open change request",
      categoryName: categoryByKind("update_existing"),
      title: `${type} — ${selectedSystem}`,
      description: `${type} requested for ${selectedSystem}.`,
      systemAffected: selectedSystem,
    });
  };

  const submitOther = () => {
    const text = otherText.trim();
    if (!text) return;
    pushTurn({ role: "user", text });
    setLeaf({
      message: `Thanks — "${text}". We'll figure out who needs to sign off.`,
      cta: "Send it over",
      categoryName: "",
      title: "",
      description: text,
    });
  };

  const goToWizard = () => {
    if (!leaf) return;
    const params = new URLSearchParams();
    if (leaf.categoryName) params.set("category", leaf.categoryName);
    if (leaf.title) params.set("title", leaf.title);
    if (leaf.description) params.set("description", leaf.description);
    if (leaf.systemAffected) params.set("systemAffected", leaf.systemAffected);
    const query = params.toString();
    navigate(`/self/changes/new/general${query ? `?${query}` : ""}`);
  };

  /* ── stats ── */
  const stats = useMemo(() => {
    const decided = changes.filter((c) => c.status !== "Draft");

    const approvalDurationsDays = decided
      .map((c) => {
        const firstApproval = c.approvals.find((a) => a.action === "approved");
        if (!firstApproval) return null;
        const days =
          (new Date(firstApproval.timestamp).getTime() -
            new Date(c.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return days >= 0 ? days : null;
      })
      .filter((d): d is number => d !== null);
    const avgApprovalDays =
      approvalDurationsDays.length > 0
        ? approvalDurationsDays.reduce((a, b) => a + b, 0) /
          approvalDurationsDays.length
        : null;

    const firstPassEligible = decided.filter(
      (c) => c.status !== "Submitted" && c.status !== "Under Review",
    );
    const firstPassApproved = firstPassEligible.filter(
      (c) => !c.isQueried && !c.approvals.some((a) => a.action === "rejected"),
    );
    const firstPassPct =
      firstPassEligible.length > 0
        ? Math.round(
            (firstPassApproved.length / firstPassEligible.length) * 100,
          )
        : null;

    const lastRequest = [...decided].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];

    return { avgApprovalDays, firstPassPct, lastRequest };
  }, [changes]);

  /* ── approvals explainer modal ── */
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [sensitive, setSensitive] = useState(false);
  const [middleware, setMiddleware] = useState(false);
  const [orgwide, setOrgwide] = useState(false);

  const resolvedRiskName = orgwide
    ? "High"
    : sensitive || middleware
      ? "Medium"
      : "Low";
  const sortedRiskLevels = [...riskLevels].sort(
    (a, b) => a.severity - b.severity,
  );
  const riskIdx = sortedRiskLevels.findIndex(
    (r) => r.name === resolvedRiskName,
  );
  const resolvedRisk = riskIdx >= 0 ? sortedRiskLevels[riskIdx] : undefined;
  const resolvedStages = Utils.resolveApprovalStages(
    approvalRules,
    "Any",
    "Any",
    resolvedRiskName,
  );
  const meterPct =
    riskIdx >= 0 ? ((riskIdx + 1) / sortedRiskLevels.length) * 100 : 16;
  const etaDays = resolvedRisk
    ? Math.max(1, Math.round(resolvedRisk.maxEscalationHours / 24))
    : 1;

  const firstName =
    currentUser?.firstName || currentUser?.name?.split(" ")[0] || "there";
  const officeLabel = currentUser?.officeLocation;

  return (
    <>
      <div className="relative flex min-h-[calc(100vh-90px)] flex-col overflow-hidden bg-gradient-to-b from-[#eef3f7] via-[#f7f9fb] to-white dark:border-border dark:from-[#1f2428] dark:via-[#1c1f22] dark:to-[#1a1a1a]">
        {/* ── decorative ambient backdrop ── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div className="absolute -top-[150px] -right-[110px] h-[480px] w-[480px] rounded-full bg-[#d8e3ee] opacity-50 blur-[90px] dark:bg-primary/10 dark:opacity-100" />
          <div className="absolute -bottom-[140px] -left-[130px] h-[420px] w-[420px] rounded-full bg-[#f3dfe1] opacity-50 blur-[90px] dark:bg-primary/10 dark:opacity-100" />
          <div className="absolute top-[42%] left-[58%] h-[260px] w-[260px] rounded-full bg-[#eae2d6] opacity-40 blur-[90px] dark:bg-white/5 dark:opacity-100" />

          <div className="animate-fd-drift-1 absolute top-[14%] left-[-280px] h-[60px] w-[260px] rounded-[100px] bg-white opacity-70 blur-[14px] dark:bg-white/10" />
          <div className="animate-fd-drift-2 absolute top-[26%] left-[-220px] h-[46px] w-[190px] rounded-[100px] bg-white opacity-70 blur-[14px] dark:bg-white/10" />
          <div className="animate-fd-drift-1 absolute top-[8%] left-[-340px] h-[70px] w-[320px] rounded-[100px] bg-white opacity-50 blur-[14px] dark:bg-white/5" />
          <div className="animate-fd-drift-2 absolute top-[20%] left-[-260px] h-[54px] w-[230px] rounded-[100px] bg-white opacity-60 blur-[14px] dark:bg-white/10" />
          <div className="animate-fd-drift-1 absolute top-[33%] left-[-180px] h-[40px] w-[150px] rounded-[100px] bg-white opacity-45 blur-[14px] dark:bg-white/5" />

          <div className="animate-fd-fly text-primary-alpha pointer-events-none absolute top-[8%] left-0 w-[60px] opacity-[0.16] dark:text-white dark:opacity-10">
            <svg
              viewBox="0 0 64 26"
              fill="currentColor"
              className="block w-full"
            >
              <path d="M2 14 L40 11 Q47 10 56 13 L62 14.5 Q63 15 62 15.5 L56 16 Q47 18 40 16 L2 16 Z" />
              <path d="M22 11 L16 3 L20 3 L30 11 Z" />
              <path d="M22 16 L15 23 L19 23 L30 16 Z" />
              <path d="M6 12 L3 6 L6 6 L11 12 Z" />
            </svg>
            <span className="absolute top-[46%] right-full h-[2px] w-[230px] bg-gradient-to-r from-transparent to-current" />
          </div>

          <div className="text-primary-alpha absolute bottom-0 left-0 w-full dark:text-white">
            <svg
              viewBox="0 0 1440 300"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMax meet"
              className="block h-auto w-full"
            >
              <g fill="currentColor" className="opacity-[0.16] dark:opacity-10">
                <rect x="40" y="174" width="60" height="114" />
                <rect x="108" y="120" width="52" height="168" />
                <rect x="130" y="106" width="6" height="14" />
                <rect x="168" y="196" width="46" height="92" />
                <rect x="222" y="150" width="58" height="138" />
                <rect x="288" y="206" width="40" height="82" />
                <rect x="336" y="178" width="52" height="110" />
                <rect x="396" y="212" width="44" height="76" />

                <rect x="500" y="220" width="380" height="68" />
                <path d="M500 220 L584 196 L668 220 Z" />
                <path d="M714 220 L798 196 L880 220 Z" />
                <rect x="512" y="178" width="26" height="42" />
                <path d="M510 178 L525 150 L540 178 Z" />
                <rect x="842" y="178" width="26" height="42" />
                <path d="M840 178 L855 150 L870 178 Z" />
                <rect x="668" y="96" width="46" height="192" />
                <rect x="662" y="92" width="58" height="10" />
                <path d="M668 92 L673 78 L678 92 Z" />
                <path d="M704 92 L709 78 L714 92 Z" />
                <path d="M662 92 L691 50 L720 92 Z" />
                <circle
                  cx="691"
                  cy="126"
                  r="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={4}
                />
                <rect x="689" y="32" width="4" height="18" />
                <path d="M693 33 L713 38 L693 45 Z" />

                <path d="M886 288 V214 Q886 188 932 188 Q978 188 978 214 V288 Z" />
                <path d="M894 188 L932 150 L970 188 Z" />
                <rect x="928" y="138" width="8" height="12" />
                <path d="M927 138 L932 128 L937 138 Z" />

                <rect x="1000" y="200" width="200" height="88" />
                <rect x="1000" y="170" width="22" height="30" />
                <path d="M998 170 L1011 144 L1024 170 Z" />
                <path d="M1028 200 L1058 162 L1088 200 Z" />
                <path d="M1094 200 L1128 158 L1162 200 Z" />
                <rect x="1172" y="152" width="30" height="48" />
                <path d="M1168 152 L1187 110 L1206 152 Z" />
                <rect x="1185" y="96" width="3" height="14" />

                <rect x="1230" y="172" width="58" height="116" />
                <rect x="1296" y="206" width="44" height="82" />
                <rect x="1348" y="150" width="60" height="138" />
                <rect x="1376" y="136" width="6" height="14" />
              </g>

              <g fill="currentColor" className="opacity-20 dark:opacity-10">
                <rect x="0" y="287" width="1440" height="2" />
                <g
                  className="animate-fd-sway"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "bottom center",
                  }}
                >
                  <rect x="147" y="258" width="6" height="30" />
                  <circle cx="150" cy="252" r="15" />
                  <circle cx="138" cy="260" r="10" />
                  <circle cx="162" cy="260" r="10" />
                  <circle cx="150" cy="242" r="10" />
                </g>
                <g
                  className="animate-fd-sway-reverse"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "bottom center",
                  }}
                >
                  <rect x="357" y="262" width="6" height="26" />
                  <circle cx="360" cy="256" r="13" />
                  <circle cx="349" cy="263" r="9" />
                  <circle cx="371" cy="263" r="9" />
                </g>
                <g
                  className="animate-fd-sway"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "bottom center",
                  }}
                >
                  <rect x="997" y="258" width="6" height="30" />
                  <circle cx="1000" cy="252" r="15" />
                  <circle cx="988" cy="260" r="10" />
                  <circle cx="1012" cy="260" r="10" />
                  <circle cx="1000" cy="242" r="10" />
                </g>
                <g
                  className="animate-fd-sway-reverse"
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "bottom center",
                  }}
                >
                  <rect x="1297" y="262" width="6" height="26" />
                  <circle cx="1300" cy="256" r="13" />
                  <circle cx="1289" cy="263" r="9" />
                  <circle cx="1311" cy="263" r="9" />
                </g>
                <g className="animate-fd-ride">
                  <circle cx="16" cy="280" r="8" />
                  <circle cx="66" cy="280" r="8" />
                  <path d="M12 280 L12 268 Q12 262 20 262 L44 262 L52 250 Q56 246 60 250 L67 263 Q71 265 71 273 L71 280 Z" />
                  <rect x="20" y="255" width="22" height="8" rx="4" />
                  <path
                    d="M31 256 L26 277"
                    stroke="currentColor"
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M31 256 L41 271"
                    stroke="currentColor"
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M31 256 L34 234"
                    stroke="currentColor"
                    strokeWidth={5}
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M34 238 L57 248"
                    stroke="currentColor"
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M57 248 L57 240"
                    stroke="currentColor"
                    strokeWidth={4}
                    fill="none"
                    strokeLinecap="round"
                  />
                  <circle cx="33" cy="227" r="6" />
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* ── hero content ── */}
        <div className="relative z-10 mx-auto flex w-full max-w-[980px] flex-1 flex-col px-6 pt-4 pb-3 sm:px-[24px] sm:pt-4 sm:pb-3">
          <span className="bg-bg border-border text-primary-alpha mb-3 inline-flex self-start items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm">
            <span className="bg-primary animate-fd-beat h-3.5 w-3.5 rounded-full" />
            Hi {firstName}
            {officeLabel ? ` — ${officeLabel}` : ""}
          </span>

          <h1 className="animate-fd-rise-hero text-primary-alpha max-w-[15ch] text-[clamp(1.6rem,3.8vw,2.5rem)] font-extrabold leading-[1.03] tracking-tight">
            What can we help you{" "}
            <span className="text-primary">get moving</span> today?
          </h1>
          <p className="animate-fd-rise-hero-delay text-fade mt-2.5 max-w-[48ch] text-[0.95rem] leading-[1.5]">
            No forms to dig for. Tell us what you need and we'll line up the
            right approval.
          </p>
          <button
            type="button"
            onClick={() => setExplainerOpen(true)}
            className="text-fade hover:text-primary mt-1.5 inline-flex cursor-pointer items-center gap-1 border-none bg-transparent text-xs font-semibold underline-offset-2 hover:underline"
          >
            <Info className="h-3.5 w-3.5" />
            How approvals work
          </button>

          {/* ── conversation ── */}
          <div aria-live="polite" className="mt-[18px] flex flex-col gap-2.5">
            {turns.map((t, i) =>
              t.role === "bot" ? (
                <BotBubble key={i}>{t.text}</BotBubble>
              ) : (
                <UserBubble key={i}>{t.text}</UserBubble>
              ),
            )}

            {!leaf && step === "root" && (
              <div className="animate-fd-rise grid grid-cols-1 gap-2.5 max-w-[720px] sm:ml-[46px] sm:grid-cols-2">
                <IntentCard
                  icon={KeyRound}
                  tint="bg-primary"
                  title="Request an AI license"
                  description="Get approved access to an AI tool or model."
                  onClick={() =>
                    chooseRoot(
                      "license",
                      "Request an AI license",
                      "Which tool do you need access to?",
                    )
                  }
                />
                <IntentCard
                  icon={Sparkles}
                  tint="bg-secondary"
                  title="Register an AI build"
                  description="Log a solution you created with AI."
                  onClick={() =>
                    chooseRoot(
                      "register",
                      "Register an AI build",
                      "Nice. What do you want to build?",
                    )
                  }
                />
                <IntentCard
                  icon={SlidersHorizontal}
                  tint="bg-primary"
                  title="Change a system"
                  description={`${activeSystems.length} systems available — pick one to get started.`}
                  systems={activeSystems.slice(0, 4).map((s) => s.name)}
                  onClick={() =>
                    chooseRoot(
                      "change",
                      "Change a system",
                      "Which system are we touching?",
                    )
                  }
                />
                <IntentCard
                  icon={MessageCircle}
                  tint="bg-secondary"
                  title="Something else"
                  description="Describe it and we'll route it."
                  onClick={() =>
                    chooseRoot(
                      "other",
                      "Something else",
                      "No problem — tell us in your own words.",
                    )
                  }
                />
              </div>
            )}

            {!leaf && step === "license" && (
              <div className="animate-fd-rise flex flex-wrap gap-2 sm:ml-[46px]">
                {LICENSE_TOOLS.map(([tool, tag]) => (
                  <Chip key={tool} onClick={() => chooseLicense(tool)}>
                    {tool}
                    <span className="text-fade-2 ml-2 font-mono text-[11px]">
                      {tag}
                    </span>
                  </Chip>
                ))}
              </div>
            )}

            {!leaf && step === "register" && (
              <div className="animate-fd-rise flex flex-wrap gap-2 sm:ml-[46px]">
                {BUILD_TYPES.map((type) => (
                  <Chip key={type} onClick={() => chooseBuild(type)}>
                    {type}
                  </Chip>
                ))}
              </div>
            )}

            {!leaf && step === "change" && (
              <div className="animate-fd-rise flex flex-wrap gap-2 sm:ml-[46px]">
                {activeSystems.map((s) => (
                  <Chip
                    key={s.id}
                    title={s.description}
                    onClick={() => chooseSystem(s.name)}
                  >
                    {s.name}
                  </Chip>
                ))}
              </div>
            )}

            {!leaf && step === "changeType" && (
              <div className="animate-fd-rise flex flex-wrap gap-2 sm:ml-[46px]">
                {CHANGE_TYPES.map((type) => (
                  <Chip key={type} onClick={() => chooseChangeType(type)}>
                    {type}
                  </Chip>
                ))}
              </div>
            )}

            {!leaf && step === "other" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitOther();
                }}
                className="animate-fd-rise flex max-w-xl gap-2.5 sm:ml-[46px]"
              >
                <input
                  autoFocus
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Describe what you need..."
                  className="border-border bg-bg text-primary-alpha focus:border-primary flex-1 rounded-full border px-4 py-2 text-xs font-medium outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none text-white transition-colors"
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}

            {!leaf && step !== "root" && (
              <div className="animate-fd-rise sm:ml-[46px]">
                <button
                  type="button"
                  onClick={restart}
                  className="border border-primary/30 hover:border-primary hover:bg-primary-light dark:hover:bg-primary/10 text-primary flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all hover:-translate-y-0.5 shadow-sm bg-bg"
                >
                  <RotateCcw className="h-3 w-3" />
                  Start over
                </button>
              </div>
            )}

            {leaf && (
              <>
                <BotBubble>{leaf.message}</BotBubble>
                <div className="animate-fd-rise flex flex-wrap items-center gap-3 sm:ml-[46px]">
                  <button
                    type="button"
                    onClick={goToWizard}
                    className="bg-primary hover:bg-primary/90 shadow-primary/30 flex cursor-pointer items-center gap-2 rounded-full border-none px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:-translate-y-0.5"
                  >
                    {leaf.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={restart}
                    className="border border-primary/30 hover:border-primary hover:bg-primary-light dark:hover:bg-primary/10 text-primary flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition-all hover:-translate-y-0.5 shadow-sm bg-bg"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Start over
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── stats strip ── */}
          <div className="border-border-muted mt-auto flex flex-wrap items-center gap-4 border-t pt-3.5">
            <div>
              <div className="text-primary-alpha flex items-baseline gap-1 text-xl font-extrabold tracking-tight">
                {stats.avgApprovalDays !== null ? (
                  <>
                    <span className="text-primary">
                      {stats.avgApprovalDays.toFixed(1)}
                    </span>
                    <span className="text-sm font-bold">days</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
              <div className="text-fade text-xs font-semibold">
                Average time to approval
              </div>
            </div>
            <div>
              <div className="text-primary-alpha flex items-baseline gap-1 text-xl font-extrabold tracking-tight">
                {stats.firstPassPct !== null ? (
                  <>
                    <span className="text-primary">{stats.firstPassPct}</span>
                    <span className="text-sm font-bold">%</span>
                  </>
                ) : (
                  "—"
                )}
              </div>
              <div className="text-fade text-xs font-semibold">
                Approved on first pass
              </div>
            </div>
            {stats.lastRequest && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/self/changes/${stats.lastRequest!.id}`)
                }
                className="bg-bg border-border hover:border-primary ml-auto flex cursor-pointer items-center gap-2.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
              >
                <span className="text-fade">Last request</span>
                <span className="bg-primary-light text-primary dark:bg-primary/15 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold">
                  {stats.lastRequest.id}
                </span>
                <span className="text-fade-2 max-w-40 truncate text-xs">
                  {stats.lastRequest.category} ·{" "}
                  {dayjs(stats.lastRequest.updatedAt).fromNow()}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={explainerOpen}
        onCancel={() => setExplainerOpen(false)}
        footer={null}
        centered
        title={
          <span className="text-h3 text-primary-alpha font-bold">
            How approvals work
          </span>
        }
        width={520}
      >
        <p className="text-body-sm text-fade mt-1 mb-5 max-w-[44ch]">
          Every request is routed by risk — the more sensitive or connected your
          change is, the more review it needs. Toggle what applies and watch the
          path grow.
        </p>
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            active={sensitive}
            onClick={() => setSensitive((v) => !v)}
          >
            Touches sensitive data
          </ToggleChip>
          <ToggleChip
            active={middleware}
            onClick={() => setMiddleware((v) => !v)}
          >
            Connects to our middleware
          </ToggleChip>
          <ToggleChip active={orgwide} onClick={() => setOrgwide((v) => !v)}>
            Affects the whole org
          </ToggleChip>
        </div>

        <div className="bg-bg-muted mt-5 h-2.5 overflow-hidden rounded-full">
          <div
            className="from-secondary to-primary h-full rounded-full bg-gradient-to-r transition-all duration-500"
            style={{ width: `${meterPct}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-sm">
          <span className="text-primary-alpha font-bold">
            {resolvedRiskName} risk
          </span>
          <span className="text-fade font-semibold">
            Decision in ~{etaDays} day{etaDays === 1 ? "" : "s"}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <PipeNode delayMs={0}>Request submitted</PipeNode>
          {resolvedStages.map((stage, i) => (
            <React.Fragment key={stage.id}>
              <ArrowRight
                className="animate-fd-pop text-fade-2 h-3.5 w-3.5"
                style={{ animationDelay: `${(i + 1) * 70}ms` }}
              />
              <PipeNode highlight delayMs={(i + 1) * 70}>
                {stage.type === "role_based" ? stage.role : "Reviewer"}
              </PipeNode>
            </React.Fragment>
          ))}
          <ArrowRight
            className="animate-fd-pop text-fade-2 h-3.5 w-3.5"
            style={{ animationDelay: `${(resolvedStages.length + 1) * 70}ms` }}
          />
          <PipeNode highlight delayMs={(resolvedStages.length + 1) * 70}>
            Decision
          </PipeNode>
        </div>

        <p className="text-body-xs text-fade border-border-muted mt-4 border-t pt-3.5">
          {resolvedStages.length === 0
            ? "No specific approval rule is configured for this combination yet — it falls back to the default routing for its risk level."
            : `This risk level routes through ${resolvedStages.length} approval stage${resolvedStages.length === 1 ? "" : "s"} before a decision is made.`}
        </p>
      </Modal>
    </>
  );
};

/* ── presentational helpers ── */

const BotBubble: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="animate-fd-rise flex items-start gap-2.5">
    <div className="bg-bg border-border relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm">
      <span className="bg-primary animate-fd-beat h-3 w-3 rounded-full" />
    </div>
    <div className="bg-bg border-border text-primary-alpha max-w-xl rounded-xl rounded-tl-md border px-4 py-2.5 text-[0.95rem] font-semibold shadow-sm">
      {children}
    </div>
  </div>
);

const UserBubble: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="animate-fd-rise flex justify-end">
    <div className="bg-secondary text-secondary-foreground max-w-md rounded-xl rounded-tr-md px-3.5 py-2 text-xs font-semibold">
      {children}
    </div>
  </div>
);

const IntentCard: React.FC<{
  icon: React.FC<{ className?: string }>;
  tint: string;
  title: string;
  description: string;
  systems?: string[];
  onClick: () => void;
}> = ({ icon: Icon, tint, title, description, systems, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`card group relative cursor-pointer overflow-hidden border border-border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
      systems ? "pb-10" : ""
    }`}
  >
    <div
      className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}
    >
      <Icon className="h-4 w-4 text-white" />
    </div>
    <h3 className="text-sm text-primary-alpha font-bold">{title}</h3>
    <p className="text-xs text-fade mt-0.5 leading-snug">{description}</p>
    <span className="bg-bg-muted text-primary-alpha group-hover:bg-primary absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full transition-colors group-hover:text-white">
      <ArrowRight className="h-3 w-3" />
    </span>
    {systems && systems.length > 0 && (
      <span className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-1">
        {systems.map((name, i) => (
          <span
            key={name}
            className="bg-bg border-border text-primary-alpha translate-y-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            {name}
          </span>
        ))}
      </span>
    )}
  </button>
);

const Chip: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
}> = ({ children, onClick, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="border-border bg-bg text-primary-alpha hover:border-primary hover:bg-primary-light dark:hover:bg-primary/10 cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5"
  >
    {children}
  </button>
);

const ToggleChip: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`cursor-pointer rounded-full border px-3.5 py-2 text-sm font-semibold transition-all ${
      active
        ? "bg-primary border-primary text-white"
        : "border-border bg-bg text-fade hover:border-primary hover:text-primary-alpha"
    }`}
  >
    {children}
  </button>
);

const PipeNode: React.FC<{
  children: React.ReactNode;
  highlight?: boolean;
  delayMs?: number;
}> = ({ children, highlight, delayMs }) => (
  <span
    className={`animate-fd-pop rounded-lg px-3 py-2 text-xs font-bold ${
      highlight
        ? "bg-primary-light text-primary dark:bg-primary/15"
        : "bg-bg-muted text-primary-alpha"
    }`}
    style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
  >
    {children}
  </span>
);

export default SelfFrontDesk;
