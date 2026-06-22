import { useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAppSelector } from "../../state/store"
import SideBar from "./side-bar"
import Header from "./header"

const MainLayout = () => {
  const { currentUserId, activeRoles } = useAppSelector((state) => state.auth)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  if (!currentUserId) {
    return <Navigate to="/login" replace />
  }

  const isRole = (roles: string[]) => {
    return activeRoles.some((role) => roles.includes(role))
  }

  if (location.pathname === "/") {
    if (!isRole(["Admin"])) {
      return <Navigate to="/self/dashboard" replace />
    }
  }

  const isMapPage = location.pathname === "/map"

  return (
    <div className="bg-background-primary flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <SideBar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col print:block">
        <div className="print:hidden">
          <Header />
        </div>
        <main
          className={`custom-scrollbar flex-1 overflow-y-auto print:h-auto print:overflow-visible print:p-0 ${isMapPage ? "p-0" : "p-8"}`}
        >
          {isMapPage ? (
            <Outlet />
          ) : (
            <div className="animate-fade-in flex min-h-full flex-col print:max-w-none">
              <Outlet />
            </div>
          )}
        </main>
        <div id="layout-footer-portal" className="shrink-0 print:hidden" />
      </div>
    </div>
  )
}

export default MainLayout
