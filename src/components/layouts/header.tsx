import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ShieldAlert, LogOut, Plus } from "lucide-react";
import {
  Badge,
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Popover,
  theme,
} from "antd";
import ThemeToggle from "../ui/theme-toggle";
import { useAppDispatch, useAppSelector } from "../../state/store";
import {
  setCurrentUser,
  toggleActiveRole,
} from "../../state/slices/auth-slice";
import { markAllAsRead } from "../../state/slices/notifications-slice";
import NotificationBell from "../../assets/icons/notification-bell.svg?react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { token } = theme.useToken();
  const { users, currentUserId, activeRoles } = useAppSelector(
    (state) => state.auth,
  );
  const { notifications } = useAppSelector((state) => state.notifications);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const userList = users ?? [];
  const currentUser =
    userList.find((u) => u.id === currentUserId) || userList[0];
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length;

  if (!currentUser) {
    return null;
  }

  const getHeaderInfo = () => {
    const path = location.pathname;
    if (path === "/")
      return {
        title: "Front Desk",
        subtitle: "Your starting point for getting things done.",
      };
    if (path === "/dashboard")
      return {
        title: "Dashboard Overview",
        subtitle: `Welcome back, ${currentUser.name}. Here's what's happening today.`,
      };
    if (path === "/self/dashboard")
      return {
        title: "My Dashboard",
        subtitle: `Welcome back, ${currentUser.name}. Here's what needs your attention.`,
      };
    if (path === "/self/profile")
      return {
        title: "My Profile",
        subtitle: "Manage your profile details and preferences.",
      };
    if (path.startsWith("/self/changes/new"))
      return {
        title: "New Change Request",
        subtitle: "Complete the wizard to submit a new change request.",
      };
    if (path === "/self/changes")
      return {
        title: "My Change Requests",
        subtitle: "Manage your submitted change requests and drafts.",
      };
    if (path.startsWith("/self/changes/"))
      return {
        title: "Change Request Details",
        subtitle: "Review change details, testing, deployment, and timeline.",
      };
    if (path === "/self/approvals")
      return {
        title: "My Approvals Queue",
        subtitle: "Review and act on change requests pending your approval.",
      };
    if (path === "/changes")
      return {
        title: "All Changes",
        subtitle: "Manage all change requests across the organization.",
      };
    if (path === "/change-journey")
      return {
        title: "Change Journey",
        subtitle:
          "Track every request across the organization as it moves through the lifecycle.",
      };
    if (path === "/graph")
      return {
        title: "Change Graph",
        subtitle:
          "See how request kinds connect to the systems they touch across the organization.",
      };
    if (path === "/map")
      return {
        title: "Change Map",
        subtitle:
          "See where change requests are coming from across the organization.",
      };
    if (path.startsWith("/changes/"))
      return {
        title: "Change Request Details",
        subtitle: "Review change details, testing, deployment, and timeline.",
      };
    if (path === "/settings/categories")
      return {
        title: "Change Categories",
        subtitle:
          "Configure change request categories and default risk levels.",
      };
    if (path === "/settings/risk-levels")
      return {
        title: "Risk Levels",
        subtitle:
          "Configure escalation SLAs and approval flows for each risk level.",
      };
    if (path === "/settings/users")
      return {
        title: "User Management",
        subtitle: "Manage users and their role assignments.",
      };
    if (path === "/settings/systems")
      return {
        title: "Systems",
        subtitle: "Manage the systems available for change requests.",
      };
    return {
      title: "NI Change",
      subtitle: "Manage the full lifecycle of system changes.",
    };
  };

  const headerInfo = getHeaderInfo();

  const handleUserChange = (userId: string) => {
    dispatch(setCurrentUser(userId));
    setDropdownOpen(false);
    navigate("/");
  };

  const handleRoleToggle = (role: string) => {
    dispatch(toggleActiveRole(role));
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    navigate("/login");
  };

  const allAvailableRoles = ["Requester", "Approver", "Tester", "Admin"];

  return (
    <header className="bg-bg border-border-muted relative z-20 flex h-[90px] shrink-0 items-center justify-between border-b px-8">
      <div className="mr-4 min-w-0 flex-1">
        <h1
          className="text-h2 text-primary-alpha mb-1 truncate leading-tight font-bold tracking-tight"
          title={headerInfo.title}
        >
          {headerInfo.title}
        </h1>
        <p
          className="text-body-sm text-fade-2 hidden truncate leading-normal font-normal sm:block"
          title={headerInfo.subtitle}
        >
          {headerInfo.subtitle}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {!location.pathname.startsWith("/self/changes/new") && (
          <Button
            type="primary"
            onClick={() => navigate("/self/changes/new")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-body-sm shadow-primary/20 animate-fade-in flex h-10! shrink-0 items-center gap-1.5 rounded-lg! border-none px-4 font-semibold shadow-sm transition-all"
            icon={<Plus className="h-4 w-4" />}
          >
            <span>New Change Request</span>
          </Button>
        )}

        <ThemeToggle />

        <Popover
          trigger="click"
          placement="bottomRight"
          arrow={false}
          content={
            <div className="w-80">
              <div className="flex items-center justify-between border-b border-border-muted pb-3 mb-3">
                <span className="text-body-md font-bold text-primary-alpha">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch(markAllAsRead())}
                    className="text-body-xs text-primary font-semibold cursor-pointer bg-transparent border-none hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="custom-scrollbar max-h-72 -mx-3 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-body-sm text-fade px-3 py-4 text-center">
                    No notifications
                  </p>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      onClick={() =>
                        n.changeId && navigate(`/self/changes/${n.changeId}`)
                      }
                      className={`w-full text-left px-3 py-2.5 cursor-pointer border-none transition-colors ${
                        n.read
                          ? "bg-transparent hover:bg-bg-muted"
                          : "bg-primary-light/50 hover:bg-primary-light dark:bg-primary/5 dark:hover:bg-primary/10"
                      }`}
                    >
                      <p className="text-body-sm font-semibold text-primary-alpha leading-snug">
                        {n.title}
                      </p>
                      <p className="text-body-xs text-fade mt-0.5 leading-snug">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-fade-2 mt-1">
                        {dayjs(n.timestamp).fromNow()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          }
        >
          <Button className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px]! border-none! bg-[#f1f3f5] p-0! text-slate-700! shadow-none! hover:bg-[#e2e8f0]! dark:bg-[#252525] dark:text-slate-300! dark:hover:bg-[#333333]!">
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <NotificationBell className="size-6!" />
            </Badge>
          </Button>
        </Popover>

        <Dropdown
          open={dropdownOpen}
          onOpenChange={(open) => setDropdownOpen(open)}
          trigger={["click"]}
          placement="bottomRight"
          align={{ offset: [0, 21] }}
          arrow={false}
          popupRender={() => (
            <div
              style={{
                backgroundColor: token.colorBgElevated,
                borderRadius: token.borderRadiusLG,
                boxShadow: token.boxShadowSecondary,
                border: "1px solid var(--color-border)",
              }}
              className="text-primary-alpha w-64 overflow-hidden"
            >
              <div className="flex w-full flex-col items-center overflow-hidden p-4 text-center">
                <div className="bg-ni-primary-tint! text-ni-primary! mb-2 flex h-15 w-15 shrink-0 items-center justify-center rounded-full text-xl font-bold uppercase shadow-none dark:bg-[#4c1d1f]! dark:text-[#fca5a5]!">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="w-full min-w-0 space-y-0.5 px-2">
                  <p
                    title={currentUser.name}
                    className="text-primary-alpha truncate text-base font-bold"
                  >
                    {currentUser.name}
                  </p>
                  <p
                    title={activeRoles.join(", ")}
                    className="text-fade truncate text-xs font-semibold capitalize"
                  >
                    {activeRoles.join(", ")}
                  </p>
                </div>
              </div>
              <Divider style={{ margin: 0 }} />

              <div className="border-border border-b px-5 py-3">
                <div className="text-fade-2 mb-2 text-[10px] font-semibold tracking-wider uppercase">
                  Switch Profile
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {userList.map((u) => {
                    const isCurrent = u.id === currentUserId;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleUserChange(u.id)}
                        className={`text-body-sm h-8 cursor-pointer rounded-lg border px-3 text-left font-semibold transition-all ${
                          isCurrent
                            ? "bg-ni-primary-light dark:bg-ni-primary/20 text-ni-primary border-ni-primary-tint dark:border-ni-primary/40 dark:text-red-400"
                            : "bg-bg-muted border-border hover:bg-bg-muted/70 text-fade dark:border-[#3d3d3d] dark:bg-[#2d2d2d]/30 dark:hover:bg-[#2d2d2d]/50"
                        }`}
                      >
                        {u.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-border border-b px-5 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-fade-2 text-[10px] font-semibold tracking-wider uppercase">
                    Override Roles (Session)
                  </div>
                  <ShieldAlert className="text-ni-primary h-3.5 w-3.5" />
                </div>
                <div className="custom-scrollbar max-h-40 space-y-1.5 overflow-y-auto">
                  {allAvailableRoles.map((role) => {
                    const isAssigned = currentUser.baseRoles.includes(role);
                    const isActive = activeRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleToggle(role)}
                        className="hover:bg-bg-muted flex h-9 w-full cursor-pointer items-center justify-between rounded-lg border-none bg-transparent px-2.5 text-left shadow-none transition-colors dark:hover:bg-[#2d2d2d]/50"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={isActive}
                            onChange={() => {}}
                            className="text-primary h-4 w-4"
                          />
                          <span
                            className={`text-body-sm font-medium ${isActive ? "text-primary-alpha" : "text-fade"}`}
                          >
                            {role}
                          </span>
                        </div>
                        {isAssigned && (
                          <span className="bg-bg-muted text-fade rounded px-1.5 py-0.5 text-[10px] font-bold dark:bg-[#3d3d3d]">
                            Base
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-body-sm border-border hover:bg-bg-muted text-fade hover:text-primary-alpha flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border bg-transparent font-semibold transition-colors dark:border-[#3d3d3d] dark:hover:bg-[#2d2d2d]/50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout / Switch Screen
                </button>
              </div>
            </div>
          )}
        >
          <div
            className="text-ni-primary! flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-none! bg-[#f1f3f5] text-sm font-bold uppercase shadow-none transition-colors hover:bg-[#e2e8f0]! dark:bg-[#252525] dark:hover:bg-[#333333]!"
            title={`${currentUser.name} (${activeRoles[0] || "No Role"})`}
          >
            {currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        </Dropdown>
      </div>
    </header>
  );
};

export default Header;
