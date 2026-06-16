import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAppSelector } from "../state/store"

const AuthGuard = ({ children }: { children: ReactNode }) => {
  const { currentUserId } = useAppSelector((state) => state.auth)

  if (!currentUserId) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default AuthGuard
