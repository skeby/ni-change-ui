import React, { Fragment } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../state/store";
import { Utils } from "../../utils";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { BiSolidDashboard } from "react-icons/bi";
import { BsClipboardCheckFill } from "react-icons/bs";
import {
  FaCodeBranch,
  FaUsersCog,
  FaShieldAlt,
  FaServer,
  FaListAlt,
  FaSitemap,
  FaProjectDiagram,
  FaMapMarkedAlt,
} from "react-icons/fa";
import { BiSolidUser } from "react-icons/bi";
import { Tooltip } from "antd";
import SidebarIllustration from "../../assets/sidebar-illus.svg?react";

interface SideBarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SideBar: React.FC<SideBarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUserId, activeRoles } = useAppSelector((state) => state.auth);
  const { changes } = useAppSelector((state) => state.changes);

  const isRole = (roles: string[]) => {
    return activeRoles.some((role) => roles.includes(role));
  };

  const isAwaitingAction = (change: any) => {
    if (
      change.status === "Draft" ||
      change.status === "Closed" ||
      change.status === "Rejected" ||
      change.status === "Rolled Back"
    ) {
      return false;
    }
    if (change.isQueried) {
      return change.submitterId === currentUserId;
    }
    if (change.status === "Under Review" || change.status === "Submitted") {
      return activeRoles.includes("Approver") || activeRoles.includes("Admin");
    }
    return false;
  };

  const pendingApprovalsCount = changes?.filter(isAwaitingAction).length;

  const menuGroups = [
    {
      title: "Overview",
      visible: isRole(["Admin"]),
      items: [
        { name: "Dashboard", path: "/", icon: BiSolidDashboard },
        // { name: "Change Journey", path: "/change-journey", icon: FaRoute },
        { name: "Change Graph", path: "/graph", icon: FaProjectDiagram },
        { name: "Change Map", path: "/map", icon: FaMapMarkedAlt },
      ],
    },
    {
      title: "My Workspace",
      visible: isRole(["Requester"]),
      items: [
        {
          name: "My Dashboard",
          path: "/self/dashboard",
          icon: BiSolidDashboard,
        },
        { name: "My Changes", path: "/self/changes", icon: FaCodeBranch },
        { name: "My Profile", path: "/self/profile", icon: BiSolidUser },
      ],
    },
    {
      title: "Approvals",
      visible: isRole(["Approver", "Admin"]),
      items: [
        {
          name: "My Approvals",
          path: "/self/approvals",
          icon: BsClipboardCheckFill,
          pendingCount: pendingApprovalsCount,
        },
      ],
    },
    {
      title: "Change Management",
      visible: isRole(["Admin"]),
      items: [{ name: "All Changes", path: "/changes", icon: FaCodeBranch }],
    },
    {
      title: "Settings",
      visible: isRole(["Admin"]),
      items: [
        { name: "Categories", path: "/settings/categories", icon: FaListAlt },
        {
          name: "Risk Levels",
          path: "/settings/risk-levels",
          icon: FaShieldAlt,
        },
        {
          name: "Approval Rules",
          path: "/settings/approval-rules",
          icon: FaSitemap,
        },
        { name: "Systems", path: "/settings/systems", icon: FaServer },
        { name: "Users", path: "/settings/users", icon: FaUsersCog },
      ],
    },
  ];

  return (
    <aside
      className={`bg-bg border-border relative flex h-screen flex-col border-r transition-all duration-300 ${
        collapsed ? "w-20" : "w-60"
      }`}
    >
      <div className="border-border relative z-10 flex h-[90px] shrink-0 items-center justify-center border-b px-5">
        <Link
          to="/"
          className={Utils.cn(
            "flex w-full items-center",
            collapsed ? "justify-center" : "justify-start",
          )}
        >
          {collapsed ? (
            <img
              src="/favicon-192x192.png"
              alt="Logo"
              className="animate-fade-in h-9 w-9 object-contain"
            />
          ) : (
            <>
              <img
                src="/logo.png"
                alt="Nutrition International"
                className="animate-fade-in h-9 max-h-9 object-contain px-2 dark:hidden"
              />
              <img
                src="/logo-white.svg"
                alt="Nutrition International"
                className="animate-fade-in hidden h-9 max-h-9 object-contain px-2 dark:block"
              />
            </>
          )}
        </Link>
      </div>

      <div
        className={Utils.cn(
          "custom-scrollbar relative z-10 flex-1 overflow-y-auto px-4 py-6 transition-all",
          !collapsed ? "space-y-6" : "",
        )}
      >
        {menuGroups.map(
          (group, index) =>
            group.visible && (
              <Fragment key={index}>
                <div className="space-y-2">
                  {!collapsed && (
                    <h3
                      title={group.title}
                      className="text-caption text-fade-2 line-clamp-1 px-2 font-semibold uppercase"
                    >
                      {group.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isActive =
                        item.path === "/"
                          ? location.pathname === "/"
                          : location.pathname.startsWith(item.path);
                      const Icon = item.icon;

                      return (
                        <Tooltip
                          key={item.path}
                          title={collapsed ? item.name : undefined}
                          placement="right"
                        >
                          <Link
                            to={item.path}
                            className={`text-body-sm relative flex items-center gap-3 rounded-lg p-3 font-medium! transition-all ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-primary/20 shadow-sm"
                                : "text-secondary-alpha hover:bg-bg-muted hover:text-primary-alpha"
                            } ${collapsed ? "w-11" : ""}`}
                          >
                            <Icon
                              className={`h-5 w-5 shrink-0 ${
                                isActive
                                  ? "text-primary-foreground"
                                  : "text-fade-2"
                              }`}
                            />
                            {!collapsed ? (
                              <div className="flex min-w-0 flex-1 items-center justify-between">
                                <span title={item.name} className="truncate">
                                  {item.name}
                                </span>
                                {(item as any).pendingCount !== undefined &&
                                  (item as any).pendingCount > 0 && (
                                    <span className="animate-scale-up flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#f59e0b] px-1.5 text-[10px] font-extrabold text-white">
                                      {(item as any).pendingCount}
                                    </span>
                                  )}
                              </div>
                            ) : (
                              (item as any).pendingCount !== undefined &&
                              (item as any).pendingCount > 0 && (
                                <span className="animate-scale-up absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-white bg-[#f59e0b] text-[9px] font-extrabold text-white dark:border-[#1a1a1a]">
                                  {(item as any).pendingCount}
                                </span>
                              )
                            )}
                          </Link>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
                {collapsed && index < menuGroups.length - 1 && (
                  <div className="border-border-muted mx-2 my-5 border-b" />
                )}
              </Fragment>
            ),
        )}
      </div>

      <div className="border-border relative z-10 shrink-0 border-t px-4 py-2">
        <Tooltip title={collapsed ? "Logout" : undefined} placement="right">
          <button
            onClick={() => navigate("/login")}
            className={`text-body-sm text-primary hover:bg-error-light flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 font-medium! transition-all ${
              collapsed ? "w-10! justify-center py-3" : "py-2.5"
            }`}
          >
            <LogOut className="text-primary h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </Tooltip>
      </div>

      <div className="border-border relative z-10 flex h-[68px] shrink-0 justify-end border-t p-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-bg-muted text-fade-2 hover:text-primary-alpha cursor-pointer rounded-lg p-2 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
      <SidebarIllustration className="pointer-events-none absolute right-0 bottom-0 z-0" />
    </aside>
  );
};

export default SideBar;
