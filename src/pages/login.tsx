import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../state/store";
import { Button, Checkbox } from "antd";
import { setCurrentUser, setActiveRoles } from "../state/slices/auth-slice";
import { ShieldCheck, ArrowRight } from "lucide-react";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state) => state.auth);

  const [selectedUserId, setSelectedUserId] = useState<string>(
    "adeyinka@company.com",
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    "Requester",
    "Approver",
    "Tester",
    "Admin",
  ]);

  const activeProfile = users.find((u) => u.id === selectedUserId) || users[0];

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedRoles([...user.baseRoles]);
    }
  };

  const handleRoleToggle = (role: string) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setCurrentUser(selectedUserId));
    dispatch(setActiveRoles(selectedRoles));
    navigate("/");
  };

  const allRoles = ["Requester", "Approver", "Tester", "Admin"];

  return (
    <div className="bg-background-primary relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      {/* Background decoration */}
      <div className="bg-primary pointer-events-none absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full opacity-10 blur-[150px]" />
      <div className="pointer-events-none absolute right-[-20%] bottom-[-20%] h-[60%] w-[60%] rounded-full bg-red-800 opacity-15 blur-[150px]" />

      {/* Main card */}
      <div className="bg-bg/95 border-border z-10 flex min-h-[500px] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border shadow-2xl backdrop-blur-md md:flex-row">
        {/* Brand/Hero Side */}
        <div className="from-primary flex flex-col justify-between bg-gradient-to-br to-red-800 p-8 text-white md:w-5/12">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="text-h2 font-extrabold tracking-tight">NI AI</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-display-md leading-tight font-bold tracking-tight">
              AI Sharepoint
            </h2>
            <p className="text-body-sm font-light text-red-100">
              Submit change requests, manage approvals, coordinate testing, and
              track deployments through a structured workflow.
            </p>
          </div>

          <div className="font-mono text-[10px] tracking-wider text-red-200">
            PROTOTYPE EVALUATION v1.0
          </div>
        </div>

        {/* Form Selection Side */}
        <form
          onSubmit={handleLogin}
          className="flex flex-col justify-between p-8 md:w-7/12"
        >
          <div>
            <div className="mb-6">
              <h3 className="text-h1 text-primary-alpha font-bold tracking-tight">
                Select Test Profile
              </h3>
              <p className="text-body-sm text-fade-2">
                Choose a mock profile to evaluate different user perspectives.
              </p>
            </div>

            {/* Profile Grid */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              {users.map((u) => {
                const isSelected = u.id === selectedUserId;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleUserSelect(u.id)}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary-light/50 ring-primary/20 shadow-sm ring-2"
                        : "border-border hover:border-border-active hover:bg-bg-muted"
                    }`}
                  >
                    <div className="bg-bg-muted text-primary-alpha text-body-sm border-border mb-2 flex h-8 w-8 items-center justify-center rounded-full border font-bold">
                      {u.initials}
                    </div>
                    <div className="text-body-sm text-primary-alpha leading-tight font-bold">
                      {u.name}
                    </div>
                    <div className="text-fade-2 mt-0.5 truncate text-[10px]">
                      {u.email}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Role Checklist */}
            <div className="mb-8 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-fade-2 text-[10px] font-bold tracking-wider uppercase">
                  Select Active Roles
                </span>
                <span className="text-fade-2 text-[10px]">
                  Can select multiple
                </span>
              </div>

              <div className="bg-bg-muted border-border-muted grid grid-cols-2 gap-2 rounded-2xl border p-3">
                {allRoles.map((role) => {
                  const isBase = activeProfile.baseRoles.includes(role);
                  const isChecked = selectedRoles.includes(role);

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`text-body-sm flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-left font-medium transition-all ${
                        isChecked
                          ? "border-primary-border text-primary-alpha bg-white shadow-sm"
                          : "text-fade hover:text-primary-alpha border-transparent bg-transparent"
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        className="text-primary mr-1"
                      />
                      <span className="truncate">{role}</span>
                      {isBase && (
                        <span className="bg-bg-muted text-fade py-0.2 ml-auto shrink-0 rounded px-1 text-[8px] font-bold">
                          Base
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <Button
            type="primary"
            htmlType="submit"
            className="bg-primary hover:bg-primary/90 text-body-md shadow-primary/25 flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-none font-bold text-white shadow-lg transition-all hover:gap-3"
          >
            Enter Change Portal
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Info Footnote */}
      <p className="text-fade mt-6 max-w-md text-center text-[11px] leading-relaxed">
        *Tip: You can dynamically switch users and toggle roles from the header
        profile dropdown menu at any time during your review.
      </p>
    </div>
  );
};

export default Login;
