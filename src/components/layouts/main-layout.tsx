import { useEffect, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAppSelector } from "../../state/store"
import SideBar from "./side-bar"
import Header from "./header"

const MainLayout = () => {
  const { currentUserId } = useAppSelector((state) => state.auth)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  // Front Desk (/) opens with the sidebar out of the way — collapse it each
  // time the route is entered, without fighting a manual expand afterwards.
  useEffect(() => {
    if (location.pathname === "/") {
      setCollapsed(true)
    }
  }, [location.pathname])

  if (!currentUserId) {
    return <Navigate to="/login" replace />
  }

  const isMapPage = location.pathname === "/map"
  const isFrontDeskPage = location.pathname === "/"
  // Both want the full viewport with no chrome padding eating into it — the
  // map needs edge-to-edge canvas, Front Desk needs to fit the mockup's
  // single-screen layout without forcing a scroll.
  const isFullBleedPage = isMapPage || isFrontDeskPage

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
          className={`custom-scrollbar flex-1 overflow-y-auto print:h-auto print:overflow-visible print:p-0 ${isFullBleedPage ? "p-0" : "p-8"}`}
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
