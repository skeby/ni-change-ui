import { createBrowserRouter, Navigate, Outlet } from "react-router-dom"
import AuthGuard from "./guards/auth-guard"
import AuthRoute from "./guards/auth-route"
import ErrorBoundary from "./components/misc/error-boundary"
import MainLayout from "./components/layouts/main-layout"
import RootLayout from "./components/layouts/root-layout"

const lazyRoute = (importFn: () => Promise<any>) => async () => {
  try {
    const module = await importFn()
    const Component =
      module.default ||
      Object.entries(module).find(
        ([key, val]) => /^[A-Z]/.test(key) && typeof val === "function"
      )?.[1]
    return { Component }
  } catch {
    try {
      const module = await importFn()
      const Component =
        module.default ||
        Object.entries(module).find(
          ([key, val]) => /^[A-Z]/.test(key) && typeof val === "function"
        )?.[1]
      return { Component }
    } catch {
      window.location.reload()
      return { Component: () => null }
    }
  }
}

const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorBoundary />,
    element: <RootLayout />,
    children: [
      {
        path: "/login",
        element: (
          <AuthRoute>
            <Outlet />
          </AuthRoute>
        ),
        children: [
          {
            index: true,
            lazy: lazyRoute(() => import("./pages/login")),
          },
        ],
      },
      {
        path: "/",
        element: (
          <AuthGuard>
            <MainLayout />
          </AuthGuard>
        ),
        children: [
          {
            index: true,
            lazy: lazyRoute(() => import("./pages/dashboard")),
          },
          {
            path: "self/dashboard",
            lazy: lazyRoute(() => import("./pages/self-dashboard")),
          },
          {
            path: "change-journey",
            lazy: lazyRoute(() => import("./pages/overview/change-journey")),
          },
          {
            path: "graph",
            lazy: lazyRoute(() => import("./pages/overview/change-graph")),
          },
          {
            path: "self/changes",
            lazy: lazyRoute(() => import("./pages/my-changes")),
          },
          {
            path: "self/changes/new",
            lazy: lazyRoute(
              () => import("./pages/new-change/new-change-wizard")
            ),
            children: [
              { index: true, element: <Navigate to="general" replace /> },
              {
                path: "general",
                lazy: lazyRoute(() => import("./pages/new-change/general")),
              },
              {
                path: "ai-request",
                lazy: lazyRoute(() => import("./pages/new-change/ai-request")),
              },
              {
                path: "ai-policy",
                lazy: lazyRoute(() => import("./pages/new-change/ai-policy")),
              },
              {
                path: "risk",
                lazy: lazyRoute(() => import("./pages/new-change/risk")),
              },
              {
                path: "rollback",
                lazy: lazyRoute(() => import("./pages/new-change/rollback")),
              },
              {
                path: "review",
                lazy: lazyRoute(() => import("./pages/new-change/review")),
              },
            ],
          },
          {
            path: "self/changes/:id",
            lazy: lazyRoute(() => import("./pages/change-detail")),
          },
          {
            path: "self/profile",
            lazy: lazyRoute(() => import("./pages/profile")),
          },
          {
            path: "self/approvals",
            lazy: lazyRoute(() => import("./pages/my-approvals")),
          },
          {
            path: "changes",
            lazy: lazyRoute(() => import("./pages/changes")),
          },
          {
            path: "changes/:id",
            lazy: lazyRoute(() => import("./pages/change-detail")),
          },
          {
            path: "settings/categories",
            lazy: lazyRoute(() => import("./pages/settings-categories")),
          },
          {
            path: "settings/risk-levels",
            lazy: lazyRoute(() => import("./pages/settings-risk-levels")),
          },
          {
            path: "settings/approval-rules",
            lazy: lazyRoute(() => import("./pages/settings-approval-rules")),
          },
          {
            path: "settings/users",
            lazy: lazyRoute(() => import("./pages/settings-users")),
          },
          {
            path: "settings/systems",
            lazy: lazyRoute(() => import("./pages/settings-systems")),
          },
          {
            path: "*",
            lazy: lazyRoute(() => import("./pages/not-found")),
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/login" replace />,
      },
    ],
  },
])

export default router
